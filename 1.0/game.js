// ============================
// ENOCH RPG - Main Game Logic (Complete Version)
// ============================

// === Setup & Element References ===
document.body.style.backgroundColor = "black";
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
const bgMusic = new Audio("../Sound/perkristian-map18.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.25;
window.addEventListener("keydown", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

const sfxAttack = new Audio("../Sound/player attack.mp3");
const sfxAttack2 = new Audio("../Sound/player attack 2.mp3");
const sfxNoDamage = new Audio("../Sound/attack no damage.mp3");
const sfxDeath = new Audio("../Sound/creature death.mp3");

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
  fetch("../log.txt")
    .then(res => res.text())
    .then(text => {
      const lines = text.split(/
?
/);
      lines.forEach(line => {
        const [key, val] = line.split(":");
        if (key && val !== undefined) {
          switch (key.trim()) {
            case "deaths": deaths = parseInt(val); break;
            case "maxLevel": maxPlayerLevel = parseInt(val); break;
            case "hpBonus": persistentStats.hp = parseInt(val); break;
            case "atkBonus": persistentStats.atk = parseInt(val); break;
          }
        }
      });
      logDebug("Save file loaded.");
    })
    .catch(() => {
      logDebug("No save file found. Creating default...");
      saveGame();
    });
}

function saveGame() {
  const saveData = `deaths:${deaths}
maxLevel:${maxPlayerLevel}
hpBonus:${persistentStats.hp}
atkBonus:${persistentStats.atk}`;
  const blob = new Blob([saveData], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "log.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}
let cameraOffset = { x: 0, y: 0 };
let viewTiles;
const tileSize = 100;
viewTiles = Math.floor(canvas.width / tileSize);
let gridSize = 2;
let deaths = 0;
let gameLevel = 1;
let maxPlayerLevel = 1;
let firstMove = true;
let player = {};
let enemies = [];
let heals = [];
let powerUps = [];
let dropFlashes = [];
let bloodSplatters = [];
let showStatText = null;
let persistentStats = { hp: 0, atk: 0 };
let playerSprite = playerImage;
let attackToggle = false;

// === Game Functions ===

function updateBloodSplatters() {
  const now = Date.now();
  bloodSplatters = bloodSplatters.filter(b => now - b.startTime < b.duration);
}

function drawBloodSplatters() {
  const now = Date.now();
  bloodSplatters.forEach(b => {
    const elapsed = now - b.startTime;
    const progress = elapsed / b.duration;
    const maxSize = tileSize;
    const currentSize = maxSize * (1 - progress);
    const centerX = b.x * tileSize + tileSize / 2;
    const centerY = b.y * tileSize + tileSize / 2;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function updateDropFlashes() {
  const now = Date.now();
  dropFlashes = dropFlashes.filter(flash => now - flash.startTime < 1000);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  updateBloodSplatters();
  updateDropFlashes();
  drawBloodSplatters();

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  ctx.drawImage(playerSprite, player.x * tileSize, player.y * tileSize, tileSize, tileSize);
  ctx.font = "16px Arial";
  drawStrokedText(`${player.hp}/${player.maxHp}`, player.x * tileSize + 5, player.y * tileSize + 20, "blue");
  drawStrokedText(player.atk, player.x * tileSize + 5, player.y * tileSize + tileSize - 5, "red");

  enemies.forEach(e => {
    ctx.drawImage(enemyImage, e.x * tileSize, e.y * tileSize, tileSize, tileSize);
    drawStrokedText(e.hp, e.x * tileSize + 5, e.y * tileSize + 20, "yellow");
    drawStrokedText(e.atk, e.x * tileSize + 5, e.y * tileSize + tileSize - 5, "orange");
  });

  powerUps.forEach(p => {
    const orbImg = p.type === "purple" ? purpleOrbImage : pinkOrbImage;
    if (orbImg.complete) ctx.drawImage(orbImg, p.x * tileSize + tileSize / 4, p.y * tileSize + tileSize / 4, tileSize / 2, tileSize / 2);
  });

  const now = Date.now();
  dropFlashes.forEach(flash => {
    const elapsed = now - flash.startTime;
    if (elapsed < 1000) {
      const alpha = 1 - (elapsed / 1000);
      const offsetY = (elapsed / 1000) * 20;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "black";
      ctx.font = "bold 20px Arial";
      ctx.fillText("!!!", flash.x * tileSize + tileSize / 2 - 15, flash.y * tileSize + tileSize / 2 - offsetY);
      ctx.restore();
    }
  });

  if (showStatText) {
    drawStrokedText(showStatText, player.x * tileSize + 25, player.y * tileSize + tileSize - 35, "black");
  }
}

function showUpgradeMenu() {
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
  `;
  document.body.appendChild(menu);
  document.getElementById("hpUp").onclick = () => {
    persistentStats.hp++;
    document.body.removeChild(menu);
  };
  document.getElementById("atkUp").onclick = () => {
    persistentStats.atk++;
    document.body.removeChild(menu);
  };
}


function updateCounters() {
  deathCounterText.innerText = `Deaths: ${deaths}`;
  levelCounter.innerText = `Level: ${player.lvl} | Max: ${maxPlayerLevel} | +HP:${persistentStats.hp} +ATK:${persistentStats.atk}`;
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

  if (isBossLevel) {
    const bossCount = gameLevel >= 80 ? 4 : gameLevel >= 40 ? 2 : 1;
    for (let i = 0; i < bossCount; i++) {
      const bossX = Math.floor(Math.random() * (gridSize - 1));
      const bossY = Math.floor(Math.random() * (gridSize - 1));
      enemies.push({
        isBoss: true,
        x: bossX,
        y: bossY,
        hp: 3 * (2 ** (gameLevel - 1)) * 4,
        atk: 1 * (2 ** (gameLevel - 1)) * 4,
        light: { x: 0, y: 0 },
        dark: { x: 1, y: 1 }
      });
    }
    return;
  }

  const enemyCount = Math.floor((gameLevel * 1.5) + 1);
  for (let i = 0; i < enemyCount; i++) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    if ((x !== player.x || y !== player.y) && !enemies.some(e => e.x === x && e.y === y)) {
      enemies.push({
        x,
        y,
        hp: 3 * (2 ** (gameLevel - 1)),
        atk: 1 * (2 ** (gameLevel - 1)),
        shields: { up: true, down: true, left: true, right: true }
      });
    }
  }
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
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);


function handleMove(dx, dy) {
  logDebug(`Player input: dx=${dx}, dy=${dy}`);
  if (firstMove) {
    firstMove = false;
    showLevelTextMsg("LEVEL 1");
  }
  const newX = player.x + dx;
  const newY = player.y + dy;
  if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) return;

  const enemy = enemies.find(e => {
    if (e.isBoss) return newX >= e.x && newX < e.x + 2 && newY >= e.y && newY < e.y + 2;
    return e.x === newX && e.y === newY;
  });

  if (enemy) {
    playerSprite = playerAttackImage;
    setTimeout(() => { playerSprite = playerImage; draw(); }, 150);

    (attackToggle ? sfxAttack2 : sfxAttack).play();
    attackToggle = !attackToggle;

    const direction = dx === 1 ? 'left' : dx === -1 ? 'right' : dy === 1 ? 'up' : 'down';
    let noDamage = false;

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
        noDamage = true;
        sfxNoDamage.play();
      }
      if (isLight) {
        enemy.hp -= player.atk * 2;
      }
    } else if (enemy.shields[direction]) {
      noDamage = true;
      enemy.shields[direction] = false;
      sfxNoDamage.play();
    } else {
      player.hp -= enemy.atk;
    }

    if (!noDamage) player.hp -= enemy.atk;
    enemy.hp -= player.atk;

    if (player.hp <= 0) {
      deaths++;
      updateCounters();
      playerSprite = playerDeathImage;
      sfxDeath.play();
      draw();
      saveGame();
      setTimeout(() => initGame(), 1000);
      return;
    }

    if (enemy.hp <= 0) {
      sfxDeath.play();
      enemies = enemies.filter(e => e !== enemy);
      if (!enemy.isBoss) {
        if (Math.random() < 0.66) {
          const orbType = Math.random() < 0.5 ? "purple" : "pink";
          powerUps.push({ x: enemy.x, y: enemy.y, type: orbType });
        }
      } else {
        for (let i = 0; i < 4; i++) {
          const offsetX = i % 2;
          const offsetY = Math.floor(i / 2);
          if (Math.random() < 0.66) {
            const orbType = Math.random() < 0.5 ? "purple" : "pink";
            powerUps.push({ x: enemy.x + offsetX, y: enemy.y + offsetY, type: orbType });
          }
        }
      }

      const diff = player.maxHp - player.hp;
      const healAmount = Math.round(diff / 4);
      player.hp = Math.min(player.hp + healAmount, player.maxHp);

      if (enemies.length === 0) {
        showLevelTextMsg(`LEVEL ${gameLevel + 1}`);
        setTimeout(() => {
          gameLevel++;
          gridSize++;
          resetPlayerPosition();
          spawnEnemies();
          if (gameLevel % 2 === 1) showUpgradeMenu();
          draw();
        }, 2000);
        return;
      }
    }
  } else {
    const orb = powerUps.find(p => p.x === newX && p.y === newY);
    if (orb) {
      if (orb.type === "purple") {
        player.atk += 3;
        showStatText = "ATK UP!";
      } else {
        player.maxHp += 5;
        player.hp = Math.min(player.hp + 5, player.maxHp);
        showStatText = "HP UP!";
      }
      player.lvl++;
      if (player.lvl > maxPlayerLevel) maxPlayerLevel = player.lvl;
      powerUps = powerUps.filter(p => p !== orb);
      updateCounters();
    }

    player.x = newX;
    player.y = newY;
  }
  updateCounters();
      playerSprite = playerDeathImage;
      draw();
      setTimeout(() => initGame(), 1000);
      return;
    }
    if (enemy.hp <= 0) {
      sfxDeath.play();
      enemies = enemies.filter(e => e !== enemy);
    }
  } else {
    player.x = newX;
    player.y = newY;
  }
  updateCounters();
  draw();
}

document.addEventListener("keydown", (e) => {
  logDebug(`Key pressed: ${e.key}`);
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

window.onload = () => {
  try {
    startGame();
  } catch (e) {
    logDebug("[ERROR] Failed to start game: " + e.message);
    console.error(e);
  }
};
