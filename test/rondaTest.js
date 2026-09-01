/**
 * Moroccan Ronda Test Suite
 * Tests Automatic Declarations (Quarteto, Tringa, Ronda comparisons, taking opponent rewards, secret ranks),
 * 4-3-3 Dealing, and Hit Prizes.
 */

const assert = require('assert');
const RondaGame = require('../server/game/rondaEngine');

console.log('🧪 Starting Moroccan Ronda Engine Tests...\n');

// 1. Test 4-3-3 Deal Sequence
console.log('1. Testing 4-3-3 Deal Sequence (40 Cards)...');
const game = new RondaGame({
  mode: '2v2',
  playerCount: 4,
  players: [
    { id: 'p0', name: 'Amine', seat: 0, avatar: 'tarboosh' },
    { id: 'p1', name: 'Bouchaib', seat: 1, avatar: 'djellaba' },
    { id: 'p2', name: 'Yassine', seat: 2, avatar: 'tea' },
    { id: 'p3', name: 'Aziz', seat: 3, avatar: 'fez' }
  ]
});
game.startMatch();

assert.strictEqual(game.handDealRound, 1);
assert.strictEqual(game.hands[0].length, 4);
assert.strictEqual(game.hands[1].length, 4);
assert.strictEqual(game.hands[2].length, 4);
assert.strictEqual(game.hands[3].length, 4);
console.log('  ✅ Deal 1 gave 4 cards to each player (16 cards dealt).');

// 2. Test Secret Ranks in Announcements
console.log('\n2. Testing Secret Ranks in Announcements...');
game.scores = [0, 0];
game.hands[0] = [
  { id: 'oros_7', suit: 'oros', rank: 7 },
  { id: 'copas_7', suit: 'copas', rank: 7 },
  { id: 'espadas_7', suit: 'espadas', rank: 7 },
  { id: 'bastos_2', suit: 'bastos', rank: 2 }
];
game.hands[1] = [
  { id: 'oros_3', suit: 'oros', rank: 3 },
  { id: 'copas_3', suit: 'copas', rank: 3 },
  { id: 'espadas_1', suit: 'espadas', rank: 1 },
  { id: 'bastos_5', suit: 'bastos', rank: 5 }
];
game.hands[2] = [];
game.hands[3] = [];
game.currentDealDeclarations = [];
game.evaluateDeclarations();

assert.strictEqual(game.currentDealDeclarations.length, 2);
assert.strictEqual(game.currentDealDeclarations[0].subtitle, 'Amine عنده تـريـنـغـا!');
assert.strictEqual(game.currentDealDeclarations[1].subtitle, 'Bouchaib عنده رونـدا!');
assert.ok(!game.currentDealDeclarations[0].subtitle.includes('7'), 'Subtitle must NOT reveal rank 7');
assert.ok(!game.currentDealDeclarations[1].subtitle.includes('3'), 'Subtitle must NOT reveal rank 3');
console.log('  ✅ Announcements do NOT reveal card numbers/ranks.');

// 3. Test Tringa taking enemy Ronda (Tringa beats Ronda)
console.log('\n3. Testing Tringa taking enemy Ronda...');
// Team 0 has Tringa (+5), Team 1 has Ronda (+1) -> Team 0 takes both (5 + 1 = 6 pts), Team 1 gets 0
assert.strictEqual(game.scores[0], 6, 'Team 0 with Tringa took own 5 pts + enemy Ronda 1 pt = 6 pts');
assert.strictEqual(game.scores[1], 0, 'Team 1 got 0 pts because enemy had Tringa');
console.log('  ✅ Tringa successfully took enemy Ronda points (5 + 1 = 6 pts to Team 0).');

// 4. Test Ronda Rank Comparison (Higher rank wins and takes enemy Ronda)
console.log('\n4. Testing Ronda Rank Comparison (Higher rank wins)...');
game.scores = [0, 0];
// Team 0: Player 0 has Ronda of 7s. Team 1: Player 1 has Ronda of 3s.
game.hands[0] = [
  { id: 'oros_7', suit: 'oros', rank: 7 },
  { id: 'copas_7', suit: 'copas', rank: 7 },
  { id: 'espadas_1', suit: 'espadas', rank: 1 },
  { id: 'bastos_2', suit: 'bastos', rank: 2 }
];
game.hands[1] = [
  { id: 'oros_3', suit: 'oros', rank: 3 },
  { id: 'copas_3', suit: 'copas', rank: 3 },
  { id: 'espadas_5', suit: 'espadas', rank: 5 },
  { id: 'bastos_6', suit: 'bastos', rank: 6 }
];
game.hands[2] = [];
game.hands[3] = [];
game.evaluateDeclarations();

assert.strictEqual(game.scores[0], 2, 'Team 0 (Ronda of 7) beat Team 1 (Ronda of 3) and got 1 + 1 = 2 pts');
assert.strictEqual(game.scores[1], 0, 'Team 1 got 0 pts for lower Ronda');
console.log('  ✅ Higher Ronda (7) won over lower Ronda (3) and took all 2 Ronda points.');

// 5. Test Quarteto taking all enemy combos (Tringa + Ronda)
console.log('\n5. Testing Quarteto taking all enemy combos...');
game.scores = [0, 0];
// Team 0: Player 0 has Quarteto of 4s (+10 pts)
game.hands[0] = [
  { id: 'oros_4', suit: 'oros', rank: 4 },
  { id: 'copas_4', suit: 'copas', rank: 4 },
  { id: 'espadas_4', suit: 'espadas', rank: 4 },
  { id: 'bastos_4', suit: 'bastos', rank: 4 }
];
// Team 1: Player 1 has Tringa of 10s (+5 pts), Player 3 has Ronda of 12s (+1 pt)
game.hands[1] = [
  { id: 'oros_10', suit: 'oros', rank: 10 },
  { id: 'copas_10', suit: 'copas', rank: 10 },
  { id: 'espadas_10', suit: 'espadas', rank: 10 },
  { id: 'bastos_1', suit: 'bastos', rank: 1 }
];
game.hands[2] = [];
game.hands[3] = [
  { id: 'oros_12', suit: 'oros', rank: 12 },
  { id: 'copas_12', suit: 'copas', rank: 12 },
  { id: 'espadas_2', suit: 'espadas', rank: 2 },
  { id: 'bastos_6', suit: 'bastos', rank: 6 }
];
game.evaluateDeclarations();

// Team 0 gets: 10 (Quarteto) + 5 (Enemy Tringa) + 1 (Enemy Ronda) = 16 pts (+3 3ouds and 1 7ajra)
assert.strictEqual(game.scores[0], 16, 'Team 0 with Quarteto took own 10 pts + enemy Tringa 5 pts + enemy Ronda 1 pt = 16 pts');
assert.strictEqual(game.scores[1], 0, 'Team 1 got 0 pts because enemy had Quarteto');
console.log('  ✅ Quarteto took all enemy combos (10 + 5 + 1 = 16 pts to Team 0).');

// 6. Test Ronda Tie (Same rank -> 0 pts to both)
console.log('\n6. Testing Ronda Tie (Same rank on opposing teams)...');
game.scores = [0, 0];
game.hands[0] = [
  { id: 'oros_7', suit: 'oros', rank: 7 },
  { id: 'copas_7', suit: 'copas', rank: 7 }
];
game.hands[1] = [
  { id: 'espadas_7', suit: 'espadas', rank: 7 },
  { id: 'bastos_7', suit: 'bastos', rank: 7 }
];
game.hands[2] = [];
game.hands[3] = [];
game.evaluateDeclarations();

assert.strictEqual(game.scores[0], 0, 'Team 0 got 0 pts on tied Ronda rank (Ba6el)');
assert.strictEqual(game.scores[1], 0, 'Team 1 got 0 pts on tied Ronda rank (Ba6el)');
console.log('  ✅ Tied Ronda rank resulted in 0 points for both teams (Ba6el).');

// 7. Test Hit Progression (Darb -> Khlis)
console.log('\n7. Testing Hit Progression (Darb -> Khlis)...');
game.scores = [0, 0];
game.table = [{ id: 'bastos_1', suit: 'bastos', rank: 1 }];
game.hands[0] = [{ id: 'oros_5', suit: 'oros', rank: 5 }];
game.hands[2] = [{ id: 'bastos_2', suit: 'bastos', rank: 2 }];
game.currentTurn = 0;
game.playCard(0, 'oros_5');

// Player 1 hits with 5 of Copas (1st Hit = Darb -> 1 7ajra)
game.hands[1] = [{ id: 'copas_5', suit: 'copas', rank: 5 }];
const p1Res = game.playCard(1, 'copas_5');
assert.strictEqual(p1Res.captureResult.hitType, 'DARB');
assert.strictEqual(game.scores[1], 1, '1st hit awarded 1 pt (1 7ajra)');
console.log('  ✅ 1st hit (Darb) awarded 1 7ajra (+1 pt).');

// 8. Test 9a3a with 12
console.log('\n8. Testing 9a3a with 12 (Rey / Cheikh)...');
game.scores = [0, 0];
game.table = [{ id: 'oros_12', suit: 'oros', rank: 12 }];
game.tricksPlayedInHand = 39; // 40th trick
game.currentTurn = 0;
game.hands[0] = [{ id: 'copas_12', suit: 'copas', rank: 12 }];
const p0_9a3a = game.playCard(0, 'copas_12');
assert.strictEqual(p0_9a3a.captureResult.hitType, '9A3A_12');
assert.strictEqual(game.scores[0], 5, '9a3a with 12 awarded 1 3oud (+5 pts)');
console.log('  ✅ 9a3a with 12 successfully awarded 1 3oud (+5 points).');

console.log('\n🎉 ALL MOROCCAN RONDA ENGINE TESTS PASSED 100%!');
