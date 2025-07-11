from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/game', methods=['GET', 'POST'])
def game():
    if request.method == 'POST':
        data = request.get_json()
        num_players = data.get('numPlayers')
        num_tokens = data.get('numTokens')
        board_size = data.get('boardSize')
        num_rounds = data.get('numRounds')
        player1_strategy = data.get('player1Strategy', 'PREDICTABLE')
        player2_strategy = data.get('player2Strategy', 'PREDICTABLE')
        game_seed = data.get('gameSeed')
        
        print(f"POST Received data: Players={num_players}, Tokens={num_tokens}, Size={board_size}, Rounds={num_rounds}")
        print(f"Strategies: Player1={player1_strategy}, Player2={player2_strategy}")
        print(f"Game Seed: {game_seed}")
        
        # Build redirect URL with seed parameter
        redirect_url = f'/game?players={num_players}&tokens={num_tokens}&size={board_size}&rounds={num_rounds}&p1strategy={player1_strategy}&p2strategy={player2_strategy}'
        
        if game_seed:
            redirect_url += f'&seed={game_seed}'
        
        return jsonify({
            'status': 'success',
            'redirect': redirect_url
        })
    
    # Handle GET request (when redirected or direct access)
    num_players = request.args.get('players', 2, type=int)
    num_tokens = request.args.get('tokens', 2, type=int)
    board_size = request.args.get('size', 9, type=int)
    num_rounds = request.args.get('rounds', 16, type=int)  # Add this line with default value
    player1_strategy = request.args.get('p1strategy', 'PREDICTABLE')
    player2_strategy = request.args.get('p2strategy', 'PREDICTABLE')
    game_seed = request.args.get('seed', None)
    
    print(f"GET Game setup: Players={num_players}, Tokens={num_tokens}, Size={board_size}, Rounds={num_rounds}")
    print(f"GET Strategies: Player1={player1_strategy}, Player2={player2_strategy}")
    print(f"GET Game Seed: {game_seed}")
    
    return render_template('game.html', 
                           num_players=num_players,
                           num_tokens=num_tokens,
                           board_size=board_size,
                           num_rounds=num_rounds,  # Add this line
                           player1_strategy=player1_strategy,
                           player2_strategy=player2_strategy,
                           game_seed=game_seed)

if __name__ == '__main__':
    app.run(debug=True)