// game.js (with art assets)

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelText = document.getElementById("levelText");
const deathCounterText = document.getElementById("deathCounter");
const levelCounter = document.getElementById("levelCounter");

const playerImage = new Image();
playerImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/player.png";

const enemyImage = new Image();
enemyImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/enemy.png";

const purpleOrbImage = new Image();
purpleOrbImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/attack%20point%20up.png";

const pinkOrbImage = new Image();
pinkOrbImage.src = "https://raw.githubusercontent.com/SoloPunished/enochhtml/main/health%20point%20up.png";

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
let showStatText = null;

function showLevelTextMsg(text) {
  levelText.innerText = text;
  levelText.style.display = "block";
  setTimeout(() => {
    levelText.style.display = "none";
  }, 2000);
}

function updateCounters() {
  deathCounterText.innerText = `Deaths: ${deaths}`;
  levelCounter.innerText = `Level: ${player.lvl} | Max: ${maxPlayerLevel}`;
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

function spawnEnemies() {
  enemies = [];
  heals = [];
  const enemyCount = Math.floor((gameLevel * 1.5) + 1);
  for (let i = 0; i < enemyCount; i++) {
    const pos = getRandomEmptyTile();
    enemies.push({ 
      x: pos.x, 
      y: pos.y, 
      hp: 3 * (2 ** (gameLevel - 1)), 
      atk: 1 * (2 ** (gameLevel - 1))
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
    maxHp: 10,
    hp: 10,
    atk: 3,
    lvl: 1
  };
  maxPlayerLevel = 1;
  resetPlayerPosition();
  spawnEnemies();
  updateCounters();
  draw();
}

function resetGame() {
  if (player.lvl > maxPlayerLevel) {
    maxPlayerLevel = player.lvl;
  }
  deaths++;
  updateCounters();
  gridSize = 2;
  gameLevel = 1;
  firstMove = true;
  player = {
    x: 0,
    y: 0,
    maxHp: 10,
    hp: 10,
    atk: 3,
    lvl: 1
  };
  resetPlayerPosition();
  spawnEnemies();
  showLevelTextMsg("GAME OVER");
  setTimeout(() => {
    showLevelTextMsg("LEVEL 1");
    updateCounters();
    draw();
  }, 2000);
}

function showStatTextForDuration(text, duration = 1000) {
  showStatText = text;
  setTimeout(() => {
    showStatText = null;
  }, duration);
}

function updateDropFlashes() {
  const now = Date.now();
  dropFlashes = dropFlashes.filter(flash => now - flash.startTime < 1000);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  if (playerImage.complete) {
    ctx.drawImage(playerImage, player.x * tileSize, player.y * tileSize, tileSize, tileSize);
  }
  ctx.fillStyle = "blue";
  ctx.font = "16px Arial";
  ctx.fillText(`${player.hp}/${player.maxHp}`, player.x * tileSize + 5, player.y * tileSize + 20);
  ctx.fillStyle = "red";
  ctx.fillText(player.atk, player.x * tileSize + 5, player.y * tileSize + tileSize - 5);

  enemies.forEach(e => {
    if (enemyImage.complete) {
      ctx.drawImage(enemyImage, e.x * tileSize, e.y * tileSize, tileSize, tileSize);
    }
    ctx.fillStyle = "yellow";
    ctx.fillText(e.hp, e.x * tileSize + 5, e.y * tileSize + 20);
    ctx.fillStyle = "orange";
    ctx.fillText(e.atk, e.x * tileSize + 5, e.y * tileSize + tileSize - 5);
  });

  powerUps.forEach(p => {
    const orbImg = p.type === "purple" ? purpleOrbImage : pinkOrbImage;
    if (orbImg.complete) {
      ctx.drawImage(orbImg, p.x * tileSize + tileSize / 4, p.y * tileSize + tileSize / 4, tileSize / 2, tileSize / 2);
    }
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
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(showStatText, player.x * tileSize + 25, player.y * tileSize + tileSize - 35);
  }
}

function handleMove(dx, dy) {
  if (firstMove) {
    showLevelTextMsg("LEVEL 1");
    firstMove = false;
  }
  const newX = player.x + dx;
  const newY = player.y + dy;
  if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) return;
  const enemy = enemies.find(e => e.x === newX && e.y === newY);
  if (enemy) {
    enemy.hp -= player.atk;
    player.hp -= enemy.atk;
    if (player.hp <= 0) {
      resetGame();
      return;
    }
    if (enemy.hp <= 0) {
      enemies = enemies.filter(e => e !== enemy);
      if (Math.random() < 0.66) {
        const orbType = Math.random() < 0.5 ? "purple" : "pink";
        powerUps.push({ x: enemy.x, y: enemy.y, type: orbType });
        dropFlashes.push({ x: enemy.x, y: enemy.y, startTime: Date.now() });
      }
      let diff = player.maxHp - player.hp;
      let healAmount = Math.round(diff / 4);
      player.hp = Math.min(player.hp + healAmount, player.maxHp);
      if (enemies.length === 0) {
        gameLevel++;
        gridSize++;
        resetPlayerPosition();
        spawnEnemies();
        showLevelTextMsg(`LEVEL ${gameLevel}`);
      }
    }
  } else {
    const orb = powerUps.find(p => p.x === newX && p.y === newY);
    if (orb) {
      if (orb.type === "purple") {
        player.atk += 3;
        showStatTextForDuration("ATK UP!");
      } else if (orb.type === "pink") {
        player.maxHp += 5;
        player.hp = Math.min(player.hp + 5, player.maxHp);
        showStatTextForDuration("HP UP!");
      }
      player.lvl++;
      if (player.lvl > maxPlayerLevel) {
        maxPlayerLevel = player.lvl;
      }
      powerUps = powerUps.filter(p => p !== orb);
      updateCounters();
    }
    player.x = newX;
    player.y = newY;
  }
  updateDropFlashes();
  updateCounters();
  draw();
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
    case "w":
      handleMove(0, -1);
      break;
    case "ArrowDown":
    case "s":
      handleMove(0, 1);
      break;
    case "ArrowLeft":
    case "a":
      handleMove(-1, 0);
      break;
    case "ArrowRight":
    case "d":
      handleMove(1, 0);
      break;
  }
});

function startGame() {
  initGame();
}

startGame();
