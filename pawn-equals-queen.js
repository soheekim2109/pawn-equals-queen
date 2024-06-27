
// html elements

var boardEl;
var tilesEl;
var pieceContEl;
var moveCountEl;

var doubleSqrTextEl;
var creditContEl;

// logic

var board;

var isMoving;
var lastPosition;
var headingTo;

var moveCount;
var isGameOver;

var isReducedMotion;



debugging = false;



function getPosition(el) {
    let x = el.getAttribute('data-x');
    let y = el.getAttribute('data-y');
    return [x,y];
}





function loadbody() {
    initialisePage();
    initialiseGame();
    initialiseBoardView();
}

function pieceGrabbed(el) {
    if (!isGameOver) {
        let [x,y] = getPosition(el);
        lastPosition = [x,y];
        if (debugging) {
            document.getElementById('debug-mousedown').innerText = 'mousedown: ' + x + ', ' + y;
        }
        let pieceEl = getPieceEl(x,y);
        if (pieceEl) {
            pieceEl.classList.add('lifted');
        }

        isMoving = true;
    }
}
function pieceHeadingTo(el) {
    if (!isGameOver) {
        let [x,y] = getPosition(el);
        headingTo = [x,y];
        if (debugging) {
            document.getElementById('debug-mouseup').innerText = 'heading to: ' + x + ', ' + y;
        }
    }
}
function pieceLetGo(el) {
    if (!isGameOver) {
        let [x,y] = getPosition(el);
        if (headingTo) { [x,y] = headingTo; }

        if (debugging) {
            document.getElementById('debug-mouseup').innerText = 'mouseup: ' + x + ', ' + y;
        }
        let pieceEl = getPieceEl(lastPosition[0],lastPosition[1]);
        if (pieceEl) {
            pieceEl.classList.remove('lifted');
        }

        if (isMoving) {
            attemptMovingPiece(lastPosition[0],lastPosition[1],x,y);
        }

        isMoving = false;
    }
}

function initialisePage() {
    // get elements
    boardEl = document.getElementById('board');
    tilesEl = document.querySelectorAll('.tile:not(.tile-double)');
    pieceContEl = document.getElementById('piece-container');
    moveCountEl = document.getElementById('print-movecount');
    doubleSqrTextEl = document.getElementById('tile-double-text');
    creditContEl = document.getElementById('icon-credit-container');

    isMoving = false;

    tilesEl.forEach(el => {
        el.addEventListener('mousedown', function() { pieceGrabbed(el); });
        el.addEventListener('mouseup', function() { pieceLetGo(el); });

        el.addEventListener('touchstart', function() { pieceGrabbed(el); });
        el.addEventListener('touchmove', function(e) {
            let thisEl = document.elementFromPoint(
                e.changedTouches[0].clientX,
                e.changedTouches[0].clientY
            );
            pieceHeadingTo(thisEl);
        });
        el.addEventListener('touchend', function() { pieceLetGo(el); });
    });

    isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initialiseGame() {
    board = [
        new Array(4),
        new Array(4),
        new Array(4),
        new Array(4)
    ];

    // pieces
    for (let y = 0; y < 4; y++) {
        board[0][y] = 'knight';
        board[1][y] = 'bishop';
        board[2][y] = 'rook';
    }
    board[3][3] = 'pawn';
    board[3][0] = '';

    moveCount = 0;
    isGameOver = false;
}

function getPieceEl(x,y) {
    let returning;

    Array.from(pieceContEl.children).forEach(pieceEl => {
        if (pieceEl.getAttribute('data-x') == x && pieceEl.getAttribute('data-y') == y) {
            returning = pieceEl;
        }
    });

    return returning;
}

// return boolean
function checkPieceDirection(piece, x1,y1, x2,y2) {
    if (piece == 'pawn') {
        if (y1==y2 && x1-x2==1) { return true; }
    }
    else if (piece == 'rook') {
        if (
            (Math.abs(x1-x2)==1 && y1==y2) ||
            (Math.abs(y1-y2)==1 && x1==x2)
        ) { return true; }
    }
    else if (piece == 'bishop') {
        if (Math.abs(x1-x2)==1 && Math.abs(y1-y2)==1) { return true; }
    }
    else if (piece == 'knight') {
        if (
            (Math.abs(x1-x2)==2 && Math.abs(y1-y2)==1) ||
            (Math.abs(x1-x2)==1 && Math.abs(y1-y2)==2)
        ) { return true; }
    }
    else if (piece == 'queen') {
        if (
            (Math.abs(x1-x2)==1 && y1==y2) ||
            (Math.abs(y1-y2)==1 && x1==x2) ||
            (Math.abs(x1-x2)==1 && Math.abs(y1-y2)==1)
        ) { return true; }
    }

    return false;
}

// try moving and do if possible
function attemptMovingPiece(x1,y1, x2,y2) {
    let piece = board[x1][y1];

    // check if the piece can move there
    if (
        // new pos is empty
        board[x2][y2] == ''
        &&
        // piece can move in that direction
        checkPieceDirection(piece, x1,y1, x2,y2)
    ) {
        // board
        board[x1][y1] = '';
        board[x2][y2] = piece;

        // piece
        movePieceView(x1,y1,x2,y2);

        moveCount++;
        if (moveCount == 1) {
            moveCountEl.innerText = 'Move: ' + moveCount;
        } else {
            moveCountEl.innerText = 'Moves: ' + moveCount;
        }

        // promote pawn to queen if pawn reached to end
        if (piece == 'pawn' && x2 == 0 && y2 == 3) {
            promotion();
        }
        // successful game over if queen reached the red square
        if (piece == 'queen' && x2 == 3 && y2 == 0) {
            gameover();
        }
    }
}

// VIEW functions

function initialiseBoardView() {
    for (let i = 0; i < tilesEl.length; i++) {
        let [x,y] = getPosition(tilesEl[i]);
        let piece = board[x][y];

        if (piece != '') {
            let pieceEl = document.createElement('img');
            pieceEl.src = 'img/' + piece + '.png';
            pieceEl.classList.add('piece');
            pieceEl.addEventListener('dragstart', function(event) {
                event.preventDefault();
            });

            pieceEl.style.top = 'calc(' + x + '* var(--tile-size))';
            pieceEl.style.left = 'calc(' + y + '* var(--tile-size))';
            pieceEl.setAttribute('data-x', x);
            pieceEl.setAttribute('data-y', y);

            pieceContEl.appendChild(pieceEl);
        }
    }
}

// x1,y1 is the old position
// x2,y2 is the new position
// set attribute and view
function movePieceView(x1,y1, x2,y2) {
    let pieceEl = getPieceEl(x1,y1);

    if (pieceEl) {
        pieceEl.style.top = 'calc(' + x2 + '* var(--tile-size))';
        pieceEl.style.left = 'calc(' + y2 + '* var(--tile-size))';
        pieceEl.setAttribute('data-x', x2);
        pieceEl.setAttribute('data-y', y2);
    }
}

// called only when it needs to promote
function promotion() {
    var pawnEl = getPieceEl(0,3);
    board[0][3] = 'queen';

    setTimeout(() => {
        pawnEl.src = 'img/queen.png';
    }, 800);
}

// called only when game won
function gameover() {
    isGameOver = true;

    setTimeout(() => {
        boardEl.classList.add('gameover');

        if (isReducedMotion) {
            doubleSqrTextEl.innerText = '🎉 You won!';
        } else {
            doubleSqrTextEl.innerText = 'You won!';
        }
    }, 800);

    setTimeout(() => {
        confetti({
            disableForReducedMotion: true,
            origin: {y: 0.7}
        });
    }, 1100);
}

function toggleCredit() {
    let current = creditContEl.style.display;

    if (current == 'none') {
        creditContEl.style.display = 'block';
    } else {
        creditContEl.style.display = 'none';
    }
}
