/**
 * Moroccan Ronda - Core Game Engine (Automatic Declarations, Slow Cinematic Pacing, Right-to-Left Flow)
 */

const {
  createDeck,
  shuffle,
  getNextRank,
  RANK_NAMES
} = require('./deck');

class RondaGame {
  constructor(options = {}) {
    this.id = options.id || Math.random().toString(36).substring(2, 8).toUpperCase();
    this.mode = options.mode || '2v2';
    this.playerCount = options.playerCount || 4;
    this.players = options.players || [];

    // Match / Dfo3 state
    // 1 3oud = 5 7ajrat (points)
    // 1st Dfo3 target = 4 3ouds (20 pts)
    // 2nd Dfo3 target = 4 3ouds + 1 7ajra (21 pts) -> Total 41 pts
    this.currentDfo3 = 1;
    this.scores = [0, 0]; // Team 0 (South 0 / North 2) vs Team 1 (East 1 / West 3)
    this.dfo3Scores = [0, 0];
    this.dfo3Wins = [0, 0];
    
    this.handNumber = 0;
    this.dealerIndex = 0;
    this.gameHistory = [];
    this.isMatchOver = false;
    this.winnerTeam = null;
    this.winnerPlayers = [];

    // Current hand state
    this.deck = [];
    this.table = [];
    this.hands = [[], [], [], []];
    this.collectedCards = [[], []];
    this.handDealRound = 0; // 1 (4 cards), 2 (3 cards), 3 (3 cards)
    this.currentTurn = 0;
    this.tricksPlayedInDeal = 0;
    this.tricksPlayedInHand = 0;
    
    // Hit / Darb chain tracking
    this.lastPlayedInfo = null;
    this.darbStreak = 0;
    this.lastCapturingPlayer = null;
    
    // Declarations for current deal round
    this.currentDealDeclarations = [];
    this.handEvents = [];
    this.currentHandRoundScores = [0, 0];
    
    this.state = 'LOBBY';
  }

  startMatch() {
    this.currentDfo3 = 1;
    this.scores = [0, 0];
    this.dfo3Scores = [0, 0];
    this.dfo3Wins = [0, 0];
    this.handNumber = 0;
    this.dealerIndex = 0;
    this.isMatchOver = false;
    this.winnerTeam = null;
    this.winnerPlayers = [];
    this.gameHistory = [];
    this.startNewHand();
  }

  startNewHand() {
    this.handNumber++;
    this.state = 'DEALING';
    this.deck = shuffle(createDeck());
    this.table = [];
    this.collectedCards = this.mode === '2v2' ? [[], []] : new Array(this.playerCount).fill(null).map(() => []);
    this.currentHandRoundScores = [0, 0];
    this.handDealRound = 0;
    this.tricksPlayedInHand = 0;
    this.lastPlayedInfo = null;
    this.darbStreak = 0;
    this.lastCapturingPlayer = null;
    this.hands = new Array(this.playerCount).fill(null).map(() => []);
    this.currentDealDeclarations = [];
    this.handEvents = [];

    this.logEvent({
      type: 'HAND_START',
      message: `بداية اليد رقم ${this.handNumber} - الموزع: ${this.getPlayerName(this.dealerIndex)}`,
      dealer: this.dealerIndex
    });

    // Right-to-Left play: (dealerIndex + 1) % 4
    this.currentTurn = (this.dealerIndex + 1) % this.playerCount;

    this.dealNextRound();
  }

  dealNextRound() {
    this.handDealRound++;
    this.tricksPlayedInDeal = 0;
    this.currentDealDeclarations = [];

    const cardsPerPlayer = this.handDealRound === 1 ? 4 : 3;
    for (let i = 0; i < this.playerCount; i++) {
      const seat = (this.dealerIndex + 1 + i) % this.playerCount;
      this.hands[seat] = this.deck.splice(0, cardsPerPlayer);
    }

    // Automatic Declaration Evaluation (Announces who has what before play starts)
    this.evaluateDeclarations();

    this.state = 'PLAYING';
    this.logEvent({
      type: 'DEAL',
      message: `التفريقة ${this.handDealRound} من 3 (${cardsPerPlayer} أوراق لكل لاعب)`,
      dealRound: this.handDealRound,
      cardsLeftInDeck: this.deck.length
    });
  }

  /**
   * Automatically inspects all players' dealt hands and resolves combos (Quarteto, Tringa, Ronda)
   * Moroccan Ronda Rules:
   * 1. Secret ranks: Announcements NEVER reveal the card rank/number (to protect hand privacy).
   * 2. Quarteto (4 cards = 10 pts): Beats everything, takes all enemy combos (Quartetos, Tringas, Rondas).
   * 3. Tringa (3 cards = 5 pts): Beats Ronda, takes all enemy Rondas. Higher Tringa rank wins.
   * 4. Ronda (2 cards = 1 pt): Higher rank wins and takes the enemy's Ronda points!
   */
  evaluateDeclarations() {
    const playerDeclarations = [];
    const teamDeclarations = [[], []];

    for (let seat = 0; seat < this.playerCount; seat++) {
      const hand = this.hands[seat];
      if (!hand || hand.length === 0) continue;

      const rankCounts = {};
      hand.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
      const team = this.getPlayerTeam(seat);
      const playerName = this.getPlayerName(seat);

      for (const [rankStr, count] of Object.entries(rankCounts)) {
        const rank = parseInt(rankStr, 10);
        if (count === 4) {
          const decl = {
            seat,
            team,
            type: 'quarteto',
            category: 3,
            rank,
            basePoints: 10,
            title: '👑 كـواطـرو (QUARTETO)!',
            subtitle: `${playerName} عنده كـواطـرو!`
          };
          playerDeclarations.push(decl);
          teamDeclarations[team].push(decl);
        } else if (count === 3) {
          const decl = {
            seat,
            team,
            type: 'tringa',
            category: 2,
            rank,
            basePoints: 5,
            title: '🔥 تـريـنـغـا (TRINGA)!',
            subtitle: `${playerName} عنده تـريـنـغـا!`
          };
          playerDeclarations.push(decl);
          teamDeclarations[team].push(decl);
        } else if (count === 2) {
          const decl = {
            seat,
            team,
            type: 'ronda',
            category: 1,
            rank,
            basePoints: 1,
            title: '✨ رونـدا (RONDA)!',
            subtitle: `${playerName} عنده رونـدا!`
          };
          playerDeclarations.push(decl);
          teamDeclarations[team].push(decl);
        }
      }
    }

    this.currentDealDeclarations = playerDeclarations;

    // Step 2: Compare and resolve rewards between Team 0 and Team 1
    const t0Decls = teamDeclarations[0];
    const t1Decls = teamDeclarations[1];

    const t0MaxCat = t0Decls.reduce((max, d) => Math.max(max, d.category), 0);
    const t1MaxCat = t1Decls.reduce((max, d) => Math.max(max, d.category), 0);

    let winningTeam = null;
    let isTie = false;

    if (t0MaxCat === 0 && t1MaxCat === 0) {
      // No declarations
      return;
    } else if (t0MaxCat > 0 && t1MaxCat === 0) {
      // Only Team 0 has declarations
      winningTeam = 0;
      const pts = t0Decls.reduce((sum, d) => sum + d.basePoints, 0);
      this.addScore(0, pts);
      this.logEvent({
        type: 'DECLARATION_RESULT',
        winnerTeam: 0,
        points: pts,
        message: `فرقة 1 دات نقاط الكومبو (+${pts} نقطة)`
      });
    } else if (t1MaxCat > 0 && t0MaxCat === 0) {
      // Only Team 1 has declarations
      winningTeam = 1;
      const pts = t1Decls.reduce((sum, d) => sum + d.basePoints, 0);
      this.addScore(1, pts);
      this.logEvent({
        type: 'DECLARATION_RESULT',
        winnerTeam: 1,
        points: pts,
        message: `فرقة 2 دات نقاط الكومبو (+${pts} نقطة)`
      });
    } else {
      // Both teams declared! Compare categories & ranks:
      if (t0MaxCat > t1MaxCat) {
        // Team 0 has higher category (Quarteto > Tringa > Ronda)
        winningTeam = 0;
      } else if (t1MaxCat > t0MaxCat) {
        // Team 1 has higher category
        winningTeam = 1;
      } else {
        // Same highest category (compare ranks in descending order)
        const cat = t0MaxCat;
        const t0Ranks = t0Decls.filter(d => d.category === cat).map(d => d.rank).sort((a, b) => b - a);
        const t1Ranks = t1Decls.filter(d => d.category === cat).map(d => d.rank).sort((a, b) => b - a);

        let compared = 0;
        const len = Math.max(t0Ranks.length, t1Ranks.length);
        for (let i = 0; i < len; i++) {
          const r0 = t0Ranks[i] || 0;
          const r1 = t1Ranks[i] || 0;
          if (r0 > r1) {
            compared = 1;
            break;
          } else if (r1 > r0) {
            compared = -1;
            break;
          }
        }

        if (compared > 0) {
          winningTeam = 0;
        } else if (compared < 0) {
          winningTeam = 1;
        } else {
          isTie = true;
        }
      }

      if (winningTeam !== null) {
        // Winning team takes ALL declaration points (theirs + enemy's!)
        const totalPoints = [...t0Decls, ...t1Decls].reduce((sum, d) => sum + d.basePoints, 0);
        this.addScore(winningTeam, totalPoints);
        this.logEvent({
          type: 'DECLARATION_RESULT',
          winnerTeam: winningTeam,
          points: totalPoints,
          message: `فرقة ${winningTeam + 1} ربحات الكومبو ودات جميع نقاط الروندا/الترينغا (+${totalPoints} نقطة)`
        });
      } else if (isTie) {
        this.logEvent({
          type: 'DECLARATION_RESULT',
          winnerTeam: null,
          points: 0,
          message: `تعادل فالروندا (باطل) - تساوو فالكارطة`
        });
      }
    }

    this.checkDfo3AndMatchWin();
  }

  getCapturableCards(card) {
    const matching = this.table.filter(c => c.rank === card.rank);
    if (matching.length === 0) return [];

    const captured = [...matching];
    let currentRank = card.rank;

    while (true) {
      const nextRank = getNextRank(currentRank);
      if (!nextRank) break;

      const nextCards = this.table.filter(c => c.rank === nextRank);
      if (nextCards.length > 0) {
        captured.push(...nextCards);
        currentRank = nextRank;
      } else {
        break;
      }
    }

    return captured;
  }

  playCard(playerIndex, cardId) {
    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Game is not in playing state' };
    }

    if (playerIndex !== this.currentTurn) {
      return { success: false, error: 'Not your turn' };
    }

    const hand = this.hands[playerIndex];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }

    const [playedCard] = hand.splice(cardIndex, 1);
    const playerTeam = this.getPlayerTeam(playerIndex);
    const capturableTableCards = this.getCapturableCards(playedCard);

    let captureResult = null;
    const isCapture = capturableTableCards.length > 0;
    const isLastTrickOfHand = (this.tricksPlayedInHand + 1 === 40);

    if (isCapture) {
      const capturedIds = new Set(capturableTableCards.map(c => c.id));
      this.table = this.table.filter(c => !capturedIds.has(c.id));

      const allWonCards = [playedCard, ...capturableTableCards];
      this.collectedCards[playerTeam].push(...allWonCards);
      this.lastCapturingPlayer = playerIndex;

      let hitType = null;
      let hitMessage = '';

      // 1. 9a3a Rule with 12 (Rey / Cheikh) -> 1 3oud (5 pts)
      if (isLastTrickOfHand && playedCard.rank === 12) {
        hitType = '9A3A_12';
        hitMessage = `👑 القاعة بالشيخ (9a3a b'12)! ${this.getPlayerName(playerIndex)} كلا القاعة بطناش (+1 عود = 5 نقط)`;
        this.addScore(playerTeam, 5);
        this.logEvent({
          type: '9A3A_12',
          message: hitMessage,
          player: playerIndex,
          team: playerTeam,
          points: 5
        });
      }

      // 2. Darb Hit Progression (1st hit = 1 pt, 2nd hit teammate = 5 pts, 4th hit = 10 pts)
      if (
        this.lastPlayedInfo &&
        !this.lastPlayedInfo.captured &&
        this.lastPlayedInfo.card.rank === playedCard.rank
      ) {
        this.darbStreak++;
        let darbPts = 0;
        if (this.darbStreak === 1) {
          darbPts = 1; // 1 7ajra
          hitType = hitType || 'DARB';
          hitMessage = `🎯 ضربة (كارطة)! ${this.getPlayerName(playerIndex)} ضرب كارطة ${this.getPlayerName(this.lastPlayedInfo.playerIndex)} (+1 حجرة)`;
        } else if (this.darbStreak === 2) {
          darbPts = 5; // Teammate counter-hit: 1 3oud (5 pts)
          hitType = 'KHLIS';
          hitMessage = `💥 خلاص (خلس)! ${this.getPlayerName(playerIndex)} رد الصرف (+1 عود = 5 نقط)`;
        } else if (this.darbStreak === 3) {
          darbPts = 10; // 3rd/4th hit: 2 3ouds (10 pts)
          hitType = 'ZID_KHLIS';
          hitMessage = `⚡ زيد خلص! ${this.getPlayerName(playerIndex)} زاد حك (+2 عواد = 10 نقط)`;
        } else {
          darbPts = 10; // 4th hit: 2 3ouds (10 pts)
          hitType = 'BASTA';
          hitMessage = `👑 باستا (BASTA)! ${this.getPlayerName(playerIndex)} كمل الرباعي (+2 عواد = 10 نقط)`;
        }

        this.addScore(playerTeam, darbPts);
        this.logEvent({
          type: hitType,
          message: hitMessage,
          player: playerIndex,
          team: playerTeam,
          points: darbPts,
          streak: this.darbStreak,
          rank: playedCard.rank
        });
      } else {
        this.darbStreak = 0;
      }

      // 3. Missa (Table completely swept)
      let isMissa = false;
      if (this.table.length === 0 && !isLastTrickOfHand) {
        isMissa = true;
        this.addScore(playerTeam, 1);
        this.logEvent({
          type: 'MISSA',
          message: `🧹 ميسة (MISSA)! ${this.getPlayerName(playerIndex)} خوى الطابلة مسح كلشي (+1 حجرة)`,
          player: playerIndex,
          team: playerTeam,
          points: 1
        });
      }

      captureResult = {
        captured: true,
        capturedCards: capturableTableCards,
        allWonCards: allWonCards,
        hitType: hitType,
        isMissa: isMissa
      };

      this.lastPlayedInfo = {
        playerIndex: playerIndex,
        card: playedCard,
        captured: true
      };
    } else {
      this.table.push(playedCard);
      this.darbStreak = 0;

      this.lastPlayedInfo = {
        playerIndex: playerIndex,
        card: playedCard,
        captured: false
      };

      captureResult = {
        captured: false,
        tableCard: playedCard
      };
    }

    this.tricksPlayedInDeal++;
    this.tricksPlayedInHand++;

    this.checkDfo3AndMatchWin();

    // Right-to-Left turn rotation
    this.currentTurn = (this.currentTurn + 1) % this.playerCount;

    if (this.isAllHandsEmpty()) {
      if (this.deck.length > 0) {
        this.dealNextRound();
      } else {
        this.finishHand();
      }
    }

    return {
      success: true,
      playedCard: playedCard,
      captureResult: captureResult,
      gameState: this.getPublicState()
    };
  }

  finishHand() {
    this.state = 'ROUND_OVER';

    if (this.table.length > 0 && this.lastCapturingPlayer !== null) {
      const sweepTeam = this.getPlayerTeam(this.lastCapturingPlayer);
      const sweptCards = [...this.table];
      this.collectedCards[sweepTeam].push(...sweptCards);
      this.table = [];

      this.logEvent({
        type: 'LAST_TRICK_SWEEP',
        message: `🏁 آخر قمرة: ${this.getPlayerName(this.lastCapturingPlayer)} جمع بقية الكارطة (${sweptCards.length} ورقة)`,
        player: this.lastCapturingPlayer,
        team: sweepTeam,
        cardsCount: sweptCards.length
      });
    }

    const cardCounts = this.collectedCards.map(cards => cards.length);
    const cardPoints = [0, 0];

    const par = 20;
    for (let t = 0; t < 2; t++) {
      if (cardCounts[t] > par) {
        cardPoints[t] = cardCounts[t] - par;
        this.addScore(t, cardPoints[t]);
      }
    }

    this.logEvent({
      type: 'CARD_COUNT',
      message: `📊 حساب الأوراق: فرقة 1 جمعات ${cardCounts[0]} ورقة (+${cardPoints[0]} نقط) | فرقة 2 جمعات ${cardCounts[1]} ورقة (+${cardPoints[1]} نقط)`,
      cardCounts: cardCounts,
      cardPoints: cardPoints
    });

    this.gameHistory.push({
      handNumber: this.handNumber,
      scoresAfterHand: [...this.scores],
      cardCounts: [...cardCounts],
      cardPoints: [...cardPoints]
    });

    this.checkDfo3AndMatchWin();

    if (!this.isMatchOver) {
      this.dealerIndex = (this.dealerIndex + 1) % this.playerCount;
    }
  }

  addScore(teamIndex, points) {
    if (points <= 0) return;
    this.scores[teamIndex] = (this.scores[teamIndex] || 0) + points;
    this.dfo3Scores[teamIndex] = (this.dfo3Scores[teamIndex] || 0) + points;
    this.currentHandRoundScores[teamIndex] = (this.currentHandRoundScores[teamIndex] || 0) + points;
  }

  checkDfo3AndMatchWin() {
    if (this.currentDfo3 === 1) {
      for (let t = 0; t < 2; t++) {
        if (this.scores[t] >= 20) {
          this.dfo3Wins[t]++;
          this.logEvent({
            type: 'DFO3_WIN',
            message: `🎉 داو الدفوع الأول! فرقة ${t + 1} وصلو لـ 4 عواد (20 نقطة) وبدا الدفوع الثاني!`,
            winnerTeam: t
          });
          this.currentDfo3 = 2;
          break;
        }
      }
    }

    if (this.currentDfo3 === 2) {
      for (let t = 0; t < 2; t++) {
        if (this.scores[t] >= 41) {
          this.isMatchOver = true;
          this.state = 'MATCH_OVER';
          this.winnerTeam = t;
          this.winnerPlayers = this.getPlayersInTeam(t).map(p => p.seat);
          this.dfo3Wins[t]++;

          this.logEvent({
            type: 'MATCH_WIN',
            message: `🏆 مبروك الفوز بالماتش كامل! فرقة ${t + 1} جابو 4 عواد وحجرة في الدفوع الثاني وختمو 41 نقطة!`,
            winnerTeam: t,
            winnerPlayers: this.winnerPlayers,
            finalScores: [...this.scores]
          });
          break;
        }
      }
    }
  }

  isAllHandsEmpty() {
    return this.hands.every(h => !h || h.length === 0);
  }

  getPlayerTeam(playerIndex) {
    return playerIndex % 2;
  }

  getPlayersInTeam(teamIndex) {
    return this.players.filter(p => this.getPlayerTeam(p.seat) === teamIndex);
  }

  getPlayerName(playerIndex) {
    const p = this.players.find(pl => pl.seat === playerIndex);
    return p ? p.name : `لاعب ${playerIndex + 1}`;
  }

  logEvent(event) {
    this.handEvents.push({ ...event, timestamp: Date.now() });
  }

  get3oudAnd7ajra(points) {
    const ouds = Math.floor(points / 5);
    const hajrat = points % 5;
    return { ouds, hajrat, total: points };
  }

  getPublicState(viewerSeat = null) {
    const team0ScoreData = this.get3oudAnd7ajra(this.scores[0]);
    const team1ScoreData = this.get3oudAnd7ajra(this.scores[1]);

    return {
      id: this.id,
      state: this.state,
      currentDfo3: this.currentDfo3,
      mode: this.mode,
      playerCount: this.playerCount,
      handNumber: this.handNumber,
      dealerIndex: this.dealerIndex,
      currentTurn: this.currentTurn,
      handDealRound: this.handDealRound,
      scores: this.scores,
      teamScoreBreakdown: [team0ScoreData, team1ScoreData],
      dfo3Wins: this.dfo3Wins,
      currentHandRoundScores: this.currentHandRoundScores,
      table: this.table,
      deckCount: this.deck.length,
      darbStreak: this.darbStreak,
      lastPlayedInfo: this.lastPlayedInfo,
      lastCapturingPlayer: this.lastCapturingPlayer,
      currentDealDeclarations: this.currentDealDeclarations,
      isMatchOver: this.isMatchOver,
      winnerTeam: this.winnerTeam,
      winnerPlayers: this.winnerPlayers,
      handEvents: this.handEvents.slice(-8),
      collectedCardsCount: this.collectedCards.map(c => c.length),
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        seat: p.seat,
        team: this.getPlayerTeam(p.seat),
        connected: p.connected,
        cardsInHandCount: (this.hands[p.seat] || []).length,
        hand: (viewerSeat !== null && viewerSeat === p.seat) ? this.hands[p.seat] : []
      }))
    };
  }
}

module.exports = RondaGame;
