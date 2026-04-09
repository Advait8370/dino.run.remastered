/** client.js - Multiplayer Networking Fix */
const socket = io("https://dino-run-remastered-server.onrender.com");

const client = {
    roomId: null,
    remotePlayers: {},

    init() {
        socket.on('connect', () => console.log("Network: Online"));

        socket.on('joined', (data) => {
            this.roomId = data.roomId;
            // FIX: Display the Room ID in the console and an alert so you can share it
            console.log("ROOM ID: " + data.roomId);
            alert("ROOM CREATED! SHARE THIS ID: " + data.roomId);
            
            // Wait for players to join or start immediately
            game.start('online'); 
        });

        socket.on('new-player', (data) => {
            console.log("New player joined: " + data.nickname);
        });

        socket.on('player-moved', (data) => {
            // Store player by unique socket ID to allow more than one
            this.remotePlayers[data.id] = data;
        });

        socket.on('player-left', (id) => {
            delete this.remotePlayers[id];
        });

        socket.on('error-msg', (msg) => alert(msg));
    },

    sendSync(nickname, x, y, duck) {
        if (this.roomId) {
            socket.emit('sync', { roomId: this.roomId, nickname, x, y, duck });
        }
    }
};

const onlineLobby = {
    create: () => {
        const nick = document.getElementById('nick-input').value.trim() || "Dino";
        const max = parseInt(document.getElementById('max-p').value);
        socket.emit('create-room', { max, nickname: nick });
    },
    join: () => {
        const nick = document.getElementById('nick-input').value.trim() || "Dino";
        const id = document.getElementById('room-input').value.trim();
        if(id) socket.emit('join-room', { roomId: id, nickname: nick });
    }
};

window.online = onlineLobby;
client.init();
