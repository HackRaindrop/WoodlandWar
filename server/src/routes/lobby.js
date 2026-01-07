const express = require('express');
const Game = require('../models/Game');

const router = express.Router();

// Get all open lobbies
router.get('/', async (req, res) => {
  try {
    const games = await Game.find({ 
      status: 'lobby'
    })
    .select('code name players settings createdAt')
    .sort({ createdAt: -1 })
    .limit(20);
    
    const lobbies = games.map(game => ({
      code: game.code,
      name: game.name,
      playerCount: game.players.length,
      maxPlayers: game.settings.maxPlayers,
      createdAt: game.createdAt
    }));
    
    res.json({ lobbies });
  } catch (error) {
    console.error('Get lobbies error:', error);
    res.status(500).json({ error: 'Failed to get lobbies' });
  }
});

// Get specific lobby details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const game = await Game.findOne({ code });
    
    if (!game) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    // If game has started, return status so client can redirect
    if (game.status !== 'lobby') {
      return res.json({
        lobby: null,
        status: game.status,
        redirectTo: `/game/${code}`
      });
    }
    
    res.json({
      lobby: {
        code: game.code,
        name: game.name,
        hostId: game.hostId,
        players: game.players.map(p => ({
          username: p.username,
          faction: p.faction,
          isReady: p.isReady
        })),
        settings: game.settings,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        expiresAt: new Date(game.updatedAt.getTime() + 5 * 60 * 1000) // 5 min from last activity
      },
      status: 'lobby'
    });
  } catch (error) {
    console.error('Get lobby error:', error);
    res.status(500).json({ error: 'Failed to get lobby' });
  }
});

module.exports = router;
