// Load .env file only in development (Heroku uses Config Vars directly)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/database');
const { createRedisClient, RedisStore, isUsingMemoryFallback } = require('./config/redis');
const setupSocketHandlers = require('./socket');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const lobbyRoutes = require('./routes/lobby');
const Game = require('./models/Game');

const app = express();
const httpServer = createServer(app);

// Initialize connections
const startServer = async () => {
  console.log('Starting Woodland War server...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Port:', process.env.PORT || 3001);
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ MongoDB connected');

    // Connect to Redis
    console.log('Connecting to Redis...');
    const redisClient = await createRedisClient();
    console.log('✓ Redis connected');

    // Handlebars setup
    app.engine('handlebars', engine({
      defaultLayout: 'main',
      layoutsDir: path.join(__dirname, 'views/layouts'),
      partialsDir: path.join(__dirname, 'views/partials'),
      helpers: {
        json: (context) => JSON.stringify(context),
        eq: (a, b) => a === b,
        capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1)
      }
    }));
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, 'views'));

    // Middleware
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.CLIENT_URL, process.env.HEROKU_URL].filter(Boolean)
      : ['http://localhost:5173'];
    
    app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
          callback(null, true);
        } else {
          callback(null, true); // Allow all in dev
        }
      },
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../public')));

    // Session configuration
    const sessionConfig = {
      secret: process.env.SESSION_SECRET || 'woodland-war-secret',
      resave: false,
      saveUninitialized: false,
      proxy: process.env.NODE_ENV === 'production', // Trust Heroku's proxy
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      }
    };
    
    // Trust proxy for Heroku
    if (process.env.NODE_ENV === 'production') {
      app.set('trust proxy', 1);
    }
    
    // Use Redis store if available, otherwise use default memory store
    if (!isUsingMemoryFallback()) {
      sessionConfig.store = new RedisStore({ client: redisClient });
    }
    
    const sessionMiddleware = session(sessionConfig);
    app.use(sessionMiddleware);

    // Socket.IO setup
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
        credentials: true
      }
    });

    // Share session with Socket.IO
    io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next);
    });

    // Setup socket handlers
    setupSocketHandlers(io, redisClient);

    // Make io accessible to routes
    app.set('io', io);
    app.set('redisClient', redisClient);

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/game', gameRoutes);
    app.use('/api/lobby', lobbyRoutes);

    // Handlebars routes for server-rendered pages
    app.get('/rules', (req, res) => {
      res.render('rules', { 
        title: 'Game Rules - Woodland War',
        factions: require('./game/factions').getAllFactionInfo()
      });
    });

    app.get('/about', (req, res) => {
      res.render('about', { title: 'About - Woodland War' });
    });

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Serve React client in production
    if (process.env.NODE_ENV === 'production') {
      const clientBuildPath = path.join(__dirname, '../../client/dist');
      console.log('Client build path:', clientBuildPath);
      
      const fs = require('fs');
      if (fs.existsSync(clientBuildPath)) {
        console.log('✓ Client build found');
        console.log('  Files:', fs.readdirSync(clientBuildPath));
      } else {
        console.error('✗ Client build NOT found at:', clientBuildPath);
      }
      
      app.use(express.static(clientBuildPath));
      
      // Handle client-side routing - serve index.html for all non-API routes
      app.get('*', (req, res, next) => {
        // Skip API routes and Handlebars routes
        if (req.path.startsWith('/api') || req.path === '/rules' || req.path === '/about') {
          return next();
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
    }

    // Lobby cleanup job - removes stale lobbies after 5 minutes of inactivity
    const LOBBY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const cleanupStaleLobbies = async () => {
      try {
        const cutoffTime = new Date(Date.now() - LOBBY_TIMEOUT_MS);
        
        // Find stale lobbies to notify players before deleting
        const staleLobbies = await Game.find({
          status: 'lobby',
          updatedAt: { $lt: cutoffTime }
        });
        
        // Notify connected players that lobby is closing
        for (const lobby of staleLobbies) {
          io.to(`game:${lobby._id}`).emit('lobby:expired', {
            message: 'Lobby closed due to inactivity'
          });
        }
        
        // Delete stale lobbies
        const result = await Game.deleteMany({
          status: 'lobby',
          updatedAt: { $lt: cutoffTime }
        });
        
        if (result.deletedCount > 0) {
          console.log(`🧹 Cleaned up ${result.deletedCount} stale lobbies`);
        }
      } catch (error) {
        console.error('Lobby cleanup error:', error);
      }
    };
    
    // Run cleanup every minute
    setInterval(cleanupStaleLobbies, 60 * 1000);
    // Also run once on startup
    cleanupStaleLobbies();

    // Start server
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`\n🌲 Woodland War Server running on port ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`   Rules: http://localhost:${PORT}/rules`);
      console.log(`   Lobby timeout: 5 minutes\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
