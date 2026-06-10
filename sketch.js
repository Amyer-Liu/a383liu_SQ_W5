const SPRITE = {
  frameWidth:  94,
  frameHeight: 166,
  numFrames:   4,
  animSpeed:   20,
  scale:       0.40,
  rows: {
    down:  0,
    up:    1,
    right: 2,
    left:  3,
  },
  offsets: {
    down:  { x: 0, y: 0 },
    up:    { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    left:  { x: 0, y: 0 },
  },
};

const COIN = {
  frameWidth:  138,
  frameHeight: 152,
  numFrames:   8,
  animSpeed:   6,
  scale:       0.35,
};

// ------------------------------------------------------------
// MAZE
// ------------------------------------------------------------
const TILE_SIZE = 50;

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 3, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 3, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const TILE_COLORS = {
  0: [40,  40,  50 ],
  1: [80,  60,  100],
  2: [40,  40,  50 ],
  3: [40,  40,  50 ],
  4: [60,  100, 80 ],
};

// ------------------------------------------------------------
// PLAYER
// ------------------------------------------------------------
let player = {
  x: 0,
  y: 0,
  speed: 2,

  currentFrame: 0,
  frameTimer:   0,
  direction:    "down",
  isMoving:     false,

  hw: 12,
  hh: 14,
};

// ------------------------------------------------------------
// STARS (collectibles)
// ------------------------------------------------------------
let coins = [];
let coinsCollected = 0;

// ------------------------------------------------------------
// FLASH EFFECT
// ------------------------------------------------------------
let flashAlpha = 0;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
let gameWon = false;

let characterSheet;
let coinSheet;

// ------------------------------------------------------------
// WIN SCREEN STATE
// ------------------------------------------------------------
let winParticles  = [];
let winFloatStars = [];
let winOrbitAngle = 0;
let winTicker     = 0;

// ============================================================
// preload()
// ============================================================
function preload() {
  characterSheet = loadImage("assets/images/character.png");
  coinSheet      = loadImage("assets/images/star.png");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(TILE_SIZE * MAZE[0].length, TILE_SIZE * MAZE.length);
  imageMode(CENTER);

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 2) {
        player.x = col * TILE_SIZE + TILE_SIZE / 2;
        player.y = row * TILE_SIZE + TILE_SIZE / 2;
      }

      if (tile === 3) {
        coins.push({
          x:          col * TILE_SIZE + TILE_SIZE / 2,
          y:          row * TILE_SIZE + TILE_SIZE / 2,
          frame:      floor(random(COIN.numFrames)),
          frameTimer: 0,
          collected:  false,
        });
      }
    }
  }
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);

  drawMaze();
  updateCoins();
  drawCoins();
  handleInput();
  resolveWallCollisions();
  checkCoinCollection();
  checkExit();
  animateSprite();
  drawCharacter();
  drawFlash();
  drawHUD();

  if (gameWon) {
    drawWinScreen();
  }
}

// ------------------------------------------------------------
// drawMaze()
// ------------------------------------------------------------
function drawMaze() {
  rectMode(CORNER);
  noStroke();

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 4) {
        if (coinsCollected === coins.length) {
          fill(30, 200, 120);
        } else {
          fill(60, 100, 80);
        }
      } else {
        let c = TILE_COLORS[tile];
        fill(c[0], c[1], c[2]);
      }

      rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

// ------------------------------------------------------------
// updateCoins()
// ------------------------------------------------------------
function updateCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    coins[i].frameTimer++;
    if (coins[i].frameTimer >= COIN.animSpeed) {
      coins[i].frameTimer = 0;
      coins[i].frame = (coins[i].frame + 1) % COIN.numFrames;
    }
  }
}

// ------------------------------------------------------------
// drawCoins()
// ------------------------------------------------------------
function drawCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    let coin = coins[i];
    let sx = coin.frame * COIN.frameWidth;
    let dw = COIN.frameWidth  * COIN.scale;
    let dh = COIN.frameHeight * COIN.scale;

    image(coinSheet, coin.x, coin.y, dw, dh, sx, 0, COIN.frameWidth, COIN.frameHeight);
  }
}

// ------------------------------------------------------------
// handleInput()
// ------------------------------------------------------------
function handleInput() {
  if (gameWon) return;

  player.isMoving = false;

  if (keyIsDown(87)) {
    player.y -= player.speed;
    player.direction = "up";
    player.isMoving = true;
  }
  if (keyIsDown(83)) {
    player.y += player.speed;
    player.direction = "down";
    player.isMoving = true;
  }
  if (keyIsDown(65)) {
    player.x -= player.speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    player.x += player.speed;
    player.direction = "right";
    player.isMoving = true;
  }
}

// ------------------------------------------------------------
// resolveWallCollisions()
// ------------------------------------------------------------
function resolveWallCollisions() {
  let corners = [
    { x: player.x - player.hw, y: player.y - player.hh },
    { x: player.x + player.hw, y: player.y - player.hh },
    { x: player.x - player.hw, y: player.y + player.hh },
    { x: player.x + player.hw, y: player.y + player.hh },
  ];

  for (let i = 0; i < corners.length; i++) {
    let c = corners[i];
    let col = floor(c.x / TILE_SIZE);
    let row = floor(c.y / TILE_SIZE);

    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) continue;

    if (MAZE[row][col] === 1) {
      let tileLeft   = col * TILE_SIZE;
      let tileRight  = tileLeft + TILE_SIZE;
      let tileTop    = row * TILE_SIZE;
      let tileBottom = tileTop + TILE_SIZE;

      let overlapLeft   = (player.x + player.hw) - tileLeft;
      let overlapRight  = tileRight  - (player.x - player.hw);
      let overlapTop    = (player.y + player.hh) - tileTop;
      let overlapBottom = tileBottom - (player.y - player.hh);

      let minOverlap = min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if      (minOverlap === overlapLeft)   player.x -= overlapLeft;
      else if (minOverlap === overlapRight)  player.x += overlapRight;
      else if (minOverlap === overlapTop)    player.y -= overlapTop;
      else if (minOverlap === overlapBottom) player.y += overlapBottom;
    }
  }
}

// ------------------------------------------------------------
// checkCoinCollection()
// ------------------------------------------------------------
function checkCoinCollection() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    let d = dist(player.x, player.y, coins[i].x, coins[i].y);
    if (d < TILE_SIZE * 0.6) {
      coins[i].collected = true;
      coinsCollected++;
      flashAlpha = 180;
    }
  }
}

// ------------------------------------------------------------
// checkExit()
// ------------------------------------------------------------
function checkExit() {
  if (coinsCollected < coins.length) return;

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      if (MAZE[row][col] === 4) {
        let exitX = col * TILE_SIZE + TILE_SIZE / 2;
        let exitY = row * TILE_SIZE + TILE_SIZE / 2;
        if (dist(player.x, player.y, exitX, exitY) < TILE_SIZE * 0.6) {
          gameWon = true;
        }
      }
    }
  }
}

// ------------------------------------------------------------
// animateSprite()
// ------------------------------------------------------------
function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;
    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer   = 0;
  }
}

// ------------------------------------------------------------
// drawCharacter()
// ------------------------------------------------------------
function drawCharacter() {
  let row    = SPRITE.rows[player.direction];
  let offset = SPRITE.offsets[player.direction];

  let sx = (player.currentFrame * SPRITE.frameWidth)  + offset.x;
  let sy = (row                 * SPRITE.frameHeight) + offset.y;

  let dw = SPRITE.frameWidth  * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;

  image(characterSheet, player.x, player.y, dw, dh, sx, sy, SPRITE.frameWidth, SPRITE.frameHeight);
}

// ------------------------------------------------------------
// drawFlash()
// ------------------------------------------------------------
function drawFlash() {
  if (flashAlpha <= 0) return;

  rectMode(CORNER);
  noStroke();
  fill(255, 220, 50, flashAlpha);
  rect(0, 0, width, height);

  flashAlpha -= 12;
  if (flashAlpha < 0) flashAlpha = 0;
}

// ------------------------------------------------------------
// drawHUD()
// ------------------------------------------------------------
function drawHUD() {
  noStroke();
  fill(255);
  textSize(14);
  textAlign(LEFT);
  textFont("monospace");
  text("Stars: " + coinsCollected + " / " + coins.length, 10, 20);

  if (coinsCollected === coins.length) {
    fill(30, 200, 120);
    text("Exit is open! Find the green tile.", 10, 40);
  }
}

// ============================================================
// WIN SCREEN HELPERS
// ============================================================

function spawnWinConfetti() {
  let colors = ['#FFD700','#FF6B6B','#6BFFB8','#6BB5FF','#FF9F6B','#E06BFF'];
  for (let i = 0; i < 120; i++) {
    winParticles.push({
      x:      width / 2,
      y:      height / 2,
      vx:     random(-6, 6),
      vy:     random(-8, 2),
      life:   1,
      decay:  random(0.008, 0.018),
      size:   random(4, 10),
      color:  random(colors),
      isRect: random() > 0.5,
      rot:    random(TWO_PI),
      rvel:   random(-0.15, 0.15),
    });
  }
}

function spawnWinFloatStar() {
  winFloatStars.push({
    x:           random(width),
    y:           height + 20,
    speed:       random(0.5, 2),
    size:        random(6, 16),
    opacity:     random(0.4, 1),
    wobble:      random(TWO_PI),
    wobbleSpeed: random(0.02, 0.05),
  });
}

function drawWinStar(cx, cy, r, col, alpha) {
  push();
  translate(cx, cy);
  fill(col);
  noStroke();
  drawingContext.globalAlpha = alpha;
  beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = (i / 10) * TWO_PI - HALF_PI;
    let rad   = i % 2 === 0 ? r : r * 0.4;
    vertex(cos(angle) * rad, sin(angle) * rad);
  }
  endShape(CLOSE);
  drawingContext.globalAlpha = 1;
  pop();
}

function drawWinTrophy(cx, cy, sc, glowAmt) {
  push();
  translate(cx, cy);
  scale(sc);

  if (glowAmt > 0) {
    drawingContext.shadowColor = '#FFD700';
    drawingContext.shadowBlur  = 20 * glowAmt;
  }

  fill('#FFD700');
  stroke('#CC9900');
  strokeWeight(2);

  // Cup bowl
  arc(0, -30, 56, 56, PI, 0);

  // Cup body
  noStroke();
  beginShape();
  vertex(-22, -4);
  vertex(-22,  10);
  vertex(-10,  18);
  vertex(  0,  20);
  vertex( 10,  18);
  vertex( 22,  10);
  vertex( 22,  -4);
  endShape(CLOSE);

  // Stem and base
  rect(-10, 16, 20,  8);
  rect(-18, 22, 36,  7);

  // Handles
  stroke('#CC9900');
  strokeWeight(3);
  noFill();
  beginShape();
  vertex( 22,   0); vertex( 36,  -2); vertex( 36, -18); vertex( 24, -28);
  endShape();
  beginShape();
  vertex(-22,   0); vertex(-36,  -2); vertex(-36, -18); vertex(-24, -28);
  endShape();

  drawingContext.shadowBlur = 0;
  pop();
}

// ------------------------------------------------------------
// drawWinScreen()
// ------------------------------------------------------------
function drawWinScreen() {
  winTicker++;

  // Semi-transparent dark overlay
  fill(0, 0, 15, 190);
  rectMode(CORNER);
  noStroke();
  rect(0, 0, width, height);

  // Twinkling background star field
  noStroke();
  for (let i = 0; i < 60; i++) {
    randomSeed(i * 137);
    let sx      = random(width);
    let sy      = random(height);
    let twinkle = 0.3 + 0.5 * abs(sin(winTicker * 0.04 + i));
    fill(255, 255, 255, twinkle * 200);
    ellipse(sx, sy, random(1, 3));
  }
  randomSeed(); // restore randomness

  // Spawn & draw rising gold stars
  if (winTicker === 1)         { for (let i = 0; i < 6; i++) spawnWinFloatStar(); }
  if (winTicker % 45 === 0)    { spawnWinFloatStar(); }

  for (let i = winFloatStars.length - 1; i >= 0; i--) {
    let fs = winFloatStars[i];
    fs.y      -= fs.speed;
    fs.wobble += fs.wobbleSpeed;
    drawWinStar(fs.x + sin(fs.wobble) * 20, fs.y, fs.size, '#FFD700', fs.opacity);
    if (fs.y < -20) winFloatStars.splice(i, 1);
  }

  // Confetti burst (initial + repeat every 200 frames)
  if (winTicker === 1 || winTicker % 200 === 0) spawnWinConfetti();

  for (let i = winParticles.length - 1; i >= 0; i--) {
    let p = winParticles[i];
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.15;
    p.vx  *= 0.99;
    p.life -= p.decay;
    p.rot  += p.rvel;
    if (p.life <= 0) { winParticles.splice(i, 1); continue; }

    push();
    translate(p.x, p.y);
    rotate(p.rot);
    fill(p.color);
    noStroke();
    drawingContext.globalAlpha = p.life;
    if (p.isRect) rect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
    else          ellipse(0, 0, p.size);
    drawingContext.globalAlpha = 1;
    pop();
  }

  // Pulsing trophy
  let pulse   = 1 + 0.04 * sin(winTicker * 0.08);
  let glowAmt = 0.5 + 0.5 * sin(winTicker * 0.06);
  drawWinTrophy(width / 2, height / 2 - 55, pulse, glowAmt);

  // Stars orbiting the trophy
  winOrbitAngle += 0.025;
  let orbitColors = ['#FFD700','#FF6B6B','#6BFFB8','#6BB5FF','#FF9F6B'];
  for (let i = 0; i < 5; i++) {
    let a  = winOrbitAngle + (i / 5) * TWO_PI;
    let ox = width  / 2 + cos(a) * 80;
    let oy = height / 2 - 55 + sin(a) * 30;
    drawWinStar(ox, oy, 6, orbitColors[i], 0.9);
  }

  // Title with gold glow
  let bounce = sin(winTicker * 0.06) * 6;
  drawingContext.shadowColor = '#FFD700';
  drawingContext.shadowBlur  = 12 + 8 * glowAmt;
  fill('#FFD700');
  textAlign(CENTER);
  textSize(48);
  textFont('monospace');
  text("You Escaped!", width / 2, height / 2 + 55 + bounce);
  drawingContext.shadowBlur = 0;

  // Subtitle
  let subAlpha = 150 + 80 * sin(winTicker * 0.05);
  fill(107, 255, 184, subAlpha);
  textSize(16);
  text("All stars collected  \u2605  Maze conquered!", width / 2, height / 2 + 88 + bounce);

  // Restart hint (blinking)
  fill(200, 200, 220, 120 + 80 * sin(winTicker * 0.04));
  textSize(13);
  text("press R to play again", width / 2, height / 2 + 118 + bounce);
}

// ============================================================
// keyPressed() — R restarts the game from the win screen
// ============================================================
function keyPressed() {
  if (gameWon && (key === 'r' || key === 'R')) {
    // Reset win screen state
    gameWon       = false;
    winParticles  = [];
    winFloatStars = [];
    winOrbitAngle = 0;
    winTicker     = 0;

    // Reset collectibles
    coinsCollected = 0;
    for (let i = 0; i < coins.length; i++) {
      coins[i].collected = false;
    }

    // Reset flash
    flashAlpha = 0;

    // Return player to start tile
    for (let row = 0; row < MAZE.length; row++) {
      for (let col = 0; col < MAZE[row].length; col++) {
        if (MAZE[row][col] === 2) {
          player.x = col * TILE_SIZE + TILE_SIZE / 2;
          player.y = row * TILE_SIZE + TILE_SIZE / 2;
        }
      }
    }
  }
}