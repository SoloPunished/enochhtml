# 🎮 ENOCH RPG

A turn-based, grid-based RPG browser game built in JavaScript. Battle enemies, level up, and collect power-ups on an expanding map that grows more dangerous over time. Featuring evolving combat mechanics, sprite animation, sound effects, and persistent stat upgrades.

## 📦 Project Structure

```
/enochhtml/
├── 1.0/
│   ├── game.js             # Main game logic
│   ├── html container.html # Game canvas and UI container
│   └── *.png               # Game sprite assets (player, enemy, boss, orbs)
├── Sound/                  # Sound effects and background music
│   ├── perkristian-map18.mp3
│   ├── player attack.mp3
│   ├── player attack 2.mp3
│   ├── attack no damage.mp3
│   └── creature death.mp3
└── README.md
```

## 🚀 Features

- **WASD/Arrow Key Movement**
- **Turn-Based Combat**:
  - Attack enemies by walking into them.
  - Enemies return damage unless their directional shield is active.
  - Bosses take up 4 tiles with light/dark weak point mechanics.
- **Combat Direction Shields**:
  - Enemies have 4-directional red shields that prevent return damage once.
  - Shields disappear after a successful directional hit.
- **Leveling System**:
  - Player collects orbs to increase attack (`purple`) or health (`pink`).
  - Orbs drop with a 66% chance per enemy (1 max per enemy).
  - Player heals 25% of missing HP after a kill.
- **Persistent Stats**:
  - Every odd game level, the player chooses a permanent +1 HP or +1 ATK bonus.
  - These persist even after player death.
- **Grid Scaling**:
  - Grid starts at `2x2` and expands by +1 in each direction per level.
  - Grid auto-scrolls based on camera offset to follow the player.
- **Boss Battles**:
  - Begin at Game Level 20 and scale up to 4 bosses.
  - Bosses drop power-ups from each occupied tile.
  - Attack light-tile for double damage, avoid dark-tile to prevent return damage.
- **Visual Enhancements**:
  - Sprite changes for attacking and death animations.
  - Red shield indicators, orb pop-in animations, and blood splatter effects.
- **Real-Time Debug Console**:
  - Displays game logs and errors directly in the UI.
- **Looping Music and SFX**:
  - Background music auto-plays on first key input.
  - SFX for attacks, no-damage hits, and deaths.
- **Session Timer (Coming Soon)**

## 🖼 Art Assets

All image assets are stored in the main GitHub directory and loaded dynamically:
- `player.png`
- `player attack.png`
- `player death.png`
- `enemy.png`
- `boss.png`
- `attack point up.png`
- `health point up.png`

## 🔊 Sound Assets

Located under `/Sound/` in the root directory and loaded from GitHub:
- `perkristian-map18.mp3` (Background Music)
- `player attack.mp3` (Standard attack)
- `player attack 2.mp3` (Alternate attack)
- `attack no damage.mp3` (Blocked attack)
- `creature death.mp3` (Enemy defeated)

## 🛠 How to Run

1. Clone or download this repository.
2. Open `html container.html` in your browser.
3. Ensure `game.js` is in the `/1.0/` directory and all sound assets are in `/Sound/`.
4. Play using arrow keys or WASD.
