// --- DOM Elements ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const finalScoreEl = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");

// --- Game Settings & Variables ---
const gridSize = 20; 
const tileCount = canvas.width / gridSize;
const SNAKE_SPEED = 10; // Number of times the snake moves per second

let snake = [];
let food = {};
let inputDirection = { x: 0, y: 0 };
let lastRenderTime = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreEl.innerText = highScore;

// Game States
let isGameRunning = false;
let isPaused = false;
let isGameOver = false;

// --- Core Game Loop ---
// requestAnimationFrame provides smoother rendering than setInterval
function mainLoop(currentTime) {
  if (isGameOver) {
    showGameOver();
    return; // Stop the loop
  }

  window.requestAnimationFrame(mainLoop);

  if (!isGameRunning || isPaused) return;

  // Calculate time since last frame to control the snake's speed
  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / SNAKE_SPEED) return; // Skip frame if too soon
  
  lastRenderTime = currentTime;

  update();
  draw();
}

// --- Game Logic Updates ---
function update() {
  // Move snake by adding a new head based on direction
  const head = { 
    x: snake[0].x + inputDirection.x, 
    y: snake[0].y + inputDirection.y 
  };

  // 1. Check if snake hit a wall
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    isGameOver = true;
    return;
  }

  // 2. Check if snake bit itself
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      isGameOver = true;
      return;
    }
  }

  // Add the new head to the snake array
  snake.unshift(head);

  // 3. Check if snake ate food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.innerText = score;
    placeFood(); // Spawn new food
    // We intentionally DON'T pop the tail here, so the snake grows
  } else {
    // If no food eaten, remove the tail so the snake stays the same length
    snake.pop(); 
  }
}

// --- Drawing / Rendering ---
function draw() {
  // 1. Clear the canvas (draw background)
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // (Optional) Draw Grid Lines for a retro feel
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for(let i = 0; i < tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height);
    ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  // 2. Draw Food
  ctx.fillStyle = "#e84118"; // Red color from CSS theme
  // Add a slight margin so it looks like a distinct block
  ctx.fillRect(food.x * gridSize + 1, food.y * gridSize + 1, gridSize - 2, gridSize - 2);

  // 3. Draw Snake
  snake.forEach((segment, index) => {
    // Make the head slightly lighter than the body
    ctx.fillStyle = index === 0 ? "#4cd137" : "#44bd32"; 
    ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
  });
}

// --- Helper Functions ---
function placeFood() {
  let newFoodPosition;
  while (newFoodPosition == null || onSnake(newFoodPosition)) {
    newFoodPosition = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  }
  food = newFoodPosition;
}

// Checks if a given position is currently occupied by the snake
function onSnake(position) {
  return snake.some(segment => {
    return segment.x === position.x && segment.y === position.y;
  });
}

function startGame() {
  // Reset Variables
  snake = [
    { x: 10, y: 10 },
    { x: 10, y: 11 }, // Start with a length of 3
    { x: 10, y: 12 }
  ];
  inputDirection = { x: 0, y: -1 }; // Start moving up
  score = 0;
  scoreEl.innerText = score;
  isGameOver = false;
  isGameRunning = true;
  isPaused = false;
  
  // Update UI
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  document.getElementById("pause-btn").innerText = "Pause";

  placeFood();
  window.requestAnimationFrame(mainLoop);
}

function showGameOver() {
  isGameRunning = false;
  finalScoreEl.innerText = score;
  
  // Save High Score to local browser storage
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

// --- Input Handling ---
// We store previous input to prevent the snake from reversing into itself instantly
let lastInputDirection = { x: 0, y: -1 };

function handleInput(direction) {
  if (direction === 'UP' && lastInputDirection.y !== 1) {
    inputDirection = { x: 0, y: -1 };
  } else if (direction === 'DOWN' && lastInputDirection.y !== -1) {
    inputDirection = { x: 0, y: 1 };
  } else if (direction === 'LEFT' && lastInputDirection.x !== 1) {
    inputDirection = { x: -1, y: 0 };
  } else if (direction === 'RIGHT' && lastInputDirection.x !== -1) {
    inputDirection = { x: 1, y: 0 };
  }
  lastInputDirection = inputDirection;
}

// Keyboard Listeners
window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': handleInput('UP'); break;
    case 'ArrowDown': handleInput('DOWN'); break;
    case 'ArrowLeft': handleInput('LEFT'); break;
    case 'ArrowRight': handleInput('RIGHT'); break;
    case ' ': // Spacebar for pause
    case 'Escape': 
      togglePause(); 
      break;
  }
});

// Button Listeners
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("pause-btn").addEventListener("click", togglePause);

// Mobile D-Pad Listeners
document.getElementById("btn-up").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('UP'); });
document.getElementById("btn-down").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('DOWN'); });
document.getElementById("btn-left").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('LEFT'); });
document.getElementById("btn-right").addEventListener("touchstart", (e) => { e.preventDefault(); handleInput('RIGHT'); });
