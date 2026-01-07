const mongoose = require('mongoose');

// Piece schema for warriors, buildings, tokens
const pieceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['warrior', 'sawmill', 'workshop', 'recruiter', 'roost', 'base', 'sympathy', 'garden', 'ruin'],
    required: true
  },
  faction: {
    type: String,
    required: true
  },
  clearingId: {
    type: Number,
    required: true
  }
}, { _id: false });

// Card schema
const cardSchema = new mongoose.Schema({
  id: String,
  name: String,
  suit: {
    type: String,
    enum: ['fox', 'rabbit', 'mouse', 'bird']
  },
  type: {
    type: String,
    enum: ['ambush', 'item', 'dominance', 'favor']
  },
  craftCost: [String],
  item: String,
  effect: String
}, { _id: false });

// Player state schema
const playerStateSchema = new mongoose.Schema({
  oderId: { type: mongoose.Schema.Types.Mixed }, // Can be ObjectId or guest string ID
  username: String,
  faction: {
    type: String,
    enum: ['ironwood', 'eyrie', 'alliance', 'wanderer', null],
    default: null
  },
  victoryPoints: { type: Number, default: 0 },
  hand: [cardSchema],
  craftedItems: [String],
  // Faction-specific state
  factionState: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  connected: { type: Boolean, default: true },
  isReady: { type: Boolean, default: false }
}, { _id: false });

// Main game schema
const gameSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or guest string ID
    required: true
  },
  status: {
    type: String,
    enum: ['lobby', 'setup', 'playing', 'paused', 'finished'],
    default: 'lobby'
  },
  players: [playerStateSchema],
  currentPlayerIndex: {
    type: Number,
    default: 0
  },
  currentPhase: {
    type: String,
    enum: ['birdsong', 'daylight', 'evening', 'setup'],
    default: 'setup'
  },
  turnNumber: {
    type: Number,
    default: 0
  },
  // Board state
  clearings: [{
    id: Number,
    suit: String,
    slots: Number,
    connections: [Number],
    river: Boolean,
    forest: Boolean,
    rulerFaction: String
  }],
  pieces: [pieceSchema],
  // Decks
  drawPile: [cardSchema],
  discardPile: [cardSchema],
  // Items available on map
  availableItems: {
    sword: { type: Number, default: 2 },
    crossbow: { type: Number, default: 1 },
    hammer: { type: Number, default: 1 },
    boot: { type: Number, default: 2 },
    torch: { type: Number, default: 2 },
    coins: { type: Number, default: 2 },
    bag: { type: Number, default: 2 },
    tea: { type: Number, default: 2 }
  },
  // Winner
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winCondition: String,
  // Action log for undo/replay
  actionLog: [{
    playerId: mongoose.Schema.Types.ObjectId,
    action: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  settings: {
    maxPlayers: { type: Number, default: 4, min: 2, max: 4 },
    turnTimeLimit: { type: Number, default: 0 }, // 0 = no limit
    allowSpectators: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
gameSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique game code
gameSchema.statics.generateCode = async function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = await this.findOne({ code });
  }
  
  return code;
};

module.exports = mongoose.model('Game', gameSchema);
