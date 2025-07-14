
export class MCTSNode {
    constructor(gameState, parent = null, move = null) {
        this.gameState = gameState; // Deep copy of game state
        this.parent = parent;
        this.move = move; // {tokenIndex, diceValue} that led to this state
        this.children = [];
        this.visits = 0;
        this.wins = 0;
        this.untriedMoves = null; // Will be populated lazily
        this.playerId = gameState.currentPlayer;
    }

    /**
     * UCB1 formula for node selection in MCTS
     * @param {number} explorationConstant - Exploration vs exploitation balance
     * @returns {number} UCB1 value for this node
     */
    getUCB1Value(explorationConstant = Math.sqrt(2)) {
        if (this.visits === 0) return Infinity;
        
        const exploitation = this.wins / this.visits;
        const exploration = explorationConstant * Math.sqrt(Math.log(this.parent.visits) / this.visits);
        
        return exploitation + exploration;
    }

    /**
     * Check if node is fully expanded (all possible moves tried)
     * @returns {boolean} True if fully expanded
     */
    isFullyExpanded() {
        return this.untriedMoves !== null && this.untriedMoves.length === 0;
    }

    /**
     * Check if node represents a terminal game state
     * @returns {boolean} True if terminal
     */
    isTerminal() {
        return this.gameState.gameOver || this.gameState.winner !== null;
    }

    /**
     * Select best child using UCB1 criterion
     * @returns {MCTSNode} Best child node
     */
    selectBestChild() {
        return this.children.reduce((best, child) => {
            return child.getUCB1Value() > best.getUCB1Value() ? child : best;
        });
    }

    /**
     * Expand node by adding a new child for an untried move
     * @returns {MCTSNode|null} New child node or null if no moves to try
     */
    expand() {
        if (this.untriedMoves === null) {
            this.untriedMoves = this.getAllPossibleMoves();
        }

        if (this.untriedMoves.length === 0) return null;

        const move = this.untriedMoves.pop();
        const newGameState = this.applyMove(this.gameState, move);
        const child = new MCTSNode(newGameState, this, move);
        this.children.push(child);

        return child;
    }

    /**
     * Get all possible moves for current game state
     * @returns {Array} Array of possible moves {tokenIndex, diceValue}
     */
    getAllPossibleMoves() {
        const moves = [];
        const numTokens = parseInt(this.gameState.config.numTokens);
        const availableDice = this.gameState.availableDice || [1, 2, 3, 4, 5, 6];

        for (const dice of availableDice) {
            for (let tokenIndex = 0; tokenIndex < numTokens; tokenIndex++) {
                if (this.isValidMove(tokenIndex, dice)) {
                    moves.push({ tokenIndex, diceValue: dice });
                }
            }
        }

        return moves;
    }

    /**
     * Check if a move is valid in current state
     * @param {number} tokenIndex - Index of token to move
     * @param {number} diceValue - Dice value for the move
     * @returns {boolean} True if move is valid
     */
    isValidMove(tokenIndex, diceValue) {
        const currentPos = this.gameState.playerPositions[this.playerId][tokenIndex];
        
        // Can't move if already finished
        if (currentPos >= this.gameState.finalPosition) return false;
        if (currentPos + diceValue > this.gameState.finalPosition) return false;
        // Move is valid (overshoot is handled in game logic)
        return true;
    }

    /**
     * Apply a move to create new game state (simulation)
     * @param {Object} currentState - Current game state
     * @param {Object} move - Move to apply {tokenIndex, diceValue}
     * @returns {Object} New game state after move
     */
    applyMove(currentState, move) {
        // Deep copy the current state
        const newState = this.deepCopyGameState(currentState);
        
        const { tokenIndex, diceValue } = move;
        const currentPos = newState.playerPositions[newState.currentPlayer][tokenIndex];
        const newPos = currentPos + diceValue;

        // Update token position
        newState.playerPositions[newState.currentPlayer][tokenIndex] = 
            Math.min(newPos, newState.finalPosition);

        // Check for game over condition
        const allFinished = newState.playerPositions[newState.currentPlayer]
            .every(pos => pos >= newState.finalPosition);
        
        if (allFinished) {
            newState.gameOver = true;
            newState.winner = newState.currentPlayer;
        }

        // Switch to next player (simplified for simulation)
        newState.currentPlayer = newState.currentPlayer === 1 ? 2 : 1;

        return newState;
    }

    /**
     * Deep copy game state for simulation
     * @param {Object} state - Game state to copy
     * @returns {Object} Deep copy of game state
     */
    deepCopyGameState(state) {
        return {
            playerPositions: JSON.parse(JSON.stringify(state.playerPositions)),
            currentPlayer: state.currentPlayer,
            finalPosition: state.finalPosition,
            config: state.config,
            gameOver: state.gameOver || false,
            winner: state.winner || null,
            availableDice: [...(state.availableDice || [1, 2, 3, 4, 5, 6])]
        };
    }

    /**
     * Backpropagate result up the tree
     * @param {number} result - Game result (playerId of winner, 0 for draw)
     */
    backpropagate(result) {
        this.visits += 1;
        
        // Result is from perspective of player who made the original move
        if (result === this.playerId) {
            this.wins += 1;
        } else if (result === 0) {
            this.wins += 0.5; // Draw
        }

        if (this.parent) {
            this.parent.backpropagate(result);
        }
    }
}

export class MCTSAlgorithm {
    constructor(game, config = {}) {
        this.game = game;
        this.config = {
            maxIterations: config.maxIterations || 1000,
            maxTime: config.maxTime || 2000, // 2 seconds
            explorationConstant: config.explorationConstant || Math.sqrt(2),
            simulationDepth: config.simulationDepth || 50,
            ...config
        };
    }

    /**
     * Main MCTS search function
     * @param {Object} gameState - Current game state
     * @param {Array} availableDice - Available dice values
     * @returns {Object} Best move {tokenIndex, chosenDice}
     */
    search(gameState, availableDice) {
        const rootState = {
            ...gameState,
            availableDice: availableDice
        };
        
        const root = new MCTSNode(rootState);
        const startTime = Date.now();

        console.log(`Starting MCTS search with ${this.config.maxIterations} iterations, ${this.config.maxTime}ms timeout`);

        let iterations = 0;
        while (iterations < this.config.maxIterations && 
               (Date.now() - startTime) < this.config.maxTime) {
            
            // Selection and Expansion
            let node = this.select(root);
            
            // If not terminal, expand
            if (!node.isTerminal() && node.visits > 0) {
                const expandedNode = node.expand();
                if (expandedNode) {
                    node = expandedNode;
                }
            }

            // Simulation
            const result = this.simulate(node);

            // Backpropagation
            node.backpropagate(result);

            iterations++;
        }

        console.log(`MCTS completed ${iterations} iterations in ${Date.now() - startTime}ms`);

        // Return best move
        return this.getBestMove(root);
    }

    /**
     * Selection phase - traverse tree using UCB1
     * @param {MCTSNode} node - Starting node
     * @returns {MCTSNode} Selected node for expansion/simulation
     */
    select(node) {
        while (!node.isTerminal() && node.isFullyExpanded()) {
            node = node.selectBestChild();
        }
        return node;
    }

    /**
     * Simulation phase - random playout from given node
     * @param {MCTSNode} node - Node to simulate from
     * @returns {number} Game result (winner playerId or 0 for draw)
     */
    simulate(node) {
        let currentState = node.deepCopyGameState(node.gameState);
        let depth = 0;

        while (!currentState.gameOver && depth < this.config.simulationDepth) {
            const move = this.getRandomMove(currentState);
            if (!move) break;

            currentState = node.applyMove(currentState, move);
            depth++;
        }

        // Evaluate final state
        return this.evaluateState(currentState, node.playerId);
    }

    /**
     * Get random move for simulation
     * @param {Object} gameState - Current game state
     * @returns {Object|null} Random move or null if no moves available
     */
    getRandomMove(gameState) {
        const moves = [];
        const numTokens = parseInt(gameState.config.numTokens);
        const availableDice = [1, 2, 3, 4, 5, 6]; // Use all possible dice values in simulation

        for (const dice of availableDice) {
            for (let tokenIndex = 0; tokenIndex < numTokens; tokenIndex++) {
                const currentPos = gameState.playerPositions[gameState.currentPlayer][tokenIndex];
                
                // Can move if not already finished
                if (currentPos < gameState.finalPosition) {
                    moves.push({ tokenIndex, diceValue: dice });
                }
            }
        }

        if (moves.length === 0) return null;
        
        return moves[Math.floor(Math.random() * moves.length)];
    }

    /**
     * Evaluate game state using multiple factors
     * @param {Object} gameState - Game state to evaluate
     * @param {number} originalPlayerId - Player ID for evaluation perspective
     * @returns {number} Evaluation result (winner playerId or 0 for draw)
     */
    evaluateState(gameState, originalPlayerId) {
        // If game is over, return winner
        if (gameState.gameOver && gameState.winner) {
            return gameState.winner === originalPlayerId ? originalPlayerId : 
                   (gameState.winner === 0 ? 0 : 3 - originalPlayerId); // opponent
        }

        // Evaluate based on multiple factors
        let score = 0;
        const myPositions = gameState.playerPositions[originalPlayerId];
        const oppPlayerId = originalPlayerId === 1 ? 2 : 1;
        const oppPositions = gameState.playerPositions[oppPlayerId];

        // Factor 1: Progress towards finish (40% weight)
        const myProgress = myPositions.reduce((sum, pos) => 
            sum + Math.min(pos, gameState.finalPosition), 0);
        const oppProgress = oppPositions.reduce((sum, pos) => 
            sum + Math.min(pos, gameState.finalPosition), 0);
        
        score += 0.4 * (myProgress - oppProgress) / gameState.finalPosition;

        // Factor 2: Finished tokens (30% weight)
        const myFinished = myPositions.filter(pos => pos >= gameState.finalPosition).length;
        const oppFinished = oppPositions.filter(pos => pos >= gameState.finalPosition).length;
        
        score += 0.3 * (myFinished - oppFinished) / parseInt(gameState.config.numTokens);

        // Factor 3: Token distribution - prefer spread out tokens (20% weight)
        const mySpread = this.calculateTokenSpread(myPositions);
        const oppSpread = this.calculateTokenSpread(oppPositions);
        
        score += 0.2 * (mySpread - oppSpread);

        // Factor 4: Safety (10% weight)
        const mySafety = this.calculateSafety(myPositions, gameState);
        const oppSafety = this.calculateSafety(oppPositions, gameState);
        
        score += 0.1 * (mySafety - oppSafety);

        // Convert score to win probability
        const winProbability = 1 / (1 + Math.exp(-score * 5)); // Sigmoid function
        
        // Return result based on probability
        if (winProbability > 0.6) return originalPlayerId;
        if (winProbability < 0.4) return oppPlayerId;
        return 0; // Draw
    }

    /**
     * Calculate token spread (higher is better for strategic positioning)
     * @param {Array} positions - Token positions
     * @returns {number} Spread score
     */
    calculateTokenSpread(positions) {
        if (positions.length <= 1) return 0;
        
        const validPositions = positions.filter(pos => pos > 0);
        if (validPositions.length <= 1) return 0;

        const mean = validPositions.reduce((sum, pos) => sum + pos, 0) / validPositions.length;
        const variance = validPositions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / validPositions.length;
        
        return Math.sqrt(variance) / 10; // Normalize
    }

    /**
     * Calculate safety score for token positions
     * @param {Array} positions - Token positions
     * @param {Object} gameState - Current game state
     * @returns {number} Safety score
     */
    calculateSafety(positions, gameState) {
        let safetyScore = 0;
        const totalPositions = positions.length;

        positions.forEach(pos => {
            if (pos === 0) {
                safetyScore += 0.5; // Home is somewhat safe
            } else if (pos >= gameState.finalPosition) {
                safetyScore += 1.0; // Finished is completely safe
            } else {
                // Could add logic for safe squares here
                safetyScore += 0.3; // Base safety on board
            }
        });

        return safetyScore / totalPositions;
    }

    /**
     * Get best move from root node after search
     * @param {MCTSNode} root - Root node of search tree
     * @returns {Object} Best move {tokenIndex, chosenDice}
     */
    getBestMove(root) {
        if (root.children.length === 0) {
            console.log("No children in root node, using random move");
            return this.getRandomMove(root.gameState);
        }

       // Log all available move options with their statistics
        console.log("===== MCTS Move Options =====");
        console.log(`Total options evaluated: ${root.children.length}`);
        
        // Create a table for better visualization in console
        const moveStats = root.children.map(child => ({
            "Token": child.move.tokenIndex + 1,
            "Dice": child.move.diceValue,
            "Visits": child.visits,
            "Wins": child.wins.toFixed(1),
            "Win Rate": (child.wins/child.visits).toFixed(3),
            "UCB1": child.getUCB1Value().toFixed(3),
        }));
        
        // Sort by visits (descending) for more readable output
        moveStats.sort((a, b) => b.Visits - a.Visits);
        
        // Log the table
        console.table(moveStats);
        
        // Select child with highest visit count (most robust)
        const bestChild = root.children.reduce((best, child) => {
            return child.visits > best.visits ? child : best;
        });

        console.log(`MCTS selected move: token ${bestChild.move.tokenIndex + 1} with dice ${bestChild.move.diceValue}`);
        console.log(`Best child stats: visits=${bestChild.visits}, wins=${bestChild.wins}, win_rate=${(bestChild.wins/bestChild.visits).toFixed(3)}`);
        console.log("==============================");

        return {
            tokenIndex: bestChild.move.tokenIndex,
            chosenDice: bestChild.move.diceValue
        };
    }
}

/**
 * MCTS Configuration Factory
 * Creates different MCTS configurations for various difficulty levels
 */
export class MCTSConfig {
    static createEasyConfig() {
        return {
            maxIterations: 500,
            maxTime: 1000,
            explorationConstant: Math.sqrt(2),
            simulationDepth: 20
        };
    }

    static createNormalConfig() {
        return {
            maxIterations: 1000,
            maxTime: 2000,
            explorationConstant: Math.sqrt(2),
            simulationDepth: 30
        };
    }

    static createHardConfig() {
        return {
            maxIterations: 2000,
            maxTime: 3000,
            explorationConstant: Math.sqrt(2),
            simulationDepth: 50
        };
    }

    static createCustomConfig(iterations, timeMs, depth, exploration = Math.sqrt(2)) {
        return {
            maxIterations: iterations,
            maxTime: timeMs,
            explorationConstant: exploration,
            simulationDepth: depth
        };
    }
}

// Export default for easy importing
export default {
    MCTSNode,
    MCTSAlgorithm,
    MCTSConfig
};