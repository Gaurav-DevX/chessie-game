const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

// Initializing variables.
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Creating functions.

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, row_index) => {
        row.forEach((square, square_index) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square', 
                (row_index + square_index) % 2 === 0 ? 'light' : 'dark'
            );

            squareElement.dataset.row = row_index;
            squareElement.dataset.col = square_index;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add(
                    'piece',
                    square.color === 'w' ? 'white' : 'black'
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: row_index, col: square_index };
                        e.dataTransfer.setData('text/plain', '');
                    }
                });

                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', function(e) {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', function(e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };

    const moveResult = chess.move(move);
    if (moveResult) {
        renderBoard();
        socket.emit('move', move);
    }
}

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        w: {
            p: '♙',
            r: '♖',
            n: '♘',
            b: '♗',
            q: '♕',
            k: '♔',
        },
        b: {
            p: '♙',
            r: '♖',
            n: '♘',
            b: '♗',
            q: '♕',
            k: '♔',
        }
    }

    return unicodePieces[piece.color][piece.type];
}

socket.on('playerRole', function(role) {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', function() {
    playerRole = null;
    renderBoard();
});

socket.on('boardState', function(fen) {
    chess.load(fen);
    renderBoard();
});

socket.on('move', function(move) {
    chess.move(move);
    renderBoard();
});

renderBoard();
