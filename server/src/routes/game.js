const express = require('express');
const Game = require('../models/Game');
const GameEngine = require('../game/engine');
const { gameStateKey } = require('../config/redis');

const router = express.Router();

// Middleware to verify authenticated user
const authMiddleware = (req, res, next) => {
  if (!req.session.userId && !req.session.isGuest) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get game by code
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const game = await Game.findOne({ code }).populate('players.userId', 'username avatar');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check Redis for live state
    const redisClient = req.app.get('redisClient');
    const liveState = await redisClient.get(gameStateKey(game._id));
    
    if (liveState) {
      const parsedState = JSON.parse(liveState);
      return res.json({ game: { ...game.toObject(), ...parsedState } });
    }
    
    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// Create new game
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, settings } = req.body;
    const userId = req.session.userId || req.session.guestId || `guest_${Date.now()}`;
    const username = req.session.username || 'Guest';
    
    const code = await Game.generateCode();
    
    // Ensure we have a valid hostId
    if (!userId) {
      return res.status(400).json({ error: 'No user session found' });
    }
    
    const game = new Game({
      code,
      name: name || `${username}'s Game`,
      hostId: userId,
      settings: settings || {},
      players: [{
        oderId: userId,
        username: username,
        faction: null,
        isReady: false
      }]
    });
    
    await game.save();
    
    res.status(201).json({
      message: 'Game created',
      game: {
        id: game._id,
        code: game.code,
        name: game.name
      }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join game
router.post('/:code/join', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.session.userId || req.session.guestId;
    const username = req.session.username;
    
    const game = await Game.findOne({ code });
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.status !== 'lobby') {
      return res.status(400).json({ error: 'Game already in progress' });
    }
    
    if (game.players.length >= game.settings.maxPlayers) {
      return res.status(400).json({ error: 'Game is full' });
    }
    
    // Check if already in game
    const alreadyJoined = game.players.some(p => 
      p.oderId?.toString() === userId?.toString() || 
      p.username === username
    );
    
    if (alreadyJoined) {
      return res.json({ message: 'Already in game', game });
    }
    
    game.players.push({
      oderId: userId,
      username: username,
      faction: null,
      isReady: false
    });
    
    await game.save();
    
    // Emit update via socket
    const io = req.app.get('io');
    io.to(`game:${game._id}`).emit('player:joined', { 
      username, 
      playerCount: game.players.length 
    });
    
    res.json({ message: 'Joined game', game });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Select faction
router.post('/:code/faction', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { faction } = req.body;
    const userId = req.session.userId || req.session.guestId;
    
    const game = await Game.findOne({ code });
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if faction is taken
    const factionTaken = game.players.some(p => 
      p.faction === faction && 
      p.oderId?.toString() !== userId?.toString()
    );
    
    if (factionTaken) {
      return res.status(400).json({ error: 'Faction already taken' });
    }
    
    // Update player's faction
    const playerIndex = game.players.findIndex(p => 
      p.oderId?.toString() === userId?.toString()
    );
    
    if (playerIndex === -1) {
      return res.status(400).json({ error: 'Not in this game' });
    }
    
    game.players[playerIndex].faction = faction;
    await game.save();
    
    // Emit update
    const io = req.app.get('io');
    io.to(`game:${game._id}`).emit('faction:selected', { 
      playerId: userId, 
      faction 
    });
    
    res.json({ message: 'Faction selected', game });
  } catch (error) {
    console.error('Select faction error:', error);
    res.status(500).json({ error: 'Failed to select faction' });
  }
});

// Set ready status
router.post('/:code/ready', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { ready } = req.body;
    const userId = req.session.userId || req.session.guestId;
    
    const game = await Game.findOne({ code });
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const playerIndex = game.players.findIndex(p => 
      p.oderId?.toString() === userId?.toString()
    );
    
    if (playerIndex === -1) {
      return res.status(400).json({ error: 'Not in this game' });
    }
    
    if (!game.players[playerIndex].faction) {
      return res.status(400).json({ error: 'Must select faction first' });
    }
    
    game.players[playerIndex].isReady = ready;
    await game.save();
    
    // Check if all players ready
    const allReady = game.players.every(p => p.isReady && p.faction);
    
    const io = req.app.get('io');
    io.to(`game:${game._id}`).emit('player:ready', { 
      playerId: userId, 
      ready,
      allReady
    });
    
    res.json({ message: 'Ready status updated', allReady });
  } catch (error) {
    console.error('Ready error:', error);
    res.status(500).json({ error: 'Failed to update ready status' });
  }
});

// Start game
router.post('/:code/start', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.session.userId || req.session.guestId;
    
    const game = await Game.findOne({ code });
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.hostId.toString() !== userId?.toString()) {
      return res.status(403).json({ error: 'Only host can start the game' });
    }
    
    if (game.players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players' });
    }
    
    const allReady = game.players.every(p => p.isReady && p.faction);
    if (!allReady) {
      return res.status(400).json({ error: 'All players must be ready' });
    }
    
    // Initialize game engine
    const engine = GameEngine.createGame(game.players, game.settings);
    engine.setupFactions();
    
    // Update game status
    game.status = 'playing';
    game.pieces = engine.state.pieces;
    game.drawPile = engine.state.drawPile;
    game.clearings = engine.state.clearings;
    Object.assign(game, engine.state);
    
    await game.save();
    
    // Store live state in Redis
    const redisClient = req.app.get('redisClient');
    await redisClient.set(
      gameStateKey(game._id),
      JSON.stringify(engine.state),
      'EX', 86400 // 24 hour expiry
    );
    
    // Emit game started
    const io = req.app.get('io');
    io.to(`game:${game._id}`).emit('game:started', { 
      state: engine.state 
    });
    
    res.json({ message: 'Game started', state: engine.state });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Get player's available actions
router.get('/:code/actions', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.session.userId || req.session.guestId;
    
    const game = await Game.findOne({ code });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get live state from Redis
    const redisClient = req.app.get('redisClient');
    const liveState = await redisClient.get(gameStateKey(game._id));
    
    if (!liveState) {
      return res.status(400).json({ error: 'Game not in progress' });
    }
    
    const state = JSON.parse(liveState);
    const engine = new GameEngine(state);
    
    const currentPlayer = engine.getCurrentPlayer();
    const isCurrentPlayer = currentPlayer.oderId?.toString() === userId?.toString();
    
    if (!isCurrentPlayer) {
      return res.json({ 
        isYourTurn: false, 
        currentPlayer: currentPlayer.username,
        phase: state.currentPhase
      });
    }
    
    // Get available actions based on faction and phase
    const { getFaction } = require('../game/factions');
    const faction = getFaction(currentPlayer.faction);
    
    res.json({
      isYourTurn: true,
      phase: state.currentPhase,
      actions: faction?.daylightActions || [],
      turnNumber: state.turnNumber
    });
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Failed to get actions' });
  }
});

module.exports = router;
