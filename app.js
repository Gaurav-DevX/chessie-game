const express = require('express');
const socket = require('socket.io');
const {Chess} = require('chess.js');
const http = require('http');
const path = require('path');


const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.render('index', {title: 'Chess Game'});
});

// Socket.io handles connection event
io.on('connection', function(unique_socket) {
    console.log('Socket Connected');

    // Send the current state of the board to the new player. and initialize player with white or black color.
    if(!players.white) {
        players.white = unique_socket.id;
        unique_socket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = unique_socket.id;
        unique_socket.emit('playerRole', 'b');
    } else {
        unique_socket.emit('Spectator');
    }

    // if any players left the game it send message the player are deleted.
    unique_socket.on('disconnect', function() {
        if(unique_socket.id === players.white) {
            delete players.white;
        } else if (unique_socket.id === players.black) {
            delete players.black;
        }
    });

    unique_socket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && unique_socket.id !== players.white) return;
            if (chess.turn() === 'b' && unique_socket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            } else {
                console.log('Invalid move', move);
                unique_socket.emit('invalidMove', move);
            }
        } catch (error) {
            console.log(error);
            unique_socket.emit('Invalid move', move);
        }
    })
})

server.listen(3000, function() {
    console.log('server running on port 3000');
});

