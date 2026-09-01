/**
 * Moroccan Ronda (الروندا) - Main Server
 * Express + Socket.io + Network Discovery + QR Code Generator
 */

const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const cors = require('cors');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const roomManager = require('./game/roomManager');
const RondaBotAI = require('./game/botAI');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Discovers all local IPv4 network interfaces (Wi-Fi / LAN)
 */
function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Look for IPv4 and non-internal (i.e. not 127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          ip: iface.address,
          url: `http://${iface.address}:${PORT}`
        });
      }
    }
  }

  // Fallback to localhost if no LAN address found
  if (addresses.length === 0) {
    addresses.push({
      name: 'localhost',
      ip: '127.0.0.1',
      url: `http://localhost:${PORT}`
    });
  }

  return addresses;
}

// API: Get Local Network Info & QR Code
app.get('/api/network-info', async (req, res) => {
  try {
    const netAddresses = getLocalNetworkAddresses();
    const primaryAddress = netAddresses[0] || { ip: 'localhost', url: `http://localhost:${PORT}` };
    const roomCode = req.query.room || '';
    
    const targetUrl = roomCode 
      ? `${primaryAddress.url}/?room=${roomCode}` 
      : primaryAddress.url;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      margin: 2,
      scale: 8,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      port: PORT,
      primaryUrl: targetUrl,
      addresses: netAddresses,
      qrDataUrl: qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Generate QR code for any URL
app.get('/api/qr', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL is required');
  try {
    const qrDataUrl = await QRCode.toDataURL(url, { margin: 2, scale: 6 });
    res.json({ qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Broadcasts updated room state to all players & spectators in room
function broadcastRoomState(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  // Send tailored state to each seat
  room.seats.forEach(slot => {
    if (slot.player && slot.player.connected && !slot.player.isBot) {
      const state = roomManager.getPublicRoomState(roomCode, slot.player.socketId);
      io.to(slot.player.socketId).emit('room_state', state);
    }
  });

  // Send state to spectators
  room.spectators.forEach(spec => {
    const state = roomManager.getPublicRoomState(roomCode, spec.socketId);
    io.to(spec.socketId).emit('room_state', state);
  });
}

// Handles automated bot turn loop
function triggerBotTurnIfNeeded(roomCode, initialDelay = 0) {
  const room = roomManager.getRoom(roomCode);
  if (!room || room.status !== 'PLAYING' || !room.game) return;

  const game = room.game;
  if (game.state !== 'PLAYING') return;

  const currentSeat = game.currentTurn;
  const currentSeatSlot = room.seats[currentSeat];

  if (currentSeatSlot && currentSeatSlot.player && currentSeatSlot.player.isBot) {
    // Bot's turn: deliberate realistic human-like pace
    const delay = initialDelay + Math.floor(Math.random() * 500) + 1300; // 1300-1800ms

    setTimeout(() => {
      // Re-verify state
      if (!room.game || room.game.state !== 'PLAYING' || room.game.currentTurn !== currentSeat) {
        return;
      }

      const botCard = RondaBotAI.chooseCard(room.game, currentSeat);
      if (!botCard) return;

      const result = room.game.playCard(currentSeat, botCard.id);
      
      // Emit play event to all clients with audio/visual trigger
      io.to(roomCode).emit('card_played_action', {
        playerIndex: currentSeat,
        card: botCard,
        result: result.captureResult,
        state: room.game.getPublicState()
      });

      broadcastRoomState(roomCode);

      // Continue chain if next player is also a bot
      if (room.game.state === 'PLAYING') {
        triggerBotTurnIfNeeded(roomCode);
      }
    }, delay);
  }
}

// Socket.io Multiplayer Connection Handling
io.on('connection', (socket) => {
  // Create Room
  socket.on('create_room', (data, callback) => {
    try {
      const hostData = {
        socketId: socket.id,
        id: data.playerId || socket.id,
        name: (data.playerName || 'الرايس').trim(),
        avatar: data.playerAvatar || 'tarboosh'
      };

      const room = roomManager.createRoom(hostData, {
        targetScore: parseInt(data.targetScore, 10) || 41,
        mode: data.mode || '2v2'
      });

      socket.join(room.code);
      const state = roomManager.getPublicRoomState(room.code, socket.id);
      if (callback) callback({ success: true, roomCode: room.code, state });
      broadcastRoomState(room.code);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', (data, callback) => {
    try {
      const code = (data.roomCode || '').toUpperCase().trim();
      const playerData = {
        socketId: socket.id,
        id: data.playerId || socket.id,
        name: (data.playerName || 'لاعب').trim(),
        avatar: data.playerAvatar || 'fez'
      };

      const result = roomManager.joinRoom(code, playerData, socket.id);
      if (!result.success) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      socket.join(code);
      const state = roomManager.getPublicRoomState(code, socket.id);
      if (callback) callback({ success: true, roomCode: code, seat: result.seat, state });
      broadcastRoomState(code);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Fill empty seats with Bots
  socket.on('fill_bots', (data) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;
    roomManager.fillWithBots(roomCode);
    broadcastRoomState(roomCode);
  });

  // Remove a Bot from a seat
  socket.on('remove_bot', (data) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;
    roomManager.removeBot(roomCode, data.seat);
    broadcastRoomState(roomCode);
  });

  // Switch Seat
  socket.on('switch_seat', (data) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;
    roomManager.switchSeat(roomCode, socket.id, data.targetSeat);
    broadcastRoomState(roomCode);
  });

  // Start Game
  socket.on('start_game', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const result = roomManager.startGame(roomCode, socket.id);
    if (result.success) {
      io.to(roomCode).emit('game_started', {
        roomCode: roomCode,
        message: 'بدات اللعبة! حظ موفق للجميع 🇲🇦'
      });
      broadcastRoomState(roomCode);
      // Trigger bot if dealer's next is bot
      triggerBotTurnIfNeeded(roomCode);
    }
  });

  // Play Card
  socket.on('play_card', (data, callback) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game || room.status !== 'PLAYING') return;

    const seat = room.seats.find(s => s.player && s.player.socketId === socket.id);
    if (!seat) return;

    const result = room.game.playCard(seat.seat, data.cardId);
    if (!result.success) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    if (callback) callback({ success: true });

    // Broadcast play action
    io.to(roomCode).emit('card_played_action', {
      playerIndex: seat.seat,
      card: result.playedCard,
      result: result.captureResult,
      state: room.game.getPublicState()
    });

    broadcastRoomState(roomCode);

    // Check if next turn is a bot
    triggerBotTurnIfNeeded(roomCode);
  });

  // (Declarations are now automatic — no manual declare/challenge events)

  // Quit / Leave Game
  socket.on('leave_game', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (roomCode) {
      roomManager.leaveRoom(socket.id);
      socket.leave(roomCode);
      socket.emit('left_game_success');
      broadcastRoomState(roomCode);
    }
  });

  // Next Hand (after round ends)
  socket.on('next_hand', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return;

    if (room.game.state === 'ROUND_OVER' && !room.game.isMatchOver) {
      room.game.startNewHand();
      broadcastRoomState(roomCode);
      triggerBotTurnIfNeeded(roomCode);
    }
  });

  // Restart Match
  socket.on('restart_match', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return;

    room.game.startMatch();
    room.status = 'PLAYING';
    broadcastRoomState(roomCode);
    triggerBotTurnIfNeeded(roomCode);
  });

  // Send Chat Message or Darija Reaction Audio
  socket.on('send_chat', (data) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const chatMsg = roomManager.addChatMessage(roomCode, socket.id, data);
    if (chatMsg) {
      io.to(roomCode).emit('chat_message', chatMsg);
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (roomCode) {
      roomManager.leaveRoom(socket.id);
      broadcastRoomState(roomCode);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎴 MOROCCAN RONDA (الروندا المغربية) - SERVER RUNNING!`);
  console.log(`======================================================`);
  const addresses = getLocalNetworkAddresses();
  console.log(`\n🌐 Accessible on your local Wi-Fi / LAN:`);
  addresses.forEach(addr => {
    console.log(`   👉 ${addr.name.padEnd(12)}: ${addr.url}`);
  });
  console.log(`\n📱 Share the link or scan the in-game QR code with your friends!`);
  console.log(`======================================================\n`);
});
