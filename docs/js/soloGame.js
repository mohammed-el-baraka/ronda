/**
 * Moroccan Ronda - Solo Offline Game Engine
 * Features automatic declarations before play starts, ultra-slow cinematic animations,
 * deliberate Tafri9a dealing (4.8s), slow UNO card glides (1.4s), and calm relaxed bot pacing.
 */

class SoloRondaGame {
  constructor(client) {
    this.client = client;
    this.audio = window.rondaAudio;
    this.active = false;

    // Local Ronda Game State
    this.suits = ['oros', 'copas', 'espadas', 'bastos'];
    this.ranks = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    this.deck = [];
    this.table = [];
    this.hands = [[], [], [], []];
    this.scores = [0, 0]; // Team 0 (South 0 / North 2) vs Team 1 (East 1 / West 3)
    this.currentDfo3 = 1;
    this.handNumber = 0;
    this.dealerIndex = 0;
    this.currentTurn = 0;
    this.handDealRound = 0;
    this.tricksPlayedInHand = 0;
    this.lastPlayedInfo = null;
    this.darbStreak = 0;
    this.lastCapturingPlayer = null;
    this.collectedCards = [[], []];
    this.isMatchOver = false;

    this.botNames = [
      { name: 'الرايس (أنت)', avatar: 'tarboosh' },
      { name: 'بوشعيب الحريفي (اليمين)', avatar: 'djellaba' },
      { name: 'ياسين القهواجي (الشريك)', avatar: 'tea' },
      { name: 'عزيز الروندا (اليسار)', avatar: 'fez' }
    ];
  }

  startSoloMatch() {
    this.active = true;
    this.scores = [0, 0];
    this.currentDfo3 = 1;
    this.handNumber = 0;
    this.dealerIndex = 0;
    this.isMatchOver = false;
    this.startNewHand();
  }

  startNewHand() {
    this.handNumber++;
    this.deck = this.createShuffledDeck();
    this.table = [];
    this.collectedCards = [[], []];
    this.handDealRound = 0;
    this.tricksPlayedInHand = 0;
    this.lastPlayedInfo = null;
    this.darbStreak = 0;
    this.lastCapturingPlayer = null;
    this.hands = [[], [], [], []];

    // Right-to-Left: next dealer starts on the right
    this.currentTurn = (this.dealerIndex + 1) % 4;
    this.dealNextRound();
  }

  dealNextRound() {
    this.handDealRound++;
    const cardsPerPlayer = this.handDealRound === 1 ? 4 : 3;

    for (let i = 0; i < 4; i++) {
      const seat = (this.dealerIndex + 1 + i) % 4;
      this.hands[seat] = this.deck.splice(0, cardsPerPlayer);
    }

    // 1. Trigger Slow Deliberate Dealing Animation (~4.8 seconds)
    const dealDuration = (cardsPerPlayer * 4 * 280) + 600;
    if (this.client && this.client.triggerTafri9aDealAnimation) {
      this.client.triggerTafri9aDealAnimation(this.handDealRound);
    }

    this.updateUI();

    // 2. Automatically Evaluate & Announce who has what (Quarteto, Tringa, Ronda)
    const declarations = this.evaluateAutomaticDeclarations();

    // Calculate total delay before first move (deal duration + declaration announcement time)
    let totalAnnouncementTime = 0;
    if (declarations.length > 0) {
      totalAnnouncementTime = declarations.length * 4000;
      // Show announcements sequentially after deal finishes
      setTimeout(() => {
        declarations.forEach((decl, idx) => {
          setTimeout(() => {
            if (!this.active) return;
            this.client.showAnnouncement(decl.title, decl.subtitle, 3800);
            if (this.audio) this.audio.playDeclaration(decl.type === 'tringa' || decl.type === 'quarteto' ? 'tringa' : 'ronda');
            this.updateUI();
          }, idx * 4000);
        });
      }, dealDuration);
    }

    const firstMoveWait = dealDuration + totalAnnouncementTime + 1200;

    setTimeout(() => {
      if (!this.active || this.isMatchOver) return;
      if (this.currentTurn !== 0) {
        this.triggerBotTurn();
      }
    }, firstMoveWait);
  }

  evaluateAutomaticDeclarations() {
    const playerDeclarations = [];
    const teamDeclarations = [[], []];

    for (let p = 0; p < 4; p++) {
      const hand = this.hands[p] || [];
      const rankCounts = {};
      hand.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);

      const team = p % 2;
      const playerName = this.botNames[p]?.name || `لاعب ${p + 1}`;

      for (const [rankStr, count] of Object.entries(rankCounts)) {
        const rank = parseInt(rankStr, 10);

        if (count === 4) {
          const decl = {
            seat: p,
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
            seat: p,
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
            seat: p,
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

    const t0Decls = teamDeclarations[0];
    const t1Decls = teamDeclarations[1];

    const t0MaxCat = t0Decls.reduce((max, d) => Math.max(max, d.category), 0);
    const t1MaxCat = t1Decls.reduce((max, d) => Math.max(max, d.category), 0);

    let winningTeam = null;
    let isTie = false;
    let resultAnnouncement = null;

    if (t0MaxCat === 0 && t1MaxCat === 0) {
      return [];
    } else if (t0MaxCat > 0 && t1MaxCat === 0) {
      winningTeam = 0;
      const pts = t0Decls.reduce((sum, d) => sum + d.basePoints, 0);
      this.scores[0] += pts;
    } else if (t1MaxCat > 0 && t0MaxCat === 0) {
      winningTeam = 1;
      const pts = t1Decls.reduce((sum, d) => sum + d.basePoints, 0);
      this.scores[1] += pts;
    } else {
      if (t0MaxCat > t1MaxCat) {
        winningTeam = 0;
      } else if (t1MaxCat > t0MaxCat) {
        winningTeam = 1;
      } else {
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

        if (compared > 0) winningTeam = 0;
        else if (compared < 0) winningTeam = 1;
        else isTie = true;
      }

      if (winningTeam !== null) {
        const totalPoints = [...t0Decls, ...t1Decls].reduce((sum, d) => sum + d.basePoints, 0);
        this.scores[winningTeam] += totalPoints;
        const winnerLabel = winningTeam === 0 ? 'فرقتكم (الجنوب والشمال)' : 'فرقة الخصم (الشرق والغرب)';
        resultAnnouncement = {
          type: 'reward',
          title: '🏆 ربح الكومبو!',
          subtitle: `${winnerLabel} ربحات وخدات نقاط الروندا/الترينغا كاملة (+${totalPoints} نقطة)`
        };
      } else if (isTie) {
        resultAnnouncement = {
          type: 'tie',
          title: '⚖️ تعادل فالروندا (باطل)',
          subtitle: 'تساوات الكارطة عند الفرقتين بجوج (0 نقط)'
        };
      }
    }

    this.checkDfo3Win();

    const announcements = [...playerDeclarations];
    if (resultAnnouncement && (t0MaxCat > 0 && t1MaxCat > 0)) {
      announcements.push(resultAnnouncement);
    }
    return announcements;
  }

  createShuffledDeck() {
    const deck = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push({
          id: `${suit}_${rank}`,
          suit: suit,
          rank: rank
        });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  getNextRank(rank) {
    const idx = this.ranks.indexOf(rank);
    if (idx >= 0 && idx < this.ranks.length - 1) return this.ranks[idx + 1];
    return null;
  }

  getCapturableCards(card) {
    const matching = this.table.filter(c => c.rank === card.rank);
    if (matching.length === 0) return [];

    const captured = [...matching];
    let cur = card.rank;
    while (true) {
      const next = this.getNextRank(cur);
      if (!next) break;
      const nextCards = this.table.filter(c => c.rank === next);
      if (nextCards.length > 0) {
        captured.push(...nextCards);
        cur = next;
      } else {
        break;
      }
    }
    return captured;
  }

  playCard(playerIndex, cardId) {
    if (this.isMatchOver) return;

    const hand = this.hands[playerIndex];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const [playedCard] = hand.splice(cardIndex, 1);
    const team = playerIndex % 2;
    const capturable = this.getCapturableCards(playedCard);
    const isCapture = capturable.length > 0;
    const is9a3a = (this.tricksPlayedInHand + 1 === 40);

    // Trigger Slow UNO-Style Flying Card Animation (1.4s)
    if (this.client && this.client.triggerUnoPlayAnimation) {
      this.client.triggerUnoPlayAnimation(playerIndex, this.botNames[playerIndex].name, playedCard);
    }

    if (isCapture) {
      const capturedIds = new Set(capturable.map(c => c.id));
      this.table = this.table.filter(c => !capturedIds.has(c.id));
      this.collectedCards[team].push(playedCard, ...capturable);
      this.lastCapturingPlayer = playerIndex;

      if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

      // 1. 9a3a with 12 (Rey / Cheikh) -> +1 3oud (5 pts)
      if (is9a3a && playedCard.rank === 12) {
        this.scores[team] += 5;
        this.client.showAnnouncement('👑 القاعة بالشيخ (9a3a b\'12)!', `${this.botNames[playerIndex].name} دا عود كامل (+5)`, 4200);
        if (this.audio) this.audio.playDeclaration('tringa');
      }

      // 2. Darb / Khlis hit progression
      if (this.lastPlayedInfo && !this.lastPlayedInfo.captured && this.lastPlayedInfo.card.rank === playedCard.rank) {
        this.darbStreak++;
        if (this.darbStreak === 1) {
          this.scores[team] += 1; // 1 7ajra
          this.client.showAnnouncement('🎯 ضربة (كارطة)!', `${this.botNames[playerIndex].name} جاب حجرة (+1)`, 3500);
          if (this.audio) this.audio.playDarb();
        } else if (this.darbStreak === 2) {
          this.scores[team] += 5; // Teammate counter-hit: 1 3oud (+5 pts)
          this.client.showAnnouncement('💥 خـلاص (خلس)!', `${this.botNames[playerIndex].name} رد الصرف (+1 عود = 5 نقط)`, 4000);
          if (this.audio) this.audio.playKhlis();
        } else {
          this.scores[team] += 10; // 4th hit: 2 3ouds (+10 pts)
          this.client.showAnnouncement('⚡ زيد خلص!', `${this.botNames[playerIndex].name} دا 2 عواد (+10 نقط)`, 4000);
          if (this.audio) this.audio.playKhlis();
        }
      } else {
        this.darbStreak = 0;
      }

      // 3. Missa
      if (this.table.length === 0 && !is9a3a) {
        this.scores[team] += 1;
        this.client.showAnnouncement('🧹 مـيـسـة (MISSA)!', `${this.botNames[playerIndex].name} خوى الطابلة مسح كلشي (+1)`, 3500);
        if (this.audio) this.audio.playMissa();
      } else {
        if (this.audio) this.audio.playCapture();
      }

      this.lastPlayedInfo = { playerIndex, card: playedCard, captured: true };
    } else {
      this.table.push(playedCard);
      this.darbStreak = 0;
      this.lastPlayedInfo = { playerIndex, card: playedCard, captured: false };
      if (this.audio) this.audio.playCardSnap();
    }

    this.tricksPlayedInHand++;
    this.checkDfo3Win();

    // Right to Left turn progression (0 South -> 1 East -> 2 North -> 3 West)
    this.currentTurn = (this.currentTurn + 1) % 4;

    if (this.hands.every(h => h.length === 0)) {
      if (this.deck.length > 0) {
        setTimeout(() => this.dealNextRound(), 1200);
      } else {
        this.finishHand();
      }
    } else {
      this.updateUI();
      if (this.currentTurn !== 0 && !this.isMatchOver) {
        this.triggerBotTurn();
      }
    }
  }

  triggerBotTurn() {
    // Deliberate relaxed bot delay (~2.0s to 2.8s) so human player easily follows the action!
    const delay = Math.floor(Math.random() * 800) + 2000;
    setTimeout(() => {
      if (!this.active || this.currentTurn === 0 || this.isMatchOver) return;
      const botHand = this.hands[this.currentTurn];
      if (!botHand || botHand.length === 0) return;

      let bestCard = botHand[0];
      let bestScore = -100;
      const is9a3a = (this.tricksPlayedInHand + 1 === 40);

      botHand.forEach(c => {
        let score = 0;
        const cap = this.getCapturableCards(c);
        if (is9a3a && c.rank === 12 && cap.length > 0) score += 500;
        if (this.lastPlayedInfo && !this.lastPlayedInfo.captured && c.rank === this.lastPlayedInfo.card.rank) score += 200;
        if (cap.length > 0) score += cap.length * 30;
        if (score > bestScore) {
          bestScore = score;
          bestCard = c;
        }
      });

      this.playCard(this.currentTurn, bestCard.id);
    }, delay);
  }

  finishHand() {
    if (this.table.length > 0 && this.lastCapturingPlayer !== null) {
      const sweepTeam = this.lastCapturingPlayer % 2;
      this.collectedCards[sweepTeam].push(...this.table);
      this.table = [];
    }

    const c0 = this.collectedCards[0].length;
    const c1 = this.collectedCards[1].length;
    if (c0 > 20) this.scores[0] += (c0 - 20);
    if (c1 > 20) this.scores[1] += (c1 - 20);

    this.checkDfo3Win();

    const scoreData0 = { ouds: Math.floor(this.scores[0] / 5), hajrat: this.scores[0] % 5, total: this.scores[0] };
    const scoreData1 = { ouds: Math.floor(this.scores[1] / 5), hajrat: this.scores[1] % 5, total: this.scores[1] };

    const modal = document.getElementById('hand-summary-modal');
    const content = document.getElementById('hand-summary-content');
    if (modal && content) {
      content.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
          <h2 style="font-family:'Cairo';color:#f59e0b">📊 نهاية اليد #${this.handNumber}</h2>
          <p style="color:#cbd5e1">حساب الأوراق (المعدل 20 ورقة)</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          <div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b;padding:16px;border-radius:12px;text-align:center;">
            <h3 style="color:#fbbf24">فرقتك (ذهبي)</h3>
            <div style="font-size:24px;font-weight:900;margin:6px 0;">${c0} ورقة</div>
            <div style="font-size:16px;font-weight:900;color:#fff">🪵 ${scoreData0.ouds} عواد | 🪨 ${scoreData0.hajrat} حجرات (${scoreData0.total} نقطة)</div>
          </div>
          <div style="background:rgba(6,182,212,0.1);border:1px solid #06b6d4;padding:16px;border-radius:12px;text-align:center;">
            <h3 style="color:#38bdf8">فرقة البوتات (أزرق)</h3>
            <div style="font-size:24px;font-weight:900;margin:6px 0;">${c1} ورقة</div>
            <div style="font-size:16px;font-weight:900;color:#fff">🪵 ${scoreData1.ouds} عواد | 🪨 ${scoreData1.hajrat} حجرات (${scoreData1.total} نقطة)</div>
          </div>
        </div>
      `;
      modal.classList.add('open');
    }

    this.dealerIndex = (this.dealerIndex + 1) % 4;
  }

  checkDfo3Win() {
    if (this.currentDfo3 === 1) {
      for (let t = 0; t < 2; t++) {
        if (this.scores[t] >= 20) {
          this.currentDfo3 = 2;
          this.client.showAnnouncement('🎉 داو الدفوع الأول!', `${t === 0 ? 'فرقتك' : 'فرقة البوتات'} وصلو لـ 4 عواد (20 نقطة)`, 4000);
          break;
        }
      }
    }

    if (this.currentDfo3 === 2) {
      for (let t = 0; t < 2; t++) {
        if (this.scores[t] >= 41) {
          this.isMatchOver = true;
          if (this.audio) this.audio.playWin();
          const modal = document.getElementById('victory-modal');
          const content = document.getElementById('victory-modal-content');
          if (modal && content) {
            content.innerHTML = `
              <div class="victory-overlay">
                <div class="victory-trophy">🏆</div>
                <h1 style="font-family:'Cairo';color:#f59e0b;font-size:30px;">مبروك الفوز بالماتش!</h1>
                <h2 style="color:#fff;font-size:20px;">الفائز: ${t === 0 ? 'فرقتك (ذهبي 👑)' : 'فرقة البوتات (أزرق 💎)'}</h2>
                <div style="margin:16px 0;font-size:18px;font-weight:800;">
                  النتيجة: فرقتك (${this.scores[0]}) - البوتات (${this.scores[1]})
                </div>
              </div>
            `;
            modal.classList.add('open');
          }
          break;
        }
      }
    }
  }

  updateUI() {
    // Show Quit button
    const btnQuit = document.getElementById('btn-quit-game');
    if (btnQuit) btnQuit.style.display = 'flex';

    const s0 = { ouds: Math.floor(this.scores[0] / 5), hajrat: this.scores[0] % 5, total: this.scores[0] };
    const s1 = { ouds: Math.floor(this.scores[1] / 5), hajrat: this.scores[1] % 5, total: this.scores[1] };

    this.client.renderTeamScoreTray('team0-score-tray', s0, 0);
    this.client.renderTeamScoreTray('team1-score-tray', s1, 1);

    const dfo3Text = this.currentDfo3 === 1 ? '🥇 الدفوع 1 (4 عواد = 20)' : '👑 الدفوع 2 (4 عواد وحجرة = 21)';
    const dfo3Badge = document.getElementById('dfo3-badge-display');
    if (dfo3Badge) dfo3Badge.textContent = dfo3Text;

    const cardsInDeal = this.handDealRound === 1 ? 4 : 3;
    const dealRoundEl = document.getElementById('deal-round-display');
    if (dealRoundEl) {
      dealRoundEl.textContent = `التفريقة ${this.handDealRound}/3 (${cardsInDeal} أوراق) | يد #${this.handNumber}`;
    }

    // Right to Left: South 0 -> East 1 (Right) -> North 2 (Partner) -> West 3 (Left)
    const p0 = { seat: 0, team: 0, name: this.botNames[0].name, avatar: this.botNames[0].avatar, cardsInHandCount: this.hands[0].length };
    const p1 = { seat: 1, team: 1, name: this.botNames[1].name, avatar: this.botNames[1].avatar, cardsInHandCount: this.hands[1].length };
    const p2 = { seat: 2, team: 0, name: this.botNames[2].name, avatar: this.botNames[2].avatar, cardsInHandCount: this.hands[2].length };
    const p3 = { seat: 3, team: 1, name: this.botNames[3].name, avatar: this.botNames[3].avatar, cardsInHandCount: this.hands[3].length };

    this.client.renderPlayerSeat('seat-south', p0, this.currentTurn === 0, this.dealerIndex === 0, true, 0);
    this.client.renderPlayerSeat('seat-east', p1, this.currentTurn === 1, this.dealerIndex === 1, false, 0);
    this.client.renderPlayerSeat('seat-north', p2, this.currentTurn === 2, this.dealerIndex === 2, false, 0);
    this.client.renderPlayerSeat('seat-west', p3, this.currentTurn === 3, this.dealerIndex === 3, false, 0);

    // Render South Hand
    const handContainer = document.getElementById('my-hand-container');
    if (handContainer) {
      const isMyTurn = (this.currentTurn === 0 && !this.isMatchOver);
      handContainer.innerHTML = this.hands[0].map(c => this.client.renderCardHTML(c, isMyTurn)).join('');

      handContainer.querySelectorAll('.ronda-card.is-playable').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
          this.playCard(0, cardEl.dataset.cardId);
        });
      });
    }

    // Render Table
    const tableContainer = document.getElementById('table-cards-grid');
    if (tableContainer) {
      tableContainer.innerHTML = this.table.map(c => this.client.renderCardHTML(c, false)).join('');
    }

    // Render Deck Count
    const deckEl = document.getElementById('table-deck-count');
    if (deckEl) {
      deckEl.textContent = `${this.deck.length} ورقة`;
    }
  }
}

window.SoloRondaGame = SoloRondaGame;
