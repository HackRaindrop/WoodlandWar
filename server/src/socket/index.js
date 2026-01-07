const Game = require('../models/Game');
const GameEngine = require('../game/engine');
const { gameStateKey } = require('../config/redis');

const setupSocketHandlers = (io, redisClient) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    const session = socket.request.session;
    const userId = session?.userId || session?.guestId;
    const username = session?.username || 'Anonymous';
    
    // Join a game room
    socket.on('game:join', async ({ gameId, code }) => {
      try {
        const game = await Game.findOne(code ? { code } : { _id: gameId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        socket.join(`game:${game._id}`);
        socket.gameId = game._id;
        socket.userId = userId;
        socket.username = username;
        
        // Notify others
        socket.to(`game:${game._id}`).emit('player:connected', { 
          username, 
          playerId: userId 
        });
        
        // Send current state
        const liveState = await redisClient.get(gameStateKey(game._id));
        if (liveState) {
          socket.emit('game:state', JSON.parse(liveState));
        } else {
          socket.emit('game:state', game.toObject());
        }
        
        console.log(`${username} joined game ${game.code}`);
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });
    
    // Leave game room
    socket.on('game:leave', () => {
      if (socket.gameId) {
        socket.to(`game:${socket.gameId}`).emit('player:disconnected', {
          username: socket.username,
          playerId: socket.userId
        });
        socket.leave(`game:${socket.gameId}`);
      }
    });
    
    // Game action
    socket.on('game:action', async ({ action, data }) => {
      try {
        if (!socket.gameId) {
          socket.emit('error', { message: 'Not in a game' });
          return;
        }
        
        // Get current state from Redis
        const stateJson = await redisClient.get(gameStateKey(socket.gameId));
        if (!stateJson) {
          socket.emit('error', { message: 'Game state not found' });
          return;
        }
        
        const state = JSON.parse(stateJson);
        const engine = new GameEngine(state);
        
        // Verify it's this player's turn
        const currentPlayer = engine.getCurrentPlayer();
        const currentPlayerId = currentPlayer.oderId?.toString();
        const socketUserId = socket.userId?.toString();
        
        console.log('Turn check:', { currentPlayerId, socketUserId, match: currentPlayerId === socketUserId });
        
        if (currentPlayerId !== socketUserId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }
        
        // Execute action
        let result;
        switch (action) {
          case 'move':
            result = engine.moveWarriors(
              currentPlayer.faction,
              data.from,
              data.to,
              data.count
            );
            break;
            
          case 'battle':
            result = engine.battle(
              currentPlayer.faction,
              data.defender,
              data.clearing
            );
            break;
            
          case 'build':
            result = engine.placeBuilding(
              currentPlayer.faction,
              data.buildingType,
              data.clearing
            );
            break;
            
          case 'recruit':
            result = engine.placeWarriors(
              currentPlayer.faction,
              data.clearing,
              data.count
            );
            break;
            
          case 'end_phase':
            result = engine.nextPhase();
            break;
            
          case 'end_turn':
            engine.nextPlayer();
            result = { phase: engine.state.currentPhase };
            break;
            
          default:
            socket.emit('error', { message: 'Unknown action' });
            return;
        }
        
        // Save updated state to Redis
        await redisClient.set(
          gameStateKey(socket.gameId),
          JSON.stringify(engine.state),
          'EX', 86400
        );
        
        // Broadcast updated state to all players
        io.to(`game:${socket.gameId}`).emit('game:state', engine.state);
        
        // Notify of action result
        io.to(`game:${socket.gameId}`).emit('game:action_result', {
          player: socket.username,
          action,
          result
        });
        
        // Check for winner
        if (engine.state.winnerId) {
          io.to(`game:${socket.gameId}`).emit('game:ended', {
            winnerId: engine.state.winnerId,
            winCondition: engine.state.winCondition
          });
          
          // Save final state to MongoDB
          await Game.findByIdAndUpdate(socket.gameId, {
            status: 'finished',
            winnerId: engine.state.winnerId,
            winCondition: engine.state.winCondition,
            ...engine.state
          });
        }
        
      } catch (error) {
        console.error('Game action error:', error);
        socket.emit('error', { message: error.message || 'Action failed' });
      }
    });
    
    // Chat message
    socket.on('chat:message', ({ message }) => {
      if (socket.gameId && message.trim()) {
        io.to(`game:${socket.gameId}`).emit('chat:message', {
          username: socket.username,
          message: message.trim(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      if (socket.gameId) {
        socket.to(`game:${socket.gameId}`).emit('player:disconnected', {
          username: socket.username,
          playerId: socket.userId
        });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocketHandlers;
