// Import constants if available
import { getBoardConfig, PLAYERS, COLORS, UTILS } from "./constants.js";

class LudoGame {
  constructor() {
    this.boardElement = document.getElementById("ludoBoard");
    this.config = window.gameConfig;
    this.tokens = {}; // Store token positions and states
    this.gameState = "WAITING_FOR_DICE"; // Current game state
    this.currentPlayer = 1; // Current player (1-based)
    this.gameHistory = []; // Store all moves
    this.moveCount = {}; // Track moves per player
    this.currentRound = 0;
    this.boardConfig = null;
    this.finalPosition = 0; // Dynamic final position based on board size
    this.maxMoves = 0; // Dynamic move limit
    this.safeSquares = []; // Dynamic safe squares
    this.playerPositions = {}; // Track actual game positions (like Python version)
    this.playerStrategies = {
      1: this.config.player1Strategy || "PREDICTABLE",
      2: this.config.player2Strategy || "PREDICTABLE",
    };
    this.playerScores = {};
    this.scoreAnimationQueue = [];
    this.isScoreAnimating = false;
    // Initialize scores for all players
    const activePlayers = this.getActivePlayers();
    activePlayers.forEach((_, playerIndex) => {
      const playerId = playerIndex + 1;
      this.playerScores[playerId] = 0;
    });

    // Create score display
    this.createScoreDisplay();

    console.log("Player strategies initialized:", this.playerStrategies);

    // Add autoplay properties
    this.isAutoplayMode = false;
    this.autoplayTimeoutId = null;
    this.autoplayDelay = 3000;
    this.initializeGame();
  }

  async initializeGame() {
    console.log("Initializing Ludo Game with config:", this.config);
    this.setupGameConfiguration();
    this.initializeTokens();
    this.initializeGameLogs();
    this.generateBoard();
    this.updateStatusDisplay();
    // Wait for dice roller to be ready before connecting
    await this.waitForDiceRoller();
  }

  // New method to wait for dice roller initialization
  async waitForDiceRoller() {
    console.log("Waiting for dice roller to be ready...");

    const isDiceRollerReady = await window.ensureDiceRollerReady();

    if (isDiceRollerReady) {
      console.log("Dice roller is ready, connecting...");
      this.connectDiceRoller();
    } else {
      console.log("Dice roller failed to initialize properly");
      // Try again after a delay
      setTimeout(() => {
        this.waitForDiceRoller();
      }, 2000);
    }
  }

  setupGameConfiguration() {
    // Get board configuration from constants
    this.boardConfig = getBoardConfig(this.config.boardSize);

    // Calculate dynamic final position based on board size
    this.finalPosition = this.calculateFinalPosition();

    // Set dynamic move limits based on selected rounds
    const numPlayers = parseInt(this.config.numPlayers);
    const selectedRounds = parseInt(this.config.numRounds); // Use selected rounds
    this.maxMoves = 1.5 * selectedRounds; // Use the exact number of rounds selected

    // Initialize move counters for all players
    for (let i = 1; i <= numPlayers; i++) {
      this.moveCount[i] = 0;
    }

    // Get safe squares from board configuration
    this.safeSquares = this.boardConfig.SAFE_SQUARES.map(
      (sq) => `${sq.row},${sq.col}`
    );

    console.log("Game configuration:", {
      finalPosition: this.finalPosition,
      maxMoves: this.maxMoves,
      selectedRounds: selectedRounds,
      safeSquares: this.safeSquares,
      boardConfig: this.boardConfig,
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
        return ["RED", "YELLOW"];
      case 3:
        // For 3 players: Red, Blue, Yellow (skip Green)
        return ["RED", "BLUE", "YELLOW"];
      case 4:
        // For 4 players: All players
        return ["RED", "BLUE", "GREEN", "YELLOW"];
      default:
        return ["RED", "BLUE"];
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
          pathIndex: 0, // Start at beginning of path
          state: "IN_HOME",
        });

        // Initialize position in game logic (similar to Python version)
        this.playerPositions[playerId].push(0); // Start at path index 0
      }
    });

    console.log("Tokens initialized:", this.tokens);
    console.log("Player positions:", this.playerPositions);
    console.log("Active players:", activePlayers);
  }

  // ============ GAME LOGIC METHODS (Ported from Python) ============

  rollThreeDice() {
    // Simulate rolling three independent dice
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  }

  isSafe(pathIndex, playerId) {
    // Check if position is safe: either predefined safe square or occupied by multiple own tokens
    const position = this.getPositionFromPathIndex(pathIndex, playerId);
    if (!position) return false;
    const posKey = `${position.row},${position.col}`;
    const isInSafeSquares = this.safeSquares.includes(posKey);
    // const multipleTokens =
    //   this.playerPositions[playerId].filter((pos) => pos === pathIndex).length >
    //   1;
    const hasDuplicateValues = (obj) => {
      const values = Object.values(obj);
      //console.log("values", values);
      for (const value of values) {
        if (value === 0) {
          values.splice(values.indexOf(value), 1);
        }
      }
      //console.log("values", values);
      return new Set(values).size !== values.length;
    };

    const multipleTokens = hasDuplicateValues(this.playerPositions[playerId]);
    //console.log(this.playerPositions);
    //console.log(multipleTokens);
    // console.log("check",multipleTokens);
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

  // Enhanced moveToken method that works with both strategies
  async moveToken(playerId, tokenIndex, diceValue) {
    const currentPathIndex = this.playerPositions[playerId][tokenIndex];

    // If already finished, no movement
    if (currentPathIndex >= this.finalPosition) {
      return {
        finalPos: currentPathIndex,
        finished: true,
        captured: false,
        pointsEarned: 0,
      };
    }

    const newPathIndex = currentPathIndex + diceValue;
    let pointsEarned = 0;

    // Calculate points earned (1 point per square moved)
    if (newPathIndex >= this.finalPosition) {
      // If move leads to or beyond final position
      const actualMovement = this.finalPosition - currentPathIndex;
      pointsEarned = actualMovement;
      this.playerPositions[playerId][tokenIndex] = this.finalPosition;
      await this.updateTokenVisualPosition(
        playerId,
        tokenIndex,
        this.finalPosition,
        true
      );

      // Update score
      await this.updatePlayerScore(playerId, pointsEarned);

      // CRITICAL: Check for immediate game end after a token finishes
      const gameEndResult = this.checkImmediateGameEnd(playerId);
      if (gameEndResult.gameEnded) {
        return {
          finalPos: this.finalPosition,
          finished: true,
          captured: false,
          pointsEarned,
          gameWon: true,
          winnerId: gameEndResult.winnerId,
        };
      }

      return {
        finalPos: this.finalPosition,
        finished: true,
        captured: false,
        pointsEarned,
      };
    } else {
      // Normal movement
      pointsEarned = diceValue;
    }

    // Check for opponent capture
    let captured = false;
    const activePlayers = this.getActivePlayers();
    const newPosition = this.getPositionFromPathIndex(newPathIndex, playerId);

    for (
      let oppPlayerId = 1;
      oppPlayerId <= activePlayers.length;
      oppPlayerId++
    ) {
      if (oppPlayerId === playerId) continue;

      for (
        let oppTokenIndex = 0;
        oppTokenIndex < parseInt(this.config.numTokens);
        oppTokenIndex++
      ) {
        const oppPathIndex = this.playerPositions[oppPlayerId][oppTokenIndex];
        const oppPosition = this.getPositionFromPathIndex(
          oppPathIndex,
          oppPlayerId
        );

        if (
          oppPosition &&
          newPosition &&
          oppPosition.row === newPosition.row &&
          oppPosition.col === newPosition.col &&
          !this.isSafe(oppPathIndex, oppPlayerId)
        ) {
          // IMPORTANT: Deduct points for captured token before resetting position
          const pointsToDeduct = oppPathIndex; // Points to lose = distance covered
          await this.updatePlayerScore(oppPlayerId, -pointsToDeduct); // Negative points = deduction

          console.log(
            `Player ${oppPlayerId}'s token at position ${oppPathIndex} was captured. Deducting ${pointsToDeduct} points.`
          );

          // Capture the opponent token (reset to home)
          this.playerPositions[oppPlayerId][oppTokenIndex] = 0;
          await this.animateCapture(oppPlayerId, oppTokenIndex);
          await this.updateTokenVisualPosition(
            oppPlayerId,
            oppTokenIndex,
            0,
            true
          );
          captured = true;

          console.log(
            `Player ${playerId} captured Player ${oppPlayerId}'s token ${
              oppTokenIndex + 1
            }`
          );
        }
      }
    }

    // Update current token position and animate movement
    this.playerPositions[playerId][tokenIndex] = newPathIndex;
    await this.updateTokenVisualPosition(
      playerId,
      tokenIndex,
      newPathIndex,
      true
    );

    // Update score
    await this.updatePlayerScore(playerId, pointsEarned);

    return { finalPos: newPathIndex, finished: false, captured, pointsEarned };
  }

  // New method to check for immediate game end
  checkImmediateGameEnd(playerId) {
    const allFinished = this.playerPositions[playerId].every(
      (pos) => pos >= this.finalPosition
    );

    if (allFinished) {
      console.log(`Player ${playerId} has won the game! All tokens finished.`);
      return { gameEnded: true, winnerId: playerId };
    }

    return { gameEnded: false, winnerId: null };
  }

  // Update the selectToken method to handle the new strategy
  selectToken(playerId, diceValue = null, availableDice = []) {
    const strategy = this.playerStrategies[playerId];
    console.log("heufhuwh");

    if (strategy === "AGGRESSIVE") {
      const result = this.selectTokenAggressive(
        playerId,
        diceValue,
        availableDice
      );
      return result ? result.tokenIndex : null;
    } else if (strategy === "RESPONSIBLE") {
      const result = this.selectTokenResponsible(
        playerId,
        diceValue,
        availableDice
      );

      return result ? result.tokenIndex : null;
    } else {
      return this.selectTokenPredictable(playerId);
    }
  }

  // New method for Responsible Pair strategy
  selectTokenResponsible(playerId, diceValue, availableDice = []) {
    const numTokens = parseInt(this.config.numTokens);

    // Get all available dice values for decision making
    const diceOptions = availableDice.length > 0 ? availableDice : [diceValue];

    console.log(
      `Responsible strategy for Player ${playerId}, dice options:`,
      diceOptions
    );

    // Find unfinished tokens
    const unfinishedTokens = [];
    for (let i = 0; i < numTokens; i++) {
      if (this.playerPositions[playerId][i] < this.finalPosition) {
        unfinishedTokens.push(i);
      }
    }

    if (unfinishedTokens.length === 0) {
      console.log(
        `Player ${playerId} has no more tokens to move - all finished!`
      );
      return { tokenIndex: null, chosenDice: diceValue };
    }

    // Priority 1: Promotion (finishing a token)
    for (const dice of diceOptions.sort((a, b) => b - a)) {
      for (const tokenIndex of unfinishedTokens) {
        const currentPos = this.playerPositions[playerId][tokenIndex];
        const newPos = currentPos + dice;

        if (newPos >= this.finalPosition) {
          console.log(
            `Priority 1 - Promotion: Token ${tokenIndex + 1} with dice ${dice}`
          );
          return { tokenIndex, chosenDice: dice };
        }
      }
    }

    // Priority 2: Capture opportunities
    for (const dice of diceOptions.sort((a, b) => b - a)) {
      for (const tokenIndex of unfinishedTokens) {
        const currentPos = this.playerPositions[playerId][tokenIndex];
        const newPos = currentPos + dice;

        if (
          newPos < this.finalPosition &&
          this.canCaptureOpponent(playerId, newPos)
        ) {
          console.log(
            `Priority 2 - Capture: Token ${tokenIndex + 1} with dice ${dice}`
          );
          return { tokenIndex, chosenDice: dice };
        }
      }
    }

    // Priority 3a: Situational aggressive movement (when opponent close to promotion)
    const opponentNearPromotion = this.checkOpponentNearPromotion(playerId);
    if (opponentNearPromotion) {
      // Move highest point token or nearest to finish
      const bestTokenForAggression = this.getBestTokenForSituationalAggression(
        playerId,
        unfinishedTokens,
        diceOptions
      );
      if (bestTokenForAggression) {
        console.log(
          `Priority 3a - Situational Aggression: Token ${
            bestTokenForAggression.tokenIndex + 1
          } with dice ${bestTokenForAggression.chosenDice}`
        );
        return bestTokenForAggression;
      }
    }

    // Priority 3b: Move to safe square
    for (const dice of diceOptions.sort((a, b) => b - a)) {
      for (const tokenIndex of unfinishedTokens) {
        const currentPos = this.playerPositions[playerId][tokenIndex];
        const newPos = currentPos + dice;
        const temporaryPosition = [...this.playerPositions[playerId]];
        temporaryPosition[tokenIndex] = newPos; // Simulate move
        //console.log(temporaryPosition);

        if (
          newPos < this.finalPosition &&
          this.isSafePosition(newPos, playerId, temporaryPosition)
        ) {
          //console.log(this.isSafePosition(newPos, playerId));
          console.log(
            `Priority 3b - Safe Square: Token ${
              tokenIndex + 1
            } with dice ${dice}`
          );
          return { tokenIndex, chosenDice: dice };
        }
      }
    }

    // Priority 4: Chase opponent token for capture with last two tokens
    const chaseResult = this.getChaseOpportunity(
      playerId,
      unfinishedTokens,
      diceOptions
    );
    if (chaseResult) {
      console.log(
        `Priority 4 - Chase: Token ${chaseResult.tokenIndex + 1} with dice ${
          chaseResult.chosenDice
        }`
      );
      return chaseResult;
    }

    // Priority 5: Move tokens alternately in pairs till 26th square (safe square for 13-square board)
    const safeSquareTarget = this.getSafeSquareTarget(); // 26 for 13-square board
    const pairMoveResult = this.getPairMovementBeforeSafe(
      playerId,
      unfinishedTokens,
      diceOptions,
      safeSquareTarget
    );
    if (pairMoveResult) {
      console.log(
        `Priority 5 - Pair Movement (Before Safe): Token ${
          pairMoveResult.tokenIndex + 1
        } with dice ${pairMoveResult.chosenDice}`
      );
      return pairMoveResult;
    }

    // Priority 6: Move tokens alternately in pairs after reaching safe square
    const pairMoveAfterSafe = this.getPairMovementAfterSafe(
      playerId,
      unfinishedTokens,
      diceOptions,
      safeSquareTarget
    );
    if (pairMoveAfterSafe) {
      console.log(
        `Priority 6 - Pair Movement (After Safe): Token ${
          pairMoveAfterSafe.tokenIndex + 1
        } with dice ${pairMoveAfterSafe.chosenDice}`
      );
      return pairMoveAfterSafe;
    }

    // Fallback: Move first available token with highest dice
    const maxDice = Math.max(...diceOptions);
    const firstToken = unfinishedTokens[0];

    console.log(
      `Fallback - Default: Token ${firstToken + 1} with highest dice ${maxDice}`
    );
    return { tokenIndex: firstToken, chosenDice: maxDice };
  }

  // Helper method to check if any opponent is near promotion
  checkOpponentNearPromotion(playerId) {
    const activePlayers = this.getActivePlayers();
    const promotionThreshold = Math.max(
      1,
      Math.floor(this.finalPosition * 0.9)
    ); // Within 10% of finish

    for (
      let oppPlayerId = 1;
      oppPlayerId <= activePlayers.length;
      oppPlayerId++
    ) {
      if (oppPlayerId === playerId) continue;

      // Check if any opponent token is close to finish
      for (
        let tokenIndex = 0;
        tokenIndex < parseInt(this.config.numTokens);
        tokenIndex++
      ) {
        const oppTokenPos = this.playerPositions[oppPlayerId][tokenIndex];
        if (
          oppTokenPos >= promotionThreshold &&
          oppTokenPos < this.finalPosition
        ) {
          console.log(
            `Opponent Player ${oppPlayerId} token ${
              tokenIndex + 1
            } near promotion at position ${oppTokenPos}`
          );
          return true;
        }
      }
    }

    return false;
  }

  // Helper method to get best token for situational aggression
  getBestTokenForSituationalAggression(
    playerId,
    unfinishedTokens,
    diceOptions
  ) {
    const maxDice = Math.max(...diceOptions);

    // Option 1: Move the token nearest to finish (highest position)
    let nearestToFinish = -1;
    let highestPos = -1;

    for (const tokenIndex of unfinishedTokens) {
      const pos = this.playerPositions[playerId][tokenIndex];
      if (pos > highestPos) {
        highestPos = pos;
        nearestToFinish = tokenIndex;
      }
    }

    if (nearestToFinish !== -1) {
      return { tokenIndex: nearestToFinish, chosenDice: maxDice };
    }

    return null;
  }

  // Helper method to get safe square target based on board size
  getSafeSquareTarget() {
    const boardSize = parseInt(this.config.boardSize);

    // Define safe square targets for different board sizes
    const safeTargets = {
      7: 15, // Mid-game safe square for 7-square board
      9: 19, // Mid-game safe square for 9-square board
      11: 23, // Mid-game safe square for 11-square board
      13: 26, // Mid-game safe square for 13-square board
    };

    return safeTargets[boardSize] || Math.floor(this.finalPosition * 0.5);
  }

  // Helper method to find chase opportunities
  getChaseOpportunity(playerId, unfinishedTokens, diceOptions) {
    const activePlayers = this.getActivePlayers();

    // Find opponent tokens within chasing range
    for (
      let oppPlayerId = 1;
      oppPlayerId <= activePlayers.length;
      oppPlayerId++
    ) {
      if (oppPlayerId === playerId) continue;

      for (
        let oppTokenIndex = 0;
        oppTokenIndex < parseInt(this.config.numTokens);
        oppTokenIndex++
      ) {
        const oppTokenPos = this.playerPositions[oppPlayerId][oppTokenIndex];
        if (oppTokenPos === 0 || oppTokenPos >= this.finalPosition) continue; // Skip home or finished tokens
        // Check if any of our tokens can chase this opponent
        for (const dice of diceOptions.sort((a, b) => b - a)) {
          for (const tokenIndex of unfinishedTokens) {
            const currentPos = this.playerPositions[playerId][tokenIndex];
            const newPos = currentPos + dice;
            console.log(currentPos, newPos, oppTokenPos);

            // Check if this move gets us closer to the opponent token for future capture
            const currentDistance = this.getTokenDistance(
              currentPos,
              oppTokenPos,
              playerId,
              oppPlayerId
            );
            const newDistance = this.getTokenDistance(
              newPos,
              oppTokenPos,
              playerId,
              oppPlayerId
            );
            console.log(newDistance, currentDistance);

            if (
              newDistance < currentDistance &&
              newDistance <= 6 &&
              newPos < this.finalPosition
            ) {
              // Only chase if we're getting significantly closer
              return { tokenIndex, chosenDice: dice };
            }
          }
        }
      }
    }

    return null;
  }

  // Helper method to calculate distance between tokens considering board paths
  getTokenDistance(pos1, pos2, playerId1, playerId2) {
    // Simple distance calculation - can be enhanced with actual path distance
    const position1 = this.getPositionFromPathIndex(pos1, playerId1);
    const position2 = this.getPositionFromPathIndex(pos2, playerId2);
    console.log(position1, position2);
    if(playerId1 === 1){
      var array1 = this.boardConfig.GAME_PATHS.RED;
      var array2 = this.boardConfig.GAME_PATHS.YELLOW;
    }
    if(playerId1 === 2){
      var array1 = this.boardConfig.GAME_PATHS.YELLOW;
      var array2 = this.boardConfig.GAME_PATHS.RED;
    }
    
    const intersection = (arr1, arr2) => {
      return arr1.filter((obj1) =>
        arr2.some((obj2) => obj1.row === obj2.row && obj1.col === obj2.col)
      );
    };

    const full_game_path = intersection(array1, array2);
    console.log("Full game path:", full_game_path);
    const index1 = full_game_path.findIndex(
      (pos) => pos.row === position1.row && pos.col === position1.col
    );
    const index2 = full_game_path.findIndex(
      (pos) => pos.row === position2.row && pos.col === position2.col
    );
    console.log("Index1:", index1, "Index2:", index2);
    console.log(
      Math.abs(
        index1 - index2 
      )+ 1
    );
    if (!position1 || !position2) return Infinity;

    return Math.abs(
      index1 - index2
    ) + 1;
  }

  // Helper method for pair movement before reaching safe square
  getPairMovementBeforeSafe(
    playerId,
    unfinishedTokens,
    diceOptions,
    safeTarget
  ) {
    const maxDice = Math.max(...diceOptions);

    // Find tokens that haven't reached the safe target yet
    const tokensBeforeSafe = unfinishedTokens.filter(
      (tokenIndex) => this.playerPositions[playerId][tokenIndex] < safeTarget
    );

    if (tokensBeforeSafe.length === 0) return null;

    // Move tokens alternately - prioritize the one that's furthest behind
    let selectedToken = tokensBeforeSafe[0];
    let minPosition = this.playerPositions[playerId][selectedToken];

    for (const tokenIndex of tokensBeforeSafe) {
      const pos = this.playerPositions[playerId][tokenIndex];
      if (pos < minPosition) {
        minPosition = pos;
        selectedToken = tokenIndex;
      }
    }

    return { tokenIndex: selectedToken, chosenDice: maxDice };
  }

  // Helper method for pair movement after reaching safe square
  getPairMovementAfterSafe(
    playerId,
    unfinishedTokens,
    diceOptions,
    safeTarget
  ) {
    const maxDice = Math.max(...diceOptions);

    // Find tokens that have reached the safe target
    const tokensAfterSafe = unfinishedTokens.filter(
      (tokenIndex) => this.playerPositions[playerId][tokenIndex] >= safeTarget
    );

    if (tokensAfterSafe.length === 0) return null;

    // Move the token that's furthest behind among those past the safe point
    let selectedToken = tokensAfterSafe[0];
    let minPosition = this.playerPositions[playerId][selectedToken];

    for (const tokenIndex of tokensAfterSafe) {
      const pos = this.playerPositions[playerId][tokenIndex];
      if (pos < minPosition) {
        minPosition = pos;
        selectedToken = tokenIndex;
      }
    }

    return { tokenIndex: selectedToken, chosenDice: maxDice };
  }

  // Original predictable strategy (keep existing logic)
  // Enhanced selectTokenPredictable to return null when no tokens available
  selectTokenPredictable(playerId) {
    const numTokens = parseInt(this.config.numTokens);

    // Find unfinished tokens
    const unfinishedTokens = [];
    for (let i = 0; i < numTokens; i++) {
      if (this.playerPositions[playerId][i] < this.finalPosition) {
        unfinishedTokens.push(i);
      }
    }

    if (unfinishedTokens.length === 0) {
      console.log(
        `Player ${playerId} has no more tokens to move - all finished!`
      );
      return null; // All tokens finished
    }

    // Use greedy strategy: prefer token that's not finished, prioritize first token
    return unfinishedTokens[0];
  }

  // Enhanced selectTokenAggressive to return null when no tokens available
  selectTokenAggressive(playerId, diceValue, availableDice = []) {
    const numTokens = parseInt(this.config.numTokens);

    // Get all available dice values for decision making
    const diceOptions = availableDice.length > 0 ? availableDice : [diceValue];

    // console.log(availableDice)
    // console.log(diceValue)

    console.log(
      `Aggressive strategy for Player ${playerId}, dice options:`,
      diceOptions
    );

    // Find unfinished tokens
    const unfinishedTokens = [];
    for (let i = 0; i < numTokens; i++) {
      if (this.playerPositions[playerId][i] < this.finalPosition) {
        unfinishedTokens.push(i);
      }
    }

    if (unfinishedTokens.length === 0) {
      console.log(
        `Player ${playerId} has no more tokens to move - all finished!`
      );
      return { tokenIndex: null, chosenDice: diceValue }; // All tokens finished
    }

    // Priority 1: Check for promotion opportunities (finishing a token)
    for (const dice of diceOptions.sort((a, b) => b - a)) {
      // Try largest dice first
      for (const tokenIndex of unfinishedTokens) {
        const currentPos = this.playerPositions[playerId][tokenIndex];
        const newPos = currentPos + dice;

        if (newPos >= this.finalPosition) {
          console.log(
            `Priority 1 - Promotion: Token ${tokenIndex + 1} with dice ${dice}`
          );
          return { tokenIndex, chosenDice: dice };
        }
      }
    }

    // Priority 2: Check for capture opportunities
    for (const dice of diceOptions.sort((a, b) => b - a)) {
      // Try largest dice first
      for (const tokenIndex of unfinishedTokens) {
        const currentPos = this.playerPositions[playerId][tokenIndex];
        const newPos = currentPos + dice;

        if (
          newPos < this.finalPosition &&
          this.canCaptureOpponent(playerId, newPos)
        ) {
          console.log(
            `Priority 2 - Capture: Token ${tokenIndex + 1} with dice ${dice}`
          );
          return { tokenIndex, chosenDice: dice };
        }
      }
    }

    // Priority 3: Check for safe square opportunities
    for (const dice of diceOptions.sort((a, b) => b - a)) {
      // Try largest dice first
      for (const tokenIndex of unfinishedTokens) {
        const currentPos = this.playerPositions[playerId][tokenIndex];
        const newPos = currentPos + dice;
        const temporaryPosition = [...this.playerPositions[playerId]];
        temporaryPosition[tokenIndex] = newPos; // Simulate move

        if (
          newPos < this.finalPosition &&
          this.isSafePosition(newPos, playerId, temporaryPosition)
        ) {
          console.log(
            `Priority 3 - Safe Square: Token ${
              tokenIndex + 1
            } with dice ${dice}`
          );
          return { tokenIndex, chosenDice: dice };
        }
      }
    }

    // Priority 4: Greedy approach - use highest dice value with first available token
    const maxDice = Math.max(...diceOptions);
    let farthestToken = 0;
    let dist = 100;
    for (let i = 0; i < numTokens; i++) {
      if (this.playerPositions[playerId][i] < this.finalPosition) {
        let distance = this.finalPosition - this.playerPositions[playerId][i];
        if (distance < dist) {
          dist = distance;
          farthestToken = i;
        }
      }
    }
    console.log(
      `Priority 4 - Greedy: Token ${
        farthestToken + 1
      } with highest dice ${maxDice}`
    );
    return { tokenIndex: farthestToken, chosenDice: maxDice };
  }

  // Helper method to check if a move can capture an opponent
  canCaptureOpponent(playerId, newPathIndex) {
    const newPosition = this.getPositionFromPathIndex(newPathIndex, playerId);
    if (!newPosition) return false;

    const activePlayers = this.getActivePlayers();

    for (
      let oppPlayerId = 1;
      oppPlayerId <= activePlayers.length;
      oppPlayerId++
    ) {
      if (oppPlayerId === playerId) continue;

      // Check if any opponent token is at this position
      for (
        let tokenIndex = 0;
        tokenIndex < parseInt(this.config.numTokens);
        tokenIndex++
      ) {
        const oppPosition = this.playerPositions[oppPlayerId][tokenIndex];
        const oppBoardPosition = this.getPositionFromPathIndex(
          oppPosition,
          oppPlayerId
        );

        if (
          oppBoardPosition &&
          oppBoardPosition.row === newPosition.row &&
          oppBoardPosition.col === newPosition.col &&
          !this.isSafe(oppPosition, oppPlayerId)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  // Helper method to check if a position is safe
  isSafePosition(pathIndex, playerId, temporaryPositions = null) {
    // Check if position is safe: either predefined safe square or occupied by multiple own tokens
    const position = this.getPositionFromPathIndex(pathIndex, playerId);
    if (!position) return false;
    const posKey = `${position.row},${position.col}`;
    const isInSafeSquares = this.safeSquares.includes(posKey);
    // const multipleTokens =
    //   this.playerPositions[playerId].filter((pos) => pos === pathIndex).length >
    //   1;
    const hasDuplicateValues = (obj) => {
      const values = Object.values(obj);
      //console.log("values", values);
      for (const value of values) {
        if (value === 0) {
          values.splice(values.indexOf(value), 1);
        }
      }
      //console.log("values", values);
      return new Set(values).size !== values.length;
    };

    const multipleTokens = hasDuplicateValues(temporaryPositions);
    //console.log(this.playerPositions[playerId]);
    //console.log("multipleTokens check:", multipleTokens);
    //console.log(this.playerPositions);
    //console.log(multipleTokens);
    // console.log("check",multipleTokens);
    return isInSafeSquares || multipleTokens;
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
      moveType: "bonus",
    });

    this.moveCount[playerId]++;

    // Add visual delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Recursively trigger another bonus move if condition satisfied
    if (
      (val === 6 || result.finished || result.captured) &&
      this.moveCount[playerId] < this.maxMoves
    ) {
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

    // Track dice usage for this turn sequence
    const turnDiceTracker = {
      allDiceValues: [...diceValues],
      usedDice: [],
      availableDice: [...diceValues],
      moveSequence: moveSequence,
      currentMoveIndex: 0,
    };

    // Store the tracker for logging purposes
    this.currentTurnTracker = turnDiceTracker;
    console.log(diceValues);
    // Perform the three moves
    for (let i = 0; i < 3; i++) {
      const currentPlayer = moveSequence[i];
      const diceValue = diceValues[0];

      // CRITICAL: Check if game has ended before processing any move
      if (this.gameState === "GAME_OVER") {
        console.log("Game has ended, stopping turn processing");
        break;
      }

      if (this.moveCount[currentPlayer] >= this.maxMoves) {
        // Update tracker even if move is skipped
        turnDiceTracker.usedDice.push(diceValue);
        turnDiceTracker.availableDice = turnDiceTracker.availableDice.filter(
          (d) => d !== diceValue
        );
        turnDiceTracker.currentMoveIndex++;
        continue;
      }

      // Update tracker before the move
      turnDiceTracker.currentMoveIndex = i;

      const moveResult = await this.performFullMove(
        currentPlayer,
        diceValue,
        diceValues
      );

      // CRITICAL: If the move resulted in a game win, stop all processing immediately
      if (moveResult.gameWon) {
        console.log(`Game won during turn! Stopping all further processing.`);
        break;
      }

      // Update tracker after the move
      turnDiceTracker.usedDice.push(diceValue);
      const diceIndex = turnDiceTracker.availableDice.indexOf(diceValue);
      if (diceIndex > -1) {
        turnDiceTracker.availableDice.splice(diceIndex, 1);
      }

      // Add delay between moves for better visualization, but only if game hasn't ended
      if (this.gameState !== "GAME_OVER") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Clear the tracker
    this.currentTurnTracker = null;

    // Check for game end conditions ONLY if game hasn't already ended
    if (this.gameState !== "GAME_OVER") {
      this.checkGameEnd();
    }
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
    if (this.moveCount[playerId] >= this.maxMoves) {
      console.log(`Player ${playerId} has reached move limit`);
      return { gameWon: false };
    }

    const initPositions = this.getAllPositions();
    let usedValues = [];
    let overallResult = {
      finalPos: 0,
      finished: false,
      captured: false,
      gameWon: false,
    };

    const strategy = this.playerStrategies[playerId];

    if (strategy === "AGGRESSIVE") {
      // Existing aggressive strategy logic
      const availableDice = [...allDiceValues];
      const decision = this.selectTokenAggressive(
        playerId,
        diceValue,
        availableDice
      );

      if (!decision || decision.tokenIndex === null) {
        console.log(`No valid moves for aggressive player ${playerId}`);
        return { gameWon: false };
      }

      const tokenIndex = decision.tokenIndex;
      const chosenDice = decision.chosenDice;
      usedValues.push(chosenDice);

      // Remove the chosen dice from available dice
      const removeFirstOccurrence = (arr, value) => {
        const index = arr.indexOf(value);
        if (index !== -1) arr.splice(index, 1);
        return arr;
      };
      allDiceValues = removeFirstOccurrence(allDiceValues, chosenDice);

      this.highlightMovingToken(playerId, tokenIndex);

      let result = await this.moveToken(playerId, tokenIndex, chosenDice);
      overallResult = { ...result };

      if (result.gameWon) {
        console.log(
          `Game won by player ${result.winnerId}! Ending immediately.`
        );
        this.endGame(result.winnerId);
        return { gameWon: true, winnerId: result.winnerId };
      }

      // Handle bonus moves for aggressive strategy
      let currentValue = chosenDice;
      let bonusCount = 0;

      while (
        (currentValue === 6 || result.finished || result.captured) &&
        this.moveCount[playerId] < this.maxMoves &&
        this.gameState !== "GAME_OVER"
      ) {
        bonusCount++;
        await this.showBonusMoveIndicator(playerId, tokenIndex);

        currentValue = Math.floor(Math.random() * 6) + 1;
        usedValues.push(currentValue);

        await this.showBonusDiceRoll(playerId, currentValue, bonusCount);

        const bonusDecision = this.selectTokenAggressive(
          playerId,
          currentValue,
          [currentValue]
        );
        if (!bonusDecision || bonusDecision.tokenIndex === null) {
          console.log(
            `No more tokens available for bonus move for player ${playerId}`
          );
          break;
        }

        const bonusTokenIndex = bonusDecision.tokenIndex;
        this.highlightMovingToken(playerId, bonusTokenIndex);

        result = await this.moveToken(playerId, bonusTokenIndex, currentValue);

        if (result.gameWon) {
          console.log(
            `Game won by player ${result.winnerId} during bonus move! Ending immediately.`
          );
          this.endGame(result.winnerId);
          return { gameWon: true, winnerId: result.winnerId };
        }

        if (result.finished) overallResult.finished = true;
        if (result.captured) overallResult.captured = true;
        overallResult.finalPos = result.finalPos;

        await this.delay(500);
      }
    } else if (strategy === "RESPONSIBLE") {
      // New responsible strategy logic
      //console.log(allDiceValues);
      const availableDice = [...allDiceValues];

      const decision = this.selectTokenResponsible(
        playerId,
        diceValue,
        availableDice
      );

      if (!decision || decision.tokenIndex === null) {
        console.log(`No valid moves for responsible player ${playerId}`);
        return { gameWon: false };
      }

      const tokenIndex = decision.tokenIndex;
      const chosenDice = decision.chosenDice;
      usedValues.push(chosenDice);

      // Remove the chosen dice from available dice
      const removeFirstOccurrence = (arr, value) => {
        const index = arr.indexOf(value);
        if (index !== -1) arr.splice(index, 1);
        return arr;
      };
      //console.log(allDiceValues);
      allDiceValues = removeFirstOccurrence(allDiceValues, chosenDice);
      //console.log(allDiceValues);

      this.highlightMovingToken(playerId, tokenIndex);

      let result = await this.moveToken(playerId, tokenIndex, chosenDice);
      overallResult = { ...result };

      if (result.gameWon) {
        console.log(
          `Game won by player ${result.winnerId}! Ending immediately.`
        );
        this.endGame(result.winnerId);
        return { gameWon: true, winnerId: result.winnerId };
      }

      // Handle bonus moves for responsible strategy
      let currentValue = chosenDice;
      let bonusCount = 0;

      while (
        (currentValue === 6 || result.finished || result.captured) &&
        this.moveCount[playerId] < this.maxMoves &&
        this.gameState !== "GAME_OVER"
      ) {
        bonusCount++;
        await this.showBonusMoveIndicator(playerId, tokenIndex);

        currentValue = Math.floor(Math.random() * 6) + 1;
        usedValues.push(currentValue);

        await this.showBonusDiceRoll(playerId, currentValue, bonusCount);

        const bonusDecision = this.selectTokenResponsible(
          playerId,
          currentValue,
          [currentValue]
        );
        if (!bonusDecision || bonusDecision.tokenIndex === null) {
          console.log(
            `No more tokens available for bonus move for player ${playerId}`
          );
          break;
        }

        const bonusTokenIndex = bonusDecision.tokenIndex;
        this.highlightMovingToken(playerId, bonusTokenIndex);

        result = await this.moveToken(playerId, bonusTokenIndex, currentValue);

        if (result.gameWon) {
          console.log(
            `Game won by player ${result.winnerId} during bonus move! Ending immediately.`
          );
          this.endGame(result.winnerId);
          return { gameWon: true, winnerId: result.winnerId };
        }

        if (result.finished) overallResult.finished = true;
        if (result.captured) overallResult.captured = true;
        overallResult.finalPos = result.finalPos;

        await this.delay(500);
      }
    } else {
      // Existing predictable strategy logic
      let tokenIndex = this.selectTokenPredictable(playerId);
      usedValues.push(diceValue);

      if (tokenIndex === null) {
        console.log(`No valid moves for predictable player ${playerId}`);
        return { gameWon: false };
      }

      // Remove the used dice value from available dice
      const removeFirstOccurrence = (arr, value) => {
        const index = arr.indexOf(value);
        if (index !== -1) arr.splice(index, 1);
        return arr;
      };
      allDiceValues = removeFirstOccurrence(allDiceValues, diceValue);

      this.highlightMovingToken(playerId, tokenIndex);
      let result = await this.moveToken(playerId, tokenIndex, diceValue);
      overallResult = { ...result };

      if (result.gameWon) {
        console.log(
          `Game won by player ${result.winnerId}! Ending immediately.`
        );
        this.endGame(result.winnerId);
        return { gameWon: true, winnerId: result.winnerId };
      }

      // Handle bonus moves for predictable strategy
      let currentValue = diceValue;
      let bonusCount = 0;

      while (
        (currentValue === 6 || result.finished || result.captured) &&
        this.moveCount[playerId] < this.maxMoves &&
        this.gameState !== "GAME_OVER"
      ) {
        bonusCount++;
        await this.showBonusMoveIndicator(playerId, tokenIndex);

        currentValue = Math.floor(Math.random() * 6) + 1;
        usedValues.push(currentValue);

        await this.showBonusDiceRoll(playerId, currentValue, bonusCount);

        tokenIndex = this.selectTokenPredictable(playerId);
        if (tokenIndex === null) {
          console.log(
            `No more tokens available for bonus move for player ${playerId}`
          );
          break;
        }

        this.highlightMovingToken(playerId, tokenIndex);
        result = await this.moveToken(playerId, tokenIndex, currentValue);

        if (result.gameWon) {
          console.log(
            `Game won by player ${result.winnerId} during bonus move! Ending immediately.`
          );
          this.endGame(result.winnerId);
          return { gameWon: true, winnerId: result.winnerId };
        }

        if (result.finished) overallResult.finished = true;
        if (result.captured) overallResult.captured = true;
        overallResult.finalPos = result.finalPos;

        await this.delay(500);
      }
    }

    const finalPositions = this.getAllPositions();

    // Fix the token selection for moveData - get the token index properly
    let selectedTokenIndex;
    if (strategy === "AGGRESSIVE") {
      const decision = this.selectTokenAggressive(playerId, diceValue, [
        diceValue,
      ]);
      selectedTokenIndex = decision ? decision.tokenIndex : 0;
    } else if (strategy === "RESPONSIBLE") {
      const decision = this.selectTokenResponsible(playerId, diceValue, [
        diceValue,
      ]);
      selectedTokenIndex = decision ? decision.tokenIndex : 0;
    } else {
      selectedTokenIndex = this.selectTokenPredictable(playerId) || 0;
    }

    // Record the complete move ONLY if game hasn't ended
    if (this.gameState !== "GAME_OVER") {
      const moveData = {
        finalPositions: finalPositions,
        initPositions: initPositions,
        player: playerId,
        token: usedValues.length > 1 ? "multiple" : selectedTokenIndex + 1,
        allDiceValues: allDiceValues,
        usedValues: usedValues,
        timestamp: new Date(),
        moveType: usedValues.length > 1 ? "bonus" : "regular",
        diceValue: usedValues[0],
        result: overallResult,
        strategy: strategy,
      };

      console.log("Move recorded:", moveData);

      this.gameHistory.push(moveData);
      this.logMove(moveData);
      this.moveCount[playerId]++;
      this.updateGameStatus();
    }

    return overallResult;
  }

  getPlayerColor(playerId) {
    // Fixed color mapping to match actual player colors
    const colors = {
      1: "#e74c3c", // Red for Player 1
      2: "#f1c40f", // Yellow for Player 2
      3: "#27ae60", // Green for Player 3
      4: "#3498db", // Blue for Player 4
    };
    return colors[playerId] || "#95a5a6";
  }

  // Update the showBonusDiceRoll method to use player colors
  async showBonusDiceRoll(playerId, diceValue, bonusCount) {
    const container = document.getElementById("bonusDiceContainer");
    const playerName = document.getElementById("bonusPlayerName");
    const streakElement = document.getElementById("bonusStreak");
    const diceElement = document.getElementById("bonusDice");
    const valueElement = document.getElementById("bonusDiceValue");
    const messageElement = document.getElementById("bonusMessage");
    const bonusCard = container.querySelector(".bonus-dice-card");

    // Get player color
    const playerColor = this.getPlayerColor(playerId);

    // Update player info with color coordination
    const playerNameText = this.getPlayerNameFromId(playerId);
    playerName.textContent = `Player ${playerId} (${playerNameText})`;
    playerName.style.color = playerColor;

    // Update streak with player color
    streakElement.textContent = `×${bonusCount + 1}`;
    streakElement.style.background = `linear-gradient(135deg, ${playerColor}, ${playerColor}dd)`;

    // Add player color accent to card
    bonusCard.style.borderColor = playerColor;
    bonusCard.style.boxShadow = `
        0 20px 40px ${playerColor}40,
        0 10px 20px ${playerColor}30,
        inset 0 1px 0 rgba(255, 255, 255, 0.6),
        0 0 60px ${playerColor}60
    `;

    // Rest of the method remains the same...
    messageElement.textContent = "Rolling for bonus move...";

    valueElement.classList.remove("show");
    valueElement.textContent = diceValue;

    container.classList.remove("hide");
    container.classList.add("show");

    diceElement.classList.add("rolling");

    await this.delay(2000);

    diceElement.classList.remove("rolling");
    this.setBonusDiceFace(diceElement, diceValue);

    valueElement.classList.add("show");

    if (diceValue === 6) {
      messageElement.textContent = "Another 6! More bonus moves!";
      messageElement.style.color = "#e74c3c";
    } else {
      messageElement.textContent = `Rolled ${diceValue} - Moving token!`;
      messageElement.style.color = "#27ae60";
    }

    await this.delay(1500);

    container.classList.remove("show");
    container.classList.add("hide");

    await this.delay(600);
  }

  // Method to set bonus dice face rotation
  setBonusDiceFace(diceElement, value) {
    const rotations = {
      1: "rotateY(0deg) rotateX(0deg)",
      2: "rotateY(-90deg) rotateX(0deg)",
      3: "rotateY(180deg) rotateX(0deg)",
      4: "rotateY(90deg) rotateX(0deg)",
      5: "rotateX(-90deg) rotateY(0deg)",
      6: "rotateX(90deg) rotateY(0deg)",
    };

    diceElement.style.transform = rotations[value];
  }

  highlightMovingToken(playerId, tokenIndex) {
    // Clear previous highlights
    document.querySelectorAll(".token.in-sequence").forEach((token) => {
      token.classList.remove("in-sequence");
    });

    // Highlight the token that will move
    const playerName = this.getPlayerNameFromId(playerId);
    const token = this.tokens[playerName][tokenIndex];
    const tokenElement = document.querySelector(
      `[data-token-id="${token.id}"]`
    );

    if (tokenElement) {
      tokenElement.classList.add("in-sequence");

      // Remove highlight after movement
      setTimeout(() => {
        tokenElement.classList.remove("in-sequence");
      }, 3000);
    }
  }

  async showBonusMoveIndicator(playerId, tokenIndex) {
    const playerName = this.getPlayerNameFromId(playerId);
    const token = this.tokens[playerName][tokenIndex];
    const tokenElement = document.querySelector(
      `[data-token-id="${token.id}"]`
    );

    if (tokenElement) {
      // Add enhanced bonus move effect
      tokenElement.classList.add("bonus-move");

      // Create floating text effect
      this.createFloatingBonusText(tokenElement, "BONUS!");

      await this.delay(1000);
      tokenElement.classList.remove("bonus-move");
    }
  }

  // New method to create floating bonus text
  createFloatingBonusText(tokenElement, text) {
    const floatingText = document.createElement("div");
    floatingText.className = "floating-bonus-text";
    floatingText.textContent = text;
    floatingText.style.cssText = `
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #FFD700, #FF8C00);
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.7rem;
        font-weight: 700;
        z-index: 1000;
        pointer-events: none;
        animation: floatBonusText 2s ease-out forwards;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    `;

    // Add CSS animation if not already present
    if (!document.querySelector("#bonusTextAnimation")) {
      const style = document.createElement("style");
      style.id = "bonusTextAnimation";
      style.textContent = `
            @keyframes floatBonusText {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(0px) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-10px) scale(1.2);
                }
                80% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-30px) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-50px) scale(0.8);
                }
            }
        `;
      document.head.appendChild(style);
    }

    tokenElement.appendChild(floatingText);

    // Remove after animation
    setTimeout(() => {
      if (floatingText.parentNode) {
        floatingText.remove();
      }
    }, 2000);
  }

  // Enhanced delay method with better timing
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============ VISUAL UPDATE METHODS ============

  async updateTokenVisualPosition(
    playerId,
    tokenIndex,
    pathIndex,
    isAnimated = true
  ) {
    const playerName = this.getPlayerNameFromId(playerId);
    const token = this.tokens[playerName][tokenIndex];

    if (!token) return;

    // Get current token element
    const currentTokenElement = document.querySelector(
      `[data-token-id="${token.id}"]`
    );

    // Get target position
    let targetSquare = this.getTargetSquare(playerName, tokenIndex, pathIndex);

    if (!targetSquare) return;

    if (isAnimated && currentTokenElement) {
      // Enhanced animated movement
      await this.animateTokenMovement(
        currentTokenElement,
        targetSquare,
        token,
        pathIndex
      );
    } else {
      // Instant movement (for initial placement)
      this.placeTokenDirectly(targetSquare, token, currentTokenElement);
    }

    // Update token state
    this.updateTokenState(token, pathIndex);
  }

  getTargetSquare(playerName, tokenIndex, pathIndex) {
    let targetSquare;

    if (pathIndex === 0) {
      // Token is in home area
      const homeSquares = this.getHomeSquares(playerName);
      if (homeSquares[tokenIndex]) {
        targetSquare = document.querySelector(
          `[data-row="${homeSquares[tokenIndex].row}"][data-col="${homeSquares[tokenIndex].col}"]`
        );
      }
    } else if (pathIndex >= this.finalPosition) {
      // Token has finished
      const centerPos = this.boardConfig.CENTER;
      targetSquare = document.querySelector(
        `[data-row="${centerPos.row}"][data-col="${centerPos.col}"]`
      );
    } else {
      // Token is on the path
      const position = this.getPositionFromPathIndex(
        pathIndex,
        this.getPlayerIdFromName(playerName)
      );
      if (position) {
        targetSquare = document.querySelector(
          `[data-row="${position.row}"][data-col="${position.col}"]`
        );
      }
    }

    return targetSquare;
  }

  async animateTokenMovement(tokenElement, targetSquare, token, pathIndex) {
    // Phase 1: Preparation animation
    tokenElement.classList.add("preparing-move");
    await this.delay(800);
    tokenElement.classList.remove("preparing-move");

    // Phase 2: Highlight movement path (optional enhancement)
    this.highlightMovementPath(tokenElement, targetSquare);

    // Phase 3: Main movement animation
    tokenElement.classList.add("moving");

    // Remove from current position
    tokenElement.remove();

    // Add to target position with animation
    this.addTokenToSquare(targetSquare, token);
    const newTokenElement = document.querySelector(
      `[data-token-id="${token.id}"]`
    );

    if (newTokenElement) {
      newTokenElement.classList.add("moving");

      // Wait for movement animation to complete
      await this.delay(1200);

      // Phase 4: Settlement animation
      newTokenElement.classList.remove("moving");
      newTokenElement.classList.add("settling");

      await this.delay(600);
      newTokenElement.classList.remove("settling");

      // Phase 5: Special effects based on move result
      await this.applyMoveEffects(newTokenElement, pathIndex);
    }

    // Clear path highlighting
    this.clearPathHighlighting();
  }

  highlightMovementPath(fromElement, toSquare) {
    // Add visual path highlighting (optional)
    const fromSquare = fromElement.closest(".square");
    if (fromSquare && toSquare) {
      // Simple path highlighting - can be enhanced further
      toSquare.classList.add("movement-path");

      // Remove highlighting after a delay
      setTimeout(() => {
        toSquare.classList.remove("movement-path");
      }, 1800);
    }
  }

  clearPathHighlighting() {
    const highlightedSquares = document.querySelectorAll(".movement-path");
    highlightedSquares.forEach((square) => {
      square.classList.remove("movement-path");
    });
  }

  async applyMoveEffects(tokenElement, pathIndex) {
    // Apply special effects based on the move result
    if (pathIndex >= this.finalPosition) {
      // Token finished - celebration effect
      tokenElement.classList.add("finishing");
      await this.delay(1800);
      tokenElement.classList.remove("finishing");
    }
  }

  placeTokenDirectly(targetSquare, token, currentTokenElement) {
    // Remove token from current position
    if (currentTokenElement) {
      currentTokenElement.remove();
    }

    // Add token to new position
    this.addTokenToSquare(targetSquare, token);
  }

  updateTokenState(token, pathIndex) {
    token.pathIndex = pathIndex;
    if (pathIndex >= this.finalPosition) {
      token.state = "FINISHED";
    } else if (pathIndex === 0) {
      token.state = "IN_HOME";
    } else {
      token.state = "ON_BOARD";
    }
  }

  async animateCapture(playerId, tokenIndex) {
    const playerName = this.getPlayerNameFromId(playerId);
    const token = this.tokens[playerName][tokenIndex];
    const tokenElement = document.querySelector(
      `[data-token-id="${token.id}"]`
    );

    if (tokenElement) {
      // Enhanced capture animation
      tokenElement.classList.add("captured");

      // Wait for capture animation to complete
      await this.delay(1500);

      // Remove from current position and place back in home
      tokenElement.remove();

      // Place token back in home area
      const homeSquares = this.getHomeSquares(playerName);
      const homeSquare = document.querySelector(
        `[data-row="${homeSquares[tokenIndex].row}"][data-col="${homeSquares[tokenIndex].col}"]`
      );

      if (homeSquare) {
        this.addTokenToSquare(homeSquare, token);
        const newTokenElement = document.querySelector(
          `[data-token-id="${token.id}"]`
        );

        if (newTokenElement) {
          // Add entrance animation for returning home
          newTokenElement.style.opacity = "0";
          newTokenElement.style.transform = "translate(-50%, -50%) scale(0)";

          await this.delay(200);

          newTokenElement.style.transition = "all 0.8s ease-out";
          newTokenElement.style.opacity = "1";
          newTokenElement.style.transform = "translate(-50%, -50%) scale(1)";
        }
      }
    }
  }

  getPlayerIdFromName(playerName) {
    const activePlayers = this.getActivePlayers();
    return activePlayers.indexOf(playerName) + 1;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  updateGameStatus() {
    // Update any status displays
    const statusElement = document.querySelector(".game-status");
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
      const counterElement = document.querySelector(
        `#player-${playerId}-moves`
      );
      if (counterElement) {
        counterElement.textContent = `${this.moveCount[playerId]}/${this.maxMoves}`;
      }
    });
  }

  checkGameEnd() {
    const activePlayers = this.getActivePlayers();

    // Check if any player has all tokens finished
    for (
      let playerIndex = 0;
      playerIndex < activePlayers.length;
      playerIndex++
    ) {
      const playerId = playerIndex + 1;
      const allFinished = this.playerPositions[playerId].every(
        (pos) => pos >= this.finalPosition
      );

      if (allFinished) {
        console.log(`Player ${playerId} has finished all tokens! Ending game.`);
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
      console.log("All players reached move limit, ending game by score.");
      this.endGame(null); // No one finished, determine by score
    }
  }

  endGame(winnerId) {
    console.log(`endGame called with winnerId: ${winnerId}`);

    // Set game state immediately to prevent any further processing
    this.gameState = "GAME_OVER";

    // Stop autoplay if active
    if (this.isAutoplayMode) {
      this.stopAutoplay();
    }

    // Calculate final scores and determine actual winner
    const finalWinner = this.determineFinalWinner(winnerId);

    // Show grand winner announcement
    this.showGrandWinnerAnnouncement(finalWinner);

    // Disable dice rolling
    const rollButton = document.getElementById("rollDiceBtn");
    if (rollButton) {
      rollButton.disabled = true;
      rollButton.textContent = "Game Over";
    }

    console.log(`Game ended. Winner: Player ${finalWinner.winner.playerId}`);
  }

  // New method to determine final winner based on scores
  determineFinalWinner(gameWinnerId) {
    const activePlayers = this.getActivePlayers();
    const finalScores = [];

    activePlayers.forEach((playerName, playerIndex) => {
      const playerId = playerIndex + 1;
      finalScores.push({
        playerId,
        playerName,
        score: this.playerScores[playerId],
        allTokensFinished: this.playerPositions[playerId].every(
          (pos) => pos >= this.finalPosition
        ),
        strategy: this.playerStrategies[playerId],
      });
    });

    // Sort by score (highest first)
    finalScores.sort((a, b) => b.score - a.score);

    // If someone finished all tokens, they win regardless of score
    const playerWithAllTokensFinished = finalScores.find(
      (p) => p.allTokensFinished
    );

    if (playerWithAllTokensFinished) {
      return {
        winner: playerWithAllTokensFinished,
        rankings: finalScores,
        winType: "COMPLETION",
      };
    } else {
      return {
        winner: finalScores[0],
        rankings: finalScores,
        winType: "SCORE",
      };
    }
  }

  // New method for grand winner announcement
  showGrandWinnerAnnouncement(gameResult) {
    // Remove score display
    const scoreDisplay = document.getElementById("scoreDisplay");
    if (scoreDisplay) {
      scoreDisplay.style.animation = "slideOutRight 0.5s ease-in-out forwards";
    }

    // Create winner announcement overlay
    const winnerOverlay = document.createElement("div");
    winnerOverlay.className = "winner-announcement-overlay";

    const { winner, rankings, winType } = gameResult;
    const winnerColor = this.getPlayerColor(winner.playerId);

    winnerOverlay.innerHTML = `
      <div class="winner-announcement-container">
        <!-- Animated Background -->
        <div class="winner-bg-animation">
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
          <div class="winner-particle"></div>
        </div>
        
        <!-- Crown Animation -->
        <div class="winner-crown-container">
          <div class="winner-crown">
            <i class="fas fa-crown"></i>
          </div>
        </div>
        
        <!-- Winner Content -->
        <div class="winner-content">
          <div class="winner-title">
            <div class="winner-title-text">VICTORY!</div>
            <div class="winner-subtitle">${
              winType === "COMPLETION"
                ? "All Tokens Completed"
                : "Highest Score Achieved"
            }</div>
          </div>
          
          <div class="winner-player-display">
            <div class="winner-player-badge" style="background: ${winnerColor};">
              <div class="winner-player-number">P${winner.playerId}</div>
            </div>
            <div class="winner-player-info">
              <div class="winner-player-name">${winner.playerName}</div>
              <div class="winner-player-strategy">
                <i class="fas ${
                  winner.strategy === "AGGRESSIVE" ? "fa-fire" : "fa-route"
                }"></i>
                ${winner.strategy} Strategy
              </div>
            </div>
          </div>
          
          <div class="winner-score-display">
            <div class="winner-final-score">
              <div class="winner-score-value">${winner.score}</div>
              <div class="winner-score-label">Final Score</div>
            </div>
          </div>
          
          <!-- Rankings Table -->
          <div class="winner-rankings">
            <div class="rankings-title">Final Rankings</div>
            <div class="rankings-table">
              ${rankings
                .map(
                  (player, index) => `
                <div class="ranking-row ${
                  index === 0 ? "first-place" : ""
                }" style="animation-delay: ${index * 0.2}s;">
                  <div class="ranking-position">
                    <span class="position-number">${index + 1}</span>
                    ${index === 0 ? '<i class="fas fa-crown"></i>' : ""}
                  </div>
                  <div class="ranking-player">
                    <div class="ranking-badge" style="background: ${this.getPlayerColor(
                      player.playerId
                    )};"></div>
                    <span class="ranking-name">Player ${player.playerId}</span>
                    <span class="ranking-strategy">${player.strategy}</span>
                  </div>
                  <div class="ranking-score">${player.score} pts</div>
                  <div class="ranking-status">
                    ${
                      player.allTokensFinished
                        ? '<i class="fas fa-check-circle text-success"></i> Complete'
                        : '<i class="fas fa-clock text-warning"></i> In Progress'
                    }
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="winner-actions">
            <button class="winner-btn winner-btn-primary" onclick="regenerateBoard()">
              <i class="fas fa-redo"></i>
              New Game
            </button>
            <button class="winner-btn winner-btn-secondary" onclick="goHome()">
              <i class="fas fa-home"></i>
              Home
            </button>
            <button class="winner-btn winner-btn-info" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              <i class="fas fa-times"></i>
              Close
            </button>
          </div>
        </div>
        
        <!-- Confetti Animation -->
        <div class="confetti-container">
          ${Array.from(
            { length: 50 },
            (_, i) => `
            <div class="confetti confetti-${i % 6}" style="
              left: ${Math.random() * 100}%;
              animation-delay: ${Math.random() * 3}s;
              animation-duration: ${3 + Math.random() * 2}s;
            "></div>
          `
          ).join("")}
        </div>
      </div>
    `;

    document.body.appendChild(winnerOverlay);

    // Trigger entrance animation
    setTimeout(() => {
      winnerOverlay.classList.add("show");
    }, 100);

    // Play victory sound (if available)
    this.playVictorySound();
  }

  // New method to play victory sound
  playVictorySound() {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRpgGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYoGAAA="
      );
      audio.play().catch(() => {
        // Sound failed to play, that's okay
      });
    } catch (e) {
      // Ignore sound errors
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
    alert("Game ended in a draw - Move limit reached!");
  }

  createVictoryDisplay(winnerId, playerName) {
    // Create a victory overlay
    const overlay = document.createElement("div");
    overlay.className = "victory-overlay";
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
      console.log("Connected to dice roller");
    }

    // Override the dice roll processing
    window.ludoGame = this;
  }

  async processDiceRoll(rollResult) {
    // Process dice roll from the 3D dice system
    console.log("Processing dice roll:", rollResult);

    if (this.gameState !== "WAITING_FOR_DICE") {
      console.log("Game not ready for dice roll");
      return;
    }

    this.gameState = "PROCESSING_MOVE";
    // Log the dice roll
    this.logDiceRoll(rollResult);

    // Get current player from dice roller
    const rollerPlayerId = rollResult.player;

    // Execute the turn
    await this.playTurn(rollerPlayerId, rollResult.values);

    // Advance to next round
    this.currentRound++;

    // Reset game state
    this.gameState = "WAITING_FOR_DICE";

    console.log("Turn completed, game ready for next roll");
    // Check if game should continue in autoplay mode
    if (this.isAutoplayMode && this.gameState === "WAITING_FOR_DICE") {
      this.scheduleAutoRoll();
    }
  }

  // Debug method to check autoplay readiness
  checkAutoplayReadiness() {
    console.log("=== Autoplay Readiness Check ===");
    console.log("Game instance:", !!window.ludoGame);
    console.log("Game state:", this.gameState);
    console.log("Autoplay mode:", this.isAutoplayMode);
    console.log("DiceRoller available:", !!window.diceRoller);
    console.log(
      "DiceRoller isRolling:",
      window.diceRoller ? window.diceRoller.isRolling : "N/A"
    );
    console.log("rollDice function:", typeof window.rollDice);
    console.log(
      "ensureDiceRollerReady function:",
      typeof window.ensureDiceRollerReady
    );
    console.log("================================");

    return {
      gameReady: !!window.ludoGame && this.gameState === "WAITING_FOR_DICE",
      diceRollerReady: !!window.diceRoller && !window.diceRoller.isRolling,
      functionsReady:
        typeof window.rollDice === "function" &&
        typeof window.ensureDiceRollerReady === "function",
    };
  }

  // Enhanced method to schedule automatic dice roll
  scheduleAutoRoll() {
    // Clear any existing timeout
    if (this.autoplayTimeoutId) {
      clearTimeout(this.autoplayTimeoutId);
    }

    // Check if game is still active
    if (this.gameState === "GAME_OVER") {
      console.log("Game over, stopping autoplay");
      this.stopAutoplay();
      return;
    }

    console.log(`Scheduling next auto-roll in ${this.autoplayDelay}ms...`);

    // Schedule next roll
    this.autoplayTimeoutId = setTimeout(() => {
      if (this.isAutoplayMode && this.gameState === "WAITING_FOR_DICE") {
        console.log("Auto-roll timer triggered, executing roll...");
        this.triggerAutoRoll();
      } else {
        console.log("Auto-roll timer triggered but conditions not met:", {
          isAutoplayMode: this.isAutoplayMode,
          gameState: this.gameState,
        });
      }
    }, this.autoplayDelay);
  }

  // Enhanced method to trigger automatic roll
  async triggerAutoRoll() {
    console.log("triggerAutoRoll called, checking conditions...");

    // First, ensure dice roller is ready
    const isDiceRollerReady = await window.ensureDiceRollerReady();

    console.log("diceRoller ready:", isDiceRollerReady);
    console.log("diceRoller available:", !!window.diceRoller);
    console.log(
      "diceRoller isRolling:",
      window.diceRoller ? window.diceRoller.isRolling : "N/A"
    );

    if (
      isDiceRollerReady &&
      window.diceRoller &&
      !window.diceRoller.isRolling
    ) {
      console.log("Triggering automatic dice roll...");
      const success = window.rollDice(true); // Pass true to indicate this is auto-triggered

      if (!success) {
        console.log("Failed to trigger dice roll, retrying...");
        setTimeout(() => {
          if (this.isAutoplayMode) {
            this.triggerAutoRoll();
          }
        }, 1000);
      }
    } else {
      console.log("Dice roller not ready or currently rolling, retrying...");
      // Retry after a longer delay
      setTimeout(() => {
        if (this.isAutoplayMode) {
          console.log("Retrying auto roll...");
          this.triggerAutoRoll();
        }
      }, 1000); // Increased delay to 1 second
    }
  }

  // Enhanced method to start autoplay mode
  async startAutoplay() {
    console.log("Starting autoplay mode");

    // First ensure dice roller is ready
    const isDiceRollerReady = await window.ensureDiceRollerReady();

    if (!isDiceRollerReady) {
      alert("Dice roller is not ready. Please wait a moment and try again.");
      return;
    }

    this.isAutoplayMode = true;

    // Disable manual dice rolling
    this.setDiceButtonState(false);

    // Update autoplay button
    this.updateAutoplayButton();

    // Start auto-rolling if game is ready
    if (this.gameState === "WAITING_FOR_DICE") {
      this.scheduleAutoRoll();
    }
  }

  // New method to stop autoplay mode
  stopAutoplay() {
    console.log("Stopping autoplay mode");
    this.isAutoplayMode = false;

    // Clear any pending auto-roll
    if (this.autoplayTimeoutId) {
      clearTimeout(this.autoplayTimeoutId);
      this.autoplayTimeoutId = null;
    }

    // Re-enable manual dice rolling
    this.setDiceButtonState(true);

    // Update autoplay button
    this.updateAutoplayButton();
  }

  // New method to set dice button state
  setDiceButtonState(enabled) {
    const rollButton = document.getElementById("rollDiceBtn");
    if (rollButton) {
      rollButton.disabled = !enabled;

      if (!enabled) {
        // Add visual indication that button is disabled due to autoplay
        rollButton.classList.add("autoplay-disabled");
        rollButton.title = "Disabled during autoplay mode";
      } else {
        rollButton.classList.remove("autoplay-disabled");
        rollButton.title = "";
      }
    }
  }

  // New method to update autoplay button appearance
  updateAutoplayButton() {
    const autoplayBtn = document.getElementById("autoplayBtn");
    if (autoplayBtn) {
      if (this.isAutoplayMode) {
        autoplayBtn.innerHTML = '<i class="fas fa-hand-paper me-1"></i> Manual';
        autoplayBtn.className = "btn btn-warning me-2";
        autoplayBtn.title = "Click to switch to manual mode";
      } else {
        autoplayBtn.innerHTML = '<i class="fas fa-play me-1"></i> Autoplay';
        autoplayBtn.className = "btn btn-secondary me-2";
        autoplayBtn.title = "Click to enable autoplay mode";
      }
    }
  }

  // New method to create score display
  createScoreDisplay() {
    const scoreContainer = document.createElement("div");
    scoreContainer.id = "scoreDisplay";
    scoreContainer.className = "score-display-container";

    const activePlayers = this.getActivePlayers();
    let scoreHTML = `
    <div class="score-display-header">
      <i class="fas fa-trophy"></i>
      <span>Live Scores</span>
    </div>
    <div class="score-players-grid">
  `;

    activePlayers.forEach((playerName, playerIndex) => {
      const playerId = playerIndex + 1;
      const playerColor = this.getPlayerColor(playerId);

      scoreHTML += `
      <div class="score-player-card" data-player="${playerId}">
        <div class="score-player-header" style="background: ${playerColor};">
          <div class="score-player-badge">P${playerId}</div>
          <div class="score-player-name">${playerName}</div>
          <div class="score-player-strategy">${this.playerStrategies[playerId]}</div>
        </div>
        <div class="score-value-container">
          <div class="score-value" id="score-${playerId}">0</div>
          <div class="score-label">Points</div>
          <div class="score-animation" id="scoreAnim-${playerId}"></div>
        </div>
      </div>
    `;
    });

    scoreHTML += `
    </div>
    <div class="score-display-footer">
      <div class="max-possible-score">Max: ${
        this.finalPosition * parseInt(this.config.numTokens)
      } pts</div>
    </div>
  `;

    scoreContainer.innerHTML = scoreHTML;
    document.body.appendChild(scoreContainer);
  }

  // New method to update player score with animation
  async updatePlayerScore(playerId, pointsChange) {
    if (pointsChange === 0) return;

    const previousScore = this.playerScores[playerId];
    this.playerScores[playerId] = Math.max(
      0,
      this.playerScores[playerId] + pointsChange
    ); // Ensure score doesn't go below 0

    // Animate score change
    const scoreElement = document.getElementById(`score-${playerId}`);
    const scoreAnimElement = document.getElementById(`scoreAnim-${playerId}`);

    if (scoreElement && scoreAnimElement) {
      // Show points change animation with appropriate styling
      if (pointsChange > 0) {
        scoreAnimElement.textContent = `+${pointsChange}`;
        scoreAnimElement.className = "score-animation show positive";
      } else {
        scoreAnimElement.textContent = `${pointsChange}`; // Already has negative sign
        scoreAnimElement.className = "score-animation show negative";
      }

      // Update the score with counting animation
      const newScore = this.playerScores[playerId];

      await this.animateScoreCount(
        scoreElement,
        previousScore,
        newScore,
        pointsChange < 0
      );

      // Remove animation
      setTimeout(() => {
        scoreAnimElement.className = "score-animation";
      }, 2000);
    }

    console.log(
      `Player ${playerId} score updated: ${previousScore} → ${
        this.playerScores[playerId]
      } (${pointsChange > 0 ? "+" : ""}${pointsChange})`
    );
  }

  // New method to animate score counting
  async animateScoreCount(element, startScore, endScore, isDecrease = false) {
    const duration = 1000; // 1 second
    const steps = 30;
    const stepValue = (endScore - startScore) / steps;
    const stepDuration = duration / steps;

    // Add visual feedback for score changes
    if (isDecrease) {
      element.style.color = "#e74c3c"; // Red for decrease
    } else {
      element.style.color = "#27ae60"; // Green for increase
    }

    for (let i = 0; i <= steps; i++) {
      const currentValue = Math.round(startScore + stepValue * i);
      element.textContent = currentValue;

      // Enhanced animation for score changes
      const scaleEffect = 1 + Math.sin((i / steps) * Math.PI) * 0.15;
      element.style.transform = `scale(${scaleEffect})`;

      if (i < steps) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
      }
    }

    // Reset styling
    element.style.transform = "scale(1)";
    setTimeout(() => {
      element.style.color = "#2c3e50"; // Back to normal color
    }, 1000);
  }

  // ============ EXISTING METHODS (Keep all existing UI methods) ============

  getBoardDimensions(boardSize) {
    const dimensionMap = {
      7: 9,
      9: 11,
      11: 13,
      13: 15,
    };
    return dimensionMap[parseInt(boardSize)];
  }

  generateBoard() {
    const boardSize = parseInt(this.config.boardSize);
    const gridSize = this.getBoardDimensions(boardSize);

    console.log(
      `Generating board: ${boardSize} squares -> ${gridSize}x${gridSize} grid`
    );

    // Clear existing board
    this.boardElement.innerHTML = "";

    // Remove previous board size classes
    this.boardElement.className = "ludo-board";
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
    const square = document.createElement("div");
    square.className = "square";
    square.dataset.row = row;
    square.dataset.col = col;

    // Determine square type based on position
    const squareClasses = this.getSquareType(row, col, gridSize, boardSize);

    // Add classes properly
    if (Array.isArray(squareClasses)) {
      square.classList.add(...squareClasses);
    } else if (typeof squareClasses === "string") {
      const classArray = squareClasses
        .split(" ")
        .filter((cls) => cls.trim() !== "");
      square.classList.add(...classArray);
    }

    // Check if this square is a center home square
    if (this.isCenterHomeSquare(row, col, gridSize, boardSize)) {
      square.classList.add("center-home");
    }

    // Add coordinate text for debugging (remove in production)
    const coordText = document.createElement("span");
    coordText.className = "coord-text";
    coordText.textContent = `${row},${col}`;
    square.appendChild(coordText);

    // Add click event for future interactions
    square.addEventListener("click", () => {
      this.onSquareClick(row, col, square);
    });

    return square;
  }

  // New method to check if a square is a center home square
  isCenterHomeSquare(row, col, gridSize, boardSize) {
    const homeSize = Math.floor((gridSize - 3) / 2);
    const centerRegions = this.getHomeCenterRegions(homeSize, gridSize);

    // Check each player's center region
    for (const [player, region] of Object.entries(centerRegions)) {
      if (
        row >= region.startRow &&
        row <= region.endRow &&
        col >= region.startCol &&
        col <= region.endCol
      ) {
        return true;
      }
    }

    return false;
  }

  placeTokensInHomeAreas() {
    const activePlayers = this.getActivePlayers();

    activePlayers.forEach((player) => {
      const homeSquares = this.getHomeSquares(player);
      const tokens = this.tokens[player];

      tokens.forEach((token, index) => {
        if (index < homeSquares.length) {
          const homeSquare = homeSquares[index];
          const square = document.querySelector(
            `[data-row="${homeSquare.row}"][data-col="${homeSquare.col}"]`
          );

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
    // Special handling for board size 7
    if (boardSize === 7) {
      // Define explicit positions for each player's tokens in 7x7 board
      const explicitPositions = {
        RED: [
          { row: 1, col: 0 }, // 1st token
          { row: 1, col: 1 }, // 2nd token
          { row: 2, col: 0 }, // 3rd token
          { row: 2, col: 1 }, // 4th token
        ],
        BLUE: [
          { row: 1, col: 6 }, // 1st token
          { row: 1, col: 5 }, // 2nd token
          { row: 2, col: 6 }, // 3rd token
          { row: 2, col: 5 }, // 4th token
        ],
        GREEN: [
          { row: 6, col: 0 }, // 1st token
          { row: 6, col: 1 }, // 2nd token
          { row: 5, col: 0 }, // 3rd token
          { row: 5, col: 1 }, // 4th token
        ],
        YELLOW: [
          { row: 7, col: 7 }, // 1st token
          { row: 7, col: 8 }, // 2nd token
          { row: 8, col: 7 }, // 3rd token
          { row: 8, col: 8 }, // 4th token
        ],
      };

      // Return the explicit positions for the specified player
      if (explicitPositions[player]) {
        return explicitPositions[player];
      }
    }



    if (boardSize === 11) {
      // Define explicit positions for each player's tokens in 7x7 board
      const explicitPositions = {
        RED: [
          { row: 1, col: 1 }, // 1st token
          { row: 1, col: 2 }, // 2nd token
          { row: 2, col: 1 }, // 3rd token
          { row: 2, col: 2 }, // 4th token
        ],
        BLUE: [
          { row: 1, col: 6 }, // 1st token
          { row: 1, col: 5 }, // 2nd token
          { row: 2, col: 6 }, // 3rd token
          { row: 2, col: 5 }, // 4th token
        ],
        GREEN: [
          { row: 6, col: 0 }, // 1st token
          { row: 6, col: 1 }, // 2nd token
          { row: 5, col: 0 }, // 3rd token
          { row: 5, col: 1 }, // 4th token
        ],
        YELLOW: [
          { row: 10, col: 10 }, // 1st token
          { row: 10, col: 11 }, // 2nd token
          { row: 11, col: 10 }, // 3rd token
          { row: 11, col: 11 }, // 4th token
        ],
      };

      // Return the explicit positions for the specified player
      if (explicitPositions[player]) {
        return explicitPositions[player];
      }
    }

    // Define center regions for each player's home area
    const centerRegions = this.getHomeCenterRegions(homeSize, gridSize);

    // Get center squares for the specific player
    const playerCenterRegion = centerRegions[player];

    if (playerCenterRegion) {
      for (
        let row = playerCenterRegion.startRow;
        row <= playerCenterRegion.endRow;
        row++
      ) {
        for (
          let col = playerCenterRegion.startCol;
          col <= playerCenterRegion.endCol;
          col++
        ) {
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
    const centerSize = Math.max(1, homeSize - centerOffset * 2); // Size of center region

    return {
      RED: {
        // Top-left home area
        startRow: centerOffset,
        endRow: centerOffset + centerSize - 1,
        startCol: centerOffset,
        endCol: centerOffset + centerSize - 1,
      },
      BLUE: {
        // Top-right home area
        startRow: centerOffset + 1,
        endRow: centerOffset + centerSize,
        startCol: gridSize - homeSize + centerOffset,
        endCol: gridSize - homeSize + centerOffset + centerSize - 1,
      },
      GREEN: {
        // Bottom-left home area
        startRow: gridSize - homeSize + centerOffset,
        endRow: gridSize - homeSize + centerOffset + centerSize - 1,
        startCol: centerOffset + 1,
        endCol: centerOffset + centerSize,
      },
      YELLOW: {
        // Bottom-right home area
        startRow: gridSize - homeSize + centerOffset,
        endRow: gridSize - homeSize + centerOffset + centerSize - 1,
        startCol: gridSize - homeSize + centerOffset,
        endCol: gridSize - homeSize + centerOffset + centerSize - 1,
      },
    };
  }

  addTokenToSquare(square, token) {
    const tokenElement = document.createElement("div");
    tokenElement.className = `token token-${token.player.toLowerCase()}`;
    tokenElement.dataset.tokenId = token.id;
    tokenElement.dataset.player = token.player;

    // Add token number
    tokenElement.textContent = token.id.split("_")[1];

    // Add click handler for token
    tokenElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onTokenClick(token, tokenElement);
    });

    square.appendChild(tokenElement);
  }

  onTokenClick(token, tokenElement) {
    console.log("Token clicked:", token);
    console.log(
      "Current position:",
      this.playerPositions[token.playerId][token.tokenIndex]
    );

    // Add selection effect
    document
      .querySelectorAll(".token")
      .forEach((t) => t.classList.remove("selected"));
    tokenElement.classList.add("selected");

    // Add pulse effect
    tokenElement.style.transform = "scale(1.2)";
    setTimeout(() => {
      tokenElement.style.transform = "";
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
      progress: `${pathIndex}/${this.finalPosition}`,
    });
  }

  // Keep all existing getSquareType, getStartingSquare, getSafeSquare, etc. methods...
  getSquareType(row, col, gridSize, boardSize) {
    const center = Math.floor(gridSize / 2);
    const homeSize = Math.floor((gridSize - 3) / 2);

    // Center square (finish area)
    if (row === center && col === center) {
      return "center";
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
      return "home-finish";
    }

    // Home areas (corners) with color identification
    if (row < homeSize && col < homeSize) {
      return ["home-area", "red-home"]; // Top-left: Red
    }
    if (row < homeSize && col > gridSize - homeSize - 1) {
      return ["home-area", "blue-home"]; // Top-right: Blue
    }
    if (row > gridSize - homeSize - 1 && col < homeSize) {
      return ["home-area", "green-home"]; // Bottom-left: Green
    }
    if (row > gridSize - homeSize - 1 && col > gridSize - homeSize - 1) {
      return ["home-area", "yellow-home"]; // Bottom-right: Yellow
    }

    // Path squares (the playable path around the board)
    if (this.isPathSquare(row, col, gridSize)) {
      return "path";
    }

    // Default square
    return "normal";
  }

  getStartingSquare(row, col, boardSize) {
    const startSquares = this.boardConfig.START_SQUARES;

    if (row === startSquares.RED.row && col === startSquares.RED.col)
      return ["starting-square", "red-start"];
    if (row === startSquares.BLUE.row && col === startSquares.BLUE.col)
      return ["starting-square", "blue-start"];
    if (row === startSquares.YELLOW.row && col === startSquares.YELLOW.col)
      return ["starting-square", "yellow-start"];
    if (row === startSquares.GREEN.row && col === startSquares.GREEN.col)
      return ["starting-square", "green-start"];

    return null;
  }

  getSafeSquare(row, col, boardSize) {
    const safeSquares = this.boardConfig.SAFE_SQUARES;

    for (let safeSquare of safeSquares) {
      if (row === safeSquare.row && col === safeSquare.col) {
        return "safe-square";
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
          return ["home-entrance", `${player.toLowerCase()}-entrance`];
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
    square.style.backgroundColor = "#007bff";
    square.style.color = "white";
    square.style.transform = "scale(1.05)";

    setTimeout(() => {
      square.style.backgroundColor = originalBg;
      square.style.color = "";
      square.style.transform = "";
    }, 300);
  }

  updateStatusDisplay() {
    const statusText = document.querySelector(".status-text");
    if (statusText) {
      statusText.textContent = `${this.getBoardDimensions(
        this.config.boardSize
      )}×${this.getBoardDimensions(this.config.boardSize)} Board Generated`;
    }
  }

  //FUNCTIONALITY FOR GAME LOGGING AND STATISTICS
  initializeGameLogs() {
    this.gameStartTime = new Date();
    this.detailedGameHistory = [];
    this.diceStatistics = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    this.playerStatistics = {};

    // Initialize player statistics with consistent structure
    const activePlayers = this.getActivePlayers();
    activePlayers.forEach((_, playerIndex) => {
      const playerId = playerIndex + 1;
      this.playerStatistics[playerId] = {
        name: this.getPlayerNameFromId(playerId),
        totalMoves: 0,
        bonusMoves: 0,
        captures: 0,
        finishedTokens: 0,
        finishes: 0, // Add this for consistency
        diceRolls: [], // Keep original name for dice roll logging
        diceHistory: [], // Add this for updatePlayerStatistics
        averageDice: 0,
        longestBonus: 0,
        totalDistance: 0,
        averageDistance: 0,
        strategy: this.playerStrategies[playerId] || "PREDICTABLE", // Add strategy here too
      };
    });
  }

  logDiceRoll(rollResult) {
    // Record dice statistics
    rollResult.values.forEach((value) => {
      this.diceStatistics[value]++;
    });

    // Add to player's dice history
    const playerId = rollResult.player;
    if (this.playerStatistics[playerId]) {
      this.playerStatistics[playerId].diceRolls.push(...rollResult.values);
      this.updatePlayerAverages(playerId);
    }
  }

  // Enhanced logging to include strategy information
  logMove(moveData) {
    // Enhanced move logging with detailed information including dice tracking, strategy, and points
    const timestamp = new Date();

    // Get actual board coordinates for from and to positions
    const fromBoardIndex = this.getActualBoardIndex(
      moveData.player,
      moveData.initPositions,
      typeof moveData.token === "number" ? moveData.token - 1 : 0
    );
    const toBoardIndex = this.getActualBoardIndex(
      moveData.player,
      moveData.finalPositions,
      typeof moveData.token === "number" ? moveData.token - 1 : 0
    );

    // Calculate available dice for this specific move
    const availableDice = this.calculateAvailableDiceForMove(moveData);

    const detailedMove = {
      id: this.detailedGameHistory.length + 1,
      timestamp: timestamp,
      round: this.currentRound,
      player: moveData.player,
      playerName: this.getPlayerNameFromId(moveData.player),
      strategy:
        moveData.strategy ||
        this.playerStrategies[moveData.player] ||
        "PREDICTABLE",
      token: moveData.token,
      diceValue: moveData.diceValue,
      moveType: moveData.moveType || "regular",
      fromPosition: moveData.initPositions
        ? moveData.initPositions[
            (moveData.player - 1) * parseInt(this.config.numTokens) +
              (typeof moveData.token === "number" ? moveData.token - 1 : 0)
          ]
        : 0,
      toPosition: moveData.finalPositions
        ? moveData.finalPositions[
            (moveData.player - 1) * parseInt(this.config.numTokens) +
              (typeof moveData.token === "number" ? moveData.token - 1 : 0)
          ]
        : 0,
      fromBoardIndex: fromBoardIndex,
      toBoardIndex: toBoardIndex,
      captured: moveData.result ? moveData.result.captured : false,
      finished: moveData.result ? moveData.result.finished : false,
      pointsEarned: moveData.result
        ? moveData.result.pointsEarned || moveData.diceValue
        : moveData.diceValue, // Track points earned
      currentPlayerScore: this.playerScores[moveData.player], // Track current score after move
      usedValues: moveData.usedValues || [moveData.diceValue],
      allDiceValues: moveData.allDiceValues || [moveData.diceValue],
      availableDice: availableDice,
      distance: moveData.diceValue,
      gameState: JSON.parse(JSON.stringify(this.playerPositions)),
      moveSequenceInfo: this.getMoveSequenceInfo(moveData),
    };

    this.detailedGameHistory.push(detailedMove);
    this.updatePlayerStatistics(detailedMove);

    console.log("Move logged:", detailedMove);
  }

  // New method to calculate available dice for a specific move
  calculateAvailableDiceForMove(moveData) {
    // If this is a bonus move, return the bonus dice values
    if (moveData.moveType === "bonus") {
      return moveData.usedValues;
    }

    // For regular moves from the 3-dice system, we need to track the sequence
    const currentRoundMoves = this.detailedGameHistory.filter(
      (move) =>
        move.round === this.currentRound &&
        move.moveType !== "bonus" &&
        move.allDiceValues &&
        JSON.stringify(move.allDiceValues) ===
          JSON.stringify(moveData.allDiceValues)
    );

    // Get all dice values from this roll
    const allDiceFromRoll = [...moveData.allDiceValues];

    // Remove dice values that have been used in previous moves of this sequence
    const usedDiceInSequence = [];
    currentRoundMoves.forEach((move) => {
      if (move.id !== this.detailedGameHistory.length) {
        // Don't count the current move
        usedDiceInSequence.push(move.diceValue);
      }
    });

    // Calculate remaining available dice
    const availableDice = [...allDiceFromRoll];
    usedDiceInSequence.forEach((usedValue) => {
      const index = availableDice.indexOf(usedValue);
      if (index > -1) {
        availableDice.splice(index, 1);
      }
    });

    return availableDice;
  }

  // New method to get move sequence information
  getMoveSequenceInfo(moveData) {
    const activePlayers = this.getActivePlayers();
    const numPlayers = activePlayers.length;

    // Find how many moves in this dice roll sequence have occurred
    const currentRoundMoves = this.detailedGameHistory.filter(
      (move) =>
        move.round === this.currentRound &&
        move.moveType !== "bonus" &&
        move.allDiceValues &&
        JSON.stringify(move.allDiceValues) ===
          JSON.stringify(moveData.allDiceValues)
    );

    const movePosition = currentRoundMoves.length; // 0-based position in the sequence

    // Generate the expected sequence for this roll
    const moveSequence = this.generateMoveSequence(moveData.player, numPlayers);

    return {
      positionInSequence: movePosition + 1, // 1-based for display
      totalMovesInSequence: 3,
      expectedPlayer: moveSequence[movePosition],
      isRoller: moveData.player === moveSequence[0],
      sequencePattern: moveSequence,
    };
  }
  // New method to get actual board coordinates
  getActualBoardIndex(playerId, positions, tokenIndex) {
    if (!positions) return { row: "N/A", col: "N/A" };

    const pathIndex =
      positions[(playerId - 1) * parseInt(this.config.numTokens) + tokenIndex];

    // Handle special cases
    if (pathIndex === 0) {
      // Token is in home area - use center home squares
      const playerName = this.getPlayerNameFromId(playerId);
      const homeSquares = this.getHomeSquares(playerName);
      if (homeSquares && homeSquares[tokenIndex]) {
        return {
          row: homeSquares[tokenIndex].row,
          col: homeSquares[tokenIndex].col,
          description: `Home Area Center (${homeSquares[tokenIndex].row}, ${homeSquares[tokenIndex].col})`,
        };
      }
      return { row: "Home", col: "Center", description: "Home Area Center" };
    }

    if (pathIndex >= this.finalPosition) {
      // Token is in center/finish area
      const centerPos = this.boardConfig.CENTER;
      return {
        row: centerPos.row,
        col: centerPos.col,
        description: `Finish Area (${centerPos.row}, ${centerPos.col})`,
      };
    }

    // Token is on the game path
    const position = this.getPositionFromPathIndex(pathIndex, playerId);
    if (position) {
      return {
        row: position.row,
        col: position.col,
        description: `Board Position (${position.row}, ${position.col})`,
      };
    }

    return { row: "Unknown", col: "Position", description: "Unknown Position" };
  }

  // Enhanced method to get board position description
  getBoardPositionDescription(boardIndex) {
    if (!boardIndex || boardIndex.row === "N/A") {
      return "Unknown Position";
    }

    if (boardIndex.description) {
      return boardIndex.description;
    }

    return `(${boardIndex.row}, ${boardIndex.col})`;
  }

  // Update player statistics to include strategy information
  updatePlayerStatistics(moveData) {
    const playerId = moveData.player;

    // Ensure player statistics exist with proper structure
    if (!this.playerStatistics[playerId]) {
      this.playerStatistics[playerId] = {
        name: this.getPlayerNameFromId(playerId),
        totalMoves: 0,
        captures: 0,
        finishes: 0,
        bonusMoves: 0,
        strategy: moveData.strategy || "PREDICTABLE",
        diceHistory: [],
        diceRolls: [], // Keep both for compatibility
        averageDice: 0,
        totalDistance: 0,
        averageDistance: 0,
      };
    }

    const stats = this.playerStatistics[playerId];

    // Ensure diceHistory array exists
    if (!stats.diceHistory) {
      stats.diceHistory = [];
    }

    // Update statistics
    stats.totalMoves++;
    stats.strategy = moveData.strategy || stats.strategy;
    stats.diceHistory.push(moveData.diceValue);
    stats.totalDistance += moveData.distance;

    if (moveData.captured) stats.captures++;
    if (moveData.finished) stats.finishes++;
    if (moveData.moveType === "bonus") stats.bonusMoves++;

    this.updatePlayerAverages(playerId);
  }

  // Fix the updatePlayerAverages method to handle missing properties
  updatePlayerAverages(playerId) {
    const stats = this.playerStatistics[playerId];
    // console.log("stats for player", playerId, stats);

    if (stats && stats.totalMoves > 0) {
      // Calculate average distance per move (total distance / total moves)
      stats.averageDice = (stats.totalDistance / stats.totalMoves).toFixed(2);
    } else {
      stats.averageDice = "0.00";
    }
  }

  getGameDuration() {
    if (!this.gameStartTime) return "00:00";

    const now = new Date();
    const diff = now - this.gameStartTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
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
      duration: this.getGameDuration(),
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
const style = document.createElement("style");
style.textContent = additionalCSS;
document.head.appendChild(style);

// Global functions
function goHome() {
  window.location.href = "/";
}
function newGame() {
  if (window.ludoGame) {
    window.location.reload();
  }
}

function regenerateBoard() {
  if (window.ludoGame) {
    window.ludoGame = new LudoGame();
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing Ludo Game...");
  window.ludoGame = new LudoGame();
});

// Add utility functions
window.LudoUtils = {
  getBoardDimensions: function (boardSize) {
    const dimensionMap = { 7: 9, 9: 11, 11: 13, 13: 15 };
    return dimensionMap[parseInt(boardSize)];
  },

  getTotalSquares: function (boardSize) {
    const gridSize = this.getBoardDimensions(boardSize);
    return gridSize * gridSize;
  },

  getGameStats: function () {
    const config = window.gameConfig;
    const gridSize = this.getBoardDimensions(config.boardSize);
    return {
      players: config.numPlayers,
      tokens: config.numTokens,
      boardSize: config.boardSize,
      rounds: config.numRounds, // Add rounds information
      gridDimensions: `${gridSize}×${gridSize}`,
      totalSquares: this.getTotalSquares(config.boardSize),
    };
  },

  getGameState: function () {
    return window.ludoGame
      ? {
          currentRound: window.ludoGame.currentRound,
          maxRounds: window.ludoGame.maxMoves,
          gameState: window.ludoGame.gameState,
          moveCount: window.ludoGame.moveCount,
          playerPositions: window.ludoGame.playerPositions,
        }
      : null;
  },
};

function openGameLogs() {
  if (!window.ludoGame) {
    alert("No active game found!");
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("gameLogsModal"));
  populateGameLogs();
  modal.show();
}

function populateGameLogs() {
  const game = window.ludoGame;
  const gameData = game.exportGameData();

  // Update summary statistics
  document.getElementById("totalMovesCount").textContent =
    gameData.detailedHistory.length;
  document.getElementById("currentRoundDisplay").textContent =
    gameData.currentRound;
  document.getElementById("gameDurationDisplay").textContent =
    gameData.duration;

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
  const playerButtons = document.querySelectorAll(
    '.filter-btn[data-filter]:not([data-filter="all"])'
  );
  playerButtons.forEach((btn, index) => {
    if (index < numPlayers) {
      btn.style.display = "inline-block";
    } else {
      btn.style.display = "none";
    }
  });
}

// Update this function in game.js
function populatePlayerStats(playerStats) {
  const container = document.getElementById("playerStatsGrid");
  container.innerHTML = "";

  Object.entries(playerStats).forEach(([playerId, stats]) => {
    const playerCard = document.createElement("div");
    playerCard.className = "player-stat-item";

    // Get strategy info and add color coding
    const strategy = stats.strategy || "PREDICTABLE";
    const strategyClass = strategy.toLowerCase();
    const strategyIcon = strategy === "AGGRESSIVE" ? "fa-fire" : "fa-route";
    const strategyColor = strategy === "AGGRESSIVE" ? "#e74c3c" : "#27ae60";

    playerCard.innerHTML = `
      <div class="player-name">
        <span class="player-badge player-${playerId}">P${playerId}</span>
        Player ${playerId}
        <div class="strategy-indicator" style="color: ${strategyColor};">
          <i class="fas ${strategyIcon}"></i> ${strategy}
        </div>
      </div>
      <div class="player-stats-details">
        <div class="stat-detail">
          <strong>Moves:</strong> ${stats.totalMoves}
        </div>
        <div class="stat-detail">
          <strong>Captures:</strong> ${stats.captures}
        </div>
        <div class="stat-detail">
          <strong>Finishes:</strong> ${stats.finishes}
        </div>
        <div class="stat-detail">
          <strong>Avg Dice:</strong> ${stats.averageDice}
        </div>
      </div>
    `;

    container.appendChild(playerCard);
  });
}

function populateDiceAnalytics(diceStats) {
  const container = document.getElementById("diceStatsContainer");
  container.innerHTML = "";

  const totalRolls = Object.values(diceStats).reduce((a, b) => a + b, 0);

  for (let i = 1; i <= 6; i++) {
    const count = diceStats[i] || 0;
    const percentage =
      totalRolls > 0 ? ((count / totalRolls) * 100).toFixed(1) : 0;

    const statItem = document.createElement("div");
    statItem.className = "dice-stat-item";

    statItem.innerHTML = `
            <div class="dice-number">${i}</div>
            <div class="dice-count">${count}</div>
            <div class="dice-percentage">${percentage}%</div>
        `;

    container.appendChild(statItem);
  }
}

function populateRecentActivity(recentMoves) {
  const container = document.getElementById("recentActivityList");
  container.innerHTML = "";

  if (recentMoves.length === 0) {
    container.innerHTML =
      '<div class="text-muted text-center">No recent activity</div>';
    return;
  }

  recentMoves.reverse().forEach((move) => {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item";

    const timeAgo = getTimeAgo(move.timestamp);
    const icon = move.captured
      ? "fas fa-crosshairs"
      : move.finished
      ? "fas fa-trophy"
      : move.moveType === "bonus"
      ? "fas fa-star"
      : "fas fa-arrows-alt";

    // Get player color for activity icon
    const playerColors = {
      1: "#e74c3c", // Red for Player 1
      2: "#f1c40f", // Yellow for Player 2
      3: "#27ae60", // Green for Player 3
      4: "#3498db", // Blue for Player 4
    };
    const playerColor = playerColors[move.player] || "#667eea";

    // Get simplified board position description
    const fromPos = move.fromBoardIndex
      ? `[${move.fromBoardIndex.row},${move.fromBoardIndex.col}]`
      : `Path ${move.fromPosition}`;
    const toPos = move.toBoardIndex
      ? `[${move.toBoardIndex.row},${move.toBoardIndex.col}]`
      : `Path ${move.toPosition}`;

    activityItem.innerHTML = `
            <div class="activity-icon" style="background: ${playerColor};">
                <i class="${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">
                    <strong>Player ${move.player}</strong> moved Token ${
      move.token
    }
                    <br>
                    <small class="activity-coordinates">${fromPos} → ${toPos}</small>
                    ${
                      move.captured
                        ? ' <span class="activity-badge capture">Captured!</span>'
                        : ""
                    }
                    ${
                      move.finished
                        ? ' <span class="activity-badge finish">Finished!</span>'
                        : ""
                    }
                </div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;

    container.appendChild(activityItem);
  });
}

function populateGameProgress(playerStats, finalPosition) {
  const container = document.getElementById("gameProgressViz");
  container.innerHTML = "";

  Object.entries(playerStats).forEach(([playerId, stats]) => {
    const progress = Math.min(
      (stats.totalDistance /
        (finalPosition * parseInt(window.gameConfig.numTokens))) *
        100,
      100
    );

    const progressItem = document.createElement("div");
    progressItem.className = "progress-item";

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
  const container = document.getElementById("gameLogsTimeline");
  container.innerHTML = "";

  if (gameHistory.length === 0) {
    container.innerHTML =
      '<div class="text-muted text-center">No moves recorded yet</div>';
    return;
  }

  gameHistory
    .slice()
    .reverse()
    .forEach((move, index) => {
      const timelineEntry = document.createElement("div");
      timelineEntry.className = "timeline-entry";
      timelineEntry.style.animationDelay = `${index * 0.1}s`;
      timelineEntry.dataset.player = move.player;
      timelineEntry.dataset.moveType = move.moveType;

      // Fixed player colors to match the actual game colors
      const playerColors = {
        1: "#e74c3c", // Red for Player 1
        2: "#f1c40f", // Yellow for Player 2 (was incorrectly blue)
        3: "#27ae60", // Green for Player 3
        4: "#3498db", // Blue for Player 4
      };
      const color = playerColors[move.player] || "#667eea";

      const timeFormatted = move.timestamp.toLocaleTimeString();
      const badges = [];

      if (move.moveType === "bonus")
        badges.push('<span class="move-badge bonus">Bonus</span>');
      if (move.captured)
        badges.push('<span class="move-badge capture">Capture</span>');
      if (move.finished)
        badges.push('<span class="move-badge finish">Finish</span>');
      if (badges.length === 0)
        badges.push('<span class="move-badge regular">Regular</span>');

      // Create dice display showing available dice for this move
      const diceDisplay = createDiceDisplay(move);

      // Enhanced move description with board coordinates
      const fromDesc = move.fromBoardIndex
        ? move.fromBoardIndex.description ||
          `(${move.fromBoardIndex.row}, ${move.fromBoardIndex.col})`
        : `Path Index ${move.fromPosition}`;

      const toDesc = move.toBoardIndex
        ? move.toBoardIndex.description ||
          `(${move.toBoardIndex.row}, ${move.toBoardIndex.col})`
        : `Path Index ${move.toPosition}`;

      // Create detailed position information
      const positionInfo = createPositionInfoElement(move);

      // Create sequence information
      const sequenceInfo = createSequenceInfoElement(move);

      timelineEntry.innerHTML = `
            <div class="timeline-header">
                <div class="timeline-player">
                    <div class="timeline-player-badge" style="background-color: ${color};"></div>
                    Player ${move.player} (${move.playerName})
                </div>
                <div class="timeline-time">${timeFormatted}</div>
            </div>
            <div class="timeline-content">
                <div class="timeline-dice-section">
                    <div class="dice-section-label">Available Dice for this Move:</div>
                    <div class="timeline-dice">${diceDisplay}</div>
                    ${sequenceInfo}
                </div>
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
                        Selected dice value: <strong>${move.diceValue}</strong>
                        ${
                          move.usedValues.length > 1
                            ? ` (Bonus chain: ${move.usedValues.join(", ")})`
                            : ""
                        }
                        ${badges.join(" ")}
                    </div>
                    ${positionInfo}
                </div>
            </div>
        `;

      container.appendChild(timelineEntry);
    });
}

// New function to create dice display showing available dice
function createDiceDisplay(move) {
  const availableDice = move.availableDice ||
    move.allDiceValues || [move.diceValue];
  const selectedDice = move.diceValue;

  return availableDice
    .map((val) => {
      const isSelected = val === selectedDice;
      const diceClass = isSelected
        ? "timeline-die selected-die"
        : "timeline-die available-die";
      const diceTitle = isSelected
        ? "Selected by player"
        : "Available but not selected";

      return `<div class="${diceClass}" title="${diceTitle}">${val}</div>`;
    })
    .join("");
}

// New function to create sequence information
function createSequenceInfoElement(move) {
  if (!move.moveSequenceInfo) return "";

  const seqInfo = move.moveSequenceInfo;

  // Fixed player colors to match the actual game colors
  const playerColors = {
    1: "#e74c3c", // Red for Player 1
    2: "#f1c40f", // Yellow for Player 2
    3: "#27ae60", // Green for Player 3
    4: "#3498db", // Blue for Player 4
  };

  // Create sequence visualization
  const sequenceDisplay = seqInfo.sequencePattern
    .map((playerId, index) => {
      const isCurrentMove = index === seqInfo.positionInSequence - 1;
      const color = playerColors[playerId] || "#667eea";
      const className = isCurrentMove
        ? "sequence-step current-step"
        : "sequence-step";

      return `
            <div class="${className}" style="border-color: ${color};">
                <div class="step-player" style="background-color: ${color}; ${
        playerId === 2 ? "color: #2c3e50;" : ""
      }"">P${playerId}</div>
                <div class="step-position">${index + 1}</div>
            </div>
        `;
    })
    .join("");

  return `
        <div class="sequence-info">
            <div class="sequence-label">Move ${seqInfo.positionInSequence} of ${seqInfo.totalMovesInSequence} in this dice roll:</div>
            <div class="sequence-display">${sequenceDisplay}</div>
        </div>
    `;
}

// New function to create detailed position information
function createPositionInfoElement(move) {
  let positionDetails = "";

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
                ${move.captured ? " | Enemy captured!" : ""}
                ${move.finished ? " | Token finished!" : ""}
            </small>
        </div>
    `;

  return positionDetails;
}

function setupFilterHandlers() {
  // Player filter handlers
  document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active state
      document
        .querySelectorAll(".filter-btn[data-filter]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Apply filter
      const filter = btn.dataset.filter;
      filterTimelineByPlayer(filter);
    });
  });

  // Move type filter handlers
  document.querySelectorAll(".filter-btn[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active state
      document
        .querySelectorAll(".filter-btn[data-type]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Apply filter
      const type = btn.dataset.type;
      filterTimelineByType(type);
    });
  });
}

function filterTimelineByPlayer(playerId) {
  const entries = document.querySelectorAll(".timeline-entry");

  entries.forEach((entry) => {
    if (playerId === "all" || entry.dataset.player === playerId) {
      entry.style.display = "block";
      entry.style.animation = "slideInUp 0.4s ease-out";
    } else {
      entry.style.display = "none";
    }
  });
}

function filterTimelineByType(moveType) {
  const entries = document.querySelectorAll(".timeline-entry");

  entries.forEach((entry) => {
    const shouldShow =
      moveType === "all" ||
      entry.dataset.moveType === moveType ||
      (moveType === "capture" &&
        entry.innerHTML.includes("move-badge capture")) ||
      (moveType === "finish" && entry.innerHTML.includes("move-badge finish"));

    if (shouldShow) {
      entry.style.display = "block";
      entry.style.animation = "slideInUp 0.4s ease-out";
    } else {
      entry.style.display = "none";
    }
  });
}

function exportGameLogs() {
  if (!window.ludoGame) {
    alert("No active game found!");
    return;
  }

  const gameData = window.ludoGame.exportGameData();
  const dataStr = JSON.stringify(gameData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `ludo_game_logs_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function clearGameLogs() {
  if (!window.ludoGame) {
    alert("No active game found!");
    return;
  }

  if (
    confirm(
      "Are you sure you want to clear all game logs? This action cannot be undone."
    )
  ) {
    window.ludoGame.detailedGameHistory = [];
    window.ludoGame.diceStatistics = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    window.ludoGame.initializeGameLogs();

    // Close modal and show confirmation
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("gameLogsModal")
    );
    modal.hide();

    alert("Game logs cleared successfully!");
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const diffMs = now - new Date(timestamp);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ago`;
}

function openGameInfo() {
  const modal = new bootstrap.Modal(document.getElementById("gameInfoModal"));

  // Add entrance animation
  const modalElement = document.getElementById("gameInfoModal");
  modalElement.addEventListener(
    "shown.bs.modal",
    function () {
      const scrollSections = modalElement.querySelectorAll(".scroll-section");
      scrollSections.forEach((section, index) => {
        section.style.opacity = "0";
        section.style.transform = "translateY(30px)";
        section.style.transition = "all 0.6s ease";

        setTimeout(() => {
          section.style.opacity = "1";
          section.style.transform = "translateY(0)";
        }, index * 200);
      });
    },
    { once: true }
  );

  modal.show();

  // Add floating particles effect
  createFloatingParticles();
}

function createFloatingParticles() {
  const modalBody = document.querySelector("#gameInfoModal .scroll-body");
  if (!modalBody) return;

  // Remove existing particles
  const existingParticles = modalBody.querySelectorAll(".floating-particle");
  existingParticles.forEach((particle) => particle.remove());

  // Create new particles
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement("div");
    particle.className = "floating-particle";
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
            animation: floatParticle ${
              Math.random() * 10 + 10
            }s linear infinite;
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
const particleStyle = document.createElement("style");
particleStyle.textContent = particleCSS;
document.head.appendChild(particleStyle);

// Enhanced scroll effects for the modal
function addScrollEffects() {
  const scrollBody = document.querySelector("#gameInfoModal .scroll-body");
  if (!scrollBody) return;

  scrollBody.addEventListener("scroll", function () {
    const scrollTop = this.scrollTop;
    const scrollHeight = this.scrollHeight - this.clientHeight;
    const scrollProgress = scrollTop / scrollHeight;

    // Parallax effect for sections
    const sections = this.querySelectorAll(".scroll-section");
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
  scrollBody.dispatchEvent(new Event("scroll"));
}

// Enhanced global function to toggle autoplay
async function toggleAutoplay() {
  if (!window.ludoGame) {
    alert("No active game found!");
    return;
  }

  // Check readiness
  const readiness = window.ludoGame.checkAutoplayReadiness();
  console.log("Readiness check:", readiness);

  if (!readiness.diceRollerReady) {
    alert("Dice system is not ready yet. Please wait a moment and try again.");
    return;
  }

  if (window.ludoGame.isAutoplayMode) {
    window.ludoGame.stopAutoplay();
  } else {
    await window.ludoGame.startAutoplay();
  }
}

// Initialize scroll effects when modal is shown
document
  .getElementById("gameInfoModal")
  .addEventListener("shown.bs.modal", function () {
    setTimeout(addScrollEffects, 500);
  });

// Add this function to game.js for copying seed to clipboard
function copySeedToClipboard(seed) {
  navigator.clipboard
    .writeText(seed)
    .then(() => {
      showSeedCopyNotification("Seed copied to clipboard!", "success");
    })
    .catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = seed;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showSeedCopyNotification("Seed copied to clipboard!", "success");
      } catch (err) {
        showSeedCopyNotification("Failed to copy seed", "error");
      }
      document.body.removeChild(textArea);
    });
}

function showSeedCopyNotification(message, type) {
  // Remove existing notification
  const existing = document.querySelector(".seed-copy-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `seed-copy-notification ${type}`;
  notification.innerHTML = `
        <i class="fas ${
          type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => notification.classList.add("show"), 100);

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Make it globally available
window.copySeedToClipboard = copySeedToClipboard;

// Make function globally available
window.openGameInfo = openGameInfo;
window.openGameLogs = openGameLogs;
window.exportGameLogs = exportGameLogs;
window.clearGameLogs = clearGameLogs;
window.toggleAutoplay = toggleAutoplay;
window.goHome = goHome;
window.regenerateBoard = regenerateBoard;
window.newGame = newGame;
console.log("Enhanced Ludo Game loaded with full gameplay logic!");
