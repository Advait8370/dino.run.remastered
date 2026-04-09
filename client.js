/** client.js - Lobby & Admin Start Logic */
const socket = io("https://dino-run-remastered-server.onrender.com");

const client = {
    roomId: null,
    isAdmin: false,
    remotePlayers: {},

    init() {
        socket.on('joined', (data) => {
            this.roomId = data.roomId;
            this.isAdmin = data.isAdmin; // Server tells us if we are admin
            
            ui.show('lobby'); // Switch to lobby screen
            document.getElementById('display-room-id').innerText = data.roomId;
            
            if(this.isAdmin) document.getElementById('admin-start-btn').classList.remove('hidden');
        });

        socket.on('lobby-update', (players) => {
            const list = document.getElementById('player-list');
            list.innerHTML = Object.values(players).map(p => `<div>${p.nickname.toUpperCase()}</div>`).join('');
        });

        socket.on('start-multiplayer', () => {
            game.start('online'); // Everyone starts at the same time
        });

        socket.on('player-moved', (data) => {
            this.remotePlayers[data.id] = data;
        });

        socket.on('player-left', (id) => delete this.remotePlayers[id]);
        socket.on('error-msg', (msg) => alert(msg));
        
        socket.on('update-leaderboard', (data) => {
            const list = document.getElementById('leaderboard-list');
            if (list) list.innerHTML = data.map((s, i) => `<div>${i+1}. ${s.name} - ${s.score}</div>`).join('');
        });
    },

    sendSync(nickname, x, y, duck) {
        if (this.roomId) socket.emit('sync', { roomId: this.roomId, nickname, x, y, duck });
    }
};

const onlineLobby = {
    create: () => {
        const nick = document.getElementById('nick-input').value.trim() || "Dino";
        socket.emit('create-room', { max: 5, nickname: nick });
    },
    join: () => {
        const nick = document.getElementById('nick-input').value.trim() || "Dino";
        const id = document.getElementById('room-input').value.trim().toUpperCase();
        if(id) socket.emit('join-room', { roomId: id, nickname: nick });
    },
    adminStart: () => {
        if(client.roomId) socket.emit('admin-start', { roomId: client.roomId });
    }
};

window.online = onlineLobby;
client.init();
