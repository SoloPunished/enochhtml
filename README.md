# ENOCH - Grid RPG Game

A browser-based, grid-style RPG built with HTML5 Canvas and JavaScript. The player fights enemies, collects stat-boosting orbs, and progresses through increasingly difficult levels.

## 🎮 Features

- **Turn-based combat** on a growing grid
- **Player stats:** Attack, HP, Level
- **Enemy scaling:** Health and damage increase with level
- **Orb drops:** Random chance on enemy death (66%)
- **Healing system:** Heal based on missing HP after enemy defeat
- **Power-ups:**
  - **Purple orbs:** Increase Attack
  - **Pink orbs:** Increase Max HP
- **Session Timer:** Tracks total time in-game
- **Leveling system:**
  - Grid size increases with levels
  - Player level increases with each orb collected
- **Bosses:** Appear at certain level thresholds, take up 4 squares, feature unique mechanics (weak/strong sides)
- **Enemy AI:** One enemy moves toward the player every second
- **"!!!" Alert:** Marks new orb drops with fading animation
- **Death mechanic:** Resets level and player, tracks max player level achieved

## 🕹️ Controls

- **Move:** Arrow keys or `WASD`
- **Attack:** Move into enemy square
- **Collect Orbs:** Move into orb square

## 🖼️ Sprites & Assets

All character and item graphics can be added via image URLs or local paths. Place your assets in the `/assets` folder (see below) and reference them in the game code like so:

```js
const playerImage = new Image();
playerImage.src = 'assets/player.png';


🚀 Running the Game

Open index.html in any modern browser.

Or host it with GitHub Pages:

Go to Settings > Pages
Choose main branch and / (root) directory
Visit: https://yourusername.github.io/enochhtml/


