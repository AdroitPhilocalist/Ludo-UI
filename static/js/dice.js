// Dice rolling functionality
class DiceRoller {
    constructor() {
        this.isRolling = false;
        this.currentPlayer = 1;
        this.gameConfig = window.gameConfig;
        this.rollHistory = [];
        this.initializeDiceRoller();
    }
    
    initializeDiceRoller() {
        console.log('Initializing 3D Dice Roller...');
        this.updatePlayerIndicator();
        this.updateMoveSequence();
    }
    
    updatePlayerIndicator() {
        const indicator = document.getElementById('currentPlayerIndicator');
        if (indicator) {
            indicator.textContent = `Player ${this.currentPlayer}`;
            indicator.className = `player-indicator player-${this.currentPlayer}`;
        }
    }
    
    updateMoveSequence() {
        const moveOrder = document.getElementById('moveOrder');
        if (!moveOrder) return;
        
        const numPlayers = parseInt(this.gameConfig.numPlayers);
        
        // Clear existing moves
        moveOrder.innerHTML = '';
        
        // Create move sequence based on current player
        const sequence = this.generateMoveSequence(this.currentPlayer, numPlayers);
        
        sequence.forEach((player, index) => {
            const moveStep = document.createElement('span');
            moveStep.className = `move-step player-${player}`;
            moveStep.textContent = `P${player}`;
            
            if (index === 0) {
                moveStep.classList.add('active');
            }
            
            moveOrder.appendChild(moveStep);
        });
    }
    
    generateMoveSequence(currentPlayer, numPlayers) {
        // Generate the 3-dice sequence based on your game rules
        if (numPlayers === 2) {
            // 2 players: Current player uses dice 1 & 3, other player uses dice 2
            const otherPlayer = currentPlayer === 1 ? 2 : 1;
            return [currentPlayer, otherPlayer, currentPlayer];
        } else if (numPlayers === 3) {
            // 3 players: Rotate through all players
            const players = [1, 2, 3];
            const startIndex = currentPlayer - 1;
            return [
                players[startIndex],
                players[(startIndex + 1) % 3],
                players[(startIndex + 2) % 3]
            ];
        } else if (numPlayers === 4) {
            // 4 players: Rotate through all players
            const players = [1, 2, 3, 4];
            const startIndex = currentPlayer - 1;
            return [
                players[startIndex],
                players[(startIndex + 1) % 4],
                players[(startIndex + 2) % 4]
            ];
        }
        
        return [currentPlayer, currentPlayer, currentPlayer];
    }
    
    async rollDice() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        const rollButton = document.getElementById('rollDiceBtn');
        const diceElements = [
            document.getElementById('dice1'),
            document.getElementById('dice2'),
            document.getElementById('dice3')
        ];
        const valueElements = [
            document.getElementById('value1'),
            document.getElementById('value2'),
            document.getElementById('value3')
        ];
        
        // Disable button and show rolling state
        rollButton.disabled = true;
        rollButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i><span class="roll-text">Rolling...</span>';
        
        // Hide previous values
        valueElements.forEach(el => {
            el.classList.remove('show');
        });
        
        // Add rolling animations with different durations
        const animations = ['rolling-1', 'rolling-2', 'rolling-3'];
        const durations = [1500, 1800, 1200];
        
        diceElements.forEach((dice, index) => {
            dice.classList.add(animations[index]);
        });
        
        // Generate random values
        const values = [
            Math.floor(Math.random() * 5) + 1,
            Math.floor(Math.random() * 5) + 1,
            Math.floor(Math.random() * 5) + 1
        ];
        
        // Wait for longest animation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Remove rolling animations and set final positions
        diceElements.forEach((dice, index) => {
            dice.classList.remove(animations[index]);
            this.setDiceFace(dice, values[index]);
        });
        
        // Show values with staggered animation
        values.forEach((value, index) => {
            setTimeout(() => {
                valueElements[index].textContent = value;
                valueElements[index].classList.add('show');
            }, index * 200);
        });
        
        // Store roll result
        const rollResult = {
            values: values,
            player: this.currentPlayer,
            timestamp: new Date(),
            sequence: this.generateMoveSequence(this.currentPlayer, parseInt(this.gameConfig.numPlayers))
        };
        
        this.rollHistory.push(rollResult);
        
        console.log('Dice rolled:', rollResult);
        
        // Animate move sequence
        this.animateMoveSequence(values);
        
        // Re-enable button after a delay
        setTimeout(() => {
            rollButton.disabled = false;
            rollButton.innerHTML = '<i class="fas fa-dice-d6 me-2"></i><span class="roll-text">Roll Dice</span>';
            this.isRolling = false;
            
            // Switch to next player
            this.switchPlayer();
        }, 1000);
        
        // Trigger game logic with dice values
        if (window.ludoGame && window.ludoGame.processDiceRoll) {
            window.ludoGame.processDiceRoll(rollResult);
        }
    }
    
    setDiceFace(diceElement, value) {
    // Fixed rotation mappings to show correct face values
    const rotations = {
        1: 'rotateY(0deg) rotateX(0deg)',        // Face 1 (front)
        2: 'rotateY(-90deg) rotateX(0deg)',      // Face 4 -> Face 2 (left side)
        3: 'rotateY(180deg) rotateX(0deg)',      // Face 3 (back) - correct
        4: 'rotateY(90deg) rotateX(0deg)',       // Face 2 -> Face 4 (right side)
        5: 'rotateX(-90deg) rotateY(0deg)',      // Face 6 -> Face 5 (top)
        6: 'rotateX(90deg) rotateY(0deg)'        // Face 5 -> Face 6 (bottom)
    };
    
    diceElement.style.transform = rotations[value];
}
    
    animateMoveSequence(diceValues) {
        const moveSteps = document.querySelectorAll('.move-step');
        
        // Reset all steps
        moveSteps.forEach(step => step.classList.remove('active'));
        
        // Animate each step with corresponding dice value
        diceValues.forEach((value, index) => {
            setTimeout(() => {
                if (moveSteps[index]) {
                    moveSteps[index].classList.add('active');
                    
                    // Add dice value to the step temporarily
                    const originalText = moveSteps[index].textContent;
                    moveSteps[index].textContent = value;
                    
                    setTimeout(() => {
                        moveSteps[index].textContent = originalText;
                        moveSteps[index].classList.remove('active');
                    }, 2000);
                }
            }, index * 500);
        });
    }
    
    switchPlayer() {
        const numPlayers = parseInt(this.gameConfig.numPlayers);
        this.currentPlayer = (this.currentPlayer % numPlayers) + 1;
        this.updatePlayerIndicator();
        this.updateMoveSequence();
    }
    
    getRollHistory() {
        return this.rollHistory;
    }
    
    getLastRoll() {
        return this.rollHistory[this.rollHistory.length - 1] || null;
    }
    
    clearHistory() {
        this.rollHistory = [];
    }
}

// Global dice roller instance
let diceRoller;

// Initialize dice roller when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    diceRoller = new DiceRoller();
});

// Global function for rolling dice
function rollDice() {
    if (diceRoller) {
        diceRoller.rollDice();
    }
}

// Export for use in game.js
window.DiceRoller = DiceRoller;
window.rollDice = rollDice;

// Add dice utilities
window.DiceUtils = {
    // Get current player
    getCurrentPlayer: () => diceRoller ? diceRoller.currentPlayer : 1,
    
    // Get last roll values
    getLastRollValues: () => {
        const lastRoll = diceRoller ? diceRoller.getLastRoll() : null;
        return lastRoll ? lastRoll.values : [1, 1, 1];
    },
    
    // Get move sequence for current player
    getCurrentMoveSequence: () => {
        const lastRoll = diceRoller ? diceRoller.getLastRoll() : null;
        return lastRoll ? lastRoll.sequence : [1, 2, 1];
    },
    
    // Check if dice are currently rolling
    isRolling: () => diceRoller ? diceRoller.isRolling : false,
    
    // Get full roll history
    getRollHistory: () => diceRoller ? diceRoller.getRollHistory() : []
};

console.log('3D Dice system loaded successfully!');