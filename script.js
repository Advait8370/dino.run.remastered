/** * script.js - Core Game Engine
 * Handles rendering, physics, and input.
 */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 800, H = 200;
canvas.width = W; canvas.height = H;

// --- ASSET LOADING ---
const assets = {};
const assetNames = [
    'DinoStart', 'DinoRun1', 'DinoRun2', 'DinoJump', 'DinoDead', 
    'DinoDuck1', 'DinoDuck2', 'Bird1', 'Bird2', 'Cloud',
    'Track', 'GameOver', 'SmallCactus1', 'SmallCactus2', 
    'SmallCactus3', 'LargeCactus1', 'LargeCactus2', 'LargeCactus3'
];

assetNames.forEach(name => {
    assets[name] = new Image();
    assets[name].src = `assets/${name}.png`; 
});

let state = {
    mode: 'menu',
    score: 0,
    hiScore: parseInt(localStorage.getItem('dinoHiScore')) || 0,
    speed: 6,
    frame: 0,
    entities: [],
    trackX: 0,
    nickname: 'Dino'
};

class Entity {
    constructor(x, y, w, h, type, subType = null) {
        Object.assign(this, {x, y, w, h, type, subType, vy: 0, ground: true, duck: false});
    }
    draw() {
        let img;
        const animFrame = Math.floor(state.frame / 10) % 2;
        if (this.type === 'dino') {
            if (state.mode === 'over') img = assets['DinoDead'];
            else if (!this.ground) img = assets['DinoJump'];
            else if (this.duck) img = (animFrame === 0) ? assets['DinoDuck1'] : assets['DinoDuck2'];
            else img = (animFrame === 0) ? assets['DinoRun1'] : assets['DinoRun2'];
        } else if (this.type === 'cactus') {
            img = assets[this.subType];
        } else if (this.type === 'bird') {
            img = (animFrame === 0) ? assets['Bird1'] : assets['Bird2'];
        }
        if (img && img.complete) ctx.drawImage(img, this.x, this.y, this.w, this.h);
    }
}

let player1 = null;

const ui = {
    show: (name) => {
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
        document.getElementById(`menu-${name}`).classList.remove('hidden');
        if (name === 'leaderboard') client.getLeaderboard();
    }
};

const game = {
    start: (mode) => {
        state.nickname = document.getElementById('nick-input').value.trim() || "Dino";
        state.mode = mode; state.score = 0; state.speed = 6; state.frame = 0; 
        state.entities = []; state.trackX = 0;
        player1 = new Entity(50, 150, 44, 47, 'dino');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-stats').classList.remove('hidden');
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    },
    restart: () => game.start(state.mode)
};

// Input Handling
window.onkeydown = (e) => { 
    if ((e.code === 'Space' || e.code === 'ArrowUp') && player1?.ground) {
        player1.vy = -12; player1.ground = false;
    }
    if (e.code === 'ArrowDown') player1.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player1.duck = false; };

function update() {
    if (state.mode === 'menu' || state.mode === 'over') return;
    state.frame++; state.score += 0.1;
    state.speed = Math.min(14, 6 + (state.score / 500));

    if(player1) {
        player1.vy += 0.6; player1.y += player1.vy;
        if (player1.y > 150) { player1.y = 150; player1.ground = true; }
        
        // Use client.js sync
        if(state.mode === 'online') {
            client.sendSync(state.nickname, player1.x, player1.y, player1.duck);
        }
    }

    if (state.frame % 100 === 0) {
        state.entities.push(new Entity(W, 160, 20, 40, 'cactus', 'SmallCactus1'));
    }

    state.entities.forEach(ent => {
        ent.x -= state.speed;
        if (player1 && player1.x < ent.x + ent.w && player1.x + player1.w > ent.x && player1.y < ent.y + ent.h && player1.y + player1.h > ent.y) {
            gameOver();
        }
    });
}

function gameOver() {
    state.mode = 'over';
    client.submitScore(state.nickname, Math.floor(state.score));
    if (Math.floor(state.score) > state.hiScore) {
        state.hiScore = Math.floor(state.score);
        localStorage.setItem('dinoHiScore', state.hiScore);
    }
    document.getElementById('game-over').classList.remove('hidden');
}

function loop() {
    ctx.clearRect(0, 0, W, H);
    update();
    if (player1) player1.draw();
    
    // Draw remote players from client.js
    Object.values(client.remotePlayers).forEach(p => {
        ctx.globalAlpha = 0.5;
        const img = (Math.floor(state.frame / 10) % 2 === 0) ? assets['DinoRun1'] : assets['DinoRun2'];
        if (img?.complete) ctx.drawImage(img, p.x, p.y, 44, 47);
        ctx.globalAlpha = 1.0;
    });

    state.entities.forEach(e => e.draw());
    requestAnimationFrame(loop);
}

window.ui = ui;
window.game = game;
loop();
