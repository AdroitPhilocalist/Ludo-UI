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
    console.log("Initializing 3D Dice Roller...");
    this.updatePlayerIndicator();
    this.updateMoveSequence();
  }

  updatePlayerIndicator() {
    const indicator = document.querySelector(".player-indicator");
    if (indicator) {
      // Remove existing player classes
      indicator.classList.remove(
        "player-1",
        "player-2",
        "player-3",
        "player-4"
      );

      // Add current player class
      indicator.classList.add(`player-${this.currentPlayer}`);
      indicator.textContent = `Player ${this.currentPlayer}`;

      // Set correct colors
      const colors = {
        1: "linear-gradient(135deg, #e74c3c, #c0392b)", // Red
        2: "linear-gradient(135deg, #f1c40f, #d4ac0d)", // Yellow
        3: "linear-gradient(135deg, #27ae60, #229954)", // Green
        4: "linear-gradient(135deg, #3498db, #2980b9)", // Blue
      };

      indicator.style.background =
        colors[this.currentPlayer] ||
        "linear-gradient(135deg, #667eea, #764ba2)";

      // Set text color for yellow background
      if (this.currentPlayer === 2) {
        indicator.style.color = "#2c3e50";
      } else {
        indicator.style.color = "white";
      }
    }
  }

  updateMoveSequence() {
    const moveOrder = document.getElementById("moveOrder");
    if (!moveOrder) return;

    const numPlayers = parseInt(this.gameConfig.numPlayers);

    // Clear existing moves
    moveOrder.innerHTML = "";

    // Create move sequence based on current player
    const sequence = this.generateMoveSequence(this.currentPlayer, numPlayers);

    sequence.forEach((player, index) => {
      const moveStep = document.createElement("span");
      moveStep.className = `move-step player-${player}`;
      moveStep.textContent = `P${player}`;

      if (index === 0) {
        moveStep.classList.add("active");
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
        players[(startIndex + 2) % 3],
      ];
    } else if (numPlayers === 4) {
      // 4 players: Rotate through all players
      const players = [1, 2, 3, 4];
      const startIndex = currentPlayer - 1;
      return [
        players[startIndex],
        players[(startIndex + 1) % 4],
        players[(startIndex + 2) % 4],
      ];
    }

    return [currentPlayer, currentPlayer, currentPlayer];
  }

  async rollDice(isAutoTriggered = false) {
    if (this.isRolling) return;

    // Only prevent manual clicks during autoplay, allow auto-triggered rolls
    if (window.ludoGame && window.ludoGame.isAutoplayMode && !isAutoTriggered) {
      console.log("Manual dice rolling disabled during autoplay mode");
      return;
    }

    this.isRolling = true;
    const rollButton = document.getElementById("rollDiceBtn");
    const diceElements = [
      document.getElementById("dice1"),
      document.getElementById("dice2"),
      document.getElementById("dice3"),
    ];
    const valueElements = [
      document.getElementById("value1"),
      document.getElementById("value2"),
      document.getElementById("value3"),
    ];

    // Disable button and show rolling state
    rollButton.disabled = true;
    rollButton.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i><span class="roll-text">Rolling...</span>';

    // Hide previous values
    valueElements.forEach((el) => {
      el.classList.remove("show");
    });

    // Add rolling animations with different durations
    const animations = ["rolling-1", "rolling-2", "rolling-3"];
    const durations = [1500, 1800, 1200];

    diceElements.forEach((dice, index) => {
      dice.classList.add(animations[index]);
    });

    // Enhanced seed-based dice generation
    const gameSeed = this.getGameSeed();
    const numRounds = parseInt(this.gameConfig.numRounds) || 16;

    let values = [];
    let USE_STATIC_DICE = false;
    let STATIC_DICE_SETS = [];

    if (gameSeed) {
      // Generate deterministic dice sets based on seed
      USE_STATIC_DICE = true;
      STATIC_DICE_SETS = this.generateSeededDiceSets(gameSeed, numRounds);
      //STATIC_DICE_SETS = [[55,55,1],[1,3,3],[1,1,1]]
      console.log(
        `Generated ${STATIC_DICE_SETS.length} dice sets for seed "${gameSeed}"`
      );
    }

    if (USE_STATIC_DICE && STATIC_DICE_SETS.length > 0) {
      // Use seed-generated values cyclically
      const roundIndex = this.rollHistory.length % STATIC_DICE_SETS.length;
      values = STATIC_DICE_SETS[roundIndex];
      console.log(
        `Using seeded dice for round ${roundIndex + 1}:`,
        values,
        `(from seed: "${gameSeed}")`
      );
    } else {
      // Use random values when no seed is provided
      values = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      console.log("Using random dice:", values);
    }

    // Wait for longest animation to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Remove rolling animations and set final positions
    diceElements.forEach((dice, index) => {
      dice.classList.remove(animations[index]);
      this.setDiceFace(dice, values[index]);
    });

    // Show values with staggered animation
    values.forEach((value, index) => {
      setTimeout(() => {
        valueElements[index].textContent = value;
        valueElements[index].classList.add("show");
      }, index * 200);
    });

    // Store roll result
    const rollResult = {
      values: values,
      player: this.currentPlayer,
      timestamp: new Date(),
      sequence: this.generateMoveSequence(
        this.currentPlayer,
        parseInt(this.gameConfig.numPlayers)
      ),
      seed: gameSeed || null,
    };

    this.rollHistory.push(rollResult);

    console.log("Dice rolled:", rollResult);

    // Animate move sequence
    this.animateMoveSequence(values);

    // Re-enable button after a delay (only if not in autoplay mode)
    setTimeout(() => {
      const isAutoplayMode = window.ludoGame && window.ludoGame.isAutoplayMode;

      if (!isAutoplayMode) {
        rollButton.disabled = false;
        rollButton.innerHTML =
          '<i class="fas fa-dice-d6 me-2"></i><span class="roll-text">Roll Dice</span>';
      } else {
        // Keep button disabled and show autoplay state
        rollButton.disabled = true;
        rollButton.innerHTML =
          '<i class="fas fa-dice-d6 me-2"></i><span class="roll-text">Roll Dice</span>';
      }

      this.isRolling = false;

      // Switch to next player
      this.switchPlayer();
    }, 1000);

    // Trigger game logic with dice values
    if (window.ludoGame && window.ludoGame.processDiceRoll) {
      window.ludoGame.processDiceRoll(rollResult);
    }
  }

  // Get game seed from the page
  getGameSeed() {
    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlSeed = urlParams.get("seed");
    if (urlSeed) {
      return urlSeed;
    }

    // Try to get from hidden config element
    const configElement = document.querySelector('[data-config="seed"]');
    if (configElement) {
      return configElement.getAttribute("data-value");
    }

    // Try to get from window.gameConfig if available
    if (window.gameConfig && window.gameConfig.gameSeed) {
      return window.gameConfig.gameSeed;
    }

    return null;
  }

  // Simple hash function to convert string seed to number
  hashSeed(seed) {
    if (typeof seed === "number") return seed;

    let hash = 0;
    const str = String(seed).toLowerCase();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Seeded random number generator (Linear Congruential Generator)
  createSeededRandom(seed) {
    const numericSeed = this.hashSeed(seed);
    let state = numericSeed % 2147483647;
    if (state <= 0) state += 2147483646;

    return function () {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  // Generate deterministic dice sets based on seed
  generateSeededDiceSets(seed, numRounds) {
    console.log(
      `Generating dice sets for seed: "${seed}", rounds: ${numRounds}`
    );

    const seededRandom = this.createSeededRandom(seed);
    const diceSets = [];

    // Generate numRounds worth of dice sets (3 dice per round)
    for (let round = 0; round < numRounds; round++) {
      const diceSet = [
        Math.floor(seededRandom() * 6) + 1,
        Math.floor(seededRandom() * 6) + 1,
        Math.floor(seededRandom() * 6) + 1,
      ];
      diceSets.push(diceSet);
    }

    console.log(`Generated ${diceSets.length} dice sets:`, diceSets);
    return diceSets;
  }

  // Add method to get current seed info
  getCurrentSeedInfo() {
    const seed = this.getGameSeed();
    if (!seed) return null;

    return {
      seed: seed,
      isSeeded: true,
      totalSets: parseInt(this.gameConfig.numRounds) || 16,
      currentRound: this.rollHistory.length + 1,
    };
  }
  

  setDiceFace(diceElement, value) {
    // Fixed rotation mappings to show correct face values
    const rotations = {
      1: "rotateY(0deg) rotateX(0deg)", // Face 1 (front)
      2: "rotateY(-90deg) rotateX(0deg)", // Face 4 -> Face 2 (left side)
      3: "rotateY(180deg) rotateX(0deg)", // Face 3 (back) - correct
      4: "rotateY(90deg) rotateX(0deg)", // Face 2 -> Face 4 (right side)
      5: "rotateX(-90deg) rotateY(0deg)", // Face 6 -> Face 5 (top)
      6: "rotateX(90deg) rotateY(0deg)", // Face 5 -> Face 6 (bottom)
    };

    diceElement.style.transform = rotations[value];
  }

  animateMoveSequence(diceValues) {
    const moveSteps = document.querySelectorAll(".move-step");

    // Reset all steps
    moveSteps.forEach((step) => step.classList.remove("active"));

    // Animate each step with corresponding dice value
    diceValues.forEach((value, index) => {
      setTimeout(() => {
        if (moveSteps[index]) {
          moveSteps[index].classList.add("active");

          // Add dice value to the step temporarily
          const originalText = moveSteps[index].textContent;
          moveSteps[index].textContent = value;

          setTimeout(() => {
            moveSteps[index].textContent = originalText;
            moveSteps[index].classList.remove("active");
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
document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing DiceRoller...");
  diceRoller = new DiceRoller();
  window.diceRoller = diceRoller; // Make it globally available
  console.log(
    "DiceRoller initialized and available globally:",
    !!window.diceRoller
  );
});

// Enhanced global function for rolling dice
function rollDice(isAutoTriggered = false) {
  console.log("rollDice called, isAutoTriggered:", isAutoTriggered);
  console.log("diceRoller available:", !!diceRoller);

  if (diceRoller) {
    // Only prevent manual clicks during autoplay, allow auto-triggered rolls
    if (window.ludoGame && window.ludoGame.isAutoplayMode && !isAutoTriggered) {
      console.log("Cannot manually roll dice during autoplay mode");
      return false;
    }

    diceRoller.rollDice(isAutoTriggered); // Pass the parameter to the method
    return true;
  } else {
    console.log("DiceRoller not initialized yet");
    return false;
  }
}

// Export for use in game.js
window.DiceRoller = DiceRoller;
window.rollDice = rollDice;
// Add initialization check function
function ensureDiceRollerReady() {
  return new Promise((resolve) => {
    if (window.diceRoller) {
      resolve(true);
      return;
    }

    // Wait for dice roller to be ready
    const checkInterval = setInterval(() => {
      if (window.diceRoller) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, 5000);
  });
}

window.ensureDiceRollerReady = ensureDiceRollerReady;

// Add dice utilities
window.DiceUtils = {
  // Get current player
  getCurrentPlayer: () => (diceRoller ? diceRoller.currentPlayer : 1),

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
  isRolling: () => (diceRoller ? diceRoller.isRolling : false),

  // Get full roll history
  getRollHistory: () => (diceRoller ? diceRoller.getRollHistory() : []),
};

console.log("3D Dice system loaded successfully!");
