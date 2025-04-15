// ============================
// ENOCH RPG - Main Game Logic (Complete Version)
// ============================

// === Setup & Element References ===
document.body.style.backgroundColor = "black";
document.body.style.margin = "0";
document.body.style.height = "100vh";
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelText = document.getElementById("levelText");
const deathCounterText = document.getElementById("deathCounter");
const levelCounter = document.getElementById("levelCounter");

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

// === Audio ===
const bgMusic = new Audio("../Sound/perkristian_map18.mp3");
bgMusic.loop = true;
window.addEventListener("keydown", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

const sfxCameraShift = new Audio("../Sound/camera_shift.mp3");
const sfxCollect1 = new Audio("../Sound/collect_orb_1.mp3");
const sfxCollect2 = new Audio("../Sound/collect_orb_2.mp3");
const sfxFullHealRing = new Audio("../Sound/full_heal_ring.mp3");
const sfxHealingArrows = new Audio("../Sound/healing_arrows.mp3");
const sfxUpgradeMenu = new Audio("../Sound/upgrade_menu.mp3");
const sfxPlayerDeath = new Audio("../Sound/player_death.mp3");
const sfxAttack = new Audio("../Sound/player_attack.mp3");
const sfxAttack2 = new Audio("../Sound/player_attack_2.mp3");
const sfxNoDamage = new Audio("../Sound/attack_no_damage.mp3");

[
  bgMusic,
  sfxCameraShift,
  sfxAttack,
  sfxAttack2,
  sfxNoDamage,
  sfxCollect1,
  sfxCollect2,
  sfxPlayerDeath,
  sfxFullHealRing,
  sfxUpgradeMenu,
  sfxHealingArrows,
].forEach(sound => {
  if (sound) {
    sound.volume = 0.25;
    sound.preload = "auto";
  }
});

// === Images ===
const playerImage = new Image();
playerImage.src = "../player.png";
const playerAttackImage = new Image();
playerAttackImage.src = "../player attack.png";
const playerDeathImage = new Image();
playerDeathImage.src = "../player death.png";
const enemyImage = new Image();
enemyImage.src = "../enemy.png";
const purpleOrbImage = new Image();
purpleOrbImage.src = "../attack point up.png";
const pinkOrbImage = new Image();
pinkOrbImage.src = "../health point up.png";
const bossImage = new Image();
bossImage.src = "../boss.png";

// === Game State Variables ===

function loadSaveFile() {
  const data = localStorage.getItem("enochSave");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      deaths = parsed.deaths || 0;
      maxPlayerLevel = parsed.maxLevel || 1;
      persistentStats.hp = parsed.hpBonus || 0;
      persistentStats.atk = parsed.atkBonus || 0;
      logDebug("Save data loaded from localStorage.");
    } catch (e) {
      logDebug("Error reading save data.");
    }
  } else {
    logDebug("No save data found. Starting fresh.");
    saveGame();
  }
}

function saveGame() {
  const saveData = {
    deaths,
    maxLevel: maxPlayerLevel,
    hpBonus: persistentStats.hp,
    atkBonus: persistentStats.atk
  };
  localStorage.setItem("enochSave", JSON.stringify(saveData));
  logDebug("Game saved to localStorage.");
}

let cameraOffset = { x: 0, y: 0 };
let lastCameraTile = { x: 0, y: 0 };
let viewTiles;
const tileSize = 100;
viewTiles = Math.floor(canvas.width / tileSize);
let gridSize = 2;
let deaths = 0;
let trueGameLevel = 1; 
let gameLevel = 1;
let maxPlayerLevel = 1;
let firstMove = true;
let player = {};
let enemies = [];
let heals = [];
let powerUps = [];
let statPops = [];
let dropFlashes = [];
let bloodSplatters = [];
let healingArrows = [];
let healPulses = [];
let healRings = [];
let soundQueue = [];
let showStatText = null;
let persistentStats = { hp: 0, atk: 0 };
let playerSprite = playerImage;
let attackToggle = false;
let isAttacking = false;
let attackStartTime = 0;
let currentHealingSession = null;
let upgradeMenuOpen = false;
let lastCameraSoundTime = 0;

const SOUND_PRIORITY = {
  playerDeath: 100,
  fullHeal: 90,
  healingArrows: 80,
  statPop: 70,
  orbCollect: 60,
  cameraShift: 50,
  upgradeMenu: 40,
  playerAttack: 65 // ✅ ADDED
};

// === Game Functions ===

function playQueuedSounds() {
  if (soundQueue.length === 0) return;

  logDebug(`🎧 Processing ${soundQueue.length} sounds in queue`);

  // Sort by priority (highest first)
  soundQueue.sort((a, b) => b.priority - a.priority);
  const toPlay = [...soundQueue];
  soundQueue = [];

  toPlay.forEach(({ sound, delay, volume, priority }) => {
    logDebug(`▶️ Playing sound | Priority: ${priority}, Delay: ${delay}, Volume: ${volume}`);

    if (delay > 0) {
      setTimeout(() => {
        sound.volume = volume;
        sound.play().catch(err => console.warn("Sound play blocked:", err));
      }, delay);
    } else {
      sound.volume = volume;
      sound.play().catch(err => console.warn("Sound play blocked:", err));
    }
  });
}

function updateBloodSplatters() {
  const now = Date.now();
  bloodSplatters = bloodSplatters.filter(b => now - b.startTime < b.duration);
}

function drawMiniMap() {
  const miniSize = 200;
  const cellSize = miniSize / gridSize;
  const offsetX = canvas.width - miniSize - 20;
  const offsetY = 20;

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#000";
  ctx.fillRect(offsetX - 5, offsetY - 5, miniSize + 10, miniSize + 10);
  ctx.globalAlpha = 1.0;

  // Grid lines
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.strokeStyle = "white";
      ctx.strokeRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
    }
  }

  // Enemies
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.fillRect(offsetX + e.x * cellSize, offsetY + e.y * cellSize, cellSize, cellSize);
  });

  // Power-ups
  powerUps.forEach(p => {
    ctx.fillStyle = p.type === "purple" ? "purple" : "pink";
    ctx.fillRect(offsetX + p.x * cellSize, offsetY + p.y * cellSize, cellSize, cellSize);
  });

  // Player
  ctx.fillStyle = "lime";
  ctx.fillRect(offsetX + player.x * cellSize, offsetY + player.y * cellSize, cellSize, cellSize);

  ctx.restore();
}

function drawBloodSplatters() {
  const now = Date.now();
  bloodSplatters.forEach(b => {
    const elapsed = now - b.startTime;
    const progress = elapsed / b.duration;
    const maxSize = tileSize;
    const currentSize = maxSize * (1 - progress);
    const centerX = b.x * tileSize + tileSize / 2 - cameraOffset.x;
    const centerY = b.y * tileSize + tileSize / 2 - cameraOffset.y;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawHealRings() {
  const now = Date.now();
  healRings = healRings.filter(r => now - r.startTime < 700);
  healRings.forEach(r => {
    const progress = (now - r.startTime) / 700;
    const radius = tileSize * progress * 1.5;
    const alpha = 1 - progress;

    const centerX = r.x * tileSize + tileSize / 2 - cameraOffset.x;
    const centerY = r.y * tileSize + tileSize / 2 - cameraOffset.y;

    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawHealingArrows() {
  const now = Date.now();
  healingArrows = healingArrows.filter(a => now - a.time < 1000);

  healingArrows.forEach((arrow) => {
    const elapsed = now - arrow.time;
    const progress = elapsed / 1000;
    const alpha = 1 - progress;
    const scale = progress > 0.9 ? 1.5 : 1; // enlarge before fading
    const offsetY = arrow.startOffsetY + progress * 40; // Stagger + float

    const x = arrow.x * tileSize + tileSize / 2 - cameraOffset.x;
    const y = arrow.y * tileSize + tileSize - offsetY - cameraOffset.y;

    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = "rgba(0,255,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5 * scale, y + 10 * scale);
    ctx.lineTo(x + 5 * scale, y + 10 * scale);

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function updateDropFlashes() {
  const now = Date.now();
  dropFlashes = dropFlashes.filter(flash => now - flash.startTime < 1000);
}

function queueSound(audioObj, priority, delay = 0, volume = 0.25) {
  const sound = new Audio(audioObj.src);
  sound.volume = volume;
  sound.preload = "auto";

  soundQueue.push({
    sound,
    priority,
    delay,
    volume
  });

  logDebug(`🔈 Queued sound with priority ${priority}`);
}

function updateCamera() {
  const newOffsetX = player.x * tileSize - canvas.width / 2 + tileSize / 2;
  const newOffsetY = player.y * tileSize - canvas.height / 2 + tileSize / 2;

  const tileX = Math.floor(newOffsetX / tileSize);
  const tileY = Math.floor(newOffsetY / tileSize);

  const canvasTilesX = Math.floor(canvas.width / tileSize);
  const canvasTilesY = Math.floor(canvas.height / tileSize);

  const gridLargerThanCanvas = gridSize > canvasTilesX || gridSize > canvasTilesY;

  if (gridLargerThanCanvas && (tileX !== lastCameraTile.x || tileY !== lastCameraTile.y)) {
    const now = Date.now();
    if (now - lastCameraSoundTime >= 5000) { // 5 second cooldown
      queueSound(sfxCameraShift.src, SOUND_PRIORITY.cameraShift);
      lastCameraSoundTime = now;
    }

    lastCameraTile = { x: tileX, y: tileY };
  }

  cameraOffset.x = newOffsetX;
  cameraOffset.y = newOffsetY;
}

function draw() {
  updateCamera();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  updateDropFlashes();
  drawBloodSplatters();
  drawHealRings();
  drawHealingArrows();
  drawHealPulses();
  drawStatPops();

  const startX = Math.floor(cameraOffset.x / tileSize);
  const startY = Math.floor(cameraOffset.y / tileSize);
  const endX = Math.ceil((cameraOffset.x + canvas.width) / tileSize);
  const endY = Math.ceil((cameraOffset.y + canvas.height) / tileSize);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x * tileSize - cameraOffset.x, y * tileSize - cameraOffset.y, tileSize, tileSize);
      }
    }
  }

  // === Draw Enemies ===
  enemies.forEach(e => {
    if (e.x >= startX && e.x < endX && e.y >= startY && e.y < endY) {
      const ex = e.x * tileSize - cameraOffset.x;
      const ey = e.y * tileSize - cameraOffset.y;
      ctx.drawImage(enemyImage, ex, ey, tileSize, tileSize);
      drawStrokedText(e.hp, ex + 5, ey + 20, "yellow");
      drawStrokedText(e.atk, ex + 5, ey + tileSize - 5, "orange");

      ctx.fillStyle = "rgba(255,0,0,0.6)";
      if (e.shields?.up)    ctx.fillRect(ex + tileSize * 0.25, ey, tileSize * 0.5, 5);
      if (e.shields?.down)  ctx.fillRect(ex + tileSize * 0.25, ey + tileSize - 5, tileSize * 0.5, 5);
      if (e.shields?.left)  ctx.fillRect(ex, ey + tileSize * 0.25, 5, tileSize * 0.5);
      if (e.shields?.right) ctx.fillRect(ex + tileSize - 5, ey + tileSize * 0.25, 5, tileSize * 0.5);
    }
  });

  // === Draw PowerUps ===
  powerUps.forEach(p => {
    if (p.x >= startX && p.x < endX && p.y >= startY && p.y < endY) {
      const orbImg = p.type === "purple" ? purpleOrbImage : pinkOrbImage;
      if (orbImg.complete) {
        const px = p.x * tileSize - cameraOffset.x;
        const py = p.y * tileSize - cameraOffset.y;
        ctx.drawImage(orbImg, px + tileSize / 4, py + tileSize / 4, tileSize / 2, tileSize / 2);
      }
    }
  });

  // === Draw Player with optional shake ===
  let px = player.x * tileSize - cameraOffset.x;
  let py = player.y * tileSize - cameraOffset.y;

  if (isAttacking) {
    const shakeStrength = 3;
    px += (Math.random() - 0.5) * shakeStrength;
    py += (Math.random() - 0.5) * shakeStrength;
  }

  ctx.drawImage(playerSprite, px, py, tileSize, tileSize);

  // === Player Stats ===
  ctx.font = "16px Arial";
  drawStrokedText(`${player.hp}/${player.maxHp}`, player.x * tileSize - cameraOffset.x + 5, player.y * tileSize - cameraOffset.y + 20, "blue");
  drawStrokedText(player.atk, player.x * tileSize - cameraOffset.x + 5, player.y * tileSize - cameraOffset.y + tileSize - 5, "red");

  if (showStatText) {
    drawStrokedText(showStatText, player.x * tileSize - cameraOffset.x + 25, player.y * tileSize - cameraOffset.y + tileSize - 35, "black");
  }

  // === Drop flashes (!!!) ===
  const now = Date.now();
  dropFlashes.forEach(flash => {
    const elapsed = now - flash.startTime;
    if (elapsed < 1000) {
      const alpha = 1 - (elapsed / 1000);
      const offsetY = (elapsed / 1000) * 20;
      const fx = flash.x * tileSize - cameraOffset.x;
      const fy = flash.y * tileSize - cameraOffset.y;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "black";
      ctx.font = "bold 20px Arial";
      ctx.fillText("!!!", fx + tileSize / 2 - 15, fy + tileSize / 2 - offsetY);
      ctx.restore();
    }
  });

  drawMiniMap(); 
}

function gameLoop() {
  draw();
  playQueuedSounds();
  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  startGame();
  requestAnimationFrame(gameLoop);
};

window.addEventListener("keydown", () => {
  logDebug("🔊 Unlocking all SFX playback due to user input.");
  [
    sfxCameraShift,
    sfxAttack,
    sfxAttack2,
    sfxNoDamage,
    sfxCollect1,
    sfxCollect2,
    sfxPlayerDeath,
    sfxFullHealRing,
    sfxUpgradeMenu,
    sfxHealingArrows
  ].forEach(s => {
    s.play().then(() => s.pause()).catch(() => {});
  });
}, { once: true });

function showUpgradeMenu() {
  upgradeMenuOpen = true;
  const menu = document.createElement("div");
  menu.style.position = "absolute";
  menu.style.top = "50%";
  menu.style.left = "50%";
  menu.style.transform = "translate(-50%, -50%)";
  menu.style.background = "white";
  menu.style.padding = "20px";
  menu.style.border = "2px solid black";
  menu.style.zIndex = 1000;
  menu.innerHTML = `
    <h3>Choose a permanent upgrade</h3>
    <img src="${pinkOrbImage.src}" style="width:80px;cursor:pointer;margin:10px" id="hpUp"/>
    <img src="${purpleOrbImage.src}" style="width:80px;cursor:pointer;margin:10px" id="atkUp"/>
    <button id="fullHeal" style="display:block;margin:20px auto;padding:10px 20px;font-size:16px">FULL HEAL</button>
  `;
  document.body.appendChild(menu);

  queueSound(sfxUpgradeMenu, SOUND_PRIORITY.upgradeMenu);

  const playClickSound = () => {
    const orbSound = Math.random() < 0.5 ? sfxCollect1 : sfxCollect2;
    queueSound(orbSound, SOUND_PRIORITY.orbCollect);
  };

  const closeMenu = () => {
    upgradeMenuOpen = false; // ✅ Unlock movement
    document.body.removeChild(menu);
  };

  document.getElementById("hpUp").onclick = () => {
    playClickSound();
    persistentStats.hp++;
    player.maxHp += 1;
    player.hp += 1;
    updateCounters();
    triggerHealingAnimation(1);
    closeMenu();
  };

  document.getElementById("atkUp").onclick = () => {
    playClickSound();
    persistentStats.atk++;
    player.atk += 1;
    updateCounters();
    closeMenu();
  };

  document.getElementById("fullHeal").onclick = () => {
    playClickSound();
    player.hp = player.maxHp;
    triggerHealingAnimation();
    updateCounters();
    closeMenu();
  };
}

function drawStatPops() {
  const now = Date.now();
  statPops = statPops.filter(p => now - p.time < 1000);

  statPops.forEach(p => {
    const progress = (now - p.time) / 1000;
    const alpha = 1 - progress;
    const floatX = p.dx * progress * 40;
    const floatY = p.dy * progress * 40;

    const px = p.x * tileSize + tileSize / 2 + floatX - cameraOffset.x;
    const py = p.y * tileSize + tileSize / 2 + floatY - cameraOffset.y;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeText(p.text, px, py);
    ctx.fillText(p.text, px, py);
    ctx.restore();
  });
}

function drawHealPulses() {
  const now = Date.now();
  healPulses = healPulses.filter(p => now - p.time < 800);
  healPulses.forEach(p => {
    const progress = (now - p.time) / 800;
    const alpha = 1 - progress;
    const floatY = 20 * progress;
    const px = p.x * tileSize + tileSize / 2 - cameraOffset.x;
    const py = p.y * tileSize - floatY - cameraOffset.y;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "lime";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.value, px, py);
    ctx.restore();
  });
}

function updateCounters() {
  deathCounterText.innerText = `Deaths: ${deaths}`;
  deathCounterText.style.color = "white";
  levelCounter.innerText = `Level: ${trueGameLevel} | Max Player: ${maxPlayerLevel} | +HP:${persistentStats.hp} +ATK:${persistentStats.atk}`;
  levelCounter.style.color = "white";
}

function resetPlayerPosition() {
  const center = Math.floor(gridSize / 2);
  player.x = center;
  player.y = center;
}

function spawnEnemies() {
  logDebug(`Spawning enemies for level ${gameLevel}`);
  enemies = [];
  heals = [];

  const isBossLevel = [20, 40, 60, 80, 100].includes(gameLevel);
  const dropChance = 0.66;

  if (isBossLevel) {
    const bossCount = gameLevel >= 80 ? 4 : gameLevel >= 40 ? 2 : 1;
    for (let i = 0; i < bossCount; i++) {
      const bossX = Math.floor(Math.random() * (gridSize - 1));
      const bossY = Math.floor(Math.random() * (gridSize - 1));
      enemies.push({
        isBoss: true,
        x: bossX,
        y: bossY,
        hp: getEnemyHP(gameLevel) * 4,
        atk: getEnemyATK(gameLevel) * 4,
        light: { x: 0, y: 0 },
        dark: { x: 1, y: 1 }
      });
    }
    return;
  }

  const enemyCount = Math.floor(gameLevel * 1.5 + 1);
  for (let i = 0; i < enemyCount; i++) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    if ((x !== player.x || y !== player.y) && !enemies.some(e => e.x === x && e.y === y)) {
      enemies.push({
        x,
        y,
        hp: getEnemyHP(gameLevel),
        atk: getEnemyATK(gameLevel),
        shields: { up: true, down: true, left: true, right: true }
      });
    }
  }
}

function getEnemyHP(level) {
  if (level <= 10) return 3 + level * 3;
  if (level <= 20) return 3 + 10 * 3 + (level - 10) * 6;
  return Math.ceil(3 + 10 * 3 + 10 * 6 + 0.15 * Math.pow(level, 2));
}

function getEnemyATK(level) {
  return Math.ceil(Math.max(1, level * 0.75));
}

  function initGame() {
    logDebug("Initializing game state");
    gridSize = 2;
    gameLevel = 1;
    firstMove = true;
    player = {
      x: 0,
      y: 0,
      maxHp: 10 + persistentStats.hp,
      hp: 10 + persistentStats.hp,
      atk: 3 + persistentStats.atk,
      lvl: 1
    };
    maxPlayerLevel = 1;
    playerSprite = playerImage;
    resetPlayerPosition();
    spawnEnemies();
    updateCounters();
    saveGame();
    draw();
  }

  function drawStrokedText(text, x, y, fill, stroke = "black") {
    ctx.font = "18px Arial";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function triggerHealingAnimation(healAmount = 0) {
    const now = Date.now();
    currentHealingSession = now;
    healingArrows = [];
    queueSound(sfxHealingArrows, SOUND_PRIORITY.healingArrows);

    const totalArrows = 8;
    for (let i = 0; i < totalArrows; i++) {
      setTimeout(() => {
        if (currentHealingSession !== now) return;
        healingArrows.push({
          x: player.x,
          y: player.y,
          startOffsetY: i * (tileSize / totalArrows),
          time: Date.now()
        });
      }, i * 80);
    }

    healPulses.push({
      x: player.x,
      y: player.y,
      value: `+${healAmount}`,
      time: Date.now()
    });
  }

  function handleMove(dx, dy) {
    logDebug(`Player input: dx=${dx}, dy=${dy}`);

    // === First Move Setup ===
    if (firstMove) {
      firstMove = false;
      showLevelTextMsg("LEVEL 1");
      bgMusic.loop = true;
      bgMusic.volume = 0.4;
      bgMusic.play().catch(err => console.warn("Music play blocked:", err));
    }

    currentHealingSession = null;
    healingArrows = [];

    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) return;

    // === Enemy Detection ===
    let enemy = enemies.find(e => {
      if (e.isBoss) return newX >= e.x && newX < e.x + 2 && newY >= e.y && newY < e.y + 2;
      return e.x === newX && e.y === newY;
    });

    if (enemy && enemy.hp <= 0) enemy = null;

    if (enemy) {
      // === Attack Animation ===
      playerSprite = playerAttackImage;
      isAttacking = true;
      setTimeout(() => {
        isAttacking = false;
        playerSprite = playerImage;
        draw(); // if needed to refresh frame
    }, 2500); // 2.5 seconds


      const direction = dx === 1 ? 'left' : dx === -1 ? 'right' : dy === 1 ? 'up' : 'down';
      let noDamage = false;

      // === Boss Shield Logic ===
      if (enemy.isBoss) {
        const relX = newX - enemy.x;
        const relY = newY - enemy.y;
        const isLight = (relX === enemy.light.x && relY === enemy.light.y);
        const isDark = (relX === enemy.dark.x && relY === enemy.dark.y);

        enemy.light = { x: Math.floor(Math.random() * 2), y: Math.floor(Math.random() * 2) };
        do {
          enemy.dark = { x: Math.floor(Math.random() * 2), y: Math.floor(Math.random() * 2) };
        } while (enemy.dark.x === enemy.light.x && enemy.dark.y === enemy.light.y);

        if (isDark) {
          queueSound(sfxNoDamage, SOUND_PRIORITY.playerAttack);
          return; // Player takes no damage and enemy takes no damage
        }
        if (isLight) {
          enemy.hp -= player.atk * 2;
        }
      }

      // === Normal Enemy Shield Check ===
      else if (enemy.shields[direction]) {
        enemy.shields[direction] = false;
        queueSound(sfxNoDamage, SOUND_PRIORITY.playerAttack);
        enemy.hp -= player.atk;
        if (enemy.hp <= 0) {
          handleEnemyDefeat(enemy);
        }
        return;
      }

      // === Damage Exchange ===
      enemy.hp -= player.atk;
      player.hp -= enemy.atk;

      // === Player Death Check ===
      if (player.hp <= 0) {
        deaths++;
        updateCounters();
        playerSprite = playerDeathImage;
        queueSound(sfxPlayerDeath, SOUND_PRIORITY.playerDeath);
        draw();
        saveGame();
        setTimeout(() => initGame(), 1000);
        return;
      }

      // === Enemy Death Check ===
      if (enemy.hp <= 0) {
        handleEnemyDefeat(enemy);
      }

    } else {
      // === Power-Up Pickup ===
      const orb = powerUps.find(p => p.x === newX && p.y === newY);
      if (orb) {
        const orbSound = Math.random() < 0.5 ? sfxCollect1 : sfxCollect2;
        queueSound(orbSound, SOUND_PRIORITY.orbCollect);

        if (orb.type === "purple") {
          player.atk += 3;
          statPops.push({
            x: player.x,
            y: player.y,
            text: "ATK UP!",
            time: Date.now(),
            dx: (Math.random() - 0.5) * 2,
            dy: Math.random() * -1.5 - 1
          });
        } else {
          player.maxHp += 5;
          const healAmount = 5;
          player.hp = Math.min(player.hp + healAmount, player.maxHp);
          triggerHealingAnimation(healAmount);
          statPops.push({
            x: player.x,
            y: player.y,
            text: "HP UP!",
            time: Date.now(),
            dx: (Math.random() - 0.5) * 2,
            dy: Math.random() * -1.5 - 1
          });
        }

        powerUps = powerUps.filter(p => p !== orb);
        player.lvl++;
        if (player.lvl > maxPlayerLevel) maxPlayerLevel = player.lvl;
        updateCounters();
      }

      // === Move Player ===
      player.x = newX;
      player.y = newY;
      updateCounters();
      draw();
    }
  }

  function handleEnemyDefeat(enemy) {
    enemies = enemies.filter(e => e !== enemy);
    const dropChance = 0.66;

    if (enemy.isBoss) {
      for (let i = 0; i < 4; i++) {
        if (Math.random() < dropChance) {
          const offsetX = i % 2;
          const offsetY = Math.floor(i / 2);
          powerUps.push({
            x: enemy.x + offsetX,
            y: enemy.y + offsetY,
            type: Math.random() < 0.5 ? "purple" : "pink"
          });
        }
      }
    } else {
      if (Math.random() < dropChance) {
        powerUps.push({
          x: enemy.x,
          y: enemy.y,
          type: Math.random() < 0.5 ? "purple" : "pink"
        });
      }
    }

    // Healing on kill
    const diff = player.maxHp - player.hp;
    const healAmount = Math.round(diff / 4);
    player.hp = Math.min(player.hp + healAmount, player.maxHp);
    triggerHealingAnimation(healAmount);

    if (player.hp === player.maxHp) {
      queueSound(sfxFullHealRing, SOUND_PRIORITY.fullHeal);
      healRings.push({
        x: player.x,
        y: player.y,
        startTime: Date.now()
      });
    }

    if (enemies.length === 0) {
      showLevelTextMsg(`LEVEL ${trueGameLevel + 1}`);
      setTimeout(() => {
        trueGameLevel++;
        gridSize++;
        resetPlayerPosition();
        spawnEnemies();
        if (trueGameLevel % 2 === 1) showUpgradeMenu();
        draw();
      }, 2000);
    }
  }    

  document.addEventListener("keydown", (e) => {
    if (upgradeMenuOpen) return; // 🔒 Block movement while menu is up
  
    switch (e.key) {
      case "ArrowUp":
      case "w": handleMove(0, -1); break;
      case "ArrowDown":
      case "s": handleMove(0, 1); break;
      case "ArrowLeft":
      case "a": handleMove(-1, 0); break;
      case "ArrowRight":
      case "d": handleMove(1, 0); break;
    }
  });  
  
  function showLevelTextMsg(text) {
    levelText.innerText = text;
    levelText.style.display = "block";
    setTimeout(() => { levelText.style.display = "none"; }, 2000);
  }

  function startGame() {
    loadSaveFile();
    logDebug("Starting game");
    initGame();
  }

  window.addEventListener("keydown", () => {
    logDebug("🔊 Unlocking all SFX playback due to user input.");
    [
      sfxCameraShift,
      sfxAttack,
      sfxAttack2,
      sfxNoDamage,
      sfxCollect1,
      sfxCollect2,
      sfxPlayerDeath,
      sfxFullHealRing,
      sfxUpgradeMenu,
      sfxHealingArrows
    ].forEach(s => {
      s.load();
      s.play().then(() => s.pause()).catch(() => {});
    });
  }, { once: true });
  
  function gameLoop() {
  draw();               // Draw frame
  playQueuedSounds();   // 🔊 Play any queued sounds
  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  try {
    startGame();
    requestAnimationFrame(gameLoop);  // ✅ Starts the game loop
  } catch (e) {
    logDebug("[ERROR] Failed to start game: " + e.message);
    console.error(e);
  }
};
