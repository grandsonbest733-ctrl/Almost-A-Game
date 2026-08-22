const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const players = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    players[socket.id] = {
        id: socket.id,
        x: (Math.random() - 0.5) * 200,
        y: 2,
        z: (Math.random() - 0.5) * 200,
        rx: 0,
        ry: 0,
        hp: 100,
        stance: 'stand'
    };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
            players[socket.id].rx = movementData.rx;
            players[socket.id].ry = movementData.ry;
            players[socket.id].stance = movementData.stance;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('playerRespawn', (pos) => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].y = pos.y;
            players[socket.id].z = pos.z;
            players[socket.id].hp = 100;
        }
    });

    socket.on('shootPlayer', ({ targetId, damage }) => {
        if (players[targetId]) {
            players[targetId].hp -= damage;
            io.to(targetId).emit('playerDamaged', { id: socket.id, hp: players[targetId].hp });
            io.emit('playerDamaged', { id: targetId, hp: players[targetId].hp });

            if (players[targetId].hp <= 0) {
                io.to(targetId).emit('die');
                io.emit('playerKilled', targetId);
                delete players[targetId];
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
