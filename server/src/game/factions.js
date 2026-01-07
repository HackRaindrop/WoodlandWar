const { FACTIONS, FACTION_NAMES, FACTION_COLORS } = require('./constants');

/**
 * IRONWOOD COLLECTIVE (inspired by Marquise de Cat)
 * Industrial powerhouse that starts controlling most of the map
 * Builds sawmills, workshops, and recruiters to generate resources
 */
const ironwoodFaction = {
  id: FACTIONS.IRONWOOD,
  name: FACTION_NAMES.ironwood,
  color: FACTION_COLORS.ironwood,
  description: 'An industrial empire spreading across the woodland. Build structures and maintain order.',
  
  difficulty: 'Easy',
  playstyle: 'Engine Building',
  
  startingVP: 0,
  
  // Faction-specific resources
  initialState: () => ({
    wood: 0,
    buildings: {
      sawmill: 6,
      workshop: 6,
      recruiter: 6
    },
    warriors: 25,
    fieldHospitals: false
  }),
  
  // Setup: place keep in corner, warriors everywhere, one building each in 3 corners
  setup: (gameState, playerIndex, cornerClearing) => {
    const player = gameState.players[playerIndex];
    const corners = [1, 3, 7, 12].filter(c => c !== cornerClearing);
    
    // Place the keep (special building) in chosen corner
    gameState.pieces.push({
      type: 'recruiter', // Keep is a special recruiter
      faction: FACTIONS.IRONWOOD,
      clearingId: cornerClearing,
      isKeep: true
    });
    
    // Place warriors in all clearings except corners not controlled
    for (let i = 1; i <= 12; i++) {
      if (i !== 3) { // Skip one corner for other factions
        for (let w = 0; w < (i === cornerClearing ? 4 : 1); w++) {
          gameState.pieces.push({
            type: 'warrior',
            faction: FACTIONS.IRONWOOD,
            clearingId: i
          });
        }
      }
    }
    
    // Place one of each building in other corners
    const buildings = ['sawmill', 'workshop', 'recruiter'];
    corners.slice(0, 3).forEach((clearing, idx) => {
      if (clearing !== 3) {
        gameState.pieces.push({
          type: buildings[idx % 3],
          faction: FACTIONS.IRONWOOD,
          clearingId: clearing
        });
      }
    });
    
    player.factionState = ironwoodFaction.initialState();
    return gameState;
  },
  
  // Birdsong: Gather wood from sawmills
  birdsong: (gameState, playerIndex) => {
    const player = gameState.players[playerIndex];
    const sawmills = gameState.pieces.filter(
      p => p.type === 'sawmill' && p.faction === FACTIONS.IRONWOOD
    );
    player.factionState.wood += sawmills.length;
    return { action: 'gather_wood', amount: sawmills.length };
  },
  
  // Available actions during daylight
  daylightActions: ['battle', 'march', 'build', 'recruit', 'overwork'],
  
  // Evening: Draw cards based on draw buildings
  evening: (gameState, playerIndex) => {
    const workshops = gameState.pieces.filter(
      p => p.type === 'workshop' && p.faction === FACTIONS.IRONWOOD
    );
    const cardsToDraw = Math.min(workshops.length + 1, 5);
    return { action: 'draw_cards', amount: cardsToDraw };
  }
};

/**
 * EYRIE DYNASTY (inspired by Eyrie Dynasties)
 * Must follow a programmed decree that grows each turn
 * Powerful but can fall into turmoil
 */
const eyrieFaction = {
  id: FACTIONS.EYRIE,
  name: FACTION_NAMES.eyrie,
  color: FACTION_COLORS.eyrie,
  description: 'A noble bird dynasty ruling from roosts. Follow your decree or fall into turmoil.',
  
  difficulty: 'Medium',
  playstyle: 'Programming',
  
  startingVP: 0,
  
  initialState: () => ({
    decree: {
      recruit: [],
      move: [],
      battle: [],
      build: []
    },
    currentLeader: null,
    leaders: ['builder', 'charismatic', 'commander', 'despot'],
    usedLeaders: [],
    roosts: 7,
    warriors: 20,
    inTurmoil: false
  }),
  
  setup: (gameState, playerIndex, cornerClearing) => {
    const player = gameState.players[playerIndex];
    
    // Place starting roost and warriors in corner
    gameState.pieces.push({
      type: 'roost',
      faction: FACTIONS.EYRIE,
      clearingId: cornerClearing
    });
    
    for (let w = 0; w < 6; w++) {
      gameState.pieces.push({
        type: 'warrior',
        faction: FACTIONS.EYRIE,
        clearingId: cornerClearing
      });
    }
    
    player.factionState = eyrieFaction.initialState();
    return gameState;
  },
  
  birdsong: (gameState, playerIndex) => {
    // If in turmoil from last turn, must choose new leader
    const player = gameState.players[playerIndex];
    if (player.factionState.inTurmoil) {
      return { action: 'choose_leader', required: true };
    }
    // Add cards to decree
    return { action: 'add_to_decree', required: true };
  },
  
  daylightActions: ['resolve_decree'],
  
  evening: (gameState, playerIndex) => {
    const roosts = gameState.pieces.filter(
      p => p.type === 'roost' && p.faction === FACTIONS.EYRIE
    );
    // Score VP based on roosts on map
    const vpToScore = [0, 0, 1, 2, 3, 4, 4, 5][Math.min(roosts.length, 7)];
    return { action: 'score_roosts', vp: vpToScore };
  }
};

/**
 * FOREST ALLIANCE (inspired by Woodland Alliance)
 * Builds support among the populace and strikes from the shadows
 * Scores points by spreading sympathy
 */
const allianceFaction = {
  id: FACTIONS.ALLIANCE,
  name: FACTION_NAMES.alliance,
  color: FACTION_COLORS.alliance,
  description: 'A rebellion brewing in the forest. Spread sympathy and revolt against oppressors.',
  
  difficulty: 'Hard',
  playstyle: 'Guerrilla',
  
  startingVP: 0,
  
  initialState: () => ({
    supporters: [], // Cards in supporter stack
    officers: 0,
    bases: { fox: false, rabbit: false, mouse: false },
    sympathy: 10,
    warriors: 10
  }),
  
  setup: (gameState, playerIndex) => {
    const player = gameState.players[playerIndex];
    player.factionState = allianceFaction.initialState();
    // Alliance starts with 3 supporters
    // (cards are drawn from deck during setup)
    return gameState;
  },
  
  birdsong: (gameState, playerIndex) => {
    // Revolt or spread sympathy
    return { action: 'revolt_or_spread', options: ['revolt', 'spread_sympathy'] };
  },
  
  daylightActions: ['craft', 'mobilize', 'train'],
  
  evening: (gameState, playerIndex) => {
    const player = gameState.players[playerIndex];
    const officers = player.factionState.officers;
    return { action: 'military_operations', operations: officers };
  }
};

/**
 * LONE WANDERER (inspired by Vagabond)
 * Single character who moves around the map completing quests
 * Uses items for actions and can ally with other factions
 */
const wandererFaction = {
  id: FACTIONS.WANDERER,
  name: FACTION_NAMES.wanderer,
  color: FACTION_COLORS.wanderer,
  description: 'A lone adventurer exploring the woodland. Complete quests and manage relationships.',
  
  difficulty: 'Medium',
  playstyle: 'Adventure',
  
  startingVP: 0,
  
  initialState: () => ({
    character: null, // Thief, Tinker, Ranger, etc.
    currentClearing: null,
    inForest: true,
    items: {
      satchel: [],   // Available items
      track: [],     // Damaged items
      equipped: []   // Ready items
    },
    relationships: {}, // Allied/Hostile with other factions
    quests: [],
    activeQuests: []
  }),
  
  characters: [
    { id: 'thief', name: 'The Thief', startItems: ['boot', 'torch', 'tea', 'sword'] },
    { id: 'tinker', name: 'The Tinker', startItems: ['boot', 'torch', 'bag', 'hammer'] },
    { id: 'ranger', name: 'The Ranger', startItems: ['boot', 'torch', 'crossbow', 'sword'] },
    { id: 'vagrant', name: 'The Vagrant', startItems: ['boot', 'torch', 'coins'] }
  ],
  
  setup: (gameState, playerIndex, character = 'thief') => {
    const player = gameState.players[playerIndex];
    const charData = wandererFaction.characters.find(c => c.id === character) 
                     || wandererFaction.characters[0];
    
    player.factionState = wandererFaction.initialState();
    player.factionState.character = charData;
    player.factionState.items.satchel = [...charData.startItems];
    player.factionState.inForest = true;
    
    // Initialize relationships as neutral (0) with all factions
    player.factionState.relationships = {
      ironwood: 0,
      eyrie: 0,
      alliance: 0
    };
    
    return gameState;
  },
  
  birdsong: (gameState, playerIndex) => {
    // Refresh items (move from damaged to ready)
    return { action: 'refresh_items', amount: 3 };
  },
  
  daylightActions: ['move', 'explore', 'battle', 'strike', 'aid', 'quest', 'craft', 'repair'],
  
  evening: (gameState, playerIndex) => {
    // Rest in forest to repair all items, or draw card if in clearing
    const player = gameState.players[playerIndex];
    if (player.factionState.inForest) {
      return { action: 'rest', repairAll: true };
    }
    return { action: 'draw_card' };
  }
};

// Export faction data
const factions = {
  [FACTIONS.IRONWOOD]: ironwoodFaction,
  [FACTIONS.EYRIE]: eyrieFaction,
  [FACTIONS.ALLIANCE]: allianceFaction,
  [FACTIONS.WANDERER]: wandererFaction
};

const getAllFactionInfo = () => {
  return Object.values(factions).map(f => ({
    id: f.id,
    name: f.name,
    color: f.color,
    description: f.description,
    difficulty: f.difficulty,
    playstyle: f.playstyle
  }));
};

const getFaction = (factionId) => factions[factionId];

module.exports = {
  factions,
  getAllFactionInfo,
  getFaction,
  ironwoodFaction,
  eyrieFaction,
  allianceFaction,
  wandererFaction
};
