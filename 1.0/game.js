// ============================
// ENOCH RPG - Main Game Logic
// ============================

// === Setup & Image Loading ===
const bgMusic = new Audio("https://raw.githubusercontent.com/SoloPunished/enochhtml/main/Sound/perkristian-map18.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.25;
window.addEventListener("keydown", () => {
  if (bgMusic.paused) bgMusic.play();
}, { once: true });

const sfxAttack = new Audio("https://raw.githubusercontent.com/SoloPunished/enochhtml/main/Sound/player%20attack.mp3");
const sfxAttack2 = new Audio("https://raw.githubusercontent.com/SoloPunished/enochhtml/main/Sound/player%20attack%202.mp3");
const sfxNoDamage = new Audio("https://raw.githubusercontent.com/SoloPunished/enochhtml/main/Sound/attack%20no%20damage.mp3");
const sfxDeath = new Audio("https://raw.githubusercontent.com/SoloPunished/enochhtml/main/Sound/creature%20death.mp3");

let attackToggle = false;
const bgMusic = new Audio("https://raw.githubusercontent.com/SoloPunished/enochhtml/main/Sound/perkristian-map18.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.25;
window.addEventListener("load", () => bgMusic.play());
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelText = document.getElementById("levelText");
const deathCounterText = document.getElementById("deathCounter");
const levelCounter = document.getElementById("levelCounter");

const playerImage = new Image();
playerImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/player.png";
const playerAttackImage = new Image();
playerAttackImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/player%20attack.png";
const playerDeathImage = new Image();
playerDeathImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/player%20death.png";

const enemyImage = new Image();
enemyImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/enemy.png";

const purpleOrbImage = new Image();
purpleOrbImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/attack%20point%20up.png";
const pinkOrbImage = new Image();
pinkOrbImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/health%20point%20up.png";

// === Game State Variables ===
let cameraOffset = { x: 0, y: 0 };
const viewTiles = Math.floor(canvas.width / tileSize);
const bossImage = new Image();
bossImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/boss.png";
let deaths = 0;
let maxPlayerLevel = 1;
let gridSize = 2;
const tileSize = 100;
let gameLevel = 1;
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

// === Utilities ===
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
function drawStrokedText(text, x, y, fill, stroke = "black") {
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function showLevelTextMsg(text) {
  levelText.innerText = text;
  levelText.style.display = "block";
  setTimeout(() => { levelText.style.display = "none"; }, 2000);
}

function updateCounters() {
  deathCounterText.innerText = `Deaths: ${deaths}`;
  levelCounter.innerText = `Level: ${player.lvl} | Max: ${maxPlayerLevel} | +HP:${persistentStats.hp} +ATK:${persistentStats.atk}`;
}

function getRandomEmptyTile() {
  let x, y;
  do {
    x = Math.floor(Math.random() * gridSize);
    y = Math.floor(Math.random() * gridSize);
  } while (
    (x === player.x && y === player.y) ||
    enemies.some(e => e.x === x && e.y === y) ||
    heals.some(h => h.x === x && h.y === y) ||
    powerUps.some(p => p.x === x && p.y === y)
  );
  return { x, y };
}

function updateDropFlashes() {
  const now = Date.now();
  dropFlashes = dropFlashes.filter(flash => now - flash.startTime < 1000);
}

function showStatTextForDuration(text, duration = 1000) {
  showStatText = text;
  setTimeout(() => { showStatText = null; }, duration);
}

// === Game Initialization ===
function spawnEnemies() {
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
  heals = [];
  const enemyCount = Math.floor((gameLevel * 1.5) + 1);
  for (let i = 0; i < enemyCount; i++) {
    const pos = getRandomEmptyTile();
    enemies.push({
      x: pos.x,
      y: pos.y,
      hp: 3 * (2 ** (gameLevel - 1)),
      atk: 1 * (2 ** (gameLevel - 1)),
      shields: { up: true, down: true, left: true, right: true }
    });
  }
}

function resetPlayerPosition() {
  const center = Math.floor(gridSize / 2);
  player.x = center;
  player.y = center;
}

function initGame() {
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
  draw();
  if (gameLevel % 2 === 1) showUpgradeMenu();
}

function resetGame() {
  if (player.lvl > maxPlayerLevel) maxPlayerLevel = player.lvl;
  deaths++;
  updateCounters();
  playerSprite = playerDeathImage;
  draw();
  setTimeout(() => {
    initGame();
    showLevelTextMsg("GAME OVER");
    setTimeout(() => showLevelTextMsg("LEVEL 1"), 2000);
  }, 1000);
}

// === Upgrade Menu ===
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

// === Drawing Logic ===
function draw() {
  cameraOffset.x = Math.max(0, Math.min(player.x - Math.floor(viewTiles / 2), gridSize - viewTiles));
  cameraOffset.y = Math.max(0, Math.min(player.y - Math.floor(viewTiles / 2), gridSize - viewTiles));
  drawBloodSplatters();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.strokeRect((x - cameraOffset.x) * tileSize, (y - cameraOffset.y) * tileSize, tileSize, tileSize);
    }
  }

  // Player
  if (playerSprite.complete) ctx.drawImage(playerSprite, (player.x - cameraOffset.x) * tileSize, (player.y - cameraOffset.y) * tileSize, tileSize, tileSize);
  ctx.font = "16px Arial";
  drawStrokedText(`${player.hp}/${player.maxHp}`, (player.x - cameraOffset.x) * tileSize + 5, (player.y - cameraOffset.y) * tileSize + 20, "blue");
  drawStrokedText(player.atk, (player.x - cameraOffset.x) * tileSize + 5, (player.y - cameraOffset.y) * tileSize + tileSize - 5, "red");

  // Enemies
  enemies.forEach(e => {
    if (e.isBoss && bossImage.complete) {
      const bx = e.x * tileSize;
      const by = e.y * tileSize;
      ctx.drawImage(bossImage, bx, by, tileSize * 2, tileSize * 2);

      // Overlay colors
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "fuchsia";
      ctx.fillRect(bx, by, tileSize * 2, tileSize);
      ctx.fillStyle = "lime";
      ctx.fillRect(bx, by + tileSize, tileSize * 2, tileSize);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "black";
      ctx.fillRect(bx + e.dark.x * tileSize, by + e.dark.y * tileSize, tileSize, tileSize);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "white";
      ctx.fillRect(bx + e.light.x * tileSize, by + e.light.y * tileSize, tileSize, tileSize);
      ctx.globalAlpha = 1.0;

      drawStrokedText(e.hp, bx + 5, by + 20, "yellow");
      drawStrokedText(e.atk, bx + 5, by + tileSize * 2 - 10, "orange");
      return;
    }
    if (enemyImage.complete) ctx.drawImage(enemyImage, e.x * tileSize, e.y * tileSize, tileSize, tileSize);
    drawStrokedText(e.hp, e.x * tileSize + 5, e.y * tileSize + 20, "yellow");
    drawStrokedText(e.atk, e.x * tileSize + 5, e.y * tileSize + tileSize - 5, "orange");

    // Directional shield lines
    const bx = e.x * tileSize;
    const by = e.y * tileSize;
    ctx.fillStyle = "rgba(255,0,0,0.6)";
    if (e.shields.up) ctx.fillRect(bx + tileSize * 0.25, by, tileSize * 0.5, 5);
    if (e.shields.down) ctx.fillRect(bx + tileSize * 0.25, by + tileSize - 5, tileSize * 0.5, 5);
    if (e.shields.left) ctx.fillRect(bx, by + tileSize * 0.25, 5, tileSize * 0.5);
    if (e.shields.right) ctx.fillRect(bx + tileSize - 5, by + tileSize * 0.25, 5, tileSize * 0.5);
  });

  // Power-ups
  powerUps.forEach(p => {
    const orbImg = p.type === "purple" ? purpleOrbImage : pinkOrbImage;
    if (orbImg.complete) ctx.drawImage(orbImg, p.x * tileSize + tileSize / 4, p.y * tileSize + tileSize / 4, tileSize / 2, tileSize / 2);
  });

  // Drop flash "!!!"
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

  // Stat text popups
  if (showStatText) {
    drawStrokedText(showStatText, player.x * tileSize + 25, player.y * tileSize + tileSize - 35, "black");
  }
}

// === Input & Combat Logic ===
function handleMove(dx, dy) {
  if (firstMove) {
    showLevelTextMsg("LEVEL 1");
    firstMove = false;
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

    // Alternate attack sounds
    if (attackToggle) {
      sfxAttack2.currentTime = 0;
      sfxAttack2.play();
    } else {
      sfxAttack.currentTime = 0;
      sfxAttack.play();
    }
    attackToggle = !attackToggle;

    let direction = dx === 1 ? 'left' : dx === -1 ? 'right' : dy === 1 ? 'up' : 'down';
    let noDamage = false;

    if (enemy.isBoss) {
      const relX = newX - enemy.x;
      const relY = newY - enemy.y;
      const isLight = (relX === enemy.light.x && relY === enemy.light.y);
      const isDark = (relX === enemy.dark.x && relY === enemy.dark.y);

      // Randomize light/dark after each attack
      enemy.light = { x: Math.floor(Math.random() * 2), y: Math.floor(Math.random() * 2) };
      do {
        enemy.dark = { x: Math.floor(Math.random() * 2), y: Math.floor(Math.random() * 2) };
      } while (enemy.dark.x === enemy.light.x && enemy.dark.y === enemy.light.y);

      if (isDark) {
        noDamage = true;
        sfxNoDamage.currentTime = 0;
        sfxNoDamage.play();
      }
      if (isLight) {
        enemy.hp -= player.atk * 2;
        return;
      }
    } else if (enemy.shields[direction]) {
      
      noDamage = true;
    }
      enemy.shields[direction] = false;
      sfxNoDamage.currentTime = 0;
      sfxNoDamage.play();
    } else {
      player.hp -= enemy.atk;
    }

    if (!noDamage) player.hp -= enemy.atk;
    enemy.hp -= player.atk;

    if (player.hp <= 0) return resetGame();

    if (enemy.hp <= 0) {
      sfxDeath.currentTime = 0;
      sfxDeath.play();
      bloodSplatters.push({ x: enemy.x, y: enemy.y, startTime: Date.now(), duration: 1000 });
      enemies = enemies.filter(e => e !== enemy);
      if (!enemy.isBoss) enemy.shields = { up: false, down: false, left: false, right: false };

      if (!enemy.isBoss && Math.random() < 0.66) {
        const orbType = Math.random() < 0.5 ? "purple" : "pink";
        powerUps.push({ x: enemy.x, y: enemy.y, type: orbType });
        dropFlashes.push({ x: enemy.x, y: enemy.y, startTime: Date.now() });
      }
      if (enemy.isBoss) {
        for (let i = 0; i < 4; i++) {
          const offsetX = i % 2;
          const offsetY = Math.floor(i / 2);
          if (Math.random() < 0.66) {
            const orbType = Math.random() < 0.5 ? "purple" : "pink";
            powerUps.push({ x: enemy.x + offsetX, y: enemy.y + offsetY, type: orbType });
            dropFlashes.push({ x: enemy.x + offsetX, y: enemy.y + offsetY, startTime: Date.now() });
          }
        }
      }
      }

      let diff = player.maxHp - player.hp;
      let healAmount = Math.round(diff / 4);
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
        resetPlayerPosition();
        spawnEnemies();
        showLevelTextMsg(`LEVEL ${gameLevel}`);
        if (gameLevel % 2 === 1) showUpgradeMenu();
      }
    }
  } else {
    const orb = powerUps.find(p => p.x === newX && p.y === newY);
    if (orb) {
      if (orb.type === "purple") {
        player.atk += 3;
        showStatTextForDuration("ATK UP!");
      } else {
        player.maxHp += 5;
        player.hp = Math.min(player.hp + 5, player.maxHp);
        showStatTextForDuration("HP UP!");
      }
      player.lvl++;
      if (player.lvl > maxPlayerLevel) maxPlayerLevel = player.lvl;
      powerUps = powerUps.filter(p => p !== orb);
      updateCounters();
    }
    player.x = newX;
    player.y = newY;
  }

  updateDropFlashes();
  updateBloodSplatters();
  updateCounters();
  draw();
}

// === Controls ===
document.addEventListener("keydown", (e) => {
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

// === Game Start ===
function startGame() {
  initGame();
}

startGame();
