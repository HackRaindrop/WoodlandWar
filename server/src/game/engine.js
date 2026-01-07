const { FACTIONS, PHASES, DEFAULT_MAP, VICTORY_POINTS_TO_WIN } = require('./constants');
const { getFaction } = require('./factions');
const deck = require('./deck');

class GameEngine {
  constructor(gameState) {
    this.state = gameState;
  }
  
  // Initialize a new game
  static createGame(players, settings = {}) {
    const initialState = {
      players: players.map((p, idx) => ({
        oderId: p.oderId || p.userId, // Support both property names
        username: p.username,
        faction: p.faction,
        victoryPoints: 0,
        hand: [],
        craftedItems: [],
        factionState: {},
        connected: true,
        isReady: false
      })),
      currentPlayerIndex: 0,
      currentPhase: 'setup',
      turnNumber: 0,
      clearings: [...DEFAULT_MAP.clearings],
      pieces: [],
      drawPile: deck.createDeck(),
      discardPile: [],
      availableItems: {
        sword: 2, crossbow: 1, hammer: 1, boot: 2,
        torch: 2, coins: 2, bag: 2, tea: 2
      },
      winnerId: null,
      winCondition: null,
      actionLog: [],
      settings: {
        maxPlayers: settings.maxPlayers || 4,
        turnTimeLimit: settings.turnTimeLimit || 0,
        allowSpectators: settings.allowSpectators !== false
      }
    };
    
    // Shuffle the deck
    initialState.drawPile = deck.shuffle(initialState.drawPile);
    
    return new GameEngine(initialState);
  }
  
  // Setup phase - initialize factions
  setupFactions() {
    const corners = [1, 3, 7, 12];
    let cornerIndex = 0;
    
    this.state.players.forEach((player, idx) => {
      const faction = getFaction(player.faction);
      if (faction && faction.setup) {
        const corner = corners[cornerIndex++];
        faction.setup(this.state, idx, corner);
      }
      
      // Deal starting hand (3 cards)
      player.hand = this.drawCards(3);
    });
    
    this.state.currentPhase = PHASES.BIRDSONG;
    this.state.turnNumber = 1;
    
    return this.state;
  }
  
  // Draw cards from deck
  drawCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      if (this.state.drawPile.length === 0) {
        // Reshuffle discard pile
        this.state.drawPile = deck.shuffle([...this.state.discardPile]);
        this.state.discardPile = [];
      }
      if (this.state.drawPile.length > 0) {
        cards.push(this.state.drawPile.pop());
      }
    }
    return cards;
  }
  
  // Get current player
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }
  
  // Get clearing data
  getClearing(clearingId) {
    return this.state.clearings.find(c => c.id === clearingId);
  }
  
  // Get pieces in a clearing
  getPiecesInClearing(clearingId, faction = null) {
    return this.state.pieces.filter(p => 
      p.clearingId === clearingId && 
      (faction === null || p.faction === faction)
    );
  }
  
  // Count warriors in clearing
  countWarriors(clearingId, faction) {
    return this.getPiecesInClearing(clearingId, faction)
      .filter(p => p.type === 'warrior').length;
  }
  
  // Determine ruler of clearing (most combined buildings + warriors)
  getRuler(clearingId) {
    const factionCounts = {};
    const pieces = this.getPiecesInClearing(clearingId);
    
    pieces.forEach(p => {
      if (!factionCounts[p.faction]) {
        factionCounts[p.faction] = { warriors: 0, buildings: 0 };
      }
      if (p.type === 'warrior') {
        factionCounts[p.faction].warriors++;
      } else {
        factionCounts[p.faction].buildings++;
      }
    });
    
    let ruler = null;
    let maxPresence = 0;
    
    for (const [faction, counts] of Object.entries(factionCounts)) {
      const presence = counts.warriors + counts.buildings;
      if (presence > maxPresence) {
        maxPresence = presence;
        ruler = faction;
      } else if (presence === maxPresence) {
        // Tie - no ruler
        ruler = null;
      }
    }
    
    return ruler;
  }
  
  // Move warriors between clearings
  moveWarriors(faction, fromClearing, toClearing, count) {
    const clearing = this.getClearing(fromClearing);
    const targetClearing = this.getClearing(toClearing);
    
    // Check if clearings are connected
    if (!clearing.connections.includes(toClearing)) {
      throw new Error('Clearings are not connected');
    }
    
    // Check if faction rules origin or destination (required to move out)
    const fromRuler = this.getRuler(fromClearing);
    const toRuler = this.getRuler(toClearing);
    
    if (fromRuler !== faction && toRuler !== faction) {
      throw new Error('Must rule origin or destination to move');
    }
    
    // Find and move warriors
    let moved = 0;
    for (let i = 0; i < this.state.pieces.length && moved < count; i++) {
      const piece = this.state.pieces[i];
      if (piece.type === 'warrior' && 
          piece.faction === faction && 
          piece.clearingId === fromClearing) {
        piece.clearingId = toClearing;
        moved++;
      }
    }
    
    this.logAction('move', { faction, from: fromClearing, to: toClearing, count: moved });
    return moved;
  }
  
  // Battle in a clearing
  battle(attackerFaction, defenderFaction, clearingId) {
    const attackerWarriors = this.countWarriors(clearingId, attackerFaction);
    const defenderWarriors = this.countWarriors(clearingId, defenderFaction);
    
    if (attackerWarriors === 0) {
      throw new Error('No warriors to attack with');
    }
    if (defenderWarriors === 0) {
      // Check for buildings/tokens
      const defenderPieces = this.getPiecesInClearing(clearingId, defenderFaction);
      if (defenderPieces.length === 0) {
        throw new Error('No enemy pieces to attack');
      }
    }
    
    // Roll dice (0-3 each in original, we'll use 0-3)
    const attackRoll = Math.floor(Math.random() * 4);
    const defendRoll = Math.floor(Math.random() * 4);
    
    // Attacker takes higher roll, defender takes lower (capped by warriors)
    let attackerHits = Math.min(Math.max(attackRoll, defendRoll), defenderWarriors);
    let defenderHits = Math.min(Math.min(attackRoll, defendRoll), attackerWarriors);
    
    // Apply casualties
    const attackerLosses = this.removePieces(attackerFaction, clearingId, defenderHits);
    const defenderLosses = this.removePieces(defenderFaction, clearingId, attackerHits);
    
    // Score VP for removed pieces
    const attackerVP = defenderLosses.buildings;
    if (attackerVP > 0) {
      this.scoreVP(attackerFaction, attackerVP);
    }
    
    this.logAction('battle', {
      attacker: attackerFaction,
      defender: defenderFaction,
      clearing: clearingId,
      attackRoll,
      defendRoll,
      attackerLosses,
      defenderLosses
    });
    
    return { attackerLosses, defenderLosses, attackerVP };
  }
  
  // Remove pieces (warriors first, then buildings)
  removePieces(faction, clearingId, count) {
    let removed = { warriors: 0, buildings: 0, tokens: 0 };
    let remaining = count;
    
    // Remove warriors first
    for (let i = this.state.pieces.length - 1; i >= 0 && remaining > 0; i--) {
      const piece = this.state.pieces[i];
      if (piece.faction === faction && 
          piece.clearingId === clearingId && 
          piece.type === 'warrior') {
        this.state.pieces.splice(i, 1);
        removed.warriors++;
        remaining--;
      }
    }
    
    // Then buildings/tokens
    for (let i = this.state.pieces.length - 1; i >= 0 && remaining > 0; i--) {
      const piece = this.state.pieces[i];
      if (piece.faction === faction && piece.clearingId === clearingId) {
        this.state.pieces.splice(i, 1);
        if (['sawmill', 'workshop', 'recruiter', 'roost', 'base', 'garden'].includes(piece.type)) {
          removed.buildings++;
        } else {
          removed.tokens++;
        }
        remaining--;
      }
    }
    
    return removed;
  }
  
  // Place a building
  placeBuilding(faction, buildingType, clearingId) {
    const clearing = this.getClearing(clearingId);
    
    // Check if faction rules the clearing
    if (this.getRuler(clearingId) !== faction) {
      throw new Error('Must rule clearing to build');
    }
    
    // Count existing buildings
    const existingBuildings = this.getPiecesInClearing(clearingId)
      .filter(p => ['sawmill', 'workshop', 'recruiter', 'roost', 'base', 'garden'].includes(p.type))
      .length;
    
    if (existingBuildings >= clearing.slots) {
      throw new Error('No empty building slots');
    }
    
    // Add the building
    this.state.pieces.push({
      type: buildingType,
      faction: faction,
      clearingId: clearingId
    });
    
    this.logAction('build', { faction, type: buildingType, clearing: clearingId });
    return true;
  }
  
  // Place warriors
  placeWarriors(faction, clearingId, count) {
    for (let i = 0; i < count; i++) {
      this.state.pieces.push({
        type: 'warrior',
        faction: faction,
        clearingId: clearingId
      });
    }
    this.logAction('recruit', { faction, clearing: clearingId, count });
    return count;
  }
  
  // Score victory points
  scoreVP(faction, points) {
    const player = this.state.players.find(p => p.faction === faction);
    if (player) {
      player.victoryPoints += points;
      
      // Check for victory
      if (player.victoryPoints >= VICTORY_POINTS_TO_WIN) {
        this.state.winnerId = player.oderId;
        this.state.winCondition = 'victory_points';
      }
    }
    this.logAction('score', { faction, points });
  }
  
  // Advance to next phase
  nextPhase() {
    const phases = [PHASES.BIRDSONG, PHASES.DAYLIGHT, PHASES.EVENING];
    const currentIndex = phases.indexOf(this.state.currentPhase);
    
    if (currentIndex === phases.length - 1) {
      // End of turn, move to next player
      this.nextPlayer();
    } else {
      this.state.currentPhase = phases[currentIndex + 1];
    }
    
    return this.state.currentPhase;
  }
  
  // Move to next player's turn
  nextPlayer() {
    this.state.currentPlayerIndex = 
      (this.state.currentPlayerIndex + 1) % this.state.players.length;
    
    if (this.state.currentPlayerIndex === 0) {
      this.state.turnNumber++;
    }
    
    this.state.currentPhase = PHASES.BIRDSONG;
    this.logAction('end_turn', { 
      newPlayer: this.state.currentPlayerIndex,
      turn: this.state.turnNumber 
    });
  }
  
  // Log an action
  logAction(action, data) {
    this.state.actionLog.push({
      playerId: this.getCurrentPlayer()?.oderId,
      action,
      data,
      timestamp: new Date()
    });
  }
  
  // Get current game state (for sending to clients)
  getState() {
    return this.state;
  }
  
  // Get state for specific player (hides other players' hands)
  getStateForPlayer(playerId) {
    const state = { ...this.state };
    state.players = state.players.map(p => {
      if (p.oderId.toString() === playerId.toString()) {
        return p;
      }
      // Hide other players' hands
      return {
        ...p,
        hand: p.hand.map(() => ({ hidden: true }))
      };
    });
    return state;
  }
}

module.exports = GameEngine;
