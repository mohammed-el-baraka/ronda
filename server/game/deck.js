/**
 * Moroccan Ronda - Deck & Card Definitions
 * 40-card Spanish Baraja deck (1-7, 10-12 in 4 suits)
 */

const SUITS = [
  { id: 'oros', nameAr: 'ذهب / دينار', nameFr: 'Oros (Or)', nameEn: 'Coins / Gold', symbol: '🪙', color: '#f59e0b' },
  { id: 'copas', nameAr: 'كؤوس / كواس', nameFr: 'Copas (Coupes)', nameEn: 'Cups', symbol: '🍷', color: '#ef4444' },
  { id: 'espadas', nameAr: 'سيوف', nameFr: 'Espadas (Épées)', nameEn: 'Swords', symbol: '⚔️', color: '#3b82f6' },
  { id: 'bastos', nameAr: 'زرواطة / عصي', nameFr: 'Bastos (Bâtons)', nameEn: 'Clubs', symbol: '🪵', color: '#10b981' }
];

const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

const RANK_NAMES = {
  1: { ar: 'واحد (الآص)', fr: 'As', en: '1 (Ace)', dar: 'Wa7ed / As' },
  2: { ar: 'جوج', fr: 'Deux', en: '2', dar: 'Jouj' },
  3: { ar: 'تلاتة', fr: 'Trois', en: '3', dar: 'Tlata' },
  4: { ar: 'ربعة', fr: 'Quatre', en: '4', dar: 'Reb3a' },
  5: { ar: 'خمسة', fr: 'Cinq', en: '5', dar: 'Khemssa' },
  6: { ar: 'ستة', fr: 'Six', en: '6', dar: 'Setta' },
  7: { ar: 'سبعة', fr: 'Sept', en: '7', dar: 'Seb3a' },
  10: { ar: 'عشرة (الولد / صوطة)', fr: 'Sota (Valet)', en: '10 (Jack / Sota)', dar: 'Walad / Sota' },
  11: { ar: 'حداش (العود / كفال)', fr: 'Caballo (Cavalier)', en: '11 (Knight / Faras)', dar: '3awd / Faras' },
  12: { ar: 'طناش (الشيخ / ري)', fr: 'Rey (Roi)', en: '12 (King / Cheikh)', dar: 'Cheikh / Rey' }
};

/**
 * Returns the next rank in Ronda ascending sequence (1->2->...->7->10->11->12)
 * Note: 12 has no subsequent rank in Ronda.
 */
function getNextRank(rank) {
  const index = RANKS.indexOf(rank);
  if (index >= 0 && index < RANKS.length - 1) {
    return RANKS[index + 1];
  }
  return null;
}

/**
 * Creates a fresh 40-card Baraja deck
 */
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit.id}_${rank}`,
        suit: suit.id,
        rank: rank,
        nameAr: `${RANK_NAMES[rank].ar} ${suit.nameAr}`,
        nameDar: `${RANK_NAMES[rank].dar} ${suit.id}`,
        nameFr: `${RANK_NAMES[rank].fr} de ${suit.nameFr}`,
        nameEn: `${RANK_NAMES[rank].en} of ${suit.nameEn}`,
        symbol: suit.symbol,
        color: suit.color
      });
    }
  }
  return deck;
}

/**
 * Shuffles an array in place using Fisher-Yates
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deals initial 4 table cards ensuring no duplicate ranks
 * (Traditional Ronda rule: initial 4 table cards must be unique ranks)
 */
function dealInitialTableCards(deck) {
  const table = [];
  const ranksSeen = new Set();
  let index = 0;

  while (table.length < 4 && index < deck.length) {
    const card = deck[index];
    if (!ranksSeen.has(card.rank)) {
      table.push(card);
      ranksSeen.add(card.rank);
      deck.splice(index, 1);
    } else {
      index++;
    }
  }

  // Fallback if needed
  while (table.length < 4 && deck.length > 0) {
    table.push(deck.shift());
  }

  return table;
}

module.exports = {
  SUITS,
  RANKS,
  RANK_NAMES,
  getNextRank,
  createDeck,
  shuffle,
  dealInitialTableCards
};
