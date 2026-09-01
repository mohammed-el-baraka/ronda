/**
 * Moroccan Ronda - Room & Lobby Manager
 * Coordinates multiplayer game rooms, seating, bots, chat reactions, bluff declarations, and socket events.
 */

const RondaGame = require('./rondaEngine');
const RondaBotAI = require('./botAI');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.socketToRoom = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostPlayer, options = {}) {
    const code = this.generateRoomCode();
    const targetScore = options.targetScore || 41;
    const mode = options.mode || '2v2';

    const room = {
      code: code,
      createdAt: Date.now(),
      hostSocketId: hostPlayer.socketId,
      targetScore: targetScore,
      mode: mode,
      status: 'LOBBY',
      seats: [
        {
          seat: 0,
          team: 0,
          position: 'south',
          labelAr: 'الجنوب (أنت / المضيف)',
          player: {
            id: hostPlayer.id || hostPlayer.socketId,
            socketId: hostPlayer.socketId,
            name: hostPlayer.name || 'الرايس (Host)',
            avatar: hostPlayer.avatar || 'tarboosh',
            isBot: false,
            isHost: true,
            connected: true
          }
        },
        {
          seat: 1,
          team: 1,
          position: 'east',
          labelAr: 'الشرق (الخصم 1 على اليمين)',
          player: null
        },
        {
          seat: 2,
          team: 0,
          position: 'north',
          labelAr: 'الشمال (الشريك / الصاحب)',
          player: null
        },
        {
          seat: 3,
          team: 1,
          position: 'west',
          labelAr: 'الغرب (الخصم 2 على اليسار)',
          player: null
        }
      ],
      spectators: [],
      chatMessages: [],
      game: null
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(hostPlayer.socketId, code);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase()) || null;
  }

  joinRoom(code, player, socketId) {
    const room = this.getRoom(code);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const existingSeat = room.seats.find(
      s => s.player && (s.player.id === player.id || s.player.socketId === socketId)
    );

    if (existingSeat) {
      existingSeat.player.socketId = socketId;
      existingSeat.player.connected = true;
      if (player.name) existingSeat.player.name = player.name;
      if (player.avatar) existingSeat.player.avatar = player.avatar;
      this.socketToRoom.set(socketId, room.code);
      return { success: true, room, seat: existingSeat.seat, reconnected: true };
    }

    const emptySeat = room.seats.find(s => !s.player);
    if (emptySeat) {
      emptySeat.player = {
        id: player.id || socketId,
        socketId: socketId,
        name: player.name || `لاعب ${emptySeat.seat + 1}`,
        avatar: player.avatar || 'fez',
        isBot: false,
        isHost: false,
        connected: true
      };
      this.socketToRoom.set(socketId, room.code);
      return { success: true, room, seat: emptySeat.seat, reconnected: false };
    }

    room.spectators.push({
      id: player.id || socketId,
      socketId: socketId,
      name: player.name || 'متفرج (Spectator)',
      avatar: player.avatar || 'spectator'
    });
    this.socketToRoom.set(socketId, room.code);
    return { success: true, room, seat: -1, isSpectator: true };
  }

  fillWithBots(code) {
    const room = this.getRoom(code);
    if (!room || room.status === 'PLAYING') return false;

    const existingNames = room.seats.filter(s => s.player).map(s => s.player.name);

    room.seats.forEach(slot => {
      if (!slot.player) {
        const botProfile = RondaBotAI.getRandomBotProfile(existingNames);
        existingNames.push(botProfile.name);

        slot.player = {
          id: `bot_${slot.seat}_${Date.now()}`,
          socketId: `bot_${slot.seat}`,
          name: botProfile.name,
          avatar: botProfile.avatar,
          isBot: true,
          isHost: false,
          connected: true
        };
      }
    });

    return true;
  }

  removeBot(code, seatIndex) {
    const room = this.getRoom(code);
    if (!room || room.status === 'PLAYING') return false;

    if (room.seats[seatIndex] && room.seats[seatIndex].player && room.seats[seatIndex].player.isBot) {
      room.seats[seatIndex].player = null;
      return true;
    }
    return false;
  }

  switchSeat(code, socketId, targetSeat) {
    const room = this.getRoom(code);
    if (!room || room.status === 'PLAYING') return false;
    if (targetSeat < 0 || targetSeat >= 4) return false;

    const currentSeatIndex = room.seats.findIndex(s => s.player && s.player.socketId === socketId);
    if (currentSeatIndex === -1) return false;

    const targetSlot = room.seats[targetSeat];
    if (targetSlot.player && !targetSlot.player.isBot) {
      return false;
    }

    const movingPlayer = room.seats[currentSeatIndex].player;
    room.seats[currentSeatIndex].player = null;
    room.seats[targetSeat].player = movingPlayer;
    return true;
  }

  leaveRoom(socketId) {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    const room = this.getRoom(code);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const seat = room.seats.find(s => s.player && s.player.socketId === socketId);
    if (seat) {
      if (room.status === 'PLAYING') {
        // In active game, replace the leaving human with a bot so the match continues smoothly
        const botProfile = RondaBotAI.getRandomBotProfile([]);
        seat.player = {
          id: `bot_${seat.seat}_${Date.now()}`,
          socketId: `bot_${seat.seat}`,
          name: botProfile.name,
          avatar: botProfile.avatar,
          isBot: true,
          isHost: false,
          connected: true
        };
      } else {
        seat.player = null;
      }
    }

    room.spectators = room.spectators.filter(s => s.socketId !== socketId);
    this.socketToRoom.delete(socketId);

    const hasHumans = room.seats.some(s => s.player && !s.player.isBot) || room.spectators.length > 0;
    if (!hasHumans) {
      this.rooms.delete(code);
      return null;
    }

    return room;
  }

  startGame(code, requesterSocketId) {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    const allFilled = room.seats.every(s => s.player !== null);
    if (!allFilled) {
      return { success: false, error: 'All 4 seats must be filled before starting' };
    }

    const gamePlayers = room.seats.map(s => ({
      id: s.player.id,
      name: s.player.name,
      avatar: s.player.avatar,
      isBot: s.player.isBot,
      seat: s.seat,
      team: s.seat % 2,
      connected: s.player.connected
    }));

    const game = new RondaGame({
      id: room.code,
      targetScore: room.targetScore,
      mode: room.mode,
      playerCount: 4,
      players: gamePlayers
    });

    game.startMatch();

    room.game = game;
    room.status = 'PLAYING';

    return { success: true, room, game };
  }

  addChatMessage(code, socketId, messageData) {
    const room = this.getRoom(code);
    if (!room) return null;

    const senderSeat = room.seats.find(s => s.player && s.player.socketId === socketId);
    const senderName = senderSeat ? senderSeat.player.name : 'متفرج';
    const senderAvatar = senderSeat ? senderSeat.player.avatar : 'spectator';
    const senderSeatIndex = senderSeat ? senderSeat.seat : -1;

    const chatMsg = {
      id: Math.random().toString(36).substring(2, 9),
      senderName,
      senderAvatar,
      senderSeat: senderSeatIndex,
      text: messageData.text || '',
      reaction: messageData.reaction || null,
      timestamp: Date.now()
    };

    room.chatMessages.push(chatMsg);
    if (room.chatMessages.length > 50) {
      room.chatMessages.shift();
    }

    return chatMsg;
  }

  getPublicRoomState(code, viewerSocketId) {
    const room = this.getRoom(code);
    if (!room) return null;

    let viewerSeat = -1;
    let isSpectator = true;
    let isHost = false;

    const seat = room.seats.find(s => s.player && s.player.socketId === viewerSocketId);
    if (seat) {
      viewerSeat = seat.seat;
      isSpectator = false;
      isHost = !!seat.player.isHost;
    }

    return {
      code: room.code,
      status: room.status,
      targetScore: room.targetScore,
      mode: room.mode,
      seats: room.seats.map(s => ({
        seat: s.seat,
        team: s.team,
        position: s.position,
        labelAr: s.labelAr,
        player: s.player ? {
          id: s.player.id,
          name: s.player.name,
          avatar: s.player.avatar,
          isBot: s.player.isBot,
          isHost: s.player.isHost,
          connected: s.player.connected
        } : null
      })),
      viewer: {
        seat: viewerSeat,
        isSpectator,
        isHost
      },
      spectatorsCount: room.spectators.length,
      gameState: room.game ? room.game.getPublicState(viewerSeat) : null,
      recentChat: room.chatMessages.slice(-15)
    };
  }
}

module.exports = new RoomManager();
