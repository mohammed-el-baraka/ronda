# 🎴 Moroccan Ronda (الروندا المغربية)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Online-8b5cf6?style=for-the-badge&logo=githubpages&logoColor=white)](https://mohammed-el-baraka.github.io/ronda/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

An authentic, modern web implementation of the traditional **Moroccan Ronda (الروندا)** card game for 4 players (2v2 teams) or Solo play against intelligent bots.

Built with pure Vanilla JavaScript, WebSockets (Socket.io), Web Audio API, and a modern responsive dark UI.

---

## 🎮 Play Instantly Online

> 👉 **[Play Now on GitHub Pages](https://mohammed-el-baraka.github.io/ronda/)** *(Instant Solo Play vs 3 Moroccan AI Bots in browser)*

---

## ✨ Features

- **🌐 Local Wi-Fi / LAN Multiplayer (4 Players):** Play together with 4 friends connected to the same Wi-Fi network. Instant QR code generation lets friends scan and join immediately from their smartphones.
- **🤖 Fast Solo Mode vs 3 AI Bots:** Jump straight into a game with 3 smart AI bots with no waiting and zero setup required.
- **🪵 Authentic 3oud (العواد) & 7ajra (الحجرات) Scoring:**
  - `1 7ajra` (Stone) = 1 Point.
  - `5 7ajrat` = `1 3oud` (Wood Stick / 5 Points).
  - **1st Dfo3 (الدفوع الأول):** Target = 4 3ouds (20 points).
  - **2nd Dfo3 (الدفوع الثاني):** Target = 4 3ouds + 1 7ajra (21 points) ➔ **Total Match = 41 points**.
- **🎴 Authentic 4-3-3 Dealing Sequence (40 Cards):**
  - Deal 1: 4 cards to each player (16 cards).
  - Deal 2: 3 cards to each player (12 cards).
  - Deal 3: 3 cards to each player (12 cards) ➔ **Total 40 cards**.
  - Right-to-Left (counter-clockwise) dealing and gameplay flow.
- **✨ Secret Combo Announcements & Contest Resolution:**
  - **Secret Ranks:** Automatic declarations announce combos (`روندا!`, `ترينغا!`, `كواطرو!`) without revealing card numbers to keep tactical secrets.
  - **Ronda vs Ronda:** Highest card rank wins and takes the opponent team's Ronda points!
  - **Tringa vs Ronda:** Tringa (+5 pts / 1 3oud) beats Ronda and takes all opponent Ronda points!
  - **Quarteto vs All:** Quarteto (4 of a kind = 10 pts / 2 3ouds) beats everything and takes all enemy combos!
- **💥 Hit Streaks & Special Rules:**
  - **Darb (الضربة):** Matching the previous player's card (+1 7ajra).
  - **Khlis (الخلاص):** Immediate counter-hit (+1 3oud / 5 pts).
  - **Zid Khles (زيد خلص):** Third consecutive hit (+2 3ouds / 10 pts).
  - **Basta (باستا):** All 4 players hit (+3 3ouds / 15 pts).
  - **Missa (الميسة):** Clearing the table (+1 7ajra).
  - **9a3a with 12 (القاعة بالشيخ):** Capturing on the 40th final trick with a 12 (Rey) awards **1 full 3oud (+5 pts)**!
- **🎨 Modern Dark UI:** Clean geometric theme with electric violet & amber accents, smooth animations, fanned card hand, and responsive mobile-first layout.
- **🔊 Zero-Latency Synthesized Audio:** Web Audio API sound effects for deals, snaps, captures, combos, and sweeps.
- **💬 In-game Darija Chat:** Quick Moroccan reaction chips (`روندا!`, `خلاص!`, `القاعة بالشيخ!`, `باستا!`).

---

## 🚀 Running Locally for LAN Multiplayer (Wi-Fi)

To host a local multiplayer room with your friends on the same Wi-Fi:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)

### 1. Clone the repository
```bash
git clone https://github.com/mohammed-el-baraka/ronda.git
cd ronda
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the game server
```bash
npm start
```

### 4. Connect and Play
The server will display your local LAN address in the terminal:
```
======================================================
🎴 MOROCCAN RONDA (الروندا المغربية) - SERVER RUNNING!
======================================================

🌐 Accessible on your local Wi-Fi / LAN:
   👉 en0         : http://192.168.1.233:3000

📱 Share the link or scan the in-game QR code with your friends!
======================================================
```
1. Open `http://localhost:3000` in your browser.
2. Click **Create Room (إنشاء طابلة)**.
3. Have your friends connect to your Wi-Fi and open the link or scan the QR code from their phones!

---

## 🧪 Automated Testing

Run the full engine test suite covering all Moroccan Ronda scoring, deal sequence, and combo comparison rules:

```bash
npm test
```

Test coverage includes:
- ✅ 4-3-3 Deal sequence (40 cards)
- ✅ Secret card rank preservation in announcements
- ✅ Tringa taking enemy Ronda points
- ✅ Ronda rank comparisons (higher rank takes opponent points)
- ✅ Quarteto taking all enemy combos
- ✅ Tied Ronda rank nullification (Ba6el)
- ✅ Darb & Khlis hit streak progressions
- ✅ 9a3a with 12 awarding 1 3oud (+5 pts)

---

## 📁 Project Structure

```
ronda/
├── public/                 # Frontend assets
│   ├── css/
│   │   ├── style.css       # Modern dark theme styles & layout
│   │   └── cards.css       # Card rendering & slow flight animations
│   ├── js/
│   │   ├── rondaClient.js  # Client multiplayer & UI controller
│   │   ├── soloGame.js     # Standalone in-browser solo game engine with bots
│   │   ├── audio.js        # Web Audio API sound synthesis
│   │   ├── rulesModal.js   # Multilingual rules modal (Darija, FR, EN)
│   │   └── lanHelper.js    # LAN IP discovery & QR code generator
│   ├── images/
│   │   └── cards/          # Spanish/Moroccan 40-card deck assets
│   └── index.html          # Main HTML5 entry page
├── server/
│   ├── game/
│   │   ├── rondaEngine.js  # Server-side authoritative game engine
│   │   ├── roomManager.js  # Lobby, room codes, seats & bot management
│   │   ├── botAI.js        # Bot decision heuristics
│   │   └── deck.js         # Deck generation, shuffling & rank utilities
│   └── index.js            # Express server & Socket.io WebSocket handlers
├── test/
│   └── rondaTest.js        # Engine unit test suite
├── package.json
└── README.md
```

---

## 📜 Moroccan Ronda Rules Summary

| Rule / Combo | Cards Required | Reward | Notes |
| :--- | :--- | :--- | :--- |
| **Ronda (روندا)** | 2 cards of same rank | **+1 7ajra (+1 pt)** | Higher rank wins and takes opponent's Ronda points |
| **Tringa (ترينغا)** | 3 cards of same rank | **+1 3oud (+5 pts)** | Beats Ronda and takes all enemy Ronda points |
| **Quarteto (كواطرو)** | 4 cards of same rank | **+2 3ouds (+10 pts)** | Beats everything and takes all enemy combos |
| **Darb (الضربة)** | Match previous card | **+1 7ajra (+1 pt)** | First hit on table |
| **Khlis (الخلاص)** | Counter-match Darb | **+1 3oud (+5 pts)** | Second consecutive hit |
| **Zid Khles (زيد خلص)** | Counter-match Khlis | **+2 3ouds (+10 pts)**| Third consecutive hit |
| **Basta (باستا)** | Counter-match 4th | **+3 3ouds (+15 pts)**| Fourth consecutive hit |
| **Missa (الميسة)** | Clear the table | **+1 7ajra (+1 pt)** | Table becomes empty |
| **9a3a b'12 (القاعة)**| Capture on trick 40 with 12 | **+1 3oud (+5 pts)** | Last trick of the 40 cards |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ for Moroccan culture and traditional card games. 🇲🇦
