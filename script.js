const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const finalScoreEl = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const gridSize = 20; 
const tileCount = canvas.width / gridSize;
let baseSpeed = 10; // Starting speed

let snake = [];
let food = {};
let bonusFood = null;
let bonusTimeout = null;
let inputDirection = { x: 0, y: 0 };
let lastRenderTime = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreEl.innerText = highScore;

let isGameRunning = false;
let isPaused = false;
let isGameOver = false;

// --- Sound Effects ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(frequency, type, duration) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type; 
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

// --- Main Game Loop ---
function mainLoop(currentTime) {
  if (isGameOver) {
    showGameOver();
    return; 
  }
  window.requestAnimationFrame(mainLoop);
  if (!isGameRunning || isPaused) return;

  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / baseSpeed) return; 
  
  lastRenderTime = currentTime;
  update();
  draw();
}

function update() {
  const head = { x: snake[0].x + inputDirection.x, y: snake[0].y + inputDirection.y };

  // Feature 1: Wall Wrapping (सांप आर-पार जाएगा)
  if (head.x < 0) head.x = tileCount - 1;
  else if (head.x >= tileCount) head.x = 0;
  
  if (head.y < 0) head.y = tileCount - 1;
  else if (head.y >= tileCount) head.y = 0;

  // Self Collision
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      isGameOver = true;
      return;
    }
  }

  snake.unshift(head);

  // Eating Normal Food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.innerText = score;
    playTone(600, 'sine', 0.1);
    placeFood();
    
    // Feature 2: Speed Increase 
    if (baseSpeed < 25) baseSpeed += 0.3;

    // Feature 3: Bonus Food Spawning
    if (!bonusFood && Math.random() < 0.20) {
      spawnBonusFood();
    }
  } else {
    snake.pop(); 
  }

  // Eating Bonus Food
  if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
    score += 50;
    scoreEl.innerText = score;
    playTone(900, 'sine', 0.2); 
    bonusFood = null;
    clearTimeout(bonusTimeout);
    snake.push({ ...snake[snake.length - 1] }); 
  }
}

function draw() {
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Grid Lines (Modern Look)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for(let i = 0; i < tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height);
    ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  // Draw Normal Food
  ctx.fillStyle = "#e84118"; 
  ctx.beginPath();
  ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw Bonus Food (Golden and pulsing effect)
  if (bonusFood) {
    ctx.fillStyle = "#fbc531";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fbc531";
    ctx.fillRect(bonusFood.x * gridSize + 2, bonusFood.y * gridSize + 2, gridSize - 4, gridSize - 4);
    ctx.shadowBlur = 0; // Reset shadow
  }

  // Draw Snake
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#4cd137" : "#44bd32"; 
    ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
  });
}

function placeFood() {
  let validSpot = false;
  while (!validSpot) {
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    validSpot = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
}

function spawnBonusFood() {
  let validSpot = false;
  while (!validSpot) {
    bonusFood = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    validSpot = !snake.some(segment => segment.x === bonusFood.x && segment.y === bonusFood.y) 
                && (food.x !== bonusFood.x || food.y !== bonusFood.y);
  }
  
  bonusTimeout = setTimeout(() => { bonusFood = null; }, 5000);
}

function startGame() {
  snake = [ { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 } ];
  inputDirection = { x: 0, y: -1 }; 
  score = 0;
  baseSpeed = 10;
  scoreEl.innerText = score;
  isGameOver = false;
  isGameRunning = true;
  isPaused = false;
  bonusFood = null;
  clearTimeout(bonusTimeout);
  
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  document.getElementById("pause-btn").innerText = "Pause";

  placeFood();
  window.requestAnimationFrame(mainLoop);
}

function showGameOver() {
  isGameRunning = false;
  finalScoreEl.innerText = score;
  playTone(200, 'sawtooth', 0.5);
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreEl.innerText = highScore;
  }
  gameOverScreen.classList.remove("hidden");
}

function togglePause() {
  if (isGameOver || !isGameRunning) return;
  isPaused = !isPaused;
  document.getElementById("pause-btn").innerText = isPaused ? "Resume" : "Pause";
}

let lastInputDirection = { x: 0, y: -1 };
function handleInput(direction) {
  if (direction === 'UP' && lastInputDirection.y !== 1) inputDirection = { x: 0, y: -1 };
  else if (direction === 'DOWN' && lastInputDirection.y !== -1) inputDirection = { x: 0, y: 1 };
  else if (direction === 'LEFT' && lastInputDirection.x !== 1) inputDirection = { x: -1, y: 0 };
  else if (direction === 'RIGHT' && lastInputDirection.x !== -1) inputDirection = { x: 1, y: 0 };
  lastInputDirection = inputDirection;
}

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': handleInput('UP'); break;
    case 'ArrowDown': handleInput('DOWN'); break;
    case 'ArrowLeft': handleInput('LEFT'); break;
    case 'ArrowRight': handleInput('RIGHT'); break;
    case ' ': case 'Escape': togglePause(); break;
  }
});

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("pause-btn").addEventListener("click", togglePause);
document.getElementById("btn-up").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('UP'); });
document.getElementById("btn-down").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('DOWN'); });
document.getElementById("btn-left").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('LEFT'); });
document.getElementById("btn-right").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('RIGHT'); });
