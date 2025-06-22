// This file contains JavaScript code for handling interactions on the home screen, such as player configuration selection.

document.addEventListener('DOMContentLoaded', function() {
    const configForm = document.getElementById('config-form');
    const selectionCards = document.querySelectorAll('.selection-card');
    const strategyCards = document.querySelectorAll('.strategy-card');
    const startBtn = document.querySelector('.start-btn');


    // Seed functionality
    const seedInput = document.getElementById('game-seed');
    const generateSeedBtn = document.getElementById('generate-seed');
    const seedExampleBtns = document.querySelectorAll('.seed-example-btn');

    // Generate random seed
    generateSeedBtn.addEventListener('click', function() {
        const randomSeed = Math.floor(Math.random() * 999999) + 100000;
        seedInput.value = randomSeed;
        
        // Add animation
        seedInput.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            seedInput.style.animation = '';
        }, 500);
    });

    // Handle seed example buttons
    seedExampleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const seed = this.getAttribute('data-seed');
            seedInput.value = seed;
            
            // Add animation
            seedInput.style.animation = 'pulse 0.5s ease';
            this.style.animation = 'pulse 0.3s ease';
            
            setTimeout(() => {
                seedInput.style.animation = '';
                this.style.animation = '';
            }, 500);
        });
    });

    // Validate seed input (allow numbers and text)
    seedInput.addEventListener('input', function() {
        // Remove any invalid characters (keep alphanumeric, spaces, hyphens, underscores)
        this.value = this.value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    });

    // Add click animations to selection cards
    selectionCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add pulse animation
            this.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
        });
    });

    // Add click animations to strategy cards
    strategyCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add pulse animation
            this.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
        });
    });

    // Add loading state to start button
    configForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const config = {
            numPlayers: formData.get('num-players'),
            numTokens: formData.get('num-tokens'),
            boardSize: formData.get('board-size'),
            numRounds: formData.get('num-rounds'), 
            player1Strategy: formData.get('player1-strategy'),
            player2Strategy: formData.get('player2-strategy'),
            gameSeed: formData.get('game-seed') || null
        };

        console.log('Form data collected:', config); // Debug log

        // Validate form
        if (!config.numPlayers || !config.numTokens || !config.boardSize || 
        !config.numRounds || !config.player1Strategy || !config.player2Strategy) {
        showNotification('Please select all options including number of rounds and player strategies!', 'error');
        return;
    }

        // Add loading state
        startBtn.classList.add('loading');
        const originalText = startBtn.innerHTML;
        startBtn.innerHTML = `
            <span class="btn-text">
                <i class="fas fa-spinner fa-spin me-2"></i>
                Starting Game...
            </span>
        `;
        startBtn.disabled = true;

        console.log('Sending to server:', config); // Debug log

        // Send data to Flask backend
        fetch('/game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Server response:', data); // Debug log
            if (data.status === 'success') {
                showNotification('Game started successfully!', 'success');
                // Use the redirect URL from server response instead of hardcoded '/game'
                setTimeout(() => {
                    window.location.href = data.redirect; // This was the missing piece!
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to start game');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Failed to start game. Please try again.', 'error');
            // Restore button
            startBtn.innerHTML = originalText;
            startBtn.disabled = false;
            startBtn.classList.remove('loading');
        });
    });

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)} me-2"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    // Add some interactive particles on mouse move
    let mouseX = 0, mouseY = 0;
    
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'mouse-particle';
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${mouseX}px;
            top: ${mouseY}px;
            animation: particleFade 1s ease-out forwards;
        `;

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    // Create particles on mouse move (throttled)
    let particleTimeout;
    document.addEventListener('mousemove', function() {
        if (particleTimeout) return;
        particleTimeout = setTimeout(() => {
            createParticle();
            particleTimeout = null;
        }, 50);
    });
});

// CSS for additional animations
const additionalStyles = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    @keyframes particleFade {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(0) translateY(-20px);
        }
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 4px solid #667eea;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left-color: #4CAF50;
    }

    .notification-error {
        border-left-color: #f44336;
    }

    .notification-warning {
        border-left-color: #ff9800;
    }

    .notification-content {
        display: flex;
        align-items: center;
        font-weight: 500;
        color: #333;
    }

    .start-btn.loading {
        pointer-events: none;
        opacity: 0.8;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);