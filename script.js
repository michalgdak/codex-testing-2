const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 30;
const DROP_BASE_INTERVAL = 1000;

const COLORS = {
    I: '#38bdf8',
    J: '#6366f1',
    L: '#f59e0b',
    O: '#facc15',
    S: '#22c55e',
    T: '#a855f7',
    Z: '#ef4444'
};

const TETROMINOES = {
    I: [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    J: [
        [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [0, 0, 1]
        ],
        [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0]
        ]
    ],
    L: [
        [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1]
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [1, 0, 0]
        ],
        [
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0]
        ]
    ],
    O: [
        [
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    ],
    S: [
        [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        [
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 1]
        ],
        [
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0]
        ],
        [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0]
        ]
    ],
    T: [
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0]
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0]
        ]
    ],
    Z: [
        [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 0, 1],
            [0, 1, 1],
            [0, 1, 0]
        ],
        [
            [0, 0, 0],
            [1, 1, 0],
            [0, 1, 1]
        ],
        [
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0]
        ]
    ]
};

const LINE_SCORES = [0, 100, 300, 500, 800];

class Board {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = this.createGrid();
    }

    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    }

    reset() {
        this.grid = this.createGrid();
    }

    isInside(x, y) {
        return x >= 0 && x < this.cols && y < this.rows;
    }

    isEmpty(x, y) {
        if (y < 0) {
            return true;
        }
        return this.grid[y][x] === null;
    }

    placePiece(piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    if (boardY >= 0) {
                        this.grid[boardY][boardX] = piece.type;
                    }
                }
            });
        });
    }

    clearLines() {
        let cleared = 0;
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== null)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.cols).fill(null));
                cleared += 1;
                y += 1; // recheck the same row index after unshift
            }
        }
        return cleared;
    }
}

class Piece {
    constructor(type) {
        this.type = type;
        this.rotationIndex = 0;
        this.rotations = TETROMINOES[type];
        this.matrix = this.rotations[this.rotationIndex];
        this.x = Math.floor((COLS - this.matrix[0].length) / 2);
        this.y = -this.getTopOffset();
    }

    rotate(direction = 1) {
        const length = this.rotations.length;
        this.rotationIndex = (this.rotationIndex + direction + length) % length;
        this.matrix = this.rotations[this.rotationIndex];
        this.y -= this.getTopOffset();
    }

    getTopOffset() {
        const firstFilledRow = this.matrix.findIndex(row => row.some(value => value !== 0));
        return firstFilledRow === -1 ? 0 : firstFilledRow;
    }
}

class Game {
    constructor() {
        this.boardCanvas = document.getElementById('board');
        this.boardCtx = this.boardCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('next');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.linesEl = document.getElementById('lines');
        this.levelEl = document.getElementById('level');
        this.overlay = document.getElementById('overlay');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');

        this.board = new Board(COLS, ROWS);
        this.activePiece = null;
        this.nextPiece = this.randomPiece();
        this.dropCounter = 0;
        this.dropInterval = DROP_BASE_INTERVAL;
        this.lastTime = 0;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.animationFrame = null;
        this.previewBlockSize = 24;
        this.resizeRaf = null;

        this.handleResize = this.handleResize.bind(this);
        this.updateCanvasSizes();
        window.addEventListener('resize', this.handleResize);

        this.registerEvents();
        this.drawBoard();
        this.drawNextPiece();
        this.updateStats();
        this.showOverlay('Press Start');
    }

    registerEvents() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver || !this.activePiece) {
                if (event.key === ' ' && !this.gameOver) {
                    event.preventDefault();
                }
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    this.movePiece(-1);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.movePiece(1);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.softDrop();
                    break;
                case 'ArrowUp':
                case 'x':
                case 'X':
                    event.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ': // Spacebar
                    event.preventDefault();
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    event.preventDefault();
                    this.togglePause();
                    break;
            }
        });

        this.startButton.addEventListener('click', () => {
            if (this.gameOver || !this.activePiece) {
                this.startGame();
            } else {
                this.resetGame();
            }
        });
    }

    randomPiece() {
        const types = Object.keys(TETROMINOES);
        const type = types[Math.floor(Math.random() * types.length)];
        return new Piece(type);
    }

    startGame() {
        this.resetGame();
        this.startButton.textContent = 'Restart';
    }

    resetGame() {
        cancelAnimationFrame(this.animationFrame);
        this.board.reset();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = DROP_BASE_INTERVAL;
        this.gameOver = false;
        this.paused = false;
        this.nextPiece = this.randomPiece();
        this.updateCanvasSizes();
        this.spawnPiece();
        this.hideOverlay();
        this.updateStats();
        this.lastTime = 0;
        this.dropCounter = 0;
        this.loop(0);
    }

    spawnPiece() {
        this.activePiece = this.nextPiece;
        this.activePiece.x = Math.floor((COLS - this.activePiece.matrix[0].length) / 2);
        this.activePiece.y = -this.activePiece.getTopOffset();
        this.nextPiece = this.randomPiece();
        this.drawNextPiece();

        if (!this.isValidPosition(this.activePiece.matrix, this.activePiece.x, this.activePiece.y)) {
            this.endGame();
        }
    }

    movePiece(dir) {
        if (this.paused) return;
        const newX = this.activePiece.x + dir;
        if (this.isValidPosition(this.activePiece.matrix, newX, this.activePiece.y)) {
            this.activePiece.x = newX;
            this.draw();
        }
    }

    softDrop() {
        if (this.paused) return;
        if (this.moveDown()) {
            this.addScore(1);
        }
    }

    hardDrop() {
        if (this.paused) return;
        let dropDistance = 0;
        while (this.moveDown()) {
            dropDistance += 1;
        }
        if (dropDistance > 0) {
            this.addScore(dropDistance * 2);
        }
        this.lockPiece();
    }

    rotatePiece() {
        if (this.paused) return;
        const piece = this.activePiece;
        const previousRotation = piece.rotationIndex;
        const previousMatrix = piece.matrix;
        piece.rotate(1);

        const kicks = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: -2 },
            { x: 2, y: 0 },
            { x: -2, y: 0 }
        ];

        const rotatedMatrix = piece.matrix;
        for (const offset of kicks) {
            if (this.isValidPosition(rotatedMatrix, piece.x + offset.x, piece.y + offset.y)) {
                piece.x += offset.x;
                piece.y += offset.y;
                this.draw();
                return;
            }
        }

        piece.rotationIndex = previousRotation;
        piece.matrix = previousMatrix;
    }

    moveDown() {
        const piece = this.activePiece;
        const newY = piece.y + 1;
        if (this.isValidPosition(piece.matrix, piece.x, newY)) {
            piece.y = newY;
            this.draw();
            return true;
        }
        return false;
    }

    lockPiece() {
        this.board.placePiece(this.activePiece);
        const clearedLines = this.board.clearLines();
        if (clearedLines > 0) {
            this.lines += clearedLines;
            const lineScore = LINE_SCORES[clearedLines] || 0;
            this.addScore(lineScore * this.level);
            this.level = Math.floor(this.lines / 10) + 1;
            const speedMultiplier = Math.pow(0.85, this.level - 1);
            this.dropInterval = Math.max(100, DROP_BASE_INTERVAL * speedMultiplier);
        }
        this.spawnPiece();
        this.draw();
    }

    addScore(amount) {
        this.score += amount;
        this.updateStats();
    }

    updateStats() {
        this.scoreEl.textContent = this.score;
        this.linesEl.textContent = this.lines;
        this.levelEl.textContent = this.level;
    }

    togglePause() {
        if (this.gameOver || !this.activePiece) return;
        this.paused = !this.paused;
        if (this.paused) {
            cancelAnimationFrame(this.animationFrame);
            this.showOverlay('Paused');
        } else {
            this.hideOverlay();
            this.dropCounter = 0;
            this.lastTime = 0;
            this.loop(0);
        }
    }

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animationFrame);
        this.showOverlay('Game Over');
    }

    showOverlay(message) {
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
    }

    isValidPosition(matrix, offsetX, offsetY) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x]) {
                    const boardX = offsetX + x;
                    const boardY = offsetY + y;
                    if (!this.board.isInside(boardX, boardY) || !this.board.isEmpty(boardX, boardY)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    loop(time = 0) {
        this.animationFrame = requestAnimationFrame((t) => this.loop(t));
        const delta = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += delta;

        if (this.dropCounter > this.dropInterval) {
            if (!this.moveDown()) {
                this.lockPiece();
            }
            this.dropCounter = 0;
        }

        this.draw();
    }

    draw() {
        this.drawBoard();
        if (this.activePiece) {
            this.drawPiece(this.activePiece, 1);
            this.drawGhost();
        }
    }

    drawBoard() {
        const ctx = this.boardCtx;
        ctx.clearRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }

        this.board.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.drawBlock(x, y, COLORS[cell]);
                }
            });
        });
    }

    drawPiece(piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const drawX = piece.x + x;
                    const drawY = piece.y + y;
                    if (drawY >= 0) {
                        this.drawBlock(drawX, drawY, COLORS[piece.type]);
                    }
                }
            });
        });
    }

    drawGhost() {
        const ghost = {
            matrix: this.activePiece.matrix,
            x: this.activePiece.x,
            y: this.activePiece.y
        };
        while (this.isValidPosition(ghost.matrix, ghost.x, ghost.y + 1)) {
            ghost.y += 1;
        }
        this.boardCtx.save();
        this.boardCtx.globalAlpha = 0.25;
        this.drawPiece(ghost);
        this.boardCtx.restore();
    }

    drawBlock(x, y, color) {
        const ctx = this.boardCtx;
        const px = x * BLOCK_SIZE;
        const py = y * BLOCK_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    }

    drawNextPiece() {
        const ctx = this.nextCtx;
        ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        const matrix = this.nextPiece.matrix;
        const size = matrix.length;
        const previewBlock = this.previewBlockSize;
        const offsetX = (this.nextCanvas.width - size * previewBlock) / 2;
        const offsetY = (this.nextCanvas.height - size * previewBlock) / 2;

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = COLORS[this.nextPiece.type];
                    const px = offsetX + x * previewBlock;
                    const py = offsetY + y * previewBlock;
                    ctx.fillRect(px, py, previewBlock - 2, previewBlock - 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.strokeRect(px, py, previewBlock - 2, previewBlock - 2);
                }
            });
        });
    }

    updateCanvasSizes() {
        const wrapper = this.boardCanvas.parentElement;
        const container = this.boardCanvas.closest('.game-container');
        const containerStyles = container ? getComputedStyle(container) : null;
        const containerPadding = containerStyles
            ? parseFloat(containerStyles.paddingLeft) + parseFloat(containerStyles.paddingRight)
            : 0;
        let availableWidth = container ? container.clientWidth - containerPadding : window.innerWidth - 48;

        const isSingleColumn = window.innerWidth <= 840;
        if (!isSingleColumn) {
            const aside = container ? container.querySelector('aside') : null;
            const main = container ? container.querySelector('main') : null;
            const gap = main ? parseFloat(getComputedStyle(main).columnGap) || 0 : 0;
            if (aside) {
                const asideStyles = getComputedStyle(aside);
                const asideMargins = parseFloat(asideStyles.marginLeft) + parseFloat(asideStyles.marginRight);
                availableWidth -= aside.getBoundingClientRect().width + asideMargins + gap;
            }
        }

        const wrapperStyles = getComputedStyle(wrapper);
        const paddingX = parseFloat(wrapperStyles.paddingLeft) + parseFloat(wrapperStyles.paddingRight);
        availableWidth = availableWidth - paddingX;
        if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
            availableWidth = COLS * BLOCK_SIZE;
        }

        const heightAllowance = window.innerHeight - 220;
        const availableHeight = heightAllowance > 0 ? heightAllowance : ROWS * BLOCK_SIZE;
        const sizeByWidth = Math.floor(availableWidth / COLS);
        const sizeByHeight = Math.floor(availableHeight / ROWS);
        let newBlockSize = sizeByWidth || BLOCK_SIZE;
        if (sizeByHeight > 0) {
            newBlockSize = Math.min(newBlockSize, sizeByHeight);
        }
        newBlockSize = Math.max(8, Math.min(40, newBlockSize));

        BLOCK_SIZE = newBlockSize;
        this.boardCanvas.width = COLS * BLOCK_SIZE;
        this.boardCanvas.height = ROWS * BLOCK_SIZE;
        this.boardCanvas.style.width = `${COLS * BLOCK_SIZE}px`;
        this.boardCanvas.style.height = `${ROWS * BLOCK_SIZE}px`;

        this.previewBlockSize = Math.max(10, Math.min(28, Math.floor(BLOCK_SIZE * 0.9)));
        const previewSize = this.previewBlockSize * 4;
        this.nextCanvas.width = previewSize;
        this.nextCanvas.height = previewSize;
        this.nextCanvas.style.width = `${previewSize}px`;
        this.nextCanvas.style.height = `${previewSize}px`;

        if (this.board) {
            this.draw();
            if (this.nextPiece) {
                this.drawNextPiece();
            }
        }
    }

    handleResize() {
        if (this.resizeRaf) {
            cancelAnimationFrame(this.resizeRaf);
        }
        this.resizeRaf = requestAnimationFrame(() => {
            this.resizeRaf = null;
            this.updateCanvasSizes();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
