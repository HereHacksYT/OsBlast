const BOARD_SIZE = 8;
let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let currentShapes = [null, null, null];

// Hazır Blok Şekilleri (Matris formatında)
const SHAPES = [
    { matrix: [[1]], color: 1 }, // Tekli kare
    { matrix: [[1, 1]], color: 2 }, // 2'li Yatay
    { matrix: [[1], [1]], color: 2 }, // 2'li Dikey
    { matrix: [[1, 1, 1]], color: 3 }, // 3'lü Yatay
    { matrix: [[1, 1], [1, 1]], color: 4 }, // 2x2 Kare
    { matrix: [[1, 1, 1], [0, 1, 0]], color: 5 }, // T Şekli
    { matrix: [[1, 0], [1, 0], [1, 1]], color: 1 } // L Şekli
];

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');

// 1. Oyun Alanını Oluştur
function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Sürüklenen bloğu üzerine bırakabilmek için eventler
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => handleDrop(e, r, c));
            
            boardEl.appendChild(cell);
        }
    }
}

// Board'u veriye göre güncelle
function updateBoardUI() {
    const cells = boardEl.children;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const index = r * BOARD_SIZE + c;
            const cellVal = boardState[r][c];
            cells[index].className = 'cell'; // Sıfırla
            if (cellVal > 0) {
                cells[index].classList.add('filled', `color-${cellVal}`);
            }
        }
    }
}

// 2. Yeni 3'lü Blok Üret
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
        
        // Hangi slot olduğunu taşıyalım
        miniGrid.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', i);
        });

        // Mini hücreleri çiz
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
}

// 3. Bloğu Bırakma Mantığı
function handleDrop(e, startRow, startCol) {
    e.preventDefault();
    const slotIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const shape = currentShapes[slotIndex];
    if (!shape) return;

    const rows = shape.matrix.length;
    const cols = shape.matrix[0].length;

    // Sığma ve çakışma kontrolü
    if (startRow + rows > BOARD_SIZE || startCol + cols > BOARD_SIZE) return;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape.matrix[r][c] === 1 && boardState[startRow + r][startCol + c] > 0) {
                return; // Üst üste biniyor, yerleştirme!
            }
        }
    }

    // Yerleştirme başarılı: Matrise yaz
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape.matrix[r][c] === 1) {
                boardState[startRow + r][startCol + c] = shape.color;
                score += 10;
            }
        }
    }

    // Slotu temizle
    document.getElementById(`slot-${slotIndex}`).innerHTML = '';
    currentShapes[slotIndex] = null;

    updateBoardUI();
    checkLines();

    // Eğer 3 slot da boşaldıysa yeni 3 tane üret
    if (currentShapes.every(s => s === null)) {
        spawnRackBlocks();
    }
}

// 4. Satır ve Sütun Patlatma Kontrolü
function checkLines() {
    let rowsToClear = [];
    let colsToClear = [];

    // Satırları kontrol et
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (boardState[r].every(val => val > 0)) {
            rowsToClear.push(r);
        }
    }

    // Sütunları kontrol et
    for (let c = 0; c < BOARD_SIZE; c++) {
        let colFilled = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (boardState[r][c] === 0) colFilled = false;
        }
        if (colFilled) colsToClear.push(c);
    }

    // Temizle ve puan ekle
    rowsToClear.forEach(r => {
        boardState[r] = Array(BOARD_SIZE).fill(0);
        score += 100;
    });

    colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) {
            boardState[r][c] = 0;
        }
        score += 100;
    });

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        updateBoardUI();
        scoreEl.textContent = score;
    }
}

// Oyunu Başlat
createBoard();
spawnRackBlocks();
