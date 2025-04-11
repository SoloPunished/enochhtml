// game.js (with art assets, stroked stat text, persistent upgrade menu placeholder)

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
let persistentStats = { hp: 0, atk: 0 };

function drawStrokedText(text, x, y, fill, stroke = "black") {
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

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
    maxHp: 10 + persistentStats.hp,
    hp: 10 + persistentStats.hp,
    atk: 3 + persistentStats.atk,
    lvl: 1
  };
  maxPlayerLevel = 1;
  resetPlayerPosition();
  spawnEnemies();
  updateCounters();
  draw();
  if (gameLevel % 2 === 1) showUpgradeMenu();
}

function resetGame() {
  if (player.lvl > maxPlayerLevel) {
    maxPlayerLevel = player.lvl;
  }
  deaths++;
  updateCounters();
  initGame();
  showLevelTextMsg("GAME OVER");
  setTimeout(() => showLevelTextMsg("LEVEL 1"), 2000);
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
    <img src="https://raw.githubusercontent.com/SoloPunished/enochhtml/main/health%20point%20up.png" style="width:80px;cursor:pointer;margin:10px" id="hpUp"/>
    <img src="https://raw.githubusercontent.com/SoloPunished/enochhtml/main/attack%20point%20up.png" style="width:80px;cursor:pointer;margin:10px" id="atkUp"/>
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
  ctx.font = "16px Arial";
  drawStrokedText(`${player.hp}/${player.maxHp}`, player.x * tileSize + 5, player.y * tileSize + 20, "blue");
  drawStrokedText(player.atk, player.x * tileSize + 5, player.y * tileSize + tileSize - 5, "red");

  enemies.forEach(e => {
    if (enemyImage.complete) {
      ctx.drawImage(enemyImage, e.x * tileSize, e.y * tileSize, tileSize, tileSize);
    }
    drawStrokedText(e.hp, e.x * tileSize + 5, e.y * tileSize + 20, "yellow");
    drawStrokedText(e.atk, e.x * tileSize + 5, e.y * tileSize + tileSize - 5, "orange");
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
    drawStrokedText(showStatText, player.x * tileSize + 25, player.y * tileSize + tileSize - 35, "black");
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
        if (gameLevel % 2 === 1) showUpgradeMenu();
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
