const BOARD_SIZE = 8;
let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let currentShapes = [null, null, null];

const SHAPES = [
    { matrix: [[1]], color: 1 }, 
    { matrix: [[1, 1]], color: 2 }, 
    { matrix: [[1], [1]], color: 2 }, 
    { matrix: [[1, 1, 1]], color: 3 }, 
    { matrix: [[1, 1], [1, 1]], color: 4 }, 
    { matrix: [[1, 1, 1], [0, 1, 0]], color: 5 }, 
    { matrix: [[1, 0], [1, 0], [1, 1]], color: 1 } 
];

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // PC Drag Events
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => handleDrop(e, r, c));
            
            boardEl.appendChild(cell);
        }
    }
}

function updateBoardUI() {
    const cells = boardEl.children;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const index = r * BOARD_SIZE + c;
            const cellVal = boardState[r][c];
            cells[index].className = 'cell';
            if (cellVal > 0) {
                cells[index].classList.add('filled', `color-${cellVal}`);
            }
        }
    }
}

function spawnRackBlocks() {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerHTML = '';
        
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        currentShapes[i] = randomShape;

        const miniGrid = document.createElement('div');
        miniGrid.classList.add('mini-grid');
        miniGrid.setAttribute('draggable', 'true');
        miniGrid.style.gridTemplateRows = `repeat(${randomShape.matrix.length}, 1fr)`;
        miniGrid.style.gridTemplateColumns = `repeat(${randomShape.matrix[0].length}, 1fr)`;
        
        // PC Sürükleme Başlangıcı
        miniGrid.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', i);
        });

        // TABLET/MOBİL Dokunma ile Sürükleme Desteği (Touch Events)
        addTouchListeners(miniGrid, i);

        randomShape.matrix.forEach(row => {
            row.forEach(val => {
                const miniCell = document.createElement('div');
                miniCell.style.width = '20px';
                miniCell.style.height = '20px';
                miniCell.style.borderRadius = '3px';
                if (val === 1) {
                    miniCell.classList.add(`color-${randomShape.color}`);
                } else {
                    miniCell.style.opacity = '0';
                }
                miniGrid.appendChild(miniCell);
            });
        });
        slot.appendChild(miniGrid);
    }
    checkGameOver();
}

// Tabletler için parmak takip mekanizması
function addTouchListeners(element, slotIndex) {
    let startX, startY;

    element.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        element.style.position = 'absolute';
        element.style.zIndex = '1000';
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        
        // Bloğu parmağın altında hareket ettir
        element.style.left = `${currentX - startX}px`;
        element.style.top = `${currentY - startY}px`;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        element.style.position = 'static';
        element.style.left = '0px';
        element.style.top = '0px';
        
        // Parmağın bırakıldığı yerdeki elementi bul
        const touch = e.changedTouches[0];
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (targetEl && targetEl.classList.contains('cell')) {
            const r = parseInt(targetEl.dataset.row);
            const c = parseInt(targetEl.dataset.col);
            executePlacement(slotIndex, r, c);
        }
    });
}

function handleDrop(e, startRow, startCol) {
    e.preventDefault();
    const slotIndex = parseInt(e.dataTransfer.getData('text/plain'));
    executePlacement(slotIndex, startRow, startCol);
}

// Yerleştirme işlemini hem PC hem Mobil için ortak çalıştıran fonksiyon
function executePlacement(slotIndex, startRow, startCol) {
    const shape = currentShapes[slotIndex];
    if (!shape) return;

    if (!canPlaceShape(shape, startRow, startCol)) return;

    // Hücreleri doldur
    for (let r = 0; r < shape.matrix.length; r++) {
        for (let c = 0; c < shape.matrix[0].length; c++) {
            if (shape.matrix[r][c] === 1) {
                boardState[startRow + r][startCol + c] = shape.color;
                score += 10;
            }
        }
    }

    document.getElementById(`slot-${slotIndex}`).innerHTML = '';
    currentShapes[slotIndex] = null;

    updateBoardUI();
    checkLines();

    if (currentShapes.every(s => s === null)) {
        spawnRackBlocks();
    } else {
        checkGameOver();
    }
}

function canPlaceShape(shape, startRow, startCol) {
    const rows = shape.matrix.length;
    const cols = shape.matrix[0].length;
    if (startRow + rows > BOARD_SIZE || startCol + cols > BOARD_SIZE) return false;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape.matrix[r][c] === 1 && boardState[startRow + r][startCol + c] > 0) {
                return false;
            }
        }
    }
    return true;
}

function checkLines() {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        if (boardState[r].every(val => val > 0)) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
        let colFilled = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (boardState[r][c] === 0) colFilled = false;
        }
        if (colFilled) colsToClear.push(c);
    }

    rowsToClear.forEach(r => { boardState[r] = Array(BOARD_SIZE).fill(0); score += 100; });
    colsToClear.forEach(c => { for (let r = 0; r < BOARD_SIZE; r++) boardState[r][c] = 0; score += 100; });

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        updateBoardUI();
        scoreEl.textContent = score;
    }
}

function checkGameOver() {
    let anyMovePossible = false;

    for (let i = 0; i < currentShapes.length; i++) {
        const shape = currentShapes[i];
        if (!shape) continue;

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (canPlaceShape(shape, r, c)) {
                    anyMovePossible = true;
                    break;
                }
            }
            if (anyMovePossible) break;
        }
        if (anyMovePossible) break;
    }

    if (!anyMovePossible && currentShapes.some(s => s !== null)) {
        finalScoreEl.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }
}

function resetGame() {
    boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    score = 0;
    scoreEl.textContent = score;
    currentShapes = [null, null, null];
    gameOverScreen.classList.add('hidden');
    createBoard();
    spawnRackBlocks();
}

restartBtn.addEventListener('click', resetGame);

// Başlat
createBoard();
spawnRackBlocks();
