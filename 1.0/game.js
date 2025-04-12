// === Setup & Image Loading ===

// Debug Console
const debugConsole = document.createElement("div");
debugConsole.style.position = "absolute";
debugConsole.style.top = "0";
debugConsole.style.right = "0";
debugConsole.style.width = "360px";
debugConsole.style.height = "100vh";
debugConsole.style.overflowY = "auto";
debugConsole.style.background = "rgba(0,0,0,0.85)";
debugConsole.style.color = "lime";
debugConsole.style.fontSize = "12px";
debugConsole.style.fontFamily = "monospace";
debugConsole.style.padding = "10px";
debugConsole.style.zIndex = 9999;
document.body.appendChild(debugConsole);

function logDebug(msg) {
  const entry = document.createElement("div");
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  debugConsole.appendChild(entry);
  debugConsole.scrollTop = debugConsole.scrollHeight;
}

// Update sound files to reflect the local path
const bgMusic = new Audio("Sound/perkristian-map18.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.25;
window.addEventListener("keydown", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

const sfxAttack = new Audio("Sound/player%20attack.mp3");
const sfxAttack2 = new Audio("Sound/player%20attack%202.mp3");
const sfxNoDamage = new Audio("Sound/attack%20no%20damage.mp3");
const sfxDeath = new Audio("Sound/creature%20death.mp3");

// === Image Files ===
const playerImage = new Image();
playerImage.src = "player.png"; // Assuming player image is in the same folder as game.js

const playerAttackImage = new Image();
playerAttackImage.src = "player%20attack.png"; // Same directory as game.js

const playerDeathImage = new Image();
playerDeathImage.src = "player%20death.png"; // Same directory as game.js

const enemyImage = new Image();
enemyImage.src = "enemy.png"; // Same directory as game.js

const purpleOrbImage = new Image();
purpleOrbImage.src = "attack%20point%20up.png"; // Same directory as game.js

const pinkOrbImage = new Image();
pinkOrbImage.src = "health%20point%20up.png"; // Same directory as game.js

// === Game Logic ===

// Rest of your game logic here...
