/**
 * Moroccan Ronda - Intelligent Bot AI (Updated with 3oud & 7ajra and 9a3a b'12 tactics)
 */

const BOT_NAMES = [
  { name: 'سيمو الحريفي (Simo)', avatar: 'tarboosh' },
  { name: 'المعلم بوشعيب (Bouchaib)', avatar: 'djellaba' },
  { name: 'عزيز الروندا (Aziz)', avatar: 'fez' },
  { name: 'ياسين القهواجي (Yassine)', avatar: 'tea' },
  { name: 'عمر القمار (Omar)', avatar: 'mustache' },
  { name: 'حميد الصوطة (Hamid)', avatar: 'sheikh' }
];

class RondaBotAI {
  /**
   * Selects the best card to play from the bot's hand
   */
  static chooseCard(gameState, botSeat) {
    const hand = gameState.hands[botSeat];
    if (!hand || hand.length === 0) return null;
    if (hand.length === 1) return hand[0];

    const table = gameState.table;
    const lastPlayed = gameState.lastPlayedInfo;
    const isPreviousPlayerUncaptured = lastPlayed && !lastPlayed.captured;
    const is9a3aTrick = (gameState.tricksPlayedInHand + 1 === 40);

    const scoredMoves = hand.map(card => {
      let score = 0;
      const capturable = gameState.getCapturableCards(card);
      const isCapture = capturable.length > 0;

      // Special 9a3a Rule: Capturing with 12 on the last card gives 1 3oud (5 points / 5 7ajrat)!
      if (is9a3aTrick && card.rank === 12 && isCapture) {
        score += 2000; // Super high priority!
      }

      // 1. Darb / Khlis Opportunity (Hitting previous uncaptured card)
      if (isPreviousPlayerUncaptured && card.rank === lastPlayed.card.rank) {
        if (gameState.darbStreak === 0) {
          score += 150; // Darb: +1 7ajra
        } else if (gameState.darbStreak === 1) {
          score += 500; // Khlis: +1 3oud (5 7ajrat)
        } else if (gameState.darbStreak === 2) {
          score += 1000; // Zid Khlis: +2 عواد (10 7ajrat)
        } else {
          score += 1500; // Basta: +3 عواد (15 7ajrat)
        }
      }

      // 2. Missa Opportunity (Sweeping the whole table)
      if (isCapture) {
        const tableCardsAfter = table.length - capturable.length;
        if (tableCardsAfter === 0 && !is9a3aTrick) {
          score += 120; // Missa: +1 7ajra + sweeps table
        }

        // 3. Number of cards captured (cascade value)
        score += (capturable.length + 1) * 25;
      } else {
        // No capture: Discard strategy
        score -= 20;

        // If on earlier deals, holding a 12 for the 9a3a can be a strategic move
        if (card.rank === 12 && gameState.handDealRound === 3 && hand.length > 1) {
          score -= 10; // Try to keep the 12 for the last trick if possible
        }

        if (card.rank >= 10) {
          score += 8;
        } else if (card.rank <= 3) {
          score += 4;
        }

        const duplicateInHand = hand.filter(c => c.rank === card.rank).length > 1;
        if (duplicateInHand) {
          score += 5;
        }
      }

      return { card, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].card;
  }

  static getRandomBotProfile(existingNames = []) {
    const available = BOT_NAMES.filter(b => !existingNames.includes(b.name));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    const idx = Math.floor(Math.random() * 100);
    return { name: `روندا بوت ${idx}`, avatar: 'tarboosh' };
  }
}

module.exports = RondaBotAI;
