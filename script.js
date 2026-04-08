const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Internal resolution stays 800x200 for physics consistency
const W = 800, H = 200;
canvas.width = W; canvas.height = H;

// Socket connection to your Render server
const socket = io("https://dino-run-remastered-server.onrender.com");

const state = {
    mode: 'menu',
    score: 0,
    hiScore: 0,
    speed: 6,
    frame: 0,
    entities: []
};

const SPRITES = {
    dino: [[0,0,0,1,1,1,1,0],[0,0,0,1,1,0,1,1],[0,0,0,1,1,1,1,1],[1,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,0],[0,0,1,0,0,1,0,0]],
    cactus: [[0,1,1,0],[1,1,1,1],[0,1,1,0],[0,1,1,0]]
};

class Entity {
    constructor(x, y, w, h, type, color) {
        Object.assign(this, {x, y, w, h, type, color, vy: 0, ground: true, duck: false});
    }
    draw() {
        ctx.fillStyle = this.color;
        const map = SPRITES[this.type] || [[1]];
        const pSize = this.w / map[0].length;
        map.forEach((row, rIdx) => {
            row.forEach((pixel, cIdx) => {
                if (pixel) ctx.fillRect(this.x + (cIdx * pSize), this.y + (rIdx * pSize), pSize, pSize);
            });
        });
    }
}

let player1, player2;
const online = {
    roomId: null,
    remotePlayers: {},
    create: () => {
        const max = document.getElementById('max-p').value;
        socket.emit('create-room', { max: parseInt(max) });
    },
    join: () => {
        const id = document.getElementById('room-input').value;
        if(id) socket.emit('join-room', id);
    }
};

// Multiplayer Sync
socket.on('joined', (data) => {
    online.roomId = data.roomId;
    game.start('online');
    alert("ROOM ID: " + data.roomId);
});

socket.on('player-moved', (data) => {
    if(!online.remotePlayers[data.id]) {
        online.remotePlayers[data.id] = new Entity(data.x, data.y, 40, 44, 'dino', '#aaaaaa');
    }
    online.remotePlayers[data.id].x = data.x;
    online.remotePlayers[data.id].y = data.y;
    online.remotePlayers[data.id].duck = data.duck;
});

const ui = {
    show: (name) => {
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
        document.getElementById(`menu-${name}`).classList.remove('hidden');
    }
};

const game = {
    start: (mode) => {
        state.mode = mode;
        state.score = 0;
        state.speed = 6;
        state.entities = [];
        player1 = new Entity(50, 150, 40, 44, 'dino', '#535353');
        if (mode === 'local') player2 = new Entity(100, 150, 40, 44, 'dino', '#e05c2a');
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
        document.getElementById('game-stats').classList.remove('hidden');
    },
    restart: () => game.start(state.mode)
};

// Controls
const keys = {};
window.onkeydown = (e) => {
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'ArrowUp') && player1) jump(player1);
    if (e.code === 'KeyW' && player2) jump(player2);
};
window.onkeyup = (e) => keys[e.code] = false;

// Mobile Touch Jump
window.addEventListener('touchstart', (e) => {
    if(state.mode !== 'menu' && state.mode !== 'over') {
        // Prevent jumping if a menu button or input is tapped
        if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
            jump(player1);
        }
    }
}, { passive: false });

function jump(p) { if (p && p.ground) { p.vy = -12; p.ground = false; } }

function update() {
    if (state.mode === 'menu' || state.mode === 'over') return;
    state.frame++;
    state.score += 0.1;
    state.speed = Math.min(14, 6 + (state.score / 500));

    if(player1) {
        player1.duck = keys['ArrowDown'] || keys['KeyS'];
        player1.vy += 0.6;
        player1.y += player1.vy;
        if (player1.y > 150) { player1.y = 150; player1.ground = true; }
        
        if(state.mode === 'online' && online.roomId) {
            socket.emit('sync', { roomId: online.roomId, x: player1.x, y: player1.y, duck: player1.duck });
        }
    }

    if(player2) {
        player2.vy += 0.6;
        player2.y += player2.vy;
        if (player2.y > 150) { player2.y = 150; player2.ground = true; }
    }

    if (state.frame % 80 === 0) {
        state.entities.push(new Entity(W, 160, 25, 35, 'cactus', '#535353'));
    }

    state.entities.forEach(ent => {
        ent.x -= state.speed;
        if (player1 && checkHit(player1, ent)) gameOver(state.mode === 'local' ? "PLAYER 2 WINS!" : "GAME OVER");
    });

    document.getElementById('score-val').innerText = Math.floor(state.score).toString().padStart(5, '0');
}

function checkHit(p, e) {
    return p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y;
}

function gameOver(msg) {
    state.mode = 'over';
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('winner-text').innerText = msg;
}

// Orientation Change Fix
window.addEventListener('resize', () => {
    canvas.width = 800;
    canvas.height = 200;
});

function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, 190, W, 2);
    if (state.mode !== 'menu') {
        update();
        if(player1) player1.draw();
        if(player2) player2.draw();
        Object.values(online.remotePlayers).forEach(p => p.draw());
        state.entities.forEach(e => e.draw());
    }
    requestAnimationFrame(loop);
}
loop();
