// Board size to grid dimension mapping
export const BOARD_DIMENSIONS = {
    7: 9,   // 7 squares -> 9x9 grid
    9: 11,  // 9 squares -> 11x11 grid
    11: 13, // 11 squares -> 13x13 grid
    13: 15  // 13 squares -> 15x15 grid
};

// Player colors and order
export const PLAYERS = {
    RED: 'RED',
    BLUE: 'BLUE',
    GREEN: 'GREEN',
    YELLOW: 'YELLOW'
};

export const PLAYER_ORDER = ['RED', 'BLUE', 'YELLOW', 'GREEN'];

// Game states
export const GAME_STATE = {
    WAITING_FOR_DICE: 'WAITING_FOR_DICE',
    DICE_ROLLED: 'DICE_ROLLED',
    TOKEN_SELECTED: 'TOKEN_SELECTED',
    MOVING_TOKEN: 'MOVING_TOKEN',
    GAME_OVER: 'GAME_OVER',
    PAUSED: 'PAUSED'
};

// Token states
export const TOKEN_STATE = {
    IN_HOME: 'IN_HOME',
    ON_BOARD: 'ON_BOARD',
    IN_SAFE_ZONE: 'IN_SAFE_ZONE',
    IN_HOME_STRETCH: 'IN_HOME_STRETCH',
    FINISHED: 'FINISHED'
};

// Dice values
export const DICE = {
    MIN_VALUE: 1,
    MAX_VALUE: 6,
    START_VALUE: 6 // Value needed to start a token from home
};

// Game rules
export const GAME_RULES = {
    TOKENS_PER_PLAYER: 4,
    MOVES_TO_WIN: 57, // Total moves to complete the board
    EXTRA_TURN_ON_SIX: true,
    CAPTURE_SENDS_HOME: true,
    SAFE_SQUARES_PROTECT: true
};

// Board size 7 (9x9 grid) configurations
export const BOARD_7_CONFIG = {
    gridSize: 9,
    boardSize: 7,
    
    // Center finish position
    CENTER: { row: 4, col: 4 },
    
    // Home areas (token starting positions)
    HOME_AREAS: {
        RED: [
            { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
            { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
            { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
        ],
        BLUE: [
            { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 },
            { row: 1, col: 6 }, { row: 1, col: 7 }, { row: 1, col: 8 },
            { row: 2, col: 6 }, { row: 2, col: 7 }, { row: 2, col: 8 }
        ],
        GREEN: [
            { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 },
            { row: 7, col: 0 }, { row: 7, col: 1 }, { row: 7, col: 2 },
            { row: 8, col: 0 }, { row: 8, col: 1 }, { row: 8, col: 2 }
        ],
        YELLOW: [
            { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 6, col: 8 },
            { row: 7, col: 6 }, { row: 7, col: 7 }, { row: 7, col: 8 },
            { row: 8, col: 6 }, { row: 8, col: 7 }, { row: 8, col: 8 }
        ]
    },
    
    // Starting squares (where tokens enter the game path)
    START_SQUARES: {
        RED: { row: 3, col: 1 },
        BLUE: { row: 1, col: 5 },
        YELLOW: { row: 5, col: 7 },
        GREEN: { row: 7, col: 3 }
    },
    
    // Safe squares (star positions)
    SAFE_SQUARES: [
        // { row: 5, col: 2 },   // Red side
        // { row: 2, col: 3 },   // Blue side
        // { row: 3, col: 6 },   // Yellow side
        // { row: 6, col: 5 }    // Green side
        { row: 3, col: 1 },
        { row: 5, col: 7 }
    ],
    
    // Home entrance paths (colored paths leading to center)
    HOME_ENTRANCE_PATHS: {
        RED: [
            { row: 4, col: 1 }, { row: 4, col: 2 }
        ],
        BLUE: [
            { row: 1, col: 4 }, { row: 2, col: 4 }
        ],
        YELLOW: [
            { row: 4, col: 7 }, { row: 4, col: 6 }
        ],
        GREEN: [
            { row: 7, col: 4 }, { row: 6, col: 4 }
        ]
    },
    
    // Home finish area
    HOME_FINISH_AREA: [
        { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
    ],
    
    // Complete game paths for each player (in order of movement)
    GAME_PATHS: {
        RED: [
            // Starting position
            { row: 3, col: 1 },
            // Moving clockwise around the board
            { row: 3, col: 2 }, { row: 2, col: 3 }, { row: 1, col: 3 }, { row: 0, col: 3 }, { row: 0, col: 4 },
            { row: 0, col: 5 }, { row: 1, col: 5 }, { row: 2, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 },
            { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 5, col: 7 }, { row: 5, col: 6 }, { row: 6, col: 5 }, { row: 7, col: 5 }, { row: 8, col: 5 }, { row: 8, col: 4 },
            { row: 8, col: 3 }, { row: 7, col: 3 }, { row: 6, col: 3 }, { row: 5, col: 2 }, { row: 5, col: 1 }, { row: 5, col: 0 },
            { row: 4, col: 0 },
            // Home stretch
            { row: 4, col: 1 }, { row: 4, col: 2 },
            // Finish
            { row: 4, col: 3 }
        ],
        BLUE: [
            // Starting position
            { row: 1, col: 5 },
            // Moving clockwise
            { row: 2, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 },
            { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 5, col: 7 }, { row: 5, col: 6 }, { row: 6, col: 5 },
            { row: 7, col: 5 }, { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 7, col: 3 }, { row: 6, col: 3 },
            { row: 5, col: 2 }, { row: 5, col: 1 }, { row: 5, col: 0 }, { row: 4, col: 0 }, { row: 3, col: 0 },
            { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 2, col: 3 }, { row: 1, col: 3 }, { row: 0, col: 3 },
            { row: 0, col: 4 },      
            // Home stretch
            { row: 1, col: 4 }, { row: 2, col: 4 },
            // Finish
            { row: 3, col: 4 }
        ],
        YELLOW: [
            // Starting position
            { row: 5, col: 7 },
            // Moving clockwise
            { row: 5, col: 6 },{ row: 6, col: 5 }, { row: 7, col: 5 }, 
            { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 7, col: 3 }, { row: 6, col: 3 },
            { row: 5, col: 2 }, { row: 5, col: 1 }, { row: 5, col: 0 }, { row: 4, col: 0 }, { row: 3, col: 0 },
            { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 2, col: 3 }, { row: 1, col: 3 }, { row: 0, col: 3 },
            { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 1, col: 5 }, { row: 2, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 4, col: 8 },
            // Home stretch
            { row: 4, col: 7 }, { row: 4, col: 6 },
            // Finish
             { row: 4, col: 5 }
        ],
        GREEN: [
            // Starting position
            { row: 7, col: 3 },
            // Moving clockwise
            { row: 6, col: 3 },
            { row: 5, col: 2 }, { row: 5, col: 1 }, { row: 5, col: 0 }, { row: 4, col: 0 }, { row: 3, col: 0 },
            { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 2, col: 3 }, { row: 1, col: 3 }, { row: 0, col: 3 },
            { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 1, col: 5 }, { row: 2, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 4, col: 8 },
            { row: 5, col: 8 }, { row: 5, col: 7 }, { row: 5, col: 6 }, { row: 6, col: 5 }, { row: 7, col: 5 },
            { row: 8, col: 5 }, { row: 8, col: 4 }, 
            // Home stretch
            { row: 7, col: 4 }, { row: 6, col: 4 }, 
            // Finish
            { row: 5, col: 4 }
        ]
    }
};

// Board size 9 (11x11 grid) configurations
export const BOARD_9_CONFIG = {
    gridSize: 11,
    boardSize: 9,
    
    CENTER: { row: 5, col: 5 },
    
    HOME_AREAS: {
        RED: [
            { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
            { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
            { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
            { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }
        ],
        BLUE: [
            { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 0, col: 9 }, { row: 0, col: 10 },
            { row: 1, col: 7 }, { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 1, col: 10 },
            { row: 2, col: 7 }, { row: 2, col: 8 }, { row: 2, col: 9 }, { row: 2, col: 10 },
            { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 3, col: 9 }, { row: 3, col: 10 }
        ],
        GREEN: [
            { row: 7, col: 0 }, { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 },
            { row: 8, col: 0 }, { row: 8, col: 1 }, { row: 8, col: 2 }, { row: 8, col: 3 },
            { row: 9, col: 0 }, { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 },
            { row: 10, col: 0 }, { row: 10, col: 1 }, { row: 10, col: 2 }, { row: 10, col: 3 }
        ],
        YELLOW: [
            { row: 7, col: 7 }, { row: 7, col: 8 }, { row: 7, col: 9 }, { row: 7, col: 10 },
            { row: 8, col: 7 }, { row: 8, col: 8 }, { row: 8, col: 9 }, { row: 8, col: 10 },
            { row: 9, col: 7 }, { row: 9, col: 8 }, { row: 9, col: 9 }, { row: 9, col: 10 },
            { row: 10, col: 7 }, { row: 10, col: 8 }, { row: 10, col: 9 }, { row: 10, col: 10 }
        ]
    },
    
    START_SQUARES: {
        RED: { row: 4, col: 1 },
        BLUE: { row: 1, col: 6 },
        YELLOW: { row: 6, col: 9 },
        GREEN: { row: 9, col: 4 }
    },
    
    SAFE_SQUARES: [
        // { row: 6, col: 2 },   // Red side
        // { row: 2, col: 4 },   // Blue side
        // { row: 4, col: 8 },   // Yellow side
        // { row: 8, col: 6 }    // Green side
        { row: 4, col: 1 },
        { row: 6, col: 9 }
    ],
    
    HOME_ENTRANCE_PATHS: {
        RED: [
            { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 3 }
        ],
        BLUE: [
            { row: 1, col: 5 }, { row: 2, col: 5 }, { row: 3, col: 5 }
        ],
        YELLOW: [
            { row: 5, col: 9 }, { row: 5, col: 8 }, { row: 5, col: 7 }
        ],
        GREEN: [
            { row: 9, col: 5 }, { row: 8, col: 5 }, { row: 7, col: 5 }
        ]
    },
    
    HOME_FINISH_AREA: [
        { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 },
        { row: 5, col: 4 }, { row: 5, col: 5 }, { row: 5, col: 6 },
        { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 6, col: 6 }
    ],

    GAME_PATHS: {
        RED: [
            // Starting position
            { row: 4, col: 1 },
            // Moving clockwise around the board
            { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 3, col: 4 }, { row: 2, col: 4 }, { row: 1, col: 4 },
            { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 }, { row: 1, col: 6 }, { row: 2, col: 6 },
            { row: 3, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 }, { row: 4, col: 10 },
            { row: 5, col: 10 }, { row: 6, col: 10 }, { row: 6, col: 9 }, { row: 6, col: 8 }, { row: 6, col: 7 },
            { row: 7, col: 6 }, { row: 8, col: 6 }, { row: 9, col: 6 }, { row: 10, col: 6 }, 
            { row: 10, col: 5 }, { row: 10, col: 4 }, { row: 9, col: 4 }, { row: 8, col: 4 }, { row: 7, col: 4 },
            { row: 6, col: 3 }, { row: 6, col: 2 }, { row: 6, col: 1 }, { row: 6, col: 0 }, { row: 5, col: 0 },
            // Home stretch
            { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 3 },
            // Finish
            { row: 5, col: 4 }
        ],
        BLUE: [
            // Starting position
            { row: 1, col: 6 },
            // Moving clockwise
            { row: 2, col: 6 }, { row: 3, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 }, { row: 4, col: 10 },
            { row: 5, col: 10 }, { row: 6, col: 10 }, { row: 6, col: 9 }, { row: 6, col: 8 }, { row: 6, col: 7 }, 
            { row: 7, col: 6 }, { row: 8, col: 6 }, { row: 9, col: 6 }, { row: 10, col: 6 },
            { row: 10, col: 5 }, { row: 10, col: 4 }, { row: 9, col: 4 }, { row: 8, col: 4 }, { row: 7, col: 4 },
            { row: 6, col: 3 }, { row: 6, col: 2 }, { row: 6, col: 1 }, { row: 6, col: 0 }, { row: 5, col: 0 },
            { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 3, col: 4 },
            { row: 2, col: 4 }, { row: 1, col: 4 }, { row: 0, col: 4 }, { row: 0, col: 5 },
            // Home stretch
            { row: 1, col: 5 }, { row: 2, col: 5 }, { row: 3, col: 5 },
            // Finish
            { row: 4, col: 5 }
        ],
        YELLOW: [
            // Starting position
            { row: 6, col: 9 },
            // Moving clockwise
            { row: 6, col: 8 }, { row: 6, col: 7 }, { row: 7, col: 6 }, { row: 8, col: 6 }, { row: 9, col: 6 }, { row: 10, col: 6 },
            { row: 10, col: 5 }, { row: 10, col: 4 }, { row: 9, col: 4 }, { row: 8, col: 4 }, { row: 7, col: 4 },
            { row: 6, col: 3 }, { row: 6, col: 2 }, { row: 6, col: 1 }, { row: 6, col: 0 }, { row: 5, col: 0 },
            { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 3, col: 4 },
            { row: 2, col: 4 }, { row: 1, col: 4 }, { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 }, { row: 1, col: 6 }, { row: 2, col: 6 },
            { row: 3, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 }, { row: 4, col: 10 },
            { row: 5, col: 10 },
            // Home stretch
            { row: 5, col: 9 }, { row: 5, col: 8 }, { row: 5, col: 7 },
            // Finish
            { row: 5, col: 6 }
        ],
        GREEN: [
            // Starting position
            { row: 9, col: 4 },
            // Moving clockwise
            { row: 8, col: 4 }, { row: 7, col: 4 }, { row: 6, col: 3 }, { row: 6, col: 2 }, { row: 6, col: 1 }, { row: 6, col: 0 },
            { row: 5, col: 0 }, { row: 4, col: 0 },{ row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 3, col: 4 },
            { row: 2, col: 4 }, { row: 1, col: 4 }, { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 }, { row: 1, col: 6 }, { row: 2, col: 6 },
            { row: 3, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 }, { row: 4, col: 10 },
            { row: 5, col: 10 }, { row: 6, col: 10 }, { row: 6, col: 9 }, { row: 6, col: 8 }, { row: 6, col: 7 },
            { row: 7, col: 6 }, { row: 8, col: 6 }, { row: 9, col: 6 }, { row: 10, col: 6 },
            { row: 10, col: 5 },
            // Home stretch
            { row: 9, col: 5 }, { row: 8, col: 5 }, { row: 7, col: 5 },
            // Finish
            { row: 6, col: 5 }
        ]

    }
};

// Board size 11 (13x13 grid) configurations
export const BOARD_11_CONFIG = {
    gridSize: 13,
    boardSize: 11,
    
    CENTER: { row: 6, col: 6 },
    
    HOME_AREAS: {
        RED: [
            { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 },
            { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
            { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
            { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }
        ],
        BLUE: [
            { row: 0, col: 8 }, { row: 0, col: 9 }, { row: 0, col: 10 }, { row: 0, col: 11 }, { row: 0, col: 12 },
            { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 1, col: 10 }, { row: 1, col: 11 }, { row: 1, col: 12 },
            { row: 2, col: 8 }, { row: 2, col: 9 }, { row: 2, col: 10 }, { row: 2, col: 11 }, { row: 2, col: 12 },
            { row: 3, col: 8 }, { row: 3, col: 9 }, { row: 3, col: 10 }, { row: 3, col: 11 }, { row: 3, col: 12 },
            { row: 4, col: 8 }, { row: 4, col: 9 }, { row: 4, col: 10 }, { row: 4, col: 11 }, { row: 4, col: 12 }
        ],
        GREEN: [
            { row: 8, col: 0 }, { row: 8, col: 1 }, { row: 8, col: 2 }, { row: 8, col: 3 }, { row: 8, col: 4 },
            { row: 9, col: 0 }, { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 }, { row: 9, col: 4 },
            { row: 10, col: 0 }, { row: 10, col: 1 }, { row: 10, col: 2 }, { row: 10, col: 3 }, { row: 10, col: 4 },
            { row: 11, col: 0 }, { row: 11, col: 1 }, { row: 11, col: 2 }, { row: 11, col: 3 }, { row: 11, col: 4 },
            { row: 12, col: 0 }, { row: 12, col: 1 }, { row: 12, col: 2 }, { row: 12, col: 3 }, { row: 12, col: 4 }
        ],
        YELLOW: [
            { row: 8, col: 8 }, { row: 8, col: 9 }, { row: 8, col: 10 }, { row: 8, col: 11 }, { row: 8, col: 12 },
            { row: 9, col: 8 }, { row: 9, col: 9 }, { row: 9, col: 10 }, { row: 9, col: 11 }, { row: 9, col: 12 },
            { row: 10, col: 8 }, { row: 10, col: 9 }, { row: 10, col: 10 }, { row: 10, col: 11 }, { row: 10, col: 12 },
            { row: 11, col: 8 }, { row: 11, col: 9 }, { row: 11, col: 10 }, { row: 11, col: 11 }, { row: 11, col: 12 },
            { row: 12, col: 8 }, { row: 12, col: 9 }, { row: 12, col: 10 }, { row: 12, col: 11 }, { row: 12, col: 12 }
        ]
    },
    
    START_SQUARES: {
        RED: { row: 5, col: 1 },
        BLUE: { row: 1, col: 7 },
        YELLOW: { row: 7, col: 11 },
        GREEN: { row: 11, col: 5 }
    },
    
    SAFE_SQUARES: [
        // { row: 7, col: 2 },   // Red side
        // { row: 2, col: 5 },   // Blue side
        // { row: 5, col: 10 },  // Yellow side
        // { row: 10, col: 7 }   // Green side
        { row: 5, col: 1 },
        { row: 7, col: 11 }
    ],
    
    HOME_ENTRANCE_PATHS: {
        RED: [
            { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }
        ],
        BLUE: [
            { row: 1, col: 6 }, { row: 2, col: 6 }, { row: 3, col: 6 }, { row: 4, col: 6 }
        ],
        YELLOW: [
            { row: 6, col: 11 }, { row: 6, col: 10 }, { row: 6, col: 9 }, { row: 6, col: 8 }
        ],
        GREEN: [
            { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 6 }
        ]
    },
    
    HOME_FINISH_AREA: [
        { row: 5, col: 5 }, { row: 5, col: 6 }, { row: 5, col: 7 },
        { row: 6, col: 5 }, { row: 6, col: 6 }, { row: 6, col: 7 },
        { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 7, col: 7 }
    ],

    GAME_PATHS: {
        RED: [
            // Starting position
            { row: 5, col: 1 },
            // Moving clockwise around the board
            { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 4, col: 5 }, { row: 3, col: 5 },
            { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 0, col: 5 }, { row: 0, col: 6 }, { row: 0, col: 7 },
            { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 8 },
            { row: 5, col: 9 }, { row: 5, col: 10 }, { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 6, col: 12 },
            { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 },
            { row: 8, col: 7 }, { row: 9, col: 7 }, { row: 10, col: 7 }, { row: 11, col: 7 }, { row: 12, col: 7 },
            { row: 12, col: 6 }, { row: 12, col: 5 }, { row: 11, col: 5 }, { row: 10, col: 5 }, { row: 9, col: 5 },
            { row: 8, col: 5 }, { row: 7, col: 4 }, { row: 7, col: 3 }, { row: 7, col: 2 }, { row: 7, col: 1 },
            { row: 7, col: 0 }, { row: 6, col: 0 },
            // Home stretch
            { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 },
            // Finish
            { row: 6, col: 5 }
        ], 

        BLUE: [
            // Starting position
            { row: 1, col: 7 },
            // Moving clockwise
            { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 8 }, { row: 5, col: 9 },
            { row: 5, col: 10 }, { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 6, col: 12 }, { row: 7, col: 12 },
            { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 }, { row: 8, col: 7 },
            { row: 9, col: 7 }, { row: 10, col: 7 }, { row: 11, col: 7 }, { row: 12, col: 7 },
            { row: 12, col: 6 }, { row: 12, col: 5 }, { row: 11, col: 5 }, { row: 10, col: 5 }, { row: 9, col: 5 },
            { row: 8, col: 5 }, { row: 7, col: 4 }, { row: 7, col: 3 }, { row: 7, col: 2 }, { row: 7, col: 1 },
            { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
            { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 4, col: 5 }, { row: 3, col: 5 },
            { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 0, col: 5 }, { row: 0, col: 6 },
            // Home stretch
            { row: 1, col: 6 }, { row: 2, col: 6 }, { row: 3, col: 6 }, { row: 4, col: 6 },
            // Finish
            { row: 5, col: 6 }
        ],
        YELLOW: [
            // Starting position
            { row: 7, col: 11 },
            // Moving clockwise
            { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 }, { row: 8, col: 7 },
            { row: 9, col: 7 }, { row: 10, col: 7 }, { row: 11, col: 7 }, { row: 12, col: 7 },
            { row: 12, col: 6 }, { row: 12, col: 5 }, { row: 11, col: 5 }, { row: 10, col: 5 }, { row: 9, col: 5 },
            { row: 8, col: 5 }, { row: 7, col: 4 }, { row: 7, col: 3 }, { row: 7, col: 2 }, { row: 7, col: 1 },
            { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
            { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 4, col: 5 }, { row: 3, col: 5 },
            { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 0, col: 5 }, { row: 0, col: 6 },
            { row: 0, col: 7 }, { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 },
            { row: 4, col: 7 }, { row: 5, col: 8 }, { row: 5, col: 9 }, { row: 5, col: 10 },
            { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 6, col: 12 },
            // Home stretch
            { row: 6, col: 11 }, { row: 6, col: 10 }, { row: 6, col: 9 }, { row: 6, col: 8 },
            // Finish
            { row: 6, col: 7 }
        ],
        GREEN: [
            // Starting position
            { row: 11, col: 5 },
            // Moving clockwise
            { row: 10, col: 5 }, { row: 9, col: 5 }, { row: 8, col: 5 }, { row: 7, col: 4 },
            { row: 7, col: 3 }, { row: 7, col: 2 }, { row: 7, col: 1 }, { row: 7, col: 0 },
            { row: 6, col: 0 }, { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
            { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 4, col: 5 }, { row: 3, col: 5 },
            { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 0, col: 5 }, { row: 0, col: 6 },
            { row: 0, col: 7 }, { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 },
            { row: 4, col: 7 }, { row: 5, col: 8 }, { row: 5, col: 9 }, { row: 5, col: 10 },
            { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 6, col: 12 },
            { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 },
            { row: 7, col: 8 }, { row: 8, col: 7 }, { row: 9, col: 7 }, { row: 10, col: 7 },
            { row: 11, col: 7 }, { row: 12, col: 7 }, { row: 12, col: 6 },

            // Home stretch
            { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 6 },
            // Finish
            { row: 7, col: 6 } 

        ]
    }
};

// Board size 13 (15x15 grid) configurations
export const BOARD_13_CONFIG = {
    gridSize: 15,
    boardSize: 13,
    
    CENTER: { row: 7, col: 7 },
    
    HOME_AREAS: {
        RED: [
            { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 },
            { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
            { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
            { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
            { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 },
            { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
        ],
        BLUE: [
            { row: 0, col: 9 }, { row: 0, col: 10 }, { row: 0, col: 11 }, { row: 0, col: 12 }, { row: 0, col: 13 }, { row: 0, col: 14 },
            { row: 1, col: 9 }, { row: 1, col: 10 }, { row: 1, col: 11 }, { row: 1, col: 12 }, { row: 1, col: 13 }, { row: 1, col: 14 },
            { row: 2, col: 9 }, { row: 2, col: 10 }, { row: 2, col: 11 }, { row: 2, col: 12 }, { row: 2, col: 13 }, { row: 2, col: 14 },
            { row: 3, col: 9 }, { row: 3, col: 10 }, { row: 3, col: 11 }, { row: 3, col: 12 }, { row: 3, col: 13 }, { row: 3, col: 14 },
            { row: 4, col: 9 }, { row: 4, col: 10 }, { row: 4, col: 11 }, { row: 4, col: 12 }, { row: 4, col: 13 }, { row: 4, col: 14 },
            { row: 5, col: 9 }, { row: 5, col: 10 }, { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 5, col: 13 }, { row: 5, col: 14 }
        ],
        GREEN: [
            { row: 9, col: 0 }, { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 }, { row: 9, col: 4 }, { row: 9, col: 5 },
            { row: 10, col: 0 }, { row: 10, col: 1 }, { row: 10, col: 2 }, { row: 10, col: 3 }, { row: 10, col: 4 }, { row: 10, col: 5 },
            { row: 11, col: 0 }, { row: 11, col: 1 }, { row: 11, col: 2 }, { row: 11, col: 3 }, { row: 11, col: 4 }, { row: 11, col: 5 },
            { row: 12, col: 0 }, { row: 12, col: 1 }, { row: 12, col: 2 }, { row: 12, col: 3 }, { row: 12, col: 4 }, { row: 12, col: 5 },
            { row: 13, col: 0 }, { row: 13, col: 1 }, { row: 13, col: 2 }, { row: 13, col: 3 }, { row: 13, col: 4 }, { row: 13, col: 5 },
            { row: 14, col: 0 }, { row: 14, col: 1 }, { row: 14, col: 2 }, { row: 14, col: 3 }, { row: 14, col: 4 }, { row: 14, col: 5 }
        ],
        YELLOW: [
            { row: 9, col: 9 }, { row: 9, col: 10 }, { row: 9, col: 11 }, { row: 9, col: 12 }, { row: 9, col: 13 }, { row: 9, col: 14 },
            { row: 10, col: 9 }, { row: 10, col: 10 }, { row: 10, col: 11 }, { row: 10, col: 12 }, { row: 10, col: 13 }, { row: 10, col: 14 },
            { row: 11, col: 9 }, { row: 11, col: 10 }, { row: 11, col: 11 }, { row: 11, col: 12 }, { row: 11, col: 13 }, { row: 11, col: 14 },
            { row: 12, col: 9 }, { row: 12, col: 10 }, { row: 12, col: 11 }, { row: 12, col: 12 }, { row: 12, col: 13 }, { row: 12, col: 14 },
            { row: 13, col: 9 }, { row: 13, col: 10 }, { row: 13, col: 11 }, { row: 13, col: 12 }, { row: 13, col: 13 }, { row: 13, col: 14 },
            { row: 14, col: 9 }, { row: 14, col: 10 }, { row: 14, col: 11 }, { row: 14, col: 12 }, { row: 14, col: 13 }, { row: 14, col: 14 }
        ]
    },
    
    START_SQUARES: {
        RED: { row: 6, col: 1 },
        BLUE: { row: 1, col: 8 },
        YELLOW: { row: 8, col: 13 },
        GREEN: { row: 13, col: 6 }
    },
    
    SAFE_SQUARES: [
        { row: 6, col: 1 },
        { row: 8, col: 13 },
        //{ row: 8, col: 2 },   // Red side
        //{ row: 2, col: 6 },   // Blue side
        //{ row: 6, col: 12 },  // Yellow side
        //{ row: 12, col: 8 }   // Green side
    ],
    
    HOME_ENTRANCE_PATHS: {
        RED: [
            { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }
        ],
        BLUE: [
            { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }
        ],
        YELLOW: [
            { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }
        ],
        GREEN: [
            { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }
        ]
    },
    
    HOME_FINISH_AREA: [
        { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 6, col: 8 },
        { row: 7, col: 6 }, { row: 7, col: 7 }, { row: 7, col: 8 },
        { row: 8, col: 6 }, { row: 8, col: 7 }, { row: 8, col: 8 }
    ],

    GAME_PATHS: {
        RED: [
            // Starting position
            { row: 6, col: 1 },
            // Moving clockwise around the board
            { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 },
            { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
            { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 },
            { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
            { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 }, { row: 8, col: 14 },
            { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 },
            { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 },
            { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 }, { row: 13, col: 6 },
            { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 },
            { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
            { row: 7, col: 0 },
            // Home stretch
            { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 },
            // Finish
            { row: 7, col: 6 }
        ],
        BLUE: [
            // Starting position
            { row: 1, col: 8 },
            // Moving clockwise
            { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 },  { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
            { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 }, { row: 8, col: 14 },
            { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 },
            { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 },
            { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 }, { row: 13, col: 6 },
            { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 },
            { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
            { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 },
            { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 },
            { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
            { row: 0, col: 7 },
            // Home stretch
            { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 },
            // Finish
            { row: 6, col: 7 }
        ],

        YELLOW: [
            // Starting position
            { row: 8, col: 13 },
            // Moving clockwise
            { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 },
            { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 },
            { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 }, { row: 13, col: 6 },
            { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 },
            { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
            { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 },
            { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 },
            { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
            { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 },
            { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
            { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 },
            // Home stretch
            { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 },
            // Finish
            { row: 7, col: 8 }
        ],

        GREEN: [
            // Starting position
            { row: 13, col: 6 },
            // Moving clockwise
            { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 },
            { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
            { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 },
            { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 },
            { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
            { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 },
            { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
            { row: 6, col:12}, {row :6 ,col :13}, {row :6 ,col :14}, {row :7 ,col :14}, {row :8 ,col :14},
            {row :8 ,col :13}, {row :8 ,col :12}, {row :8 ,col :11}, {row :8 ,col :10},
            {row :8 ,col :9}, {row :9 ,col :8}, {row :10 ,col :8}, {row :11 ,col :8}, {row :12 ,col :8},
            {row :13 ,col :8}, {row :14 ,col :8}, {row :14 ,col :7},
            // Home stretch
            { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 },
            // Finish
            { row: 8, col: 7 }
        ]
    }


};

// Get configuration for specific board size
export function getBoardConfig(boardSize) {
    const configs = {
        7: BOARD_7_CONFIG,
        9: BOARD_9_CONFIG,
        11: BOARD_11_CONFIG,
        13: BOARD_13_CONFIG
    };
    return configs[parseInt(boardSize)];
}

// Utility functions
export const UTILS = {
    // Check if position is safe square
    isSafeSquare: (row, col, boardSize) => {
        const config = getBoardConfig(boardSize);
        return config.SAFE_SQUARES.some(square => square.row === row && square.col === col);
    },
    
    // Check if position is home area
    isHomeArea: (row, col, boardSize, player) => {
        const config = getBoardConfig(boardSize);
        return config.HOME_AREAS[player].some(square => square.row === row && square.col === col);
    },
    
    // Check if position is starting square
    isStartSquare: (row, col, boardSize, player) => {
        const config = getBoardConfig(boardSize);
        const startSquare = config.START_SQUARES[player];
        return startSquare.row === row && startSquare.col === col;
    },
    
    // Check if position is home entrance path
    isHomeEntrance: (row, col, boardSize, player) => {
        const config = getBoardConfig(boardSize);
        return config.HOME_ENTRANCE_PATHS[player].some(square => square.row === row && square.col === col);
    },
    
    // Check if position is center/finish
    isCenter: (row, col, boardSize) => {
        const config = getBoardConfig(boardSize);
        return config.CENTER.row === row && config.CENTER.col === col;
    },
    
    // Get next position in path
    getNextPosition: (currentIndex, player, boardSize) => {
        const config = getBoardConfig(boardSize);
        const path = config.GAME_PATHS[player];
        if (currentIndex >= 0 && currentIndex < path.length - 1) {
            return path[currentIndex + 1];
        }
        return null;
    },
    
    // Get path index for position
    getPathIndex: (row, col, player, boardSize) => {
        const config = getBoardConfig(boardSize);
        const path = config.GAME_PATHS[player];
        return path.findIndex(pos => pos.row === row && pos.col === col);
    },
    
    // Check if token can move from current position
    canMove: (row, col, diceValue, player, boardSize) => {
        const config = getBoardConfig(boardSize);
        const currentIndex = UTILS.getPathIndex(row, col, player, boardSize);
        
        if (currentIndex === -1) return false;
        
        const targetIndex = currentIndex + diceValue;
        return targetIndex < config.GAME_PATHS[player].length;
    }
};

// Animation and UI constants
export const ANIMATION = {
    TOKEN_MOVE_DURATION: 500, // ms
    DICE_ROLL_DURATION: 1000, // ms
    CAPTURE_ANIMATION_DURATION: 800, // ms
    WIN_ANIMATION_DURATION: 2000 // ms
};

// Color schemes
export const COLORS = {
    RED: '#e74c3c',
    BLUE: '#3498db',
    GREEN: '#27ae60',
    YELLOW: '#f1c40f',
    RED_LIGHT: '#fadbd8',
    BLUE_LIGHT: '#d6eaf8',
    GREEN_LIGHT: '#d5f4e6',
    YELLOW_LIGHT: '#fef9e7'
};

// Export all configurations
export const ALL_CONFIGS = {
    7: BOARD_7_CONFIG,
    9: BOARD_9_CONFIG,
    11: BOARD_11_CONFIG,
    13: BOARD_13_CONFIG
};

// Add to Player strategies section
export const PLAYER_STRATEGIES = {
    PREDICTABLE: 'PREDICTABLE',
    AGGRESSIVE: 'AGGRESSIVE',
    RESPONSIBLE: 'RESPONSIBLE'
};

// Update Strategy descriptions
export const STRATEGY_DESCRIPTIONS = {
    PREDICTABLE: 'Focuses on completing one token at a time systematically',
    AGGRESSIVE: 'Prioritizes captures and risky moves for quick victories',
    RESPONSIBLE: 'Strategic pair movement with safety prioritization and situational aggression'
};


// Default export
export default {
    BOARD_DIMENSIONS,
    PLAYERS,
    PLAYER_ORDER,
    GAME_STATE,
    TOKEN_STATE,
    DICE,
    GAME_RULES,
    getBoardConfig,
    UTILS,
    ANIMATION,
    COLORS,
    ALL_CONFIGS,
    PLAYER_STRATEGIES,
    STRATEGY_DESCRIPTIONS
};