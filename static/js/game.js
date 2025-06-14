// Import constants if available
import { getBoardConfig, PLAYERS, COLORS, UTILS } from './constants.js';

class LudoGame {
    constructor() {
        this.boardElement = document.getElementById('ludoBoard');
        this.config = window.gameConfig;
        this.tokens = {}; // Store token positions and states
        this.gameState = 'WAITING_FOR_DICE'; // Current game state
        this.currentPlayer = 1; // Current player (1-based)
        this.gameHistory = []; // Store all moves
        this.moveCount = {}; // Track moves per player
        this.currentRound = 0;
        this.boardConfig = null;
        this.finalPosition = 0; // Dynamic final position based on board size
        this.maxMoves = 0; // Dynamic move limit
        this.safeSquares = []; // Dynamic safe squares
        this.playerPositions = {}; // Track actual game positions (like Python version)
        
        this.initializeGame();
    }
    
    initializeGame() {
        console.log('Initializing Ludo Game with config:', this.config);
        this.setupGameConfiguration();
        this.initializeTokens();
        this.initializeGameLogs();
        this.generateBoard();
        this.updateStatusDisplay();
        this.connectDiceRoller();
    }
    
    setupGameConfiguration() {
        // Get board configuration from constants
        this.boardConfig = getBoardConfig(this.config.boardSize);
        
        // Calculate dynamic final position based on board size
        this.finalPosition = this.calculateFinalPosition();
        
        // Set dynamic move limits
        const numPlayers = parseInt(this.config.numPlayers);
        const baseRounds = 16;
        this.maxMoves = Math.floor(baseRounds * 1.5);
        
        // Initialize move counters for all players
        for (let i = 1; i <= numPlayers; i++) {
            this.moveCount[i] = 0;
        }
        
        // Get safe squares from board configuration
        this.safeSquares = this.boardConfig.SAFE_SQUARES.map(sq => `${sq.row},${sq.col}`);
        
        console.log('Game configuration:', {
            finalPosition: this.finalPosition,
            maxMoves: this.maxMoves,
            safeSquares: this.safeSquares,
            boardConfig: this.boardConfig
        });
    }
    
    calculateFinalPosition() {
        // Calculate final position based on path length
        const boardSize = parseInt(this.config.boardSize);
        
        // Use the longest path as reference (typically RED player path)
        const redPath = this.boardConfig.GAME_PATHS.RED;
        return redPath.length - 1; // Last index in path
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
        activePlayers.forEach((player, playerIndex) => {
            const playerId = playerIndex + 1; // Convert to 1-based player ID
            
            this.tokens[player] = [];
            this.playerPositions[playerId] = [];
            
            for (let j = 0; j < numTokens; j++) {
                this.tokens[player].push({
                    id: `${player}_${j}`,
                    player: player,
                    playerId: playerId,
                    tokenIndex: j,
                    position: null, // null means in home area
                    pathIndex: 0,  // Start at beginning of path
                    state: 'IN_HOME'
                });
                
                // Initialize position in game logic (similar to Python version)
                this.playerPositions[playerId].push(0); // Start at path index 0
            }
        });
        
        console.log('Tokens initialized:', this.tokens);
        console.log('Player positions:', this.playerPositions);
        console.log('Active players:', activePlayers);
    }
    
    // ============ GAME LOGIC METHODS (Ported from Python) ============
    
    rollThreeDice() {
        // Simulate rolling three independent dice
        return [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
    }
    
    isSafe(pathIndex, playerId) {
        // Check if position is safe: either predefined safe square or occupied by multiple own tokens
        const position = this.getPositionFromPathIndex(pathIndex, playerId);
        if (!position) return false;
        
        const posKey = `${position.row},${position.col}`;
        const isInSafeSquares = this.safeSquares.includes(posKey);
        const multipleTokens = this.playerPositions[playerId].filter(pos => pos === pathIndex).length > 1;
        
        return isInSafeSquares || multipleTokens;
    }
    
    getPositionFromPathIndex(pathIndex, playerId) {
        const player = this.getPlayerNameFromId(playerId);
        const path = this.boardConfig.GAME_PATHS[player];
        
        if (pathIndex >= 0 && pathIndex < path.length) {
            return path[pathIndex];
        }
        return null;
    }
    
    getPlayerNameFromId(playerId) {
        const activePlayers = this.getActivePlayers();
        return activePlayers[playerId - 1]; // Convert 1-based to 0-based
    }
    
    moveToken(playerId, tokenIndex, diceValue) {
        // Move the selected token of the player using dice value
        const currentPathIndex = this.playerPositions[playerId][tokenIndex];
        
        // If already finished, no movement
        if (currentPathIndex >= this.finalPosition) {
            return { finalPos: currentPathIndex, finished: false, captured: false };
        }
        
        const newPathIndex = currentPathIndex + diceValue;
        
        // If move leads to or beyond final position, promote the token
        if (newPathIndex >= this.finalPosition) {
            this.playerPositions[playerId][tokenIndex] = this.finalPosition;
            this.updateTokenVisualPosition(playerId, tokenIndex, this.finalPosition);
            return { finalPos: this.finalPosition, finished: true, captured: false };
        }
        
        // Check for opponent capture
        let captured = false;
        const activePlayers = this.getActivePlayers();
        
        for (let oppPlayerId = 1; oppPlayerId <= activePlayers.length; oppPlayerId++) {
            if (oppPlayerId === playerId) continue;
            
            for (let i = 0; i < this.playerPositions[oppPlayerId].length; i++) {
                if (this.playerPositions[oppPlayerId][i] === newPathIndex && 
                    !this.isSafe(newPathIndex, oppPlayerId)) {
                    
                    // Reset opponent token to start
                    this.playerPositions[oppPlayerId][i] = 0;
                    this.updateTokenVisualPosition(oppPlayerId, i, 0);
                    captured = true;
                    
                    // Add capture animation
                    this.animateCapture(oppPlayerId, i);
                }
            }
        }
        
        // Update current token position
        this.playerPositions[playerId][tokenIndex] = newPathIndex;
        this.updateTokenVisualPosition(playerId, tokenIndex, newPathIndex);
        
        return { finalPos: newPathIndex, finished: false, captured };
    }
    
    selectToken(playerId) {
        // Select token using greedy strategy (like Python version)
        const numTokens = parseInt(this.config.numTokens);
        
        // Find unfinished tokens
        const unfinishedTokens = [];
        for (let i = 0; i < numTokens; i++) {
            if (this.playerPositions[playerId][i] < this.finalPosition) {
                unfinishedTokens.push(i);
            }
        }
        
        if (unfinishedTokens.length === 0) {
            return 0; // Default to first token if all finished
        }
        
        // Use greedy strategy: prefer token that's not finished, prioritize first token
        return unfinishedTokens[0];
    }
    
    async bonusMove(playerId, diceValue = null) {
        // Handle bonus move if criteria met and moves left
        if (this.moveCount[playerId] >= this.maxMoves) {
            return;
        }
        
        const val = diceValue || Math.floor(Math.random() * 6) + 1;
        const tokenIndex = this.selectToken(playerId);
        
        // Record initial positions
        const initPositions = this.getAllPositions();
        
        // Make the move
        const result = this.moveToken(playerId, tokenIndex, val);
        
        // Record final positions
        const finalPositions = this.getAllPositions();
        
        // Record move in history
        this.gameHistory.push({
            finalPositions: finalPositions,
            initPositions: initPositions,
            player: playerId,
            token: tokenIndex + 1,
            diceValue: val,
            result: result,
            timestamp: new Date(),
            moveType: 'bonus'
        });
        
        this.moveCount[playerId]++;
        
        // Add visual delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Recursively trigger another bonus move if condition satisfied
        if ((val === 6 || result.finished || result.captured) && 
            this.moveCount[playerId] < this.maxMoves) {
            await this.bonusMove(playerId);
        }
    }
    
    getAllPositions() {
        const positions = [];
        const activePlayers = this.getActivePlayers();
        
        activePlayers.forEach((_, playerIndex) => {
            const playerId = playerIndex + 1;
            positions.push(...this.playerPositions[playerId]);
        });
        
        return positions;
    }
    
    async playTurn(rollerPlayerId, diceValues) {
        // Execute a full turn with 3 dice (like Python version)
        console.log(`Player ${rollerPlayerId} rolled dice:`, diceValues);
        
        const activePlayers = this.getActivePlayers();
        const numPlayers = activePlayers.length;
        
        // Generate move sequence based on current player and dice arrangement
        const moveSequence = this.generateMoveSequence(rollerPlayerId, numPlayers);
        
        // Perform the three moves
        for (let i = 0; i < 3; i++) {
            const currentPlayer = moveSequence[i];
            const diceValue = diceValues[i];
            
            if (this.moveCount[currentPlayer] >= this.maxMoves) {
                continue; // Skip if player has reached move limit
            }
            
            await this.performFullMove(currentPlayer, diceValue, diceValues);
            
            // Add delay between moves for better visualization
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Check for game end conditions
        this.checkGameEnd();
    }
    
    generateMoveSequence(rollerPlayerId, numPlayers) {
        // Generate move sequence based on game rules
        if (numPlayers === 2) {
            const otherPlayer = rollerPlayerId === 1 ? 2 : 1;
            return [rollerPlayerId, otherPlayer, rollerPlayerId];
        } else if (numPlayers === 3) {
            const otherPlayer1 = (rollerPlayerId % 3) + 1;
            const otherPlayer2 = ((rollerPlayerId + 1) % 3) + 1;
            return [rollerPlayerId, otherPlayer1, otherPlayer2];
        } else if (numPlayers === 4) {
            const otherPlayer1 = (rollerPlayerId % 4) + 1;
            const otherPlayer2 = ((rollerPlayerId + 1) % 4) + 1;
            return [rollerPlayerId, otherPlayer1, otherPlayer2];
        }
        
        return [rollerPlayerId, rollerPlayerId, rollerPlayerId];
    }
    
    async performFullMove(playerId, diceValue, allDiceValues) {
        // Perform a move and handle all bonus moves (like Python version)
        if (this.moveCount[playerId] >= this.maxMoves) {
            return;
        }
        
        const initPositions = this.getAllPositions();
        const usedValues = [diceValue];
        
        let tokenIndex = this.selectToken(playerId);
        let result = this.moveToken(playerId, tokenIndex, diceValue);
        
        // Handle all bonus moves iteratively
        let currentValue = diceValue;
        while ((currentValue === 6 || result.finished || result.captured) && 
               this.moveCount[playerId] < this.maxMoves) {
            
            // Generate new bonus dice value
            currentValue = Math.floor(Math.random() * 6) + 1;
            usedValues.push(currentValue);
            
            // Select token for bonus move
            tokenIndex = this.selectToken(playerId);
            result = this.moveToken(playerId, tokenIndex, currentValue);
            
            // Add visual delay
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const finalPositions = this.getAllPositions();
        // Record the complete move (including all bonus moves) as one entry
        const moveData = {
            finalPositions: finalPositions,
            initPositions: initPositions,
            player: playerId,
            token: tokenIndex + 1,
            allDiceValues: allDiceValues,
            usedValues: usedValues,
            timestamp: new Date(),
            moveType: usedValues.length > 1 ? 'bonus' : 'regular',
            diceValue: usedValues[0],
            result: result
        };
        
        this.gameHistory.push(moveData);
        this.logMove(moveData); // Add detailed logging
        
        this.moveCount[playerId]++;
        
        // Update UI
        this.updateGameStatus();
    }
    
    // ============ VISUAL UPDATE METHODS ============
    
    updateTokenVisualPosition(playerId, tokenIndex, pathIndex) {
        const playerName = this.getPlayerNameFromId(playerId);
        const token = this.tokens[playerName][tokenIndex];
        
        if (!token) return;
        
        // Remove token from current position
        const currentTokenElement = document.querySelector(`[data-token-id="${token.id}"]`);
        if (currentTokenElement) {
            currentTokenElement.remove();
        }
        
        // Get new position
        let targetSquare;
        
        if (pathIndex === 0) {
            // Token is in home area
            const homeSquares = this.getHomeSquares(playerName);
            targetSquare = document.querySelector(`[data-row="${homeSquares[tokenIndex].row}"][data-col="${homeSquares[tokenIndex].col}"]`);
        } else if (pathIndex >= this.finalPosition) {
            // Token has finished
            const centerPos = this.boardConfig.CENTER;
            targetSquare = document.querySelector(`[data-row="${centerPos.row}"][data-col="${centerPos.col}"]`);
        } else {
            // Token is on the path
            const position = this.getPositionFromPathIndex(pathIndex, playerId);
            if (position) {
                targetSquare = document.querySelector(`[data-row="${position.row}"][data-col="${position.col}"]`);
            }
        }
        
        // Add token to new position
        if (targetSquare) {
            this.addTokenToSquare(targetSquare, token);
        }
        
        // Update token state
        token.pathIndex = pathIndex;
        if (pathIndex >= this.finalPosition) {
            token.state = 'FINISHED';
        } else if (pathIndex === 0) {
            token.state = 'IN_HOME';
        } else {
            token.state = 'ON_BOARD';
        }
    }
    
    animateCapture(playerId, tokenIndex) {
        const playerName = this.getPlayerNameFromId(playerId);
        const token = this.tokens[playerName][tokenIndex];
        const tokenElement = document.querySelector(`[data-token-id="${token.id}"]`);
        
        if (tokenElement) {
            tokenElement.classList.add('captured');
            setTimeout(() => {
                tokenElement.classList.remove('captured');
            }, 600);
        }
    }
    
    updateGameStatus() {
        // Update any status displays
        const statusElement = document.querySelector('.game-status');
        if (statusElement) {
            statusElement.textContent = `Round ${this.currentRound} - Player ${this.currentPlayer}'s turn`;
        }
        
        // Update move counters
        this.updateMoveCounters();
    }
    
    updateMoveCounters() {
        const activePlayers = this.getActivePlayers();
        activePlayers.forEach((_, playerIndex) => {
            const playerId = playerIndex + 1;
            const counterElement = document.querySelector(`#player-${playerId}-moves`);
            if (counterElement) {
                counterElement.textContent = `${this.moveCount[playerId]}/${this.maxMoves}`;
            }
        });
    }
    
    checkGameEnd() {
        const activePlayers = this.getActivePlayers();
        
        // Check if any player has all tokens finished
        for (let playerIndex = 0; playerIndex < activePlayers.length; playerIndex++) {
            const playerId = playerIndex + 1;
            const allFinished = this.playerPositions[playerId].every(pos => pos >= this.finalPosition);
            
            if (allFinished) {
                this.endGame(playerId);
                return;
            }
        }
        
        // Check if move limits reached
        const allReachedLimit = activePlayers.every((_, playerIndex) => {
            const playerId = playerIndex + 1;
            return this.moveCount[playerId] >= this.maxMoves;
        });
        
        if (allReachedLimit) {
            this.endGame(null); // Draw/time limit
        }
    }
    
    endGame(winnerId) {
        this.gameState = 'GAME_OVER';
        
        if (winnerId) {
            const playerName = this.getPlayerNameFromId(winnerId);
            console.log(`Game Over! Player ${winnerId} (${playerName}) wins!`);
            
            // Add winner celebration animation
            const winnerTokens = document.querySelectorAll(`[data-player="${playerName}"]`);
            winnerTokens.forEach(token => {
                token.classList.add('winner');
            });
            
            // Show victory message
            this.showVictoryMessage(winnerId, playerName);
        } else {
            console.log('Game Over! Draw - Move limit reached');
            this.showDrawMessage();
        }
        
        // Disable dice rolling
        const rollButton = document.getElementById('rollDiceBtn');
        if (rollButton) {
            rollButton.disabled = true;
            rollButton.textContent = 'Game Over';
        }
    }
    
    showVictoryMessage(winnerId, playerName) {
        // Create victory modal or notification
        const message = `🎉 Player ${winnerId} (${playerName}) Wins! 🎉`;
        
        // You can enhance this with a proper modal
        alert(message);
        
        // Or create a custom victory display
        this.createVictoryDisplay(winnerId, playerName);
    }
    
    showDrawMessage() {
        alert('Game ended in a draw - Move limit reached!');
    }
    
    createVictoryDisplay(winnerId, playerName) {
        // Create a victory overlay
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        overlay.innerHTML = `
            <div class="victory-content">
                <h2>🎉 Victory! 🎉</h2>
                <p>Player ${winnerId} (${playerName}) Wins!</p>
                <button onclick="this.parentElement.parentElement.remove(); regenerateBoard();">New Game</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    // ============ DICE INTEGRATION ============
    
    connectDiceRoller() {
        // Connect with the dice roller system
        if (window.diceRoller) {
            console.log('Connected to dice roller');
        }
        
        // Override the dice roll processing
        window.ludoGame = this;
    }
    
    async processDiceRoll(rollResult) {
        // Process dice roll from the 3D dice system
        console.log('Processing dice roll:', rollResult);
        
        if (this.gameState !== 'WAITING_FOR_DICE') {
            console.log('Game not ready for dice roll');
            return;
        }
        
        this.gameState = 'PROCESSING_MOVE';
        // Log the dice roll
        this.logDiceRoll(rollResult);
        
        // Get current player from dice roller
        const rollerPlayerId = rollResult.player;
        
        // Execute the turn
        await this.playTurn(rollerPlayerId, rollResult.values);
        
        // Advance to next round
        this.currentRound++;
        
        // Reset game state
        this.gameState = 'WAITING_FOR_DICE';
        
        console.log('Turn completed, game ready for next roll');
    }
    
    // ============ EXISTING METHODS (Keep all existing UI methods) ============
    
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
        // Use board configuration for precise home areas
        const homeAreas = this.boardConfig.HOME_AREAS[player];
        const numTokens = parseInt(this.config.numTokens);
        
        // Filter to get only center squares of home areas (not boundary squares)
        const centerHomeSquares = this.getCenterHomeSquares(homeAreas, player);
        
        // Return the first numTokens squares from center home area
        return centerHomeSquares.slice(0, numTokens);
    }

    // New method to get center squares of home areas
    getCenterHomeSquares(homeAreas, player) {
        // Get board dimensions
        const boardSize = parseInt(this.config.boardSize);
        const gridSize = this.getBoardDimensions(boardSize);
        const homeSize = Math.floor((gridSize - 3) / 2);
        
        // Calculate center region of each home area
        const centerSquares = [];
        
        // Define center regions for each player's home area
        const centerRegions = this.getHomeCenterRegions(homeSize, gridSize);
        
        // Get center squares for the specific player
        const playerCenterRegion = centerRegions[player];
        
        if (playerCenterRegion) {
            for (let row = playerCenterRegion.startRow; row <= playerCenterRegion.endRow; row++) {
                for (let col = playerCenterRegion.startCol; col <= playerCenterRegion.endCol; col++) {
                    centerSquares.push({ row, col });
                }
            }
        }
        
        return centerSquares;
    }
    
    // New method to define center regions for each player's home area
    getHomeCenterRegions(homeSize, gridSize) {
        // Calculate center regions for each home area (avoiding boundary squares)
        const centerOffset = Math.floor(homeSize / 3); // Offset from edges to get center area
        const centerSize = Math.max(1, homeSize - (centerOffset * 2)); // Size of center region
        
        return {
            RED: { // Top-left home area
                startRow: centerOffset + 1,
                endRow: centerOffset + centerSize,
                startCol: centerOffset + 1,
                endCol: centerOffset + centerSize
            },
            BLUE: { // Top-right home area
                startRow: centerOffset + 1,
                endRow: centerOffset + centerSize,
                startCol: gridSize - homeSize + centerOffset,
                endCol: gridSize - homeSize + centerOffset + centerSize - 1
            },
            GREEN: { // Bottom-left home area
                startRow: gridSize - homeSize + centerOffset,
                endRow: gridSize - homeSize + centerOffset + centerSize - 1,
                startCol: centerOffset + 1,
                endCol: centerOffset + centerSize
            },
            YELLOW: { // Bottom-right home area
                startRow: gridSize - homeSize + centerOffset,
                endRow: gridSize - homeSize + centerOffset + centerSize - 1,
                startCol: gridSize - homeSize + centerOffset,
                endCol: gridSize - homeSize + centerOffset + centerSize - 1
            }
        };
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
        console.log('Current position:', this.playerPositions[token.playerId][token.tokenIndex]);
        
        // Add selection effect
        document.querySelectorAll('.token').forEach(t => t.classList.remove('selected'));
        tokenElement.classList.add('selected');
        
        // Add pulse effect
        tokenElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            tokenElement.style.transform = '';
        }, 200);
        
        // Show token info
        this.showTokenInfo(token);
    }
    
    showTokenInfo(token) {
        const pathIndex = this.playerPositions[token.playerId][token.tokenIndex];
        const position = this.getPositionFromPathIndex(pathIndex, token.playerId);
        
        console.log(`Token ${token.id} info:`, {
            pathIndex: pathIndex,
            position: position,
            state: token.state,
            player: token.player,
            progress: `${pathIndex}/${this.finalPosition}`
        });
    }
    
    // Keep all existing getSquareType, getStartingSquare, getSafeSquare, etc. methods...
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
        const startSquares = this.boardConfig.START_SQUARES;
        
        if (row === startSquares.RED.row && col === startSquares.RED.col) return ['starting-square', 'red-start'];
        if (row === startSquares.BLUE.row && col === startSquares.BLUE.col) return ['starting-square', 'blue-start'];
        if (row === startSquares.YELLOW.row && col === startSquares.YELLOW.col) return ['starting-square', 'yellow-start'];
        if (row === startSquares.GREEN.row && col === startSquares.GREEN.col) return ['starting-square', 'green-start'];
        
        return null;
    }
    
    getSafeSquare(row, col, boardSize) {
        const safeSquares = this.boardConfig.SAFE_SQUARES;
        
        for (let safeSquare of safeSquares) {
            if (row === safeSquare.row && col === safeSquare.col) {
                return 'safe-square';
            }
        }
        return null;
    }
    
    getHomeEntrancePath(row, col, boardSize) {
        const entrancePaths = this.boardConfig.HOME_ENTRANCE_PATHS;
        
        // Check each player's entrance path
        for (const [player, path] of Object.entries(entrancePaths)) {
            for (const pos of path) {
                if (row === pos.row && col === pos.col) {
                    return ['home-entrance', `${player.toLowerCase()}-entrance`];
                }
            }
        }
        
        return null;
    }
    
    isHomeFinishArea(row, col, boardSize) {
        const finishArea = this.boardConfig.HOME_FINISH_AREA;
        
        for (const pos of finishArea) {
            if (row === pos.row && col === pos.col) {
                return true;
            }
        }
        return false;
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










    initializeGameLogs() {
        this.gameStartTime = new Date();
        this.detailedGameHistory = [];
        this.diceStatistics = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
        };
        this.playerStatistics = {};
        
        // Initialize player statistics
        const activePlayers = this.getActivePlayers();
        activePlayers.forEach((_, playerIndex) => {
            const playerId = playerIndex + 1;
            this.playerStatistics[playerId] = {
                name: this.getPlayerNameFromId(playerId),
                totalMoves: 0,
                bonusMoves: 0,
                captures: 0,
                finishedTokens: 0,
                diceRolls: [],
                averageDice: 0,
                longestBonus: 0,
                totalDistance: 0
            };
        });
    }
    
    logDiceRoll(rollResult) {
        // Record dice statistics
        rollResult.values.forEach(value => {
            this.diceStatistics[value]++;
        });
        
        // Add to player's dice history
        const playerId = rollResult.player;
        if (this.playerStatistics[playerId]) {
            this.playerStatistics[playerId].diceRolls.push(...rollResult.values);
            this.updatePlayerAverages(playerId);
        }
    }
    
    logMove(moveData) {
        // Enhanced move logging with detailed information
        const timestamp = new Date();
        // Get actual board coordinates for from and to positions
        const fromBoardIndex = this.getActualBoardIndex(moveData.player, moveData.initPositions, moveData.token - 1);
        const toBoardIndex = this.getActualBoardIndex(moveData.player, moveData.finalPositions, moveData.token - 1);
        const detailedMove = {
            id: this.detailedGameHistory.length + 1,
            timestamp: timestamp,
            round: this.currentRound,
            player: moveData.player,
            playerName: this.getPlayerNameFromId(moveData.player),
            token: moveData.token,
            diceValue: moveData.diceValue,
            moveType: moveData.moveType || 'regular',
            fromPosition: moveData.initPositions ? moveData.initPositions[((moveData.player - 1) * parseInt(this.config.numTokens)) + (moveData.token - 1)] : 0,
            toPosition: moveData.finalPositions ? moveData.finalPositions[((moveData.player - 1) * parseInt(this.config.numTokens)) + (moveData.token - 1)] : 0,
            fromBoardIndex: fromBoardIndex, // New: actual board coordinates
            toBoardIndex: toBoardIndex,     // New: actual board coordinates
            captured: moveData.result ? moveData.result.captured : false,
            finished: moveData.result ? moveData.result.finished : false,
            usedValues: moveData.usedValues || [moveData.diceValue],
            allDiceValues: moveData.allDiceValues || [moveData.diceValue],
            distance: moveData.diceValue,
            gameState: JSON.parse(JSON.stringify(this.playerPositions))
        };
        
        this.detailedGameHistory.push(detailedMove);
        this.updatePlayerStatistics(detailedMove);
        
        console.log('Move logged:', detailedMove);
    }
    // New method to get actual board coordinates
    getActualBoardIndex(playerId, positions, tokenIndex) {
        if (!positions) return { row: 'N/A', col: 'N/A' };
        
        const pathIndex = positions[((playerId - 1) * parseInt(this.config.numTokens)) + tokenIndex];
        
        // Handle special cases
        if (pathIndex === 0) {
            // Token is in home area - use center home squares
            const playerName = this.getPlayerNameFromId(playerId);
            const homeSquares = this.getHomeSquares(playerName);
            if (homeSquares && homeSquares[tokenIndex]) {
                return {
                    row: homeSquares[tokenIndex].row,
                    col: homeSquares[tokenIndex].col,
                    description: `Home Area Center (${homeSquares[tokenIndex].row}, ${homeSquares[tokenIndex].col})`
                };
            }
            return { row: 'Home', col: 'Center', description: 'Home Area Center' };
        }
        
        if (pathIndex >= this.finalPosition) {
            // Token is in center/finish area
            const centerPos = this.boardConfig.CENTER;
            return {
                row: centerPos.row,
                col: centerPos.col,
                description: `Finish Area (${centerPos.row}, ${centerPos.col})`
            };
        }
        
        // Token is on the game path
        const position = this.getPositionFromPathIndex(pathIndex, playerId);
        if (position) {
            return {
                row: position.row,
                col: position.col,
                description: `Board Position (${position.row}, ${position.col})`
            };
        }
        
        return { row: 'Unknown', col: 'Position', description: 'Unknown Position' };
    }

    // Enhanced method to get board position description
    getBoardPositionDescription(boardIndex) {
        if (!boardIndex || boardIndex.row === 'N/A') {
            return 'Unknown Position';
        }
        
        if (boardIndex.description) {
            return boardIndex.description;
        }
        
        return `(${boardIndex.row}, ${boardIndex.col})`;
    }
    
    updatePlayerStatistics(moveData) {
        const playerId = moveData.player;
        const stats = this.playerStatistics[playerId];
        
        if (stats) {
            stats.totalMoves++;
            stats.totalDistance += moveData.distance;
            
            if (moveData.moveType === 'bonus') {
                stats.bonusMoves++;
            }
            
            if (moveData.captured) {
                stats.captures++;
            }
            
            if (moveData.finished) {
                stats.finishedTokens++;
            }
            
            // Calculate longest bonus streak
            if (moveData.usedValues && moveData.usedValues.length > stats.longestBonus) {
                stats.longestBonus = moveData.usedValues.length;
            }
        }
    }
    
    updatePlayerAverages(playerId) {
        const stats = this.playerStatistics[playerId];
        if (stats && stats.diceRolls.length > 0) {
            const sum = stats.diceRolls.reduce((a, b) => a + b, 0);
            stats.averageDice = (sum / stats.diceRolls.length).toFixed(2);
        }
    }
    
    getGameDuration() {
        if (!this.gameStartTime) return '00:00';
        
        const now = new Date();
        const diff = now - this.gameStartTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    exportGameData() {
        return {
            gameConfig: this.config,
            startTime: this.gameStartTime,
            currentRound: this.currentRound,
            gameState: this.gameState,
            playerPositions: this.playerPositions,
            moveCount: this.moveCount,
            finalPosition: this.finalPosition,
            detailedHistory: this.detailedGameHistory,
            playerStatistics: this.playerStatistics,
            diceStatistics: this.diceStatistics,
            duration: this.getGameDuration()
        };
    }
}

// Additional CSS for new animations
const additionalCSS = `
    .victory-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }
    
    .victory-content {
        background: white;
        padding: 2rem;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: victoryBounce 0.6s ease-out;
    }
    
    @keyframes victoryBounce {
        0% { transform: scale(0) rotate(180deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(0deg); opacity: 0.8; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    .victory-content h2 {
        color: #f39c12;
        margin-bottom: 1rem;
        font-size: 2rem;
    }
    
    .victory-content button {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 1rem;
    }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Global functions
function goHome() {
    window.location.href = '/';
}

function regenerateBoard() {
    if (window.ludoGame) {
        window.ludoGame = new LudoGame();
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
    },
    
    getGameState: function() {
        return window.ludoGame ? {
            currentRound: window.ludoGame.currentRound,
            gameState: window.ludoGame.gameState,
            moveCount: window.ludoGame.moveCount,
            playerPositions: window.ludoGame.playerPositions
        } : null;
    }
};





function openGameLogs() {
    if (!window.ludoGame) {
        alert('No active game found!');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('gameLogsModal'));
    populateGameLogs();
    modal.show();
}

function populateGameLogs() {
    const game = window.ludoGame;
    const gameData = game.exportGameData();
    
    // Update summary statistics
    document.getElementById('totalMovesCount').textContent = gameData.detailedHistory.length;
    document.getElementById('currentRoundDisplay').textContent = gameData.currentRound;
    document.getElementById('gameDurationDisplay').textContent = gameData.duration;
    
    // Update filter buttons for active players
    updateFilterButtons(game.getActivePlayers().length);
    
    // Populate dashboard sections
    populatePlayerStats(gameData.playerStatistics);
    populateDiceAnalytics(gameData.diceStatistics);
    populateRecentActivity(gameData.detailedHistory.slice(-5));
    populateGameProgress(gameData.playerStatistics, game.finalPosition);
    
    // Populate timeline
    populateTimeline(gameData.detailedHistory);
    
    // Setup filter functionality
    setupFilterHandlers();
}

function updateFilterButtons(numPlayers) {
    const playerButtons = document.querySelectorAll('.filter-btn[data-filter]:not([data-filter="all"])');
    playerButtons.forEach((btn, index) => {
        if (index < numPlayers) {
            btn.style.display = 'inline-block';
        } else {
            btn.style.display = 'none';
        }
    });
}

function populatePlayerStats(playerStats) {
    const container = document.getElementById('playerStatsGrid');
    container.innerHTML = '';
    
    Object.entries(playerStats).forEach(([playerId, stats]) => {
        const playerColors = ['#e74c3c', '#3498db', '#f1c40f', '#27ae60'];
        const color = playerColors[playerId - 1] || '#667eea';
        
        const statItem = document.createElement('div');
        statItem.className = 'player-stat-item';
        statItem.style.borderLeftColor = color;
        
        statItem.innerHTML = `
            <div class="player-name">
                <div class="player-badge" style="background-color: ${color};"></div>
                Player ${playerId} (${stats.name})
            </div>
            <div class="player-stats-details">
                <div class="stat-detail">Moves: <strong>${stats.totalMoves}</strong></div>
                <div class="stat-detail">Bonus: <strong>${stats.bonusMoves}</strong></div>
                <div class="stat-detail">Captures: <strong>${stats.captures}</strong></div>
                <div class="stat-detail">Finished: <strong>${stats.finishedTokens}</strong></div>
                <div class="stat-detail">Avg Dice: <strong>${stats.averageDice}</strong></div>
                <div class="stat-detail">Distance: <strong>${stats.totalDistance}</strong></div>
            </div>
        `;
        
        container.appendChild(statItem);
    });
}

function populateDiceAnalytics(diceStats) {
    const container = document.getElementById('diceStatsContainer');
    container.innerHTML = '';
    
    const totalRolls = Object.values(diceStats).reduce((a, b) => a + b, 0);
    
    for (let i = 1; i <= 6; i++) {
        const count = diceStats[i] || 0;
        const percentage = totalRolls > 0 ? ((count / totalRolls) * 100).toFixed(1) : 0;
        
        const statItem = document.createElement('div');
        statItem.className = 'dice-stat-item';
        
        statItem.innerHTML = `
            <div class="dice-number">${i}</div>
            <div class="dice-count">${count}</div>
            <div class="dice-percentage">${percentage}%</div>
        `;
        
        container.appendChild(statItem);
    }
}

// Enhanced recent activity with board coordinates
function populateRecentActivity(recentMoves) {
    const container = document.getElementById('recentActivityList');
    container.innerHTML = '';
    
    if (recentMoves.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">No recent activity</div>';
        return;
    }
    
    recentMoves.reverse().forEach(move => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const timeAgo = getTimeAgo(move.timestamp);
        const icon = move.captured ? 'fas fa-crosshairs' : 
                    move.finished ? 'fas fa-trophy' : 
                    move.moveType === 'bonus' ? 'fas fa-star' : 'fas fa-arrows-alt';
        
        // Get simplified board position description
        const fromPos = move.fromBoardIndex ? 
            `[${move.fromBoardIndex.row},${move.fromBoardIndex.col}]` : 
            `Path ${move.fromPosition}`;
        const toPos = move.toBoardIndex ? 
            `[${move.toBoardIndex.row},${move.toBoardIndex.col}]` : 
            `Path ${move.toPosition}`;
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">
                    <strong>Player ${move.player}</strong> moved Token ${move.token}
                    <br>
                    <small class="activity-coordinates">${fromPos} → ${toPos}</small>
                    ${move.captured ? ' <span class="activity-badge capture">Captured!</span>' : ''}
                    ${move.finished ? ' <span class="activity-badge finish">Finished!</span>' : ''}
                </div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
        
        container.appendChild(activityItem);
    });
}

function populateGameProgress(playerStats, finalPosition) {
    const container = document.getElementById('gameProgressViz');
    container.innerHTML = '';
    
    Object.entries(playerStats).forEach(([playerId, stats]) => {
        const progress = Math.min((stats.totalDistance / (finalPosition * parseInt(window.gameConfig.numTokens))) * 100, 100);
        
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        
        progressItem.innerHTML = `
            <div class="progress-label">
                <span>Player ${playerId} Progress</span>
                <span>${progress.toFixed(1)}%</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
        `;
        
        container.appendChild(progressItem);
    });
}

// Update the populateTimeline function to use board coordinates
function populateTimeline(gameHistory) {
    const container = document.getElementById('gameLogsTimeline');
    container.innerHTML = '';
    
    if (gameHistory.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">No moves recorded yet</div>';
        return;
    }
    
    gameHistory.slice().reverse().forEach((move, index) => {
        const timelineEntry = document.createElement('div');
        timelineEntry.className = 'timeline-entry';
        timelineEntry.style.animationDelay = `${index * 0.1}s`;
        timelineEntry.dataset.player = move.player;
        timelineEntry.dataset.moveType = move.moveType;
        
        const playerColors = ['#e74c3c', '#3498db', '#f1c40f', '#27ae60'];
        const color = playerColors[move.player - 1] || '#667eea';
        
        const timeFormatted = move.timestamp.toLocaleTimeString();
        const badges = [];
        
        if (move.moveType === 'bonus') badges.push('<span class="move-badge bonus">Bonus</span>');
        if (move.captured) badges.push('<span class="move-badge capture">Capture</span>');
        if (move.finished) badges.push('<span class="move-badge finish">Finish</span>');
        if (badges.length === 0) badges.push('<span class="move-badge regular">Regular</span>');
        
        const diceDisplay = move.allDiceValues.map(val => 
            `<div class="timeline-die">${val}</div>`
        ).join('');
        
        // Enhanced move description with board coordinates
        const fromDesc = move.fromBoardIndex ? 
            (move.fromBoardIndex.description || `(${move.fromBoardIndex.row}, ${move.fromBoardIndex.col})`) : 
            `Path Index ${move.fromPosition}`;
            
        const toDesc = move.toBoardIndex ? 
            (move.toBoardIndex.description || `(${move.toBoardIndex.row}, ${move.toBoardIndex.col})`) : 
            `Path Index ${move.toPosition}`;
        
        // Create detailed position information
        const positionInfo = createPositionInfoElement(move);
        
        timelineEntry.innerHTML = `
            <div class="timeline-header">
                <div class="timeline-player">
                    <div class="timeline-player-badge" style="background-color: ${color};"></div>
                    Player ${move.player} (${move.playerName})
                </div>
                <div class="timeline-time">${timeFormatted}</div>
            </div>
            <div class="timeline-content">
                <div class="timeline-dice">${diceDisplay}</div>
                <div class="timeline-details">
                    <strong>Move #${move.id}</strong> - Token ${move.token}
                    <br>
                    <div class="move-path-info">
                        <div class="path-segment">
                            <span class="path-label">From:</span>
                            <span class="path-location from-location">${fromDesc}</span>
                        </div>
                        <div class="path-arrow">→</div>
                        <div class="path-segment">
                            <span class="path-label">To:</span>
                            <span class="path-location to-location">${toDesc}</span>
                        </div>
                    </div>
                    <div class="move-details-extra">
                        Used dice value: <strong>${move.diceValue}</strong>
                        ${move.usedValues.length > 1 ? ` (Bonus chain: ${move.usedValues.join(', ')})` : ''}
                        ${badges.join(' ')}
                    </div>
                    ${positionInfo}
                </div>
            </div>
        `;
        
        container.appendChild(timelineEntry);
    });
}

// New function to create detailed position information
function createPositionInfoElement(move) {
    let positionDetails = '';
    
    // Add coordinate details if available
    if (move.fromBoardIndex && move.toBoardIndex) {
        positionDetails += `
            <div class="coordinate-details">
                <div class="coordinate-item">
                    <span class="coord-label">From Coordinates:</span>
                    <span class="coord-value">[${move.fromBoardIndex.row}, ${move.fromBoardIndex.col}]</span>
                </div>
                <div class="coordinate-item">
                    <span class="coord-label">To Coordinates:</span>
                    <span class="coord-value">[${move.toBoardIndex.row}, ${move.toBoardIndex.col}]</span>
                </div>
            </div>
        `;
    }
    
    // Add path index information for reference
    positionDetails += `
        <div class="path-index-details">
            <small class="text-muted">
                Path progression: ${move.fromPosition} → ${move.toPosition}
                ${move.captured ? ' | Enemy captured!' : ''}
                ${move.finished ? ' | Token finished!' : ''}
            </small>
        </div>
    `;
    
    return positionDetails;
}

function setupFilterHandlers() {
    // Player filter handlers
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            const filter = btn.dataset.filter;
            filterTimelineByPlayer(filter);
        });
    });
    
    // Move type filter handlers
    document.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-btn[data-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            const type = btn.dataset.type;
            filterTimelineByType(type);
        });
    });
}

function filterTimelineByPlayer(playerId) {
    const entries = document.querySelectorAll('.timeline-entry');
    
    entries.forEach(entry => {
        if (playerId === 'all' || entry.dataset.player === playerId) {
            entry.style.display = 'block';
            entry.style.animation = 'slideInUp 0.4s ease-out';
        } else {
            entry.style.display = 'none';
        }
    });
}

function filterTimelineByType(moveType) {
    const entries = document.querySelectorAll('.timeline-entry');
    
    entries.forEach(entry => {
        const shouldShow = moveType === 'all' || 
                          entry.dataset.moveType === moveType ||
                          (moveType === 'capture' && entry.innerHTML.includes('move-badge capture')) ||
                          (moveType === 'finish' && entry.innerHTML.includes('move-badge finish'));
        
        if (shouldShow) {
            entry.style.display = 'block';
            entry.style.animation = 'slideInUp 0.4s ease-out';
        } else {
            entry.style.display = 'none';
        }
    });
}

function exportGameLogs() {
    if (!window.ludoGame) {
        alert('No active game found!');
        return;
    }
    
    const gameData = window.ludoGame.exportGameData();
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ludo_game_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearGameLogs() {
    if (!window.ludoGame) {
        alert('No active game found!');
        return;
    }
    
    if (confirm('Are you sure you want to clear all game logs? This action cannot be undone.')) {
        window.ludoGame.detailedGameHistory = [];
        window.ludoGame.diceStatistics = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        window.ludoGame.initializeGameLogs();
        
        // Close modal and show confirmation
        const modal = bootstrap.Modal.getInstance(document.getElementById('gameLogsModal'));
        modal.hide();
        
        alert('Game logs cleared successfully!');
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
}

function openGameInfo() {
    const modal = new bootstrap.Modal(document.getElementById('gameInfoModal'));
    
    // Add entrance animation
    const modalElement = document.getElementById('gameInfoModal');
    modalElement.addEventListener('shown.bs.modal', function () {
        const scrollSections = modalElement.querySelectorAll('.scroll-section');
        scrollSections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, { once: true });
    
    modal.show();
    
    // Add floating particles effect
    createFloatingParticles();
}

function createFloatingParticles() {
    const modalBody = document.querySelector('#gameInfoModal .scroll-body');
    if (!modalBody) return;
    
    // Remove existing particles
    const existingParticles = modalBody.querySelectorAll('.floating-particle');
    existingParticles.forEach(particle => particle.remove());
    
    // Create new particles
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: radial-gradient(circle, rgba(139, 69, 19, 0.6), rgba(205, 133, 63, 0.3));
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            pointer-events: none;
            z-index: 1;
            animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
        `;
        
        modalBody.appendChild(particle);
    }
}

// Add CSS for floating particles
const particleCSS = `
    @keyframes floatParticle {
        0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 0.6;
        }
        90% {
            opacity: 0.6;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .floating-particle {
        animation-timing-function: ease-in-out;
    }
`;

// Inject particle CSS
const particleStyle = document.createElement('style');
particleStyle.textContent = particleCSS;
document.head.appendChild(particleStyle);

// Enhanced scroll effects for the modal
function addScrollEffects() {
    const scrollBody = document.querySelector('#gameInfoModal .scroll-body');
    if (!scrollBody) return;
    
    scrollBody.addEventListener('scroll', function() {
        const scrollTop = this.scrollTop;
        const scrollHeight = this.scrollHeight - this.clientHeight;
        const scrollProgress = scrollTop / scrollHeight;
        
        // Parallax effect for sections
        const sections = this.querySelectorAll('.scroll-section');
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const containerRect = this.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const containerCenter = containerRect.top + containerRect.height / 2;
            const distance = Math.abs(sectionCenter - containerCenter);
            const maxDistance = containerRect.height / 2 + rect.height / 2;
            const proximity = Math.max(0, 1 - distance / maxDistance);
            
            // Apply subtle transform based on proximity
            const translateY = (1 - proximity) * 10;
            const opacity = 0.3 + proximity * 0.7;
            
            section.style.transform = `translateY(${translateY}px)`;
            section.style.opacity = opacity;
        });
    });
    
    // Trigger initial scroll effect
    scrollBody.dispatchEvent(new Event('scroll'));
}

// Initialize scroll effects when modal is shown
document.getElementById('gameInfoModal').addEventListener('shown.bs.modal', function() {
    setTimeout(addScrollEffects, 500);
});

// Make function globally available
window.openGameInfo = openGameInfo;
window.openGameLogs = openGameLogs;
window.exportGameLogs = exportGameLogs;
window.clearGameLogs = clearGameLogs;

console.log('Enhanced Ludo Game loaded with full gameplay logic!');