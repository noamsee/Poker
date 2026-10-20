# ♠ Royal Texas Hold'em Poker

A modern, responsive, casino-style Texas Hold'em Poker game built for the web with an interactive browser interface, realistic felt table graphics, smart AI opponents, synthesized audio effects, and a complete hand evaluator engine.

---

## 🌟 Key Features

- **Casino Felt UI**: Luxurious dark theme with green felt table, golden rims, dealer button ('D'), animated card dealing, and dynamic chip piles.
- **Smart AI Opponents**:
  - 🦊 **Alex (Aggressive)**: Loose-aggressive player who applies pressure, raises, and bluffs.
  - 🦉 **Claire (Conservative)**: Tight player who only bets into strong hands and protects her stack.
  - 🐺 **Tom (Balanced)**: Calculated player who makes decisions based on pot odds and table position.
- **Full Texas Hold'em Engine**:
  - Standard 52-card deck with Fisher-Yates shuffle.
  - Small & Big Blinds rotation.
  - Betting stages: Pre-flop, Flop (3 cards), Turn (4th card), and River (5th card).
  - Actions: **Fold**, **Check**, **Call**, **Bet / Raise** (with slider and quick-bet buttons: Min, 1/2 Pot, Pot, All-in).
  - **7-card Hand Evaluator**: Accurately scores High Card, One Pair, Two Pair, Three of a Kind, Straight, Flush, Full House, Four of a Kind, Straight Flush, and Royal Flush.
  - Split pot handling and showdown card reveal.
- **Live Hand Assistant**: Displays your current best hand strength in real time as community cards drop.
- **Web Audio Sound Effects**: Zero external audio dependencies—synthesized card slides, chip clicks, and win fanfare using the Web Audio API.
- **Hand History Log**: Real-time drawer tracking every bet, raise, fold, and winner.
- **Re-buy Bankroll**: If you run low on chips, hit the **Re-buy** button to grab a fresh $1,000 stack.

---

## 🚀 How to Run

### Option 1: Direct in Browser (No Server Required)
Simply double-click [`index.html`](file:///C:/Users/Noam/.gemini/antigravity/scratch/Poker/index.html) or open it directly in Chrome, Edge, Firefox, or Safari.

### Option 2: Local Node.js Server
From the project folder, run:
```bash
node server.js
```
Then visit:
```
http://localhost:3000
```

---

## 📂 Project Structure

```text
Poker/
├── index.html          # Main HTML structure & UI components
├── server.js           # Zero-dependency local development server
├── README.md           # Documentation & instructions
├── css/
│   └── style.css       # Casino table styling, animations, cards, badges
└── js/
    ├── evaluator.js    # 7-card Texas Hold'em hand ranking algorithm
    ├── cards.js        # Card and Deck classes, shuffling & rendering
    ├── ai.js           # Decision engine for AI opponents
    ├── game.js         # Core state machine & betting round controller
    └── app.js          # UI connector, sound synthesis & event listeners
```
