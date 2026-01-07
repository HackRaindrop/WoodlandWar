const { v4: uuidv4 } = require('uuid');

// Card definitions for the shared deck
const cardDefinitions = [
  // Ambush cards (8 total - 2 per suit)
  { name: 'Ambush', type: 'ambush', suit: 'fox', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'fox', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'rabbit', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'rabbit', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'mouse', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'mouse', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'bird', effect: 'Deal 2 extra hits in battle' },
  { name: 'Ambush', type: 'ambush', suit: 'bird', effect: 'Deal 2 extra hits in battle' },
  
  // Dominance cards (4 total - 1 per suit)
  { name: 'Fox Dominance', type: 'dominance', suit: 'fox', effect: 'Win by controlling 3 fox clearings' },
  { name: 'Rabbit Dominance', type: 'dominance', suit: 'rabbit', effect: 'Win by controlling 3 rabbit clearings' },
  { name: 'Mouse Dominance', type: 'dominance', suit: 'mouse', effect: 'Win by controlling 3 mouse clearings' },
  { name: 'Bird Dominance', type: 'dominance', suit: 'bird', effect: 'Win by controlling 2 opposite corners' },
  
  // Item cards for crafting
  { name: 'Sword', type: 'item', suit: 'fox', craftCost: ['fox'], item: 'sword' },
  { name: 'Sword', type: 'item', suit: 'fox', craftCost: ['fox'], item: 'sword' },
  { name: 'Crossbow', type: 'item', suit: 'fox', craftCost: ['fox'], item: 'crossbow' },
  { name: 'Hammer', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], item: 'hammer' },
  { name: 'Boot', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], item: 'boot' },
  { name: 'Boot', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], item: 'boot' },
  { name: 'Torch', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'torch' },
  { name: 'Torch', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'torch' },
  { name: 'Coins', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'coins' },
  { name: 'Coins', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'coins' },
  { name: 'Bag', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'bag' },
  { name: 'Bag', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'bag' },
  { name: 'Tea', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'tea' },
  { name: 'Tea', type: 'item', suit: 'mouse', craftCost: ['mouse'], item: 'tea' },
  
  // Favor cards (powerful effects)
  { name: 'Favor of the Foxes', type: 'favor', suit: 'fox', craftCost: ['fox', 'fox', 'fox'], effect: 'Remove all enemy pieces in fox clearings' },
  { name: 'Favor of the Rabbits', type: 'favor', suit: 'rabbit', craftCost: ['rabbit', 'rabbit', 'rabbit'], effect: 'Remove all enemy pieces in rabbit clearings' },
  { name: 'Favor of the Mice', type: 'favor', suit: 'mouse', craftCost: ['mouse', 'mouse', 'mouse'], effect: 'Remove all enemy pieces in mouse clearings' },
  
  // Standard cards (various effects)
  { name: 'Woodland Runners', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], effect: 'Move through two extra clearings', item: 'boot' },
  { name: 'Arms Trader', type: 'item', suit: 'fox', craftCost: ['fox', 'fox'], effect: 'Gain 2 VP per sword you craft' },
  { name: 'Sappers', type: 'item', suit: 'mouse', craftCost: ['mouse'], effect: 'In battle as defender, deal extra hit' },
  { name: 'Brutality', type: 'item', suit: 'fox', craftCost: ['fox', 'fox'], effect: 'Score VP for each enemy warrior removed' },
  { name: 'Tax Collector', type: 'item', suit: 'rabbit', craftCost: ['rabbit', 'rabbit', 'rabbit'], effect: 'Once per turn, take a card from an opponent' },
  { name: 'Scout', type: 'item', suit: 'mouse', craftCost: ['mouse'], effect: 'Look at an opponent\'s hand' },
  { name: 'Armorers', type: 'item', suit: 'fox', craftCost: ['fox'], effect: 'Ignore first hit in battle' },
  { name: 'Better Burrow Bank', type: 'item', suit: 'rabbit', craftCost: ['rabbit', 'rabbit'], effect: 'Draw a card at start of turn' },
  { name: 'Cobbler', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], effect: 'Take extra move action' },
  { name: 'Command Warren', type: 'item', suit: 'rabbit', craftCost: ['rabbit', 'rabbit'], effect: 'Initiate battle in clearing you rule' },
  { name: 'Codebreakers', type: 'item', suit: 'mouse', craftCost: ['mouse'], effect: 'Look at Decree before adding cards' },
  { name: 'Bake Sale', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], effect: 'Discard hand, draw equal cards' },
  { name: 'Stand and Deliver', type: 'item', suit: 'mouse', craftCost: ['mouse', 'mouse', 'mouse'], effect: 'Steal from supply pile' },
  
  // Filler cards to round out deck (54 total typical)
  { name: 'Forest Path', type: 'item', suit: 'fox', craftCost: ['fox'], effect: 'Draw 1 card' },
  { name: 'Forest Path', type: 'item', suit: 'rabbit', craftCost: ['rabbit'], effect: 'Draw 1 card' },
  { name: 'Forest Path', type: 'item', suit: 'mouse', craftCost: ['mouse'], effect: 'Draw 1 card' },
  { name: 'Forest Path', type: 'item', suit: 'bird', craftCost: ['bird'], effect: 'Draw 1 card' },
  { name: 'Birdsong', type: 'item', suit: 'bird', craftCost: ['bird'], effect: 'Gain 1 VP' },
  { name: 'Birdsong', type: 'item', suit: 'bird', craftCost: ['bird'], effect: 'Gain 1 VP' },
  { name: 'Travel Permit', type: 'item', suit: 'bird', craftCost: ['bird', 'bird'], effect: 'Move ignoring rule' },
  { name: 'Royal Claim', type: 'item', suit: 'bird', craftCost: ['bird', 'bird', 'bird', 'bird'], effect: 'Score 1 VP per clearing you rule' },
];

// Fisher-Yates shuffle
const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create a new deck with unique IDs
const createDeck = () => {
  return cardDefinitions.map(card => ({
    ...card,
    id: uuidv4()
  }));
};

// Draw cards from deck
const drawCards = (deck, discardPile, count) => {
  const cards = [];
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  
  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      // Reshuffle discard
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }
    if (currentDeck.length > 0) {
      cards.push(currentDeck.pop());
    }
  }
  
  return { cards, deck: currentDeck, discardPile: currentDiscard };
};

module.exports = {
  cardDefinitions,
  createDeck,
  shuffle,
  drawCards
};
