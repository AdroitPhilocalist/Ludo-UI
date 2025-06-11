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
        
        print(f"POST Received data: Players={num_players}, Tokens={num_tokens}, Size={board_size}")
        
        # Return JSON response for AJAX requests with consistent parameter names
        return jsonify({
            'status': 'success',
            'redirect': f'/game?players={num_players}&tokens={num_tokens}&size={board_size}'
        })
    
    # Handle GET request (when redirected or direct access)
    # Use the same parameter names as in the redirect URL
    num_players = request.args.get('players', 2, type=int)  # Changed from 'numPlayers' to 'players'
    num_tokens = request.args.get('tokens', 2, type=int)
    board_size = request.args.get('size', 9, type=int)      # Changed default from 4 to 9
    
    print(f"GET Game setup: Players={num_players}, Tokens={num_tokens}, Size={board_size}")
    
    return render_template('game.html', 
                           num_players=num_players,
                           num_tokens=num_tokens,
                           board_size=board_size)

if __name__ == '__main__':
    app.run(debug=True)