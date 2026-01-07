// Generic woodland theme - avoiding Root copyright
// Factions are inspired by but distinct from Root

const FACTIONS = {
  IRONWOOD: 'ironwood',      // Industrial faction (like Marquise)
  EYRIE: 'eyrie',            // Bird dynasty (like Eyrie)
  ALLIANCE: 'alliance',      // Rebel faction (like Woodland Alliance)
  WANDERER: 'wanderer'       // Lone explorer (like Vagabond)
};

const FACTION_NAMES = {
  ironwood: 'Ironwood Collective',
  eyrie: 'Eyrie Dynasty',
  alliance: 'Forest Alliance',
  wanderer: 'Lone Wanderer'
};

const FACTION_COLORS = {
  ironwood: '#D97706',    // Amber/Orange
  eyrie: '#3B82F6',       // Blue
  alliance: '#10B981',    // Green
  wanderer: '#6B7280'     // Gray
};

const SUITS = {
  FOX: 'fox',
  RABBIT: 'rabbit',
  MOUSE: 'mouse',
  BIRD: 'bird'  // Wild suit
};

const PHASES = {
  BIRDSONG: 'birdsong',
  DAYLIGHT: 'daylight',
  EVENING: 'evening'
};

const BUILDING_TYPES = {
  SAWMILL: 'sawmill',
  WORKSHOP: 'workshop',
  RECRUITER: 'recruiter',
  ROOST: 'roost',
  BASE: 'base',
  GARDEN: 'garden'
};

const ITEMS = {
  SWORD: 'sword',
  CROSSBOW: 'crossbow',
  HAMMER: 'hammer',
  BOOT: 'boot',
  TORCH: 'torch',
  COINS: 'coins',
  BAG: 'bag',
  TEA: 'tea'
};

// Standard map layout (12 clearings)
const DEFAULT_MAP = {
  clearings: [
    { id: 1, suit: 'fox', slots: 2, connections: [2, 5, 10], river: false, forest: false },
    { id: 2, suit: 'rabbit', slots: 2, connections: [1, 3, 6, 10], river: true, forest: false },
    { id: 3, suit: 'mouse', slots: 2, connections: [2, 7, 11], river: true, forest: false },
    { id: 4, suit: 'rabbit', slots: 1, connections: [5, 8], river: false, forest: true },
    { id: 5, suit: 'fox', slots: 2, connections: [1, 4, 8, 9], river: false, forest: false },
    { id: 6, suit: 'mouse', slots: 2, connections: [2, 9, 10, 11], river: true, forest: false },
    { id: 7, suit: 'fox', slots: 2, connections: [3, 11, 12], river: true, forest: false },
    { id: 8, suit: 'mouse', slots: 2, connections: [4, 5, 9, 12], river: false, forest: false },
    { id: 9, suit: 'rabbit', slots: 2, connections: [5, 6, 8, 10, 12], river: false, forest: false },
    { id: 10, suit: 'fox', slots: 1, connections: [1, 2, 6, 9], river: false, forest: true },
    { id: 11, suit: 'mouse', slots: 2, connections: [3, 6, 7, 12], river: true, forest: false },
    { id: 12, suit: 'rabbit', slots: 2, connections: [7, 8, 9, 11], river: false, forest: false }
  ],
  // Corner clearings for setup
  corners: [1, 3, 7, 12]
};

// Victory points needed to win
const VICTORY_POINTS_TO_WIN = 30;

// Crafting costs for items
const CRAFT_COSTS = {
  sword: ['fox'],
  crossbow: ['fox'],
  hammer: ['rabbit'],
  boot: ['rabbit'],
  torch: ['mouse'],
  coins: ['mouse'],
  bag: ['mouse'],
  tea: ['mouse']
};

module.exports = {
  FACTIONS,
  FACTION_NAMES,
  FACTION_COLORS,
  SUITS,
  PHASES,
  BUILDING_TYPES,
  ITEMS,
  DEFAULT_MAP,
  VICTORY_POINTS_TO_WIN,
  CRAFT_COSTS
};
