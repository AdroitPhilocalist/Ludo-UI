// Import constants if available
// import { getBoardConfig, PLAYERS, COLORS } from './constants.js';

class LudoGame {
    constructor() {
        this.boardElement = document.getElementById('ludoBoard');
        this.config = window.gameConfig;
        this.tokens = {}; // Store token positions and states
        
        this.initializeGame();
    }
    
    initializeGame() {
        console.log('Initializing Ludo Game with config:', this.config);
        this.initializeTokens();
        this.generateBoard();
        this.updateStatusDisplay();
    }
    
    getActivePlayers() {
        const numPlayers = parseInt(this.config.numPlayers);
        
        // Define player arrangements based on number of players
        switch (numPlayers) {
            case 2:
                // For 2 players: Blue and Green (diagonally opposite)
                return ['BLUE', 'GREEN'];
            case 3:
                // For 3 players: Red, Blue, Yellow (skip Green)
                return ['RED', 'BLUE', 'YELLOW'];
            case 4:
                // For 4 players: All players
                return ['RED', 'BLUE', 'GREEN', 'YELLOW'];
            default:
                return ['RED', 'BLUE'];
        }
    }
    
    initializeTokens() {
        const numTokens = parseInt(this.config.numTokens);
        const activePlayers = this.getActivePlayers();
        
        // Initialize token data for active players only
        activePlayers.forEach(player => {
            this.tokens[player] = [];
            
            for (let j = 0; j < numTokens; j++) {
                this.tokens[player].push({
                    id: `${player}_${j}`,
                    player: player,
                    position: null, // null means in home area
                    pathIndex: -1,  // -1 means not on path
                    state: 'IN_HOME'
                });
            }
        });
        
        console.log('Tokens initialized:', this.tokens);
        console.log('Active players:', activePlayers);
    }
    
    getBoardDimensions(boardSize) {
        const dimensionMap = {
            7: 9, 9: 11, 11: 13, 13: 15
        };
        return dimensionMap[parseInt(boardSize)];
    }
    
    generateBoard() {
        const boardSize = parseInt(this.config.boardSize);
        const gridSize = this.getBoardDimensions(boardSize);
        
        console.log(`Generating board: ${boardSize} squares -> ${gridSize}x${gridSize} grid`);
        
        // Clear existing board
        this.boardElement.innerHTML = '';
        
        // Remove previous board size classes
        this.boardElement.className = 'ludo-board';
        this.boardElement.classList.add(`board-size-${boardSize}`);
        
        // Generate squares with animation delay
        let animationDelay = 0;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const square = this.createSquare(row, col, gridSize, boardSize);
                square.style.animationDelay = `${animationDelay * 10}ms`;
                this.boardElement.appendChild(square);
                animationDelay++;
            }
        }
        
        // Add tokens to home areas after board generation
        setTimeout(() => {
            this.placeTokensInHomeAreas();
        }, 500);
        
        this.updateStatusDisplay();
    }
    
    createSquare(row, col, gridSize, boardSize) {
        const square = document.createElement('div');
        square.className = 'square';
        square.dataset.row = row;
        square.dataset.col = col;
        
        // Determine square type based on position
        const squareClasses = this.getSquareType(row, col, gridSize, boardSize);
        
        // Add classes properly
        if (Array.isArray(squareClasses)) {
            square.classList.add(...squareClasses);
        } else if (typeof squareClasses === 'string') {
            const classArray = squareClasses.split(' ').filter(cls => cls.trim() !== '');
            square.classList.add(...classArray);
        }
        
        // Add coordinate text for debugging (remove in production)
        const coordText = document.createElement('span');
        coordText.className = 'coord-text';
        coordText.textContent = `${row},${col}`;
        square.appendChild(coordText);
        
        // Add click event for future interactions
        square.addEventListener('click', () => {
            this.onSquareClick(row, col, square);
        });
        
        return square;
    }
    
    placeTokensInHomeAreas() {
        const activePlayers = this.getActivePlayers();
        
        activePlayers.forEach(player => {
            const homeSquares = this.getHomeSquares(player);
            const tokens = this.tokens[player];
            
            tokens.forEach((token, index) => {
                if (index < homeSquares.length) {
                    const homeSquare = homeSquares[index];
                    const square = document.querySelector(`[data-row="${homeSquare.row}"][data-col="${homeSquare.col}"]`);
                    
                    if (square) {
                        this.addTokenToSquare(square, token);
                    }
                }
            });
        });
    }
    
    getHomeSquares(player) {
        const boardSize = parseInt(this.config.boardSize);
        const gridSize = this.getBoardDimensions(boardSize);
        const homeSize = Math.floor((gridSize - 3) / 2);
        
        let homeSquares = [];
        
        switch (player) {
            case 'RED': // Top-left
                for (let row = 1; row < homeSize - 1; row++) {
                    for (let col = 1; col < homeSize - 1; col++) {
                        homeSquares.push({ row, col });
                    }
                }
                break;
            case 'BLUE': // Top-right
                for (let row = 1; row < homeSize - 1; row++) {
                    for (let col = gridSize - homeSize + 1; col < gridSize - 1; col++) {
                        homeSquares.push({ row, col });
                    }
                }
                break;
            case 'GREEN': // Bottom-left
                for (let row = gridSize - homeSize + 1; row < gridSize - 1; row++) {
                    for (let col = 1; col < homeSize - 1; col++) {
                        homeSquares.push({ row, col });
                    }
                }
                break;
            case 'YELLOW': // Bottom-right
                for (let row = gridSize - homeSize + 1; row < gridSize - 1; row++) {
                    for (let col = gridSize - homeSize + 1; col < gridSize - 1; col++) {
                        homeSquares.push({ row, col });
                    }
                }
                break;
        }
        
        return homeSquares;
    }
    
    addTokenToSquare(square, token) {
        const tokenElement = document.createElement('div');
        tokenElement.className = `token token-${token.player.toLowerCase()}`;
        tokenElement.dataset.tokenId = token.id;
        tokenElement.dataset.player = token.player;
        
        // Add token number
        tokenElement.textContent = token.id.split('_')[1];
        
        // Add click handler for token
        tokenElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onTokenClick(token, tokenElement);
        });
        
        square.appendChild(tokenElement);
    }
    
    onTokenClick(token, tokenElement) {
        console.log('Token clicked:', token);
        
        // Add selection effect
        document.querySelectorAll('.token').forEach(t => t.classList.remove('selected'));
        tokenElement.classList.add('selected');
        
        // Add pulse effect
        tokenElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            tokenElement.style.transform = '';
        }, 200);
    }
    
    getSquareType(row, col, gridSize, boardSize) {
        const center = Math.floor(gridSize / 2);
        const homeSize = Math.floor((gridSize - 3) / 2);
        
        // Center square (finish area)
        if (row === center && col === center) {
            return 'center';
        }
        
        // Starting squares (check this before home finish area)
        const startingSquare = this.getStartingSquare(row, col, boardSize);
        if (startingSquare) {
            return startingSquare;
        }
        
        // Safe squares (check before home entrance paths)
        const safeSquare = this.getSafeSquare(row, col, boardSize);
        if (safeSquare) {
            return safeSquare;
        }
        
        // Home entrance paths (check before home finish area)
        const homeEntrancePath = this.getHomeEntrancePath(row, col, boardSize);
        if (homeEntrancePath) {
            return homeEntrancePath;
        }
        
        // Home finish area based on board size
        if (this.isHomeFinishArea(row, col, boardSize)) {
            return 'home-finish';
        }
        
        // Home areas (corners) with color identification
        if (row < homeSize && col < homeSize) {
            return ['home-area', 'red-home']; // Top-left: Red
        }
        if (row < homeSize && col > gridSize - homeSize - 1) {
            return ['home-area', 'blue-home']; // Top-right: Blue
        }
        if (row > gridSize - homeSize - 1 && col < homeSize) {
            return ['home-area', 'green-home']; // Bottom-left: Green
        }
        if (row > gridSize - homeSize - 1 && col > gridSize - homeSize - 1) {
            return ['home-area', 'yellow-home']; // Bottom-right: Yellow
        }
        
        // Path squares (the playable path around the board)
        if (this.isPathSquare(row, col, gridSize)) {
            return 'path';
        }
        
        // Default square
        return 'normal';
    }
    
    getStartingSquare(row, col, boardSize) {
        const startingSquares = {
            7: { red: { row: 3, col: 1 }, blue: { row: 1, col: 5 }, yellow: { row: 5, col: 7 }, green: { row: 7, col: 3 } },
            9: { red: { row: 4, col: 1 }, blue: { row: 1, col: 6 }, yellow: { row: 6, col: 9 }, green: { row: 9, col: 4 } },
            11: { red: { row: 5, col: 1 }, blue: { row: 1, col: 7 }, yellow: { row: 7, col: 11 }, green: { row: 11, col: 5 } },
            13: { red: { row: 6, col: 1 }, blue: { row: 1, col: 8 }, yellow: { row: 8, col: 13 }, green: { row: 13, col: 6 } }
        };
        
        const squares = startingSquares[parseInt(boardSize)];
        if (!squares) return null;
        
        if (row === squares.red.row && col === squares.red.col) return ['starting-square', 'red-start'];
        if (row === squares.blue.row && col === squares.blue.col) return ['starting-square', 'blue-start'];
        if (row === squares.yellow.row && col === squares.yellow.col) return ['starting-square', 'yellow-start'];
        if (row === squares.green.row && col === squares.green.col) return ['starting-square', 'green-start'];
        
        return null;
    }
    
    getSafeSquare(row, col, boardSize) {
        const safeSquares = {
            7: [{ row: 5, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 6 }, { row: 6, col: 5 }],
            9: [{ row: 6, col: 2 }, { row: 2, col: 4 }, { row: 4, col: 8 }, { row: 8, col: 6 }],
            11: [{ row: 7, col: 2 }, { row: 2, col: 5 }, { row: 5, col: 10 }, { row: 10, col: 7 }],
            13: [{ row: 8, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 12 }, { row: 12, col: 8 }]
        };
        
        const squares = safeSquares[parseInt(boardSize)];
        if (!squares) return null;
        
        for (let safeSquare of squares) {
            if (row === safeSquare.row && col === safeSquare.col) {
                return 'safe-square';
            }
        }
        return null;
    }
    
    getHomeEntrancePath(row, col, boardSize) {
        const entrancePaths = {
            7: {
                red: { row: 4, colStart: 1, colEnd: 2 },
                blue: { rowStart: 1, rowEnd: 2, col: 4 },
                yellow: { row: 4, colStart: 6, colEnd: 7 },
                green: { rowStart: 6, rowEnd: 7, col: 4 }
            },
            9: {
                red: { row: 5, colStart: 1, colEnd: 3 },
                blue: { rowStart: 1, rowEnd: 3, col: 5 },
                yellow: { row: 5, colStart: 7, colEnd: 9 },
                green: { rowStart: 7, rowEnd: 9, col: 5 }
            },
            11: {
                red: { row: 6, colStart: 1, colEnd: 4 },
                blue: { rowStart: 1, rowEnd: 4, col: 6 },
                yellow: { row: 6, colStart: 8, colEnd: 11 },
                green: { rowStart: 8, rowEnd: 11, col: 6 }
            },
            13: {
                red: { row: 7, colStart: 1, colEnd: 5 },
                blue: { rowStart: 1, rowEnd: 5, col: 7 },
                yellow: { row: 7, colStart: 9, colEnd: 13 },
                green: { rowStart: 9, rowEnd: 13, col: 7 }
            }
        };
        
        const paths = entrancePaths[parseInt(boardSize)];
        if (!paths) return null;
        
        if (row === paths.red.row && col >= Math.min(paths.red.colStart, paths.red.colEnd) && col <= Math.max(paths.red.colStart, paths.red.colEnd)) {
            return ['home-entrance', 'red-entrance'];
        }
        if (col === paths.blue.col && row >= Math.min(paths.blue.rowStart, paths.blue.rowEnd) && row <= Math.max(paths.blue.rowStart, paths.blue.rowEnd)) {
            return ['home-entrance', 'blue-entrance'];
        }
        if (row === paths.yellow.row && col >= Math.min(paths.yellow.colStart, paths.yellow.colEnd) && col <= Math.max(paths.yellow.colStart, paths.yellow.colEnd)) {
            return ['home-entrance', 'yellow-entrance'];
        }
        if (col === paths.green.col && row >= Math.min(paths.green.rowStart, paths.green.rowEnd) && row <= Math.max(paths.green.rowStart, paths.green.rowEnd)) {
            return ['home-entrance', 'green-entrance'];
        }
        
        return null;
    }
    
    isHomeFinishArea(row, col, boardSize) {
        const finishAreas = {
            7: { start: 3, end: 5 }, 9: { start: 4, end: 6 }, 11: { start: 5, end: 7 }, 13: { start: 6, end: 8 }
        };
        
        const area = finishAreas[parseInt(boardSize)];
        if (!area) return false;
        
        return row >= area.start && row <= area.end && col >= area.start && col <= area.end;
    }
    
    isPathSquare(row, col, gridSize) {
        const center = Math.floor(gridSize / 2);
        const homeSize = Math.floor((gridSize - 3) / 2);
        
        if (row === homeSize || row === center || row === gridSize - homeSize - 1) {
            if (col >= homeSize && col <= gridSize - homeSize - 1) {
                return true;
            }
        }
        
        if (col === homeSize || col === center || col === gridSize - homeSize - 1) {
            if (row >= homeSize && row <= gridSize - homeSize - 1) {
                return true;
            }
        }
        
        return false;
    }
    
    onSquareClick(row, col, square) {
        console.log(`Square clicked: (${row}, ${col}) - Type: ${square.className}`);
        
        // Add visual feedback
        const originalBg = square.style.backgroundColor;
        square.style.backgroundColor = '#007bff';
        square.style.color = 'white';
        square.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            square.style.backgroundColor = originalBg;
            square.style.color = '';
            square.style.transform = '';
        }, 300);
    }
    
    updateStatusDisplay() {
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = `${this.getBoardDimensions(this.config.boardSize)}×${this.getBoardDimensions(this.config.boardSize)} Board Generated`;
        }
    }
}

// Global functions
function goHome() {
    window.location.href = '/';
}

function regenerateBoard() {
    if (window.ludoGame) {
        window.ludoGame.generateBoard();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Ludo Game...');
    window.ludoGame = new LudoGame();
});

// Add utility functions
window.LudoUtils = {
    getBoardDimensions: function(boardSize) {
        const dimensionMap = { 7: 9, 9: 11, 11: 13, 13: 15 };
        return dimensionMap[parseInt(boardSize)];
    },
    
    getTotalSquares: function(boardSize) {
        const gridSize = this.getBoardDimensions(boardSize);
        return gridSize * gridSize;
    },
    
    getGameStats: function() {
        const config = window.gameConfig;
        const gridSize = this.getBoardDimensions(config.boardSize);
        return {
            players: config.numPlayers,
            tokens: config.numTokens,
            boardSize: config.boardSize,
            gridDimensions: `${gridSize}×${gridSize}`,
            totalSquares: this.getTotalSquares(config.boardSize)
        };
    }
};

console.log('Game utilities loaded:', window.LudoUtils.getGameStats());
