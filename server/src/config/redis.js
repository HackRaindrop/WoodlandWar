const Redis = require('ioredis');
const RedisStore = require('connect-redis').default;

let redisClient = null;
let useMemoryFallback = false;

// In-memory fallback for development without Redis
const memoryStore = new Map();
const memoryClient = {
  get: async (key) => memoryStore.get(key) || null,
  set: async (key, value, ...args) => { memoryStore.set(key, value); return 'OK'; },
  del: async (key) => memoryStore.delete(key),
  on: () => {},
  status: 'ready'
};

const createRedisClient = async () => {
  if (redisClient) return redisClient;

  // Try to connect to Redis, fall back to memory if not available
  try {
    // Build Redis config from env vars
    const redisConfig = process.env.REDIS_URL ? process.env.REDIS_URL : {
      host: process.env.REDIS_HOST || 'redis-18693.c321.us-east-1-2.ec2.cloud.redislabs.com',
      port: parseInt(process.env.REDIS_PORT) || 18693,
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD || 'hgMbYfdjkNCVHgQIq7ZuKDGL8cgNzBHT'
    };
    
    redisClient = new Redis(redisConfig);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      if (redisClient.status === 'ready') {
        resolve();
      } else {
        redisClient.once('ready', resolve);
        redisClient.once('error', reject);
        setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
      }
    });

  } catch (error) {
    console.warn('⚠ Redis not available, using in-memory store (dev mode only)');
    console.warn('  Error:', error.message);
    useMemoryFallback = true;
    redisClient = memoryClient;
  }

  return redisClient;
};

const getRedisClient = () => redisClient;
const isUsingMemoryFallback = () => useMemoryFallback;

// Game state helpers
const gameStateKey = (gameId) => `game:${gameId}:state`;
const lobbyKey = (lobbyId) => `lobby:${lobbyId}`;
const playerGamesKey = (playerId) => `player:${playerId}:games`;

module.exports = {
  createRedisClient,
  getRedisClient,
  isUsingMemoryFallback,
  RedisStore,
  gameStateKey,
  lobbyKey,
  playerGamesKey
};
