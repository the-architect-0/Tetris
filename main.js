 const BOARD_WIDTH = 10;
        const BOARD_HEIGHT = 20;
        const EMPTY_CELL = 'empty';
        
        // Pirate ranks
        const RANKS = [
            { name: 'Powder Monkey', icon: '🧹', linesRequired: 0 },
            { name: 'Deckhand', icon: '⚓', linesRequired: 10 },
            { name: 'Quartermaster', icon: '🧭', linesRequired: 30 },
            { name: 'First Mate', icon: '⭐', linesRequired: 60 },
            { name: 'Pirate Captain', icon: '🏴‍☠️', linesRequired: 100 }
        ];
        
        // Game modes
        const GAME_MODES = {
            NORMAL: { name: 'Normal Seas', speed: 1000, specialChance: 0.05 },
            STORMY: { name: 'Stormy Seas', speed: 700, specialChance: 0.08 },
            TREASURE: { name: 'Treasure Hunt', speed: 1000, specialChance: 0.1 }
        };
        
        // Pirate-themed Tetrominoes
        const TETROMINOES = {
            I: {
                shape: [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                color: 'block-i',
                name: 'Cannonball'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-j',
                name: 'Cutlass'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-l',
                name: 'Doubloon'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: 'block-o',
                name: 'Treasure Chest'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: 'block-s',
                name: 'Jolly Roger'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-t',
                name: 'Anchor'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-z',
                name: 'Spyglass'
            }
        };
        
        // Special blocks for events
        const SPECIAL_BLOCKS = {
            PARROT: { color: 'block-special', name: 'Parrot Assistant' },
            CANNON: { color: 'block-power', name: 'Cannon Blast' }
        };
        
        // Game state
        let board = [];
        let currentPiece = null;
        let nextPiece = null;
        let holdPiece = null;
        let canHold = true;
        let score = 0;
        let lines = 0;
        let level = 1;
        let gameOver = false;
        let isPaused = false;
        let dropInterval = null;
        let gameMode = GAME_MODES.NORMAL;
        let lastDropTime = 0;
        let eventActive = false;
        let highScores = [];
        
        // DOM Elements
        const gameBoard = document.getElementById('game-board');
        const scoreElement = document.getElementById('score');
        const linesElement = document.getElementById('lines');
        const levelElement = document.getElementById('level');
        const nextRankElement = document.getElementById('next-rank');
        const rankNameElement = document.getElementById('rank-name');
        const rankIconElement = document.getElementById('rank-icon');
        const nextPieceContainer = document.getElementById('next-piece-container');
        const holdPieceContainer = document.getElementById('hold-piece-container');
        const startScreen = document.getElementById('start-screen');
        const pauseScreen = document.getElementById('pause-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const eventNotification = document.getElementById('event-notification');
        const highScoresList = document.getElementById('high-scores-list');
        const startButton = document.getElementById('start-button');
        const resumeButton = document.getElementById('resume-button');
        const restartButton = document.getElementById('restart-button');
        const playAgainButton = document.getElementById('play-again-button');
        const modeButtons = document.querySelectorAll('.mode-button');
        const controlButtons = document.querySelectorAll('.control-button');
        
        // Initialize the game
        function init() {
            createBoard();
            loadHighScores();
            renderHighScores();
            setupEventListeners();
            showStartScreen();
        }
        
        // Create the game board
        function createBoard() {
            board = [];
            gameBoard.innerHTML = '';
            
            // Create grid cells
            for (let row = 0; row < BOARD_HEIGHT; row++) {
                board[row] = [];
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    board[row][col] = EMPTY_CELL;
                    
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    gameBoard.appendChild(cell);
                }
            }
        }
        
        // Get a random Tetromino
        function getRandomPiece() {
            const pieces = 'IJLOSTZ';
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            return JSON.parse(JSON.stringify(TETROMINOES[randomPiece]));
        }
        
        // Create a new piece
        function createPiece() {
            // If nextPiece doesn't exist, generate a new one
            if (!nextPiece) {
                nextPiece = getRandomPiece();
            }
            
            currentPiece = nextPiece;
            nextPiece = getRandomPiece();
            
            // Set initial position (centered at the top)
            currentPiece.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2);
            currentPiece.y = 0;
            
            // Check for game over
            if (isCollision()) {
                gameOver = true;
                endGame();
            }
            
            // Render next piece preview
            renderNextPiece();
            
            // Reset hold ability
            canHold = true;
            
            // Draw the piece
            drawPiece();
        }
        
        // Draw the current piece on the board
        function drawPiece() {
            if (!currentPiece) return;
            
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const boardRow = currentPiece.y + row;
                        const boardCol = currentPiece.x + col;
                        
                        if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
                            const cell = document.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);
                            if (cell) {
                                cell.classList.add(currentPiece.color);
                                cell.classList.add('current-piece');
                            }
                        }
                    }
                }
            }
        }
        
        // Clear the current piece from the board
        function clearPiece() {
            if (!currentPiece) return;
            
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const boardRow = currentPiece.y + row;
                        const boardCol = currentPiece.x + col;
                        
                        if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
                            const cell = document.querySelector(`.cell[data-row="${boardRow}"][data-col="${boardCol}"]`);
                            if (cell) {
                                cell.classList.remove(currentPiece.color);
                                cell.classList.remove('current-piece');
                            }
                        }
                    }
                }
            }
        }
        
        // Move the piece
        function movePiece(dx, dy) {
            if (!currentPiece || isPaused || gameOver) return;
            
            clearPiece();
            currentPiece.x += dx;
            currentPiece.y += dy;
            
            // If there's a collision, revert the move
            if (isCollision()) {
                currentPiece.x -= dx;
                currentPiece.y -= dy;
                
                // If moving down caused collision, lock the piece
                if (dy > 0) {
                    lockPiece();
                    redrawBoard(); // REDRAW THE BOARD AFTER LOCKING
                    clearLines();
                    createPiece();
                    
                    // Check for special events
                    checkSpecialEvents();
                }
            }
            
            drawPiece();
        }
        
        // Rotate the piece
        function rotatePiece() {
            if (!currentPiece || isPaused || gameOver) return;
            
            clearPiece();
            
            // Transpose the matrix (rotate 90 degrees)
            const originalShape = currentPiece.shape;
            const rows = originalShape.length;
            const cols = originalShape[0].length;
            const rotated = [];
            
            for (let col = 0; col < cols; col++) {
                rotated[col] = [];
                for (let row = rows - 1; row >= 0; row--) {
                    rotated[col][rows - 1 - row] = originalShape[row][col];
                }
            }
            
            // Save original shape in case of collision
            const originalShapeBackup = currentPiece.shape;
            currentPiece.shape = rotated;
            
            // If there's a collision, try wall kicks
            if (isCollision()) {
                // Try moving left
                currentPiece.x -= 1;
                if (isCollision()) {
                    // Try moving right
                    currentPiece.x += 2;
                    if (isCollision()) {
                        // Try moving up (rarely needed)
                        currentPiece.x -= 1;
                        currentPiece.y -= 1;
                        if (isCollision()) {
                            // Revert to original shape
                            currentPiece.y += 1;
                            currentPiece.shape = originalShapeBackup;
                        }
                    }
                }
            }
            
            drawPiece();
        }
        
        // Check for collisions
        function isCollision() {
            if (!currentPiece) return false;
            
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const boardRow = currentPiece.y + row;
                        const boardCol = currentPiece.x + col;
                        
                        // Check boundaries
                        if (boardCol < 0 || boardCol >= BOARD_WIDTH || boardRow >= BOARD_HEIGHT) {
                            return true;
                        }
                        
                        // Check if cell is occupied (only check rows that are on the board)
                        if (boardRow >= 0 && board[boardRow][boardCol] !== EMPTY_CELL) {
                            return true;
                        }
                    }
                }
            }
            
            return false;
        }
        
        // Lock the piece in place
        function lockPiece() {
            if (!currentPiece) return;
            
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const boardRow = currentPiece.y + row;
                        const boardCol = currentPiece.x + col;
                        
                        // Only update board if within bounds
                        if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
                            board[boardRow][boardCol] = currentPiece.color;
                        }
                    }
                }
            }
        }
        
        // Clear completed lines
        function clearLines() {
            let linesCleared = 0;
            let rowsToClear = [];
            
            // Check for completed lines
            for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
                let isLineComplete = true;
                
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    if (board[row][col] === EMPTY_CELL) {
                        isLineComplete = false;
                        break;
                    }
                }
                
                if (isLineComplete) {
                    rowsToClear.push(row);
                    linesCleared++;
                }
            }
            
            // If lines were cleared
            if (linesCleared > 0) {
                // Add to score
                const linePoints = [100, 300, 500, 800]; // Points for 1, 2, 3, 4 lines
                const points = linePoints[linesCleared - 1] * level;
                score += points;
                
                // Add to lines total
                lines += linesCleared;
                
                // Update level based on lines cleared
                const newLevel = Math.floor(lines / 10) + 1;
                if (newLevel > level) {
                    level = newLevel;
                    updateDropSpeed();
                    showEventNotification(`Promoted to Level ${level}!`);
                }
                
                // Update rank
                updateRank();
                
                // Update UI
                updateUI();
                
                // Animate line clearing
                animateLineClearing(rowsToClear);
                
                // Remove cleared lines after animation
                setTimeout(() => {
                    // Remove cleared lines
                    for (let rowIndex of rowsToClear) {
                        // Remove the row
                        board.splice(rowIndex, 1);
                        // Add a new empty row at the top
                        board.unshift(new Array(BOARD_WIDTH).fill(EMPTY_CELL));
                    }
                    
                    // Redraw the board
                    redrawBoard();
                }, 500);
                
                // Check for treasure bonus
                if (linesCleared >= 3) {
                    const bonus = 1000 * linesCleared;
                    score += bonus;
                    updateUI();
                    showEventNotification(`Treasure Bonus! +${bonus} Booty!`);
                }
            }
        }
        
        // Animate line clearing
        function animateLineClearing(rows) {
            for (let row of rows) {
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('clearing-line');
                    }
                }
            }
        }
        
        // Redraw the entire board
        function redrawBoard() {
            // Clear all cells
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                // Remove all block classes but keep the basic cell class
                cell.className = 'cell';
            });
            
            // Draw occupied cells from the board array
            for (let row = 0; row < BOARD_HEIGHT; row++) {
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    if (board[row][col] !== EMPTY_CELL) {
                        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add(board[row][col]);
                        }
                    }
                }
            }
            
            // Draw current piece if it exists
            if (currentPiece) {
                drawPiece();
            }
        }
        
        // Update the game UI
        function updateUI() {
            scoreElement.textContent = score;
            linesElement.textContent = lines;
            levelElement.textContent = level;
            
            // Calculate lines needed for next rank
            const currentRank = getCurrentRank();
            const nextRank = RANKS.find(rank => rank.linesRequired > lines) || RANKS[RANKS.length - 1];
            const linesNeeded = nextRank.linesRequired - lines;
            nextRankElement.textContent = linesNeeded > 0 ? linesNeeded : 'MAX';
        }
        
        // Get current pirate rank
        function getCurrentRank() {
            for (let i = RANKS.length - 1; i >= 0; i--) {
                if (lines >= RANKS[i].linesRequired) {
                    return RANKS[i];
                }
            }
            return RANKS[0];
        }
        
        // Update rank display
        function updateRank() {
            const rank = getCurrentRank();
            rankNameElement.textContent = rank.name;
            rankIconElement.textContent = rank.icon;
        }
        
        // Update drop speed based on level
        function updateDropSpeed() {
            if (dropInterval) {
                clearInterval(dropInterval);
            }
            
            // Calculate drop interval (faster as level increases)
            const baseSpeed = gameMode.speed;
            const speed = Math.max(50, baseSpeed - (level - 1) * 50);
            
            dropInterval = setInterval(() => {
                movePiece(0, 1);
            }, speed);
        }
        
        // Drop the piece instantly
        function dropPiece() {
            if (!currentPiece || isPaused || gameOver) return;
            
            clearPiece();
            
            // Move down until collision
            while (!isCollision()) {
                currentPiece.y++;
            }
            
            // Move back up one step (to the last valid position)
            currentPiece.y--;
            
            lockPiece();
            redrawBoard(); // REDRAW THE BOARD AFTER DROPPING
            clearLines();
            createPiece();
            
            // Check for special events
            checkSpecialEvents();
        }
        
        // Hold the current piece
        function holdCurrentPiece() {
            if (!currentPiece || !canHold || isPaused || gameOver) return;
            
            clearPiece();
            
            // If hold piece is empty, store current piece and get a new one
            if (!holdPiece) {
                holdPiece = currentPiece;
                createPiece();
            } else {
                // Swap current piece with hold piece
                const temp = currentPiece;
                currentPiece = holdPiece;
                holdPiece = temp;
                
                // Reset position
                currentPiece.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2);
                currentPiece.y = 0;
                
                // Check for collision (game over)
                if (isCollision()) {
                    gameOver = true;
                    endGame();
                }
            }
            
            // Disable holding until next piece is placed
            canHold = false;
            
            // Render hold piece
            renderHoldPiece();
            drawPiece();
        }
        
        // Render the next piece preview
        function renderNextPiece() {
            if (!nextPiece) return;
            
            // Clear the container
            nextPieceContainer.innerHTML = '';
            
            // Create a mini grid for the preview
            const rows = nextPiece.shape.length;
            const cols = nextPiece.shape[0].length;
            
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    
                    // Center the piece in the 4x4 grid
                    const offsetRow = Math.floor((4 - rows) / 2);
                    const offsetCol = Math.floor((4 - cols) / 2);
                    
                    if (row >= offsetRow && row < offsetRow + rows && 
                        col >= offsetCol && col < offsetCol + cols && 
                        nextPiece.shape[row - offsetRow][col - offsetCol]) {
                        cell.classList.add(nextPiece.color);
                    }
                    
                    nextPieceContainer.appendChild(cell);
                }
            }
        }
        
        // Render the hold piece preview
        function renderHoldPiece() {
            // Clear the container
            holdPieceContainer.innerHTML = '';
            
            if (!holdPiece) {
                // Create empty grid
                for (let i = 0; i < 16; i++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    holdPieceContainer.appendChild(cell);
                }
                return;
            }
            
            // Create a mini grid for the preview
            const rows = holdPiece.shape.length;
            const cols = holdPiece.shape[0].length;
            
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    
                    // Center the piece in the 4x4 grid
                    const offsetRow = Math.floor((4 - rows) / 2);
                    const offsetCol = Math.floor((4 - cols) / 2);
                    
                    if (row >= offsetRow && row < offsetRow + rows && 
                        col >= offsetCol && col < offsetCol + cols && 
                        holdPiece.shape[row - offsetRow][col - offsetCol]) {
                        cell.classList.add(holdPiece.color);
                    }
                    
                    holdPieceContainer.appendChild(cell);
                }
            }
        }
        
        // Check for special events
        function checkSpecialEvents() {
            if (eventActive || Math.random() > gameMode.specialChance) return;
            
            const eventType = Math.random();
            
            if (eventType < 0.4) {
                // Cannon Blast event (clears random rows)
                cannonBlastEvent();
            } else if (eventType < 0.7) {
                // Parrot Assistant event (rotates a piece)
                parrotAssistantEvent();
            } else {
                // Sea Monster event (board shake)
                seaMonsterEvent();
            }
        }
        
        // Cannon Blast event
        function cannonBlastEvent() {
            eventActive = true;
            showEventNotification("Cannon Blast! Clearing random rows!");
            
            // Find rows that are at least half full
            const candidateRows = [];
            for (let row = 0; row < BOARD_HEIGHT; row++) {
                let filledCells = 0;
                for (let col = 0; col < BOARD_WIDTH; col++) {
                    if (board[row][col] !== EMPTY_CELL) {
                        filledCells++;
                    }
                }
                
                if (filledCells >= BOARD_WIDTH / 2) {
                    candidateRows.push(row);
                }
            }
            
            // Clear up to 3 random rows
            const rowsToClear = [];
            const numRowsToClear = Math.min(3, candidateRows.length);
            
            for (let i = 0; i < numRowsToClear; i++) {
                const randomIndex = Math.floor(Math.random() * candidateRows.length);
                rowsToClear.push(candidateRows[randomIndex]);
                candidateRows.splice(randomIndex, 1);
            }
            
            // Animate and clear rows
            if (rowsToClear.length > 0) {
                animateLineClearing(rowsToClear);
                
                setTimeout(() => {
                    // Clear the rows
                    for (let rowIndex of rowsToClear) {
                        for (let col = 0; col < BOARD_WIDTH; col++) {
                            board[rowIndex][col] = EMPTY_CELL;
                        }
                    }
                    
                    // Add points
                    score += 500 * rowsToClear.length;
                    updateUI();
                    
                    // Redraw board
                    redrawBoard();
                    
                    eventActive = false;
                }, 500);
            } else {
                eventActive = false;
            }
        }
        
        // Parrot Assistant event
        function parrotAssistantEvent() {
            eventActive = true;
            showEventNotification("Polly wants a cracker! Parrot Assistant rotating piece!");
            
            // Rotate the current piece
            rotatePiece();
            
            // Add bonus points
            score += 200;
            updateUI();
            
            setTimeout(() => {
                eventActive = false;
            }, 2000);
        }
        
        // Sea Monster event
        function seaMonsterEvent() {
            eventActive = true;
            showEventNotification("Sea Monster! Hold on to yer hats!");
            
            // Shake the board
            gameBoard.classList.add('board-shake');
            
            setTimeout(() => {
                gameBoard.classList.remove('board-shake');
                eventActive = false;
            }, 500);
        }
        
        // Show event notification
        function showEventNotification(message) {
            eventNotification.textContent = message;
            eventNotification.classList.remove('hidden');
            
            setTimeout(() => {
                eventNotification.classList.add('hidden');
            }, 3000);
        }
        
        // Start the game
        function startGame() {
            // Reset game state
            score = 0;
            lines = 0;
            level = 1;
            gameOver = false;
            isPaused = false;
            eventActive = false;
            currentPiece = null;
            nextPiece = null;
            holdPiece = null;
            canHold = true;
            
            // Create fresh board
            createBoard();
            
            // Create first piece
            createPiece();
            
            // Update UI
            updateUI();
            updateRank();
            renderHoldPiece();
            
            // Start game loop
            updateDropSpeed();
            
            // Hide start screen
            startScreen.classList.add('hidden');
        }
        
        // Pause the game
        function pauseGame() {
            if (gameOver) return;
            
            isPaused = !isPaused;
            
            if (isPaused) {
                clearInterval(dropInterval);
                pauseScreen.classList.remove('hidden');
            } else {
                updateDropSpeed();
                pauseScreen.classList.add('hidden');
            }
        }
        
        // End the game
        function endGame() {
            gameOver = true;
            clearInterval(dropInterval);
            
            // Update final stats
            document.getElementById('final-score').textContent = score;
            document.getElementById('final-lines').textContent = lines;
            document.getElementById('final-rank').textContent = getCurrentRank().name;
            
            // Save high score
            saveHighScore();
            
            // Show game over screen
            gameOverScreen.classList.remove('hidden');
        }
        
        // Save high score
        function saveHighScore() {
            const playerName = `Pirate ${Math.floor(Math.random() * 1000)}`;
            const highScore = {
                name: playerName,
                score: score,
                lines: lines,
                rank: getCurrentRank().name,
                mode: gameMode.name,
                date: new Date().toLocaleDateString()
            };
            
            highScores.push(highScore);
            
            // Sort by score (descending)
            highScores.sort((a, b) => b.score - a.score);
            
            // Keep only top 10
            highScores = highScores.slice(0, 10);
            
            // Save to localStorage
            localStorage.setItem('pirateTetrisHighScores', JSON.stringify(highScores));
            
            // Update display
            renderHighScores();
        }
        
        // Load high scores
        function loadHighScores() {
            const savedScores = localStorage.getItem('pirateTetrisHighScores');
            if (savedScores) {
                highScores = JSON.parse(savedScores);
            } else {
                // Default high scores
                highScores = [
                    { name: 'Blackbeard', score: 125000, lines: 150, rank: 'Pirate Captain', mode: 'Normal Seas', date: '10/26/2023' },
                    { name: 'Calico Jack', score: 98000, lines: 120, rank: 'First Mate', mode: 'Stormy Seas', date: '10/25/2023' },
                    { name: 'Anne Bonny', score: 75000, lines: 95, rank: 'Quartermaster', mode: 'Treasure Hunt', date: '10/24/2023' },
                    { name: 'Long John', score: 50000, lines: 70, rank: 'Deckhand', mode: 'Normal Seas', date: '10/23/2023' },
                    { name: 'One-Eyed Willy', score: 25000, lines: 40, rank: 'Powder Monkey', mode: 'Stormy Seas', date: '10/22/2023' }
                ];
            }
        }
        
        // Render high scores
        function renderHighScores() {
            highScoresList.innerHTML = '';
            
            highScores.forEach((score, index) => {
                const scoreElement = document.createElement('div');
                scoreElement.className = 'high-score-item';
                scoreElement.innerHTML = `
                    <div class="high-score-name">${index + 1}. ${score.name}</div>
                    <div class="high-score-value">${score.score.toLocaleString()}</div>
                `;
                highScoresList.appendChild(scoreElement);
            });
        }
        
        // Show start screen
        function showStartScreen() {
            startScreen.classList.remove('hidden');
        }
        
        // Setup event listeners
        function setupEventListeners() {
            // Keyboard controls
            document.addEventListener('keydown', (e) => {
                if (gameOver) return;
                
                switch (e.key) {
                    case 'ArrowLeft':
                        movePiece(-1, 0);
                        break;
                    case 'ArrowRight':
                        movePiece(1, 0);
                        break;
                    case 'ArrowDown':
                        movePiece(0, 1);
                        break;
                    case 'ArrowUp':
                        rotatePiece();
                        break;
                    case ' ':
                        dropPiece();
                        break;
                    case 'p':
                    case 'P':
                        pauseGame();
                        break;
                    case 'c':
                    case 'C':
                        holdCurrentPiece();
                        break;
                }
            });
            
            // Control buttons
            controlButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.dataset.action;
                    
                    switch (action) {
                        case 'left':
                            movePiece(-1, 0);
                            break;
                        case 'right':
                            movePiece(1, 0);
                            break;
                        case 'down':
                            movePiece(0, 1);
                            break;
                        case 'rotate':
                            rotatePiece();
                            break;
                        case 'drop':
                            dropPiece();
                            break;
                        case 'pause':
                            pauseGame();
                            break;
                    }
                });
            });
            
            // Game state buttons
            startButton.addEventListener('click', startGame);
            resumeButton.addEventListener('click', () => pauseGame());
            restartButton.addEventListener('click', () => {
                pauseScreen.classList.add('hidden');
                startGame();
            });
            playAgainButton.addEventListener('click', () => {
                gameOverScreen.classList.add('hidden');
                startGame();
            });
            
            // Mode selection buttons
            modeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const mode = button.dataset.mode;
                    
                    switch (mode) {
                        case 'normal':
                            gameMode = GAME_MODES.NORMAL;
                            break;
                        case 'stormy':
                            gameMode = GAME_MODES.STORMY;
                            break;
                        case 'treasure':
                            gameMode = GAME_MODES.TREASURE;
                            break;
                    }
                    
                    // Update button styling
                    modeButtons.forEach(btn => {
                        btn.style.backgroundColor = '#8B4513';
                        btn.style.transform = 'none';
                    });
                    button.style.backgroundColor = '#A0522D';
                    button.style.transform = 'translateY(-3px)';
                });
            });
            
            // Initialize with normal mode selected
            document.querySelector('.mode-button[data-mode="normal"]').style.backgroundColor = '#A0522D';
            document.querySelector('.mode-button[data-mode="normal"]').style.transform = 'translateY(-3px)';
        }
        
        // Initialize the game when the page loads
        window.addEventListener('load', init);
   