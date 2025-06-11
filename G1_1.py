import random
import pandas as pd

# Game constants
N_TOKENS = 2
FINAL_POS = 57 # home position
SAFE_SQUARES = [1, 9, 14, 22, 27, 35, 40, 48]  # Sample safe squares (need to be defined based on game rules)

# Initialize player tokens at position 1
player_positions = {
    1: [1] * N_TOKENS,
    2: [1] * N_TOKENS
}

# History matrix
move_matrix = []

def roll_three_dice(): #roll three dice
    return [random.randint(1, 6) for _ in range(3)]

def is_safe(pos, player):
    # Safe if in defined safe squares or if a player has 2 tokens in the same pos
    if pos in SAFE_SQUARES:
        return True
    return player_positions[player].count(pos) > 1

def move_token(player, token_idx, dice_val):
    curr_pos = player_positions[player][token_idx]
    if curr_pos == FINAL_POS:
        return curr_pos, False, False  # Already home
    new_pos = curr_pos + dice_val
    if new_pos >= FINAL_POS:
        player_positions[player][token_idx] = FINAL_POS
        return FINAL_POS, True, False  # Finished
    # Check for captures
    opp = 2 if player == 1 else 1
    captured = False
    for i in range(N_TOKENS):
        if player_positions[opp][i] == new_pos and not is_safe(new_pos, opp):
            player_positions[opp][i] = 1  # Captured
            captured = True
    player_positions[player][token_idx] = new_pos
    return new_pos, False, captured

def play_turn(roll_by_player):
    global move_matrix
    dice = roll_three_dice()
    moves = [(roll_by_player, dice[0]), (3 - roll_by_player, dice[1]), (roll_by_player, dice[2])]
    six_count = 0
    for player, val in moves:
        if val == 6:
            six_count += 1
        if six_count == 3:
            val = 0  # Nullify third six
        # Choose a token to move (greedy for simplicity)
        token_idx = 0 if player_positions[player][0] != FINAL_POS else 1
        init_positions = player_positions[1][:] + player_positions[2][:]
        final_pos, finished, captured = move_token(player, token_idx, val)
        final_positions = player_positions[1][:] + player_positions[2][:]
        move_matrix.append(final_positions + init_positions + [player, token_idx + 1])
        if (val == 6 or finished or captured) and six_count < 3:
            # Extra move
            extra_val = random.randint(1, 6)
            if extra_val == 6 and six_count == 2:
                continue  # Would be third six, skip
            token_idx = 0 if player_positions[player][0] != FINAL_POS else 1
            init_positions = player_positions[1][:] + player_positions[2][:]
            _, f2, c2 = move_token(player, token_idx, extra_val)
            final_positions = player_positions[1][:] + player_positions[2][:]
            move_matrix.append(final_positions + init_positions + [player, token_idx + 1])

# Play full game (e.g., 12 turns = 18 moves)
for turn in range(12):
    current_player = 1 if turn % 2 == 0 else 2
    play_turn(current_player)

# Output result matrix
columns = [
    "P1_T1_Final", "P1_T2_Final", "P2_T1_Final", "P2_T2_Final",
    "P1_T1_Init", "P1_T2_Init", "P2_T1_Init", "P2_T2_Init",
    "WhichPlayer", "WhichToken"
]

df = pd.DataFrame(move_matrix, columns=columns)
print(df)
