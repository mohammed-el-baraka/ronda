/**
 * Moroccan Ronda - Client Application Logic (Updated with 3oud & 7ajra Trays, 4-3-3 Deal, 9a3a b'12, Left Turn Flow)
 */

class RondaClient {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.mySeat = -1;
    this.isHost = false;
    this.isSpectator = false;
    this.roomState = null;
    this.selectedAvatar = 'tarboosh';
    this.audio = window.rondaAudio;

    this.init();
  }

    const isGitHubPages = window.location.hostname.includes('github.io');
    if (typeof io !== 'undefined' && !isGitHubPages) {
      try {
        this.socket = io({ reconnectionAttempts: 3, timeout: 3000 });
        this.bindSocketEvents();
      } catch (e) {
        console.warn('Socket initialization bypassed:', e);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queryRoom = urlParams.get('room');
    if (queryRoom) {
      const joinInput = document.getElementById('join-room-code');
      if (joinInput) joinInput.value = queryRoom.toUpperCase();
    }

    this.bindUIEvents();

    if (window.lanHelper && !isGitHubPages) {
      window.lanHelper.fetchNetworkInfo(queryRoom || '');
    } else {
      const ipEl = document.getElementById('lobby-lan-ip');
      if (ipEl) ipEl.innerHTML = `العب دابا أونلاين ضد 3 بوتات حريفية، أو حمل المشروع للعب الجماعي`;
    }

    if (window.rulesModalManager) {
      window.rulesModalManager.renderRules('ar');
    }
  }

  bindSocketEvents() {
    if (!this.socket) return;
    this.socket.on('connect', () => {
      console.log('Connected to Ronda server:', this.socket.id);
    });

    this.socket.on('room_state', (state) => {
      this.handleRoomStateUpdate(state);
    });

    this.socket.on('game_started', (data) => {
      this.showAnnouncement('بدات الروندا', 'الدفوع الأول — 4 عواد = 20 نقطة');
      if (this.audio) this.audio.playDeal();
    });

    this.socket.on('card_played_action', (data) => {
      this.handleCardPlayedAction(data);
    });

    this.socket.on('chat_message', (msg) => {
      this.handleIncomingChat(msg);
    });
  }

  bindUIEvents() {
    // Quit Game Button
    const btnQuit = document.getElementById('btn-quit-game');
    const quitModal = document.getElementById('quit-confirm-modal');
    const btnCancelQuit = document.getElementById('btn-cancel-quit');
    const btnConfirmQuit = document.getElementById('btn-confirm-quit');

    if (btnQuit && quitModal) {
      btnQuit.addEventListener('click', () => {
        quitModal.classList.add('open');
      });
    }

    if (btnCancelQuit && quitModal) {
      btnCancelQuit.addEventListener('click', () => {
        quitModal.classList.remove('open');
      });
    }

    if (btnConfirmQuit && quitModal) {
      btnConfirmQuit.addEventListener('click', () => {
        quitModal.classList.remove('open');
        if (this.isSoloMode) {
          this.isSoloMode = false;
          if (this.soloGame) this.soloGame.active = false;
          this.showLobby();
        } else {
          this.socket.emit('leave_game');
          this.showLobby();
        }
      });
    }

    // Next Hand Button
    const btnNext = document.getElementById('btn-next-hand');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const modal = document.getElementById('hand-summary-modal');
        if (modal) modal.classList.remove('open');
        if (this.isSoloMode && this.soloGame) {
          this.soloGame.startNewHand();
        } else {
          this.socket.emit('next_hand');
        }
      });
    }

    // Solo Offline Mode Button
    const btnSolo = document.getElementById('btn-start-solo');
    if (btnSolo) {
      btnSolo.addEventListener('click', () => {
        const lobbyView = document.getElementById('lobby-view');
        const gameView = document.getElementById('game-view');
        if (lobbyView) lobbyView.style.display = 'none';
        if (gameView) gameView.style.display = 'flex';

        this.soloGame = new window.SoloRondaGame(this);
        this.soloGame.startSoloMatch();
        this.showAnnouncement('لعب فردي (Solo)', 'حظ موفق ضد 3 بوتات حريفية 🇲🇦', 4000);
      });
    }

    // Avatar selection
    document.querySelectorAll('.av-pick').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.av-pick').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        this.selectedAvatar = el.dataset.avatar;
      });
    });

    const btnCreate = document.getElementById('btn-create-room');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => this.handleCreateRoom());
    }

    const btnJoin = document.getElementById('btn-join-room');
    if (btnJoin) {
      btnJoin.addEventListener('click', () => this.handleJoinRoom());
    }

    const btnFillBots = document.getElementById('btn-fill-bots');
    if (btnFillBots) {
      btnFillBots.addEventListener('click', () => {
        this.socket.emit('fill_bots');
      });
    }

    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.socket.emit('start_game');
      });
    }

    const btnNextHand = document.getElementById('btn-next-hand');
    if (btnNextHand) {
      btnNextHand.addEventListener('click', () => {
        this.socket.emit('next_hand');
        this.closeModal('hand-summary-modal');
      });
    }

    const btnRestart = document.getElementById('btn-restart-match');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.socket.emit('restart_match');
        this.closeModal('victory-modal');
      });
    }

    const btnAudio = document.getElementById('btn-toggle-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        btnAudio.classList.toggle('active', !isMuted);
        btnAudio.innerHTML = isMuted ? '<i class="pill-icon">x</i> كتم' : '<i class="pill-icon">♪</i> صوت';
      });
    }

    const btnRules = document.getElementById('btn-open-rules');
    if (btnRules) {
      btnRules.addEventListener('click', () => {
        this.openModal('rules-modal');
      });
    }

    const btnQR = document.getElementById('btn-open-qr');
    if (btnQR) {
      btnQR.addEventListener('click', () => {
        if (window.lanHelper) {
          window.lanHelper.fetchNetworkInfo(this.roomCode || '');
        }
        this.openModal('qr-modal');
      });
    }

    const btnCopyLink = document.getElementById('btn-copy-link');
    if (btnCopyLink) {
      btnCopyLink.addEventListener('click', () => {
        if (window.lanHelper) window.lanHelper.copyJoinUrl();
      });
    }

    document.querySelectorAll('.rules-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rules-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        if (window.rulesModalManager) {
          window.rulesModalManager.renderRules(btn.dataset.lang);
        }
      });
    });

    const btnChatToggle = document.getElementById('btn-toggle-chat');
    const chatDrawer = document.getElementById('chat-drawer');
    if (btnChatToggle && chatDrawer) {
      btnChatToggle.addEventListener('click', () => {
        chatDrawer.classList.toggle('open');
      });
    }

    const chatInput = document.getElementById('chat-input-field');
    const btnSendChat = document.getElementById('btn-send-chat');
    const doSend = () => {
      const text = (chatInput?.value || '').trim();
      if (text) {
        this.socket.emit('send_chat', { text });
        chatInput.value = '';
      }
    };
    if (btnSendChat) btnSendChat.addEventListener('click', doSend);
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSend();
      });
    }

    document.querySelectorAll('.btn-darija-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.text || btn.textContent;
        const reaction = btn.dataset.reaction || null;
        this.socket.emit('send_chat', { text, reaction });
        if (reaction === 'tea' && this.audio) this.audio.playTeaClink();
      });
    });
  }

  handleCreateRoom() {
    const nameInput = document.getElementById('player-name-input');
    const playerName = (nameInput?.value || 'الرايس').trim();

    if (!this.socket || !this.socket.connected) {
      alert('⚠️ للعب الجماعي عبر الشبكة المحلية (LAN) مع 4 أصدقاء:\n\nقم بتحميل المشروع من GitHub وتشغيله محلياً عبر:\n\nnpm install && npm start\n\nيمكنك الآن تجربة اللعب الفردي السريع ضد 3 بوتات أونلاين مباشرة!');
      return;
    }

    this.socket.emit('create_room', {
      playerName,
      playerAvatar: this.selectedAvatar,
      targetScore: 41,
      mode: '2v2'
    }, (res) => {
      if (res && res.success) {
        this.roomCode = res.roomCode;
        if (window.history.pushState) {
          const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${this.roomCode}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
        if (window.lanHelper) window.lanHelper.fetchNetworkInfo(this.roomCode);
      } else {
        alert('حدث خطأ أثناء إنشاء الغرفة: ' + (res?.error || 'Unknown'));
      }
    });
  }

  handleJoinRoom() {
    const nameInput = document.getElementById('player-name-input');
    const codeInput = document.getElementById('join-room-code');
    const playerName = (nameInput?.value || 'لاعب').trim();
    const roomCode = (codeInput?.value || '').trim().toUpperCase();

    if (!roomCode) {
      alert('يرجى إدخال رمز الغرفة');
      return;
    }

    if (!this.socket || !this.socket.connected) {
      alert('⚠️ للعب الجماعي عبر الشبكة المحلية (LAN) مع 4 أصدقاء:\n\nقم بتحميل المشروع من GitHub وتشغيله محلياً عبر:\n\nnpm install && npm start\n\nيمكنك الآن تجربة اللعب الفردي السريع ضد 3 بوتات أونلاين مباشرة!');
      return;
    }

    this.socket.emit('join_room', {
      roomCode,
      playerName,
      playerAvatar: this.selectedAvatar
    }, (res) => {
      if (res && res.success) {
        this.roomCode = res.roomCode;
        if (window.history.pushState) {
          const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${this.roomCode}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
        if (window.lanHelper) window.lanHelper.fetchNetworkInfo(this.roomCode);
      } else {
        alert('تعذر الانضمام للغرفة: ' + (res?.error || 'رمز غير صحيح أو الغرفة ممتلئة'));
      }
    });
  }

  handleRoomStateUpdate(state) {
    this.roomState = state;
    this.mySeat = state.viewer.seat;
    this.isHost = state.viewer.isHost;
    this.isSpectator = state.viewer.isSpectator;

    const lobbyView = document.getElementById('lobby-view');
    const roomLobbyView = document.getElementById('room-lobby-view');
    const gameView = document.getElementById('game-view');

    if (state.status === 'LOBBY') {
      if (lobbyView) lobbyView.style.display = 'none';
      if (roomLobbyView) roomLobbyView.style.display = 'flex';
      if (gameView) gameView.style.display = 'none';
      this.renderRoomLobby(state);
    } else if (state.status === 'PLAYING') {
      if (lobbyView) lobbyView.style.display = 'none';
      if (roomLobbyView) roomLobbyView.style.display = 'none';
      if (gameView) gameView.style.display = 'flex';
      this.renderGameTable(state);
    }
  }

  showLobby() {
    const lobbyView = document.getElementById('lobby-view');
    const roomLobbyView = document.getElementById('room-lobby-view');
    const gameView = document.getElementById('game-view');
    const btnQuit = document.getElementById('btn-quit-game');
    if (lobbyView) lobbyView.style.display = 'flex';
    if (roomLobbyView) roomLobbyView.style.display = 'none';
    if (gameView) gameView.style.display = 'none';
    if (btnQuit) btnQuit.style.display = 'none';
    this.roomCode = null;
    this.roomState = null;
    this.isSoloMode = false;
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  renderRoomLobby(state) {
    const codeEl = document.getElementById('lobby-room-code');
    if (codeEl) codeEl.textContent = state.code;

    const seatsContainer = document.getElementById('lobby-seats-container');
    if (!seatsContainer) return;

    seatsContainer.innerHTML = state.seats.map(slot => {
      const isOcc = !!slot.player;
      const p = slot.player;
      const isMe = this.mySeat === slot.seat;
      const teamClass = slot.team === 0 ? 'team-0' : 'team-1';

      return `
        <div class="seat-slot ${teamClass} ${isOcc ? 'occupied' : 'empty'}">
          <div class="seat-player-info">
            <div class="seat-avatar">${isOcc ? this.getAvatarLetter(p.avatar) : '-'}</div>
            <div class="seat-details">
              <div class="seat-name">${isOcc ? p.name : 'مقعد فارغ'} ${isMe ? '<span style="color:#f59e0b">(أنت)</span>' : ''}</div>
              <div class="seat-role">${slot.labelAr} - ${slot.team === 0 ? 'فرقة 1 (ذهبي)' : 'فرقة 2 (أزرق)'}</div>
            </div>
          </div>
          <div class="seat-actions">
            ${!isOcc && this.mySeat !== slot.seat ? `
              <button class="btn-secondary" onclick="window.rondaClient.switchSeat(${slot.seat})">الجلوس هنا</button>
            ` : ''}
            ${isOcc && p.isBot && this.isHost ? `
              <button class="btn-secondary" onclick="window.rondaClient.removeBot(${slot.seat})" style="color:#ef4444">طرد البوت</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    const btnStart = document.getElementById('btn-start-game');
    const allFilled = state.seats.every(s => s.player !== null);
    if (btnStart) {
      btnStart.style.display = this.isHost ? 'flex' : 'none';
      btnStart.disabled = !allFilled;
    }

    const btnFillBots = document.getElementById('btn-fill-bots');
    if (btnFillBots) {
      btnFillBots.style.display = this.isHost ? 'flex' : 'none';
    }
  }

  switchSeat(seatIndex) {
    this.socket.emit('switch_seat', { targetSeat: seatIndex });
  }

  removeBot(seatIndex) {
    this.socket.emit('remove_bot', { seat: seatIndex });
  }

  renderGameTable(state) {
    const gs = state.gameState;
    if (!gs) return;

    // Show Quit Game button
    const btnQuit = document.getElementById('btn-quit-game');
    if (btnQuit) btnQuit.style.display = 'flex';

    // 1. Render 3oud & 7ajra Score Trays
    this.renderTeamScoreTray('team0-score-tray', gs.teamScoreBreakdown[0], 0);
    this.renderTeamScoreTray('team1-score-tray', gs.teamScoreBreakdown[1], 1);

    // 2. Dfo3 and Deal info
    const dfo3Text = gs.currentDfo3 === 1 
      ? '🥇 الدفوع 1 (الهدف: 4 عواد = 20)' 
      : '👑 الدفوع 2 (الهدف: 4 عواد وحجرة = 21)';
    const dfo3Badge = document.getElementById('dfo3-badge-display');
    if (dfo3Badge) dfo3Badge.textContent = dfo3Text;

    const cardsInDeal = gs.handDealRound === 1 ? 4 : 3;
    const dealRoundEl = document.getElementById('deal-round-display');
    if (dealRoundEl) {
      dealRoundEl.textContent = `التفريقة ${gs.handDealRound}/3 (${cardsInDeal} أوراق) | يد #${gs.handNumber}`;
    }

    // Check if new deal round started -> trigger Tafri9a animation & declarations
    if (this.currentDealRoundTrack !== gs.handDealRound && gs.state === 'PLAYING') {
      this.currentDealRoundTrack = gs.handDealRound;
      this.triggerTafri9aDealAnimation(gs.handDealRound);

      const cardsInDeal = gs.handDealRound === 1 ? 4 : 3;
      const dealDuration = (cardsInDeal * 4 * 280) + 900;
      if (gs.currentDealDeclarations && gs.currentDealDeclarations.length > 0) {
        setTimeout(() => {
          gs.currentDealDeclarations.forEach((decl, idx) => {
            setTimeout(() => {
              this.showAnnouncement(decl.title, decl.subtitle, 3800);
              if (this.audio) this.audio.playDeclaration(decl.type === 'tringa' || decl.type === 'quarteto' ? 'tringa' : 'ronda');
            }, idx * 4000);
          });
        }, dealDuration);
      }
    }

    // 3. Map seats relative to viewer (Right-to-Left: South 0 -> East 1 -> North 2 -> West 3)
    const viewerSeat = this.mySeat >= 0 ? this.mySeat : 0;
    const viewerTeam = gs.players[viewerSeat]?.team || 0;
    const posNorth = (viewerSeat + 2) % 4;
    const posEast = (viewerSeat + 1) % 4; // Right
    const posWest = (viewerSeat + 3) % 4; // Left
    const posSouth = viewerSeat;

    this.renderPlayerSeat('seat-south', gs.players[posSouth], posSouth === gs.currentTurn, posSouth === gs.dealerIndex, true, viewerTeam);
    this.renderPlayerSeat('seat-north', gs.players[posNorth], posNorth === gs.currentTurn, posNorth === gs.dealerIndex, false, viewerTeam);
    this.renderPlayerSeat('seat-east', gs.players[posEast], posEast === gs.currentTurn, posEast === gs.dealerIndex, false, viewerTeam);
    this.renderPlayerSeat('seat-west', gs.players[posWest], posWest === gs.currentTurn, posWest === gs.dealerIndex, false, viewerTeam);

    // Declaration Bar Visibility (Show if player has cards and haven't declared yet)
    const declBar = document.getElementById('declaration-bar');
    const myPlayer = gs.players[posSouth];
    if (declBar) {
      const myCardCount = (myPlayer && myPlayer.hand) ? myPlayer.hand.length : 0;
      const alreadyDeclared = !!(gs.playerDeclarations && gs.playerDeclarations[posSouth]);
      declBar.style.display = (myCardCount > 0 && !alreadyDeclared && gs.state === 'PLAYING') ? 'flex' : 'none';
    }

    // 4. Render My Hand (South)
    const myHandContainer = document.getElementById('my-hand-container');
    if (myHandContainer && myPlayer && myPlayer.hand) {
      const isMyTurn = (posSouth === gs.currentTurn) && (gs.state === 'PLAYING');
      myHandContainer.innerHTML = myPlayer.hand.map(card => {
        return this.renderCardHTML(card, isMyTurn);
      }).join('');

      myHandContainer.querySelectorAll('.ronda-card.is-playable').forEach(cardEl => {
        const cardId = cardEl.dataset.cardId;
        const cardRank = parseInt(cardEl.dataset.rank, 10);

        cardEl.addEventListener('click', () => {
          this.playCard(cardId);
        });

        cardEl.addEventListener('mouseenter', () => {
          this.previewCaptures(cardRank);
        });

        cardEl.addEventListener('mouseleave', () => {
          this.clearCaptureHighlights();
        });
      });
    }

    // 5. Render Table Cards
    const tableContainer = document.getElementById('table-cards-grid');
    if (tableContainer) {
      tableContainer.innerHTML = gs.table.map(card => {
        return this.renderCardHTML(card, false);
      }).join('');
    }

    // 6. Update Deck Pile Count
    const deckCountEl = document.getElementById('table-deck-count');
    if (deckCountEl) {
      deckCountEl.textContent = `${gs.deckCount} ورقة`;
    }

    // 7. Modals
    if (gs.state === 'ROUND_OVER' && !gs.isMatchOver) {
      this.showHandSummaryModal(gs);
    }

    if (gs.isMatchOver) {
      this.showVictoryModal(gs);
    }
  }

  renderTeamScoreTray(containerId, scoreData, teamIdx) {
    const container = document.getElementById(containerId);
    if (!container || !scoreData) return;

    const { ouds, hajrat, total } = scoreData;

    let oudsHTML = '';
    for (let i = 0; i < ouds; i++) {
      oudsHTML += `<span class="oud-stick" title="عود (5 نقط)"></span>`;
    }

    let hajratHTML = '';
    for (let i = 0; i < hajrat; i++) {
      hajratHTML += `<span class="hajra-dot" title="حجرة (1 نقطة)"></span>`;
    }

    const teamLabel = teamIdx === 0 ? 'فرقة ذهبية 👑' : 'فرقة زرقاء 💎';

    container.innerHTML = `
      <span class="pod-title">${teamLabel}</span>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;color:#d97706;font-weight:900;">🪵 ${ouds}</span>
        ${oudsHTML}
      </div>
      <div style="display:flex;align-items:center;gap:3px;">
        <span style="font-size:12px;color:#38bdf8;font-weight:900;">🪨 ${hajrat}</span>
        ${hajratHTML}
      </div>
      <span class="pod-score-number">(${total} نقطة)</span>
    `;
  }

  renderPlayerSeat(containerId, player, isCurrentTurn, isDealer, isSouth, viewerTeam = 0) {
    const container = document.getElementById(containerId);
    if (!container || !player) return;

    const teamClass = player.team === 0 ? 'tm-0' : 'tm-1';
    const avatarLetter = this.getAvatarLetter(player.avatar);

    const podHTML = `
      <div class="player-pod ${teamClass} ${isCurrentTurn ? 'active-turn' : ''}" data-seat="${player.seat}">
        <span class="p-avatar">${avatarLetter}</span>
        <span class="p-name">${player.name}</span>
        ${isDealer ? '<span class="p-dealer">D</span>' : ''}
      </div>
    `;

    if (isSouth) {
      const tagEl = container.querySelector('.player-tag-container');
      if (tagEl) tagEl.innerHTML = podHTML;
    } else {
      const count = player.cardsInHandCount || 0;
      let cardsBackHTML = '';
      for (let i = 0; i < count; i++) {
        cardsBackHTML += `
          <div class="ronda-card card-back">
            <img src="images/cards/card_back.png" class="ronda-card-img" alt="">
          </div>
        `;
      }
      container.innerHTML = `
        ${podHTML}
        <div class="opp-fan">${cardsBackHTML}</div>
      `;
    }
  }

  getAvatarLetter(avatar) {
    const map = { tarboosh:'T', fez:'M', djellaba:'D', tea:'A', sheikh:'S', mustache:'H' };
    return map[avatar] || avatar?.charAt(0)?.toUpperCase() || '?';
  }

  triggerUnoPlayAnimation(playerSeat, playerName, card) {
    const container = document.getElementById('flying-cards-container');
    if (!container || !card) return;

    let flyClass = 'flight-south';
    if (playerSeat === 1) flyClass = 'flight-east';
    if (playerSeat === 2) flyClass = 'flight-north';
    if (playerSeat === 3) flyClass = 'flight-west';

    const overlay = document.createElement('div');
    overlay.className = `flight-wrap ${flyClass}`;
    overlay.innerHTML = `
      <div class="flight-badge">${playerName}</div>
      <div class="ronda-card" style="width:var(--card-w);height:var(--card-h);">
        <img src="images/cards/${card.suit}_${card.rank}.png" class="ronda-card-img" alt="${card.suit} ${card.rank}">
      </div>
    `;

    container.appendChild(overlay);
    if (this.audio) this.audio.playCardSnap();

    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 1450);
  }

  triggerTafri9aDealAnimation(dealRound) {
    const seats = ['south', 'east', 'north', 'west'];
    const container = document.getElementById('flying-cards-container');
    if (!container) return;

    const cardsPerPlayer = dealRound === 1 ? 4 : 3;
    let cardCount = 0;

    for (let c = 0; c < cardsPerPlayer; c++) {
      for (let s = 0; s < 4; s++) {
        const seatName = seats[s];
        const delay = cardCount * 280;
        cardCount++;

        setTimeout(() => {
          const cardEl = document.createElement('div');
          cardEl.className = `ronda-card card-back deal-card deal-to-${seatName}`;
          cardEl.innerHTML = `<img src="images/cards/card_back.png" class="ronda-card-img" alt="">`;
          container.appendChild(cardEl);
          requestAnimationFrame(() => { cardEl.style.opacity = '1'; });
          if (this.audio) this.audio.playDeal();
          setTimeout(() => {
            if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
          }, 850);
        }, delay);
      }
    }
  }

  renderCardHTML(card, isPlayable = false) {
    if (!card) return '';
    const suit = card.suit;
    const rank = card.rank;
    const imgUrl = `images/cards/${suit}_${rank}.png`;

    return `
      <div class="ronda-card ${isPlayable ? 'is-playable' : ''}" 
           data-card-id="${card.id}" 
           data-rank="${rank}" 
           data-suit="${suit}">
        <img src="${imgUrl}" class="ronda-card-img" alt="${suit} ${rank}" loading="eager">
      </div>
    `;
  }

  playCard(cardId) {
    if (this.audio) this.audio.playCardSnap();
    if (navigator.vibrate) navigator.vibrate(40);
    this.socket.emit('play_card', { cardId });
  }

  previewCaptures(playedRank) {
    if (!this.roomState || !this.roomState.gameState) return;
    const table = this.roomState.gameState.table;
    const matching = table.filter(c => c.rank === playedRank);
    if (matching.length === 0) return;

    const capturedIds = new Set(matching.map(c => c.id));
    let curRank = playedRank;

    const ranksOrder = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    while (true) {
      const idx = ranksOrder.indexOf(curRank);
      if (idx === -1 || idx === ranksOrder.length - 1) break;
      const nextRank = ranksOrder[idx + 1];
      const nextCards = table.filter(c => c.rank === nextRank);
      if (nextCards.length > 0) {
        nextCards.forEach(c => capturedIds.add(c.id));
        curRank = nextRank;
      } else {
        break;
      }
    }

    document.querySelectorAll('#table-cards-grid .ronda-card').forEach(el => {
      if (capturedIds.has(el.dataset.cardId)) {
        el.classList.add('highlight-capture');
      }
    });
  }

  clearCaptureHighlights() {
    document.querySelectorAll('#table-cards-grid .ronda-card').forEach(el => {
      el.classList.remove('highlight-capture');
    });
  }

  handleCardPlayedAction(data) {
    const { playerIndex, card, result } = data;
    const playerName = this.roomState ? this.roomState.gameState.players[playerIndex]?.name : 'لاعب';

    // 1. Slow Uno-Style Flying Card Animation
    if (card) {
      const viewerSeat = this.mySeat >= 0 ? this.mySeat : 0;
      const relativeSeat = (playerIndex - viewerSeat + 4) % 4; // 0 South, 1 East, 2 North, 3 West
      this.triggerUnoPlayAnimation(relativeSeat, playerName, card);
    }

    if (result && result.captured) {
      if (result.hitType === '9A3A_12') {
        this.showAnnouncement('👑 القاعة بالشيخ (9a3a b\'12)!', `${playerName} دا عود كامل (+5 نقط)`, 4200);
        if (this.audio) this.audio.playDeclaration('tringa');
      } else if (result.hitType === 'DARB') {
        this.showAnnouncement('🎯 ضربة (كارطة)!', `${playerName} جاب حجرة (+1)`, 3500);
        if (this.audio) this.audio.playDarb();
      } else if (result.hitType === 'KHLIS') {
        this.showAnnouncement('💥 خـلاص (خلس)!', `${playerName} دا عود كامل (+5 نقط)`, 4000);
        if (this.audio) this.audio.playKhlis();
      } else if (result.hitType === 'ZID_KHLIS') {
        this.showAnnouncement('⚡ زيد خلص!', `${playerName} دا 2 عواد (+10 نقط)`, 4000);
        if (this.audio) this.audio.playKhlis();
      } else if (result.hitType === 'BASTA') {
        this.showAnnouncement('👑 بـاسـتـا (BASTA)!', `${playerName} دا 2 عواد (+10 نقط)`, 4000);
        if (this.audio) this.audio.playKhlis();
      } else if (result.isMissa) {
        this.showAnnouncement('🧹 مـيـسـة (MISSA)!', `${playerName} مسح الطابلة كاملة (+1 حجرة)`, 3500);
        if (this.audio) this.audio.playMissa();
      } else {
        if (this.audio) this.audio.playCapture();
      }
    } else {
      if (this.audio) this.audio.playCardSnap();
    }
  }

  showAnnouncement(title, subtitle, duration = 4000) {
    const banner = document.getElementById('announcement-banner');
    const titleEl = document.getElementById('announcement-title');
    const subEl = document.getElementById('announcement-subtitle');
    if (!banner || !titleEl || !subEl) return;

    titleEl.textContent = title;
    subEl.textContent = subtitle;
    banner.classList.add('show');

    if (this.announcementTimeout) clearTimeout(this.announcementTimeout);

    this.announcementTimeout = setTimeout(() => {
      banner.classList.remove('show');
    }, duration);
  }

  showHandSummaryModal(gs) {
    const modal = document.getElementById('hand-summary-modal');
    const content = document.getElementById('hand-summary-content');
    if (!modal || !content) return;

    const cardsTeam0 = gs.collectedCardsCount[0] || 0;
    const cardsTeam1 = gs.collectedCardsCount[1] || 0;
    const ptsTeam0 = Math.max(0, cardsTeam0 - 20);
    const ptsTeam1 = Math.max(0, cardsTeam1 - 20);
    const s0 = gs.teamScoreBreakdown[0];
    const s1 = gs.teamScoreBreakdown[1];

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:16px;">
        <h2 style="font-family:'Cairo';color:#f59e0b">📊 نهاية اليد رقم ${gs.handNumber}</h2>
        <p style="color:#cbd5e1">حساب الأوراق (المعدل 20 ورقة = 0 نقط)</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
        <div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b;padding:16px;border-radius:12px;text-align:center;">
          <h3 style="color:#fbbf24">فرقة 1 (ذهبي)</h3>
          <div style="font-size:24px;font-weight:900;margin:6px 0;">${cardsTeam0} ورقة</div>
          <div style="font-size:15px;font-weight:700;color:#10b981">+${ptsTeam0} حجرة من الأوراق</div>
          <div style="font-size:16px;font-weight:900;margin-top:8px;color:#fff">
            🪵 ${s0.ouds} عواد | 🪨 ${s0.hajrat} حجرات (${s0.total} نقطة)
          </div>
        </div>

        <div style="background:rgba(6,182,212,0.1);border:1px solid #06b6d4;padding:16px;border-radius:12px;text-align:center;">
          <h3 style="color:#38bdf8">فرقة 2 (أزرق)</h3>
          <div style="font-size:24px;font-weight:900;margin:6px 0;">${cardsTeam1} ورقة</div>
          <div style="font-size:15px;font-weight:700;color:#10b981">+${ptsTeam1} حجرة من الأوراق</div>
          <div style="font-size:16px;font-weight:900;margin-top:8px;color:#fff">
            🪵 ${s1.ouds} عواد | 🪨 ${s1.hajrat} حجرات (${s1.total} نقطة)
          </div>
        </div>
      </div>
    `;

    const btnNext = document.getElementById('btn-next-hand');
    if (btnNext) {
      btnNext.style.display = this.isHost ? 'flex' : 'none';
    }

    this.openModal('hand-summary-modal');
  }

  showVictoryModal(gs) {
    const modal = document.getElementById('victory-modal');
    const content = document.getElementById('victory-modal-content');
    if (!modal || !content) return;

    if (this.audio) this.audio.playWin();

    const winnerTeam = gs.winnerTeam;
    const teamName = winnerTeam === 0 ? 'فرقة 1 (ذهبي 👑)' : 'فرقة 2 (أزرق 💎)';
    const finalScores = gs.scores;
    const sWin = gs.teamScoreBreakdown[winnerTeam];

    content.innerHTML = `
      <div class="victory-overlay">
        <div class="victory-trophy">🏆</div>
        <h1 style="font-family:'Cairo';color:#f59e0b;font-size:32px;">مبروك الفوز بالماتش!</h1>
        <h2 style="color:#fff;font-size:22px;">الفائز: ${teamName}</h2>
        <p style="color:#94a3b8">ختمو الدفوع الثاني بـ <strong>${sWin.ouds} عواد و ${sWin.hajrat} حجرات (${finalScores[winnerTeam]} نقطة)</strong>!</p>

        <div style="margin:16px 0;font-size:18px;font-weight:800;">
          النتيجة: فرقة 1 (${finalScores[0]} نقطة) - فرقة 2 (${finalScores[1]} نقطة)
        </div>
      </div>
    `;

    const btnRestart = document.getElementById('btn-restart-match');
    if (btnRestart) {
      btnRestart.style.display = this.isHost ? 'flex' : 'none';
    }

    this.openModal('victory-modal');
  }

  handleIncomingChat(msg) {
    const container = document.getElementById('chat-messages-box');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `
      <div class="sender">${msg.senderName}:</div>
      <div class="text">${msg.text}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }

  getAvatarEmoji(key) {
    const avatars = {
      tarboosh: '🎩',
      fez: '🇲🇦',
      djellaba: '👳‍♂️',
      tea: '☕',
      sheikh: '👑',
      mustache: '🧔‍♂️',
      spectator: '👀'
    };
    return avatars[key] || '👤';
  }

  getSuitSymbol(suit) {
    const symbols = { oros: 'O', copas: 'C', espadas: 'E', bastos: 'B' };
    return symbols[suit] || suit;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.rondaClient = new RondaClient();
});
