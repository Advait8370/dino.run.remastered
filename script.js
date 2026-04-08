const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 800, H = 200;
canvas.width = W; canvas.height = H;

// Game State
let state = 'menu'; // menu, playing, gameOver
let mode = 'single'; // single, localMP
let score = 0, hiScore = 0, speed = 5, frame = 0;
let obstacles = [], clouds = [], groundPebbles = [];
let soundEnabled = true, fxEnabled = true;

const dino1 = { x: 50, y: 155, w: 40, h: 50, vy: 0, onGround: true, color: '#535353', dead: false, key: 'ArrowUp' };
const dino2 = { x: 100, y: 155, w: 40, h: 50, vy: 0, onGround: true, color: '#e05c2a', dead: false, key: 'KeyW' };

/* --- Menu Controls --- */
function showScreen(screen) {
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    if(screen === 'main') document.getElementById('menu-overlay').classList.remove('hidden');
    if(screen === 'multiplayer') document.getElementById('multiplayer-menu').classList.remove('hidden');
    if(screen === 'settings') document.getElementById('settings-menu').classList.remove('hidden');
    if(screen === 'updates') document.getElementById('updates-menu').classList.remove('hidden');
    if(screen === 'singleplayer') startGame('single');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('toggle-sound').innerText = soundEnabled ? 'ON' : 'OFF';
}

function toggleFX() {
    fxEnabled = !fxEnabled;
    document.getElementById('toggle-fx').innerText = fxEnabled ? 'ON' : 'OFF';
}

/* --- Core Game Logic --- */
function startGame(m) {
    state = 'playing';
    mode = m;
    score = 0;
    speed = 5;
    obstacles = [];
    dino1.dead = false; dino1.y = 155;
    dino2.dead = false; dino2.y = 155;
    
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    document.getElementById('score-board').classList.remove('hidden');
}

function returnToMenu() {
    state = 'menu';
    showScreen('main');
    document.getElementById('score-board').classList.add('hidden');
}

function restartCurrentMode() {
    startGame(mode);
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (state === 'playing') {
        if (e.code === dino1.key && dino1.onGround) { dino1.vy = -12; dino1.onGround = false; }
        if (mode === 'localMP' && e.code === dino2.key && dino2.onGround) { dino2.vy = -12; dino2.onGround = false; }
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Physics & Update
function update() {
    if (state !== 'playing') return;

    frame++;
    score += 0.1;
    speed = Math.min(15, 5 + (score / 200));

    updateDino(dino1);
    if (mode === 'localMP') updateDino(dino2);

    // Obstacles
    if (frame % 100 === 0) {
        obstacles.push({ x: W, y: 155, w: 20, h: 40 });
    }

    obstacles.forEach(o => {
        o.x -= speed;
        if (checkCollision(dino1, o)) { dino1.dead = true; endGame(); }
        if (mode === 'localMP' && checkCollision(dino2, o)) { dino2.dead = true; endGame(); }
    });

    document.getElementById('score-val').innerText = Math.floor(score).toString().padStart(5, '0');
}

function updateDino(d) {
    if (!d.onGround) {
        d.vy += 0.6;
        d.y += d.vy;
        if (d.y >= 155) { d.y = 155; d.onGround = true; }
    }
}

function checkCollision(d, o) {
    return d.x < o.x + o.w && d.x + d.w > o.x && d.y < o.y + o.h && d.y + d.h > o.y;
}

function endGame() {
    state = 'gameOver';
    document.getElementById('game-over').classList.remove('hidden');
    if (mode === 'localMP') {
        document.getElementById('winner-msg').innerText = dino1.dead ? "PLAYER 2 WINS!" : "PLAYER 1 WINS!";
    } else {
        document.getElementById('winner-msg').innerText = "GAME OVER";
    }
}

function startLocalMP() { startGame('localMP'); }

// Simple Render Loop
function draw() {
    ctx.clearRect(0, 0, W, H);
    
    // Ground line
    ctx.strokeStyle = '#535353';
    ctx.beginPath(); ctx.moveTo(0, 195); ctx.lineTo(W, 195); ctx.stroke();

    // Dinos
    ctx.fillStyle = dino1.color;
    ctx.fillRect(dino1.x, dino1.y, dino1.w, dino1.h);
    
    if (mode === 'localMP') {
        ctx.fillStyle = dino2.color;
        ctx.fillRect(dino2.x, dino2.y, dino2.w, dino2.h);
    }

    // Obstacles
    ctx.fillStyle = '#b00';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    update();
    requestAnimationFrame(draw);
}

draw();
