// Game variables
console.log('Checking pokemonData:', window.pokemonData);

// Ensure the pokemonData is available before proceeding
if (!window.pokemonData || !Array.isArray(window.pokemonData) || window.pokemonData.length === 0) {
    console.error('Pokemon data not loaded correctly!');
    alert('Failed to load Pokemon data. Please refresh the page.');
}

// Game state object for better state management
const gameState = {
    targetPokemon: null,
    attempts: 0,
    maxAttempts: 6,
    isGameOver: false,
    isGameWon: false,
    guessHistory: [],
    
    // Game statistics
    stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0
        },
        lastPlayed: null
    },
    
    // Reset game state for a new game
    reset: function() {
        this.attempts = 0;
        this.isGameOver = false;
        this.isGameWon = false;
        this.guessHistory = [];
    },
    
    // Add a guess to history
    addGuess: function(pokemon) {
        this.guessHistory.push(pokemon);
        this.attempts++;
        return this.attempts;
    },
    
    // Check if the game should end
    shouldEndGame: function(guessedPokemon) {
        if (guessedPokemon.name === this.targetPokemon.name) {
            return { ended: true, won: true };
        } else if (this.attempts >= this.maxAttempts) {
            return { ended: true, won: false };
        }
        return { ended: false, won: false };
    },
    
    // Update game stats when game ends
    updateStats: function(won) {
        this.isGameOver = true;
        this.isGameWon = won;
        
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            this.stats.guessDistribution[this.attempts]++;
        } else {
            this.stats.currentStreak = 0;
        }
        
        this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
        this.stats.lastPlayed = new Date().toDateString();
    }
};

// Maintain legacy variables for compatibility with existing code
let targetPokemon = null;
let attempts = 0;
const maxAttempts = 6;
let gameOver = false;
let gameWon = false;
let guessHistory = [];

// DOM elements
const pokemonGuessInput = document.getElementById('pokemon-guess');
const guessButton = document.getElementById('guess-button');
const guessesContainer = document.getElementById('guesses');
const resultContainer = document.getElementById('result');
const resultMessage = document.getElementById('result-message');
const pokemonReveal = document.getElementById('pokemon-reveal');
const shareButton = document.getElementById('share-button');
const playAgainButton = document.getElementById('play-again');
const currentAttemptSpan = document.getElementById('current-attempt');
const maxAttemptsSpan = document.getElementById('max-attempts');
const rulesLink = document.getElementById('rules-link');
const statsLink = document.getElementById('stats-link');
const rulesModal = document.getElementById('rules-modal');
const statsModal = document.getElementById('stats-modal');
const closeButtons = document.querySelectorAll('.close-button');
const searchResults = document.getElementById('search-results');

// Stats variables
let stats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    },
    lastPlayed: null
};

// Initialize the game
function initGame() {
    console.log('Initializing game...');
    
    // Load stats from localStorage
    loadStats();
    
    // Set max attempts display
    maxAttemptsSpan.textContent = gameState.maxAttempts;
    
    // Check if the player has already played today
    const today = new Date().toDateString();
    if (stats.lastPlayed === today) {
        // Player has already played today, show their previous result
        console.log('Player already played today, loading saved game');
        loadTodaysGame();
    } else {
        // New day, new Pokémon
        console.log('New game for today');
        selectDailyPokemon();
    }
    
    // Add event listeners
    setupEventListeners();
    
    console.log('Game initialized successfully');
}

// Set up event listeners - extracted from initGame for modularity
function setupEventListeners() {
    // Main game controls
    guessButton.addEventListener('click', handleGuess);
    pokemonGuessInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });
    
    // Add search functionality
    pokemonGuessInput.addEventListener('input', handleSearch);
    pokemonGuessInput.addEventListener('focus', function() {
        if (pokemonGuessInput.value.length > 0) {
            showSearchResults(pokemonGuessInput.value);
        }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== pokemonGuessInput && e.target !== searchResults) {
            searchResults.style.display = 'none';
        }
    });
    
    // Game control buttons
    shareButton.addEventListener('click', shareResult);
    playAgainButton.addEventListener('click', resetGame);
    
    // Modal controls
    rulesLink.addEventListener('click', function(e) {
        e.preventDefault();
        rulesModal.style.display = 'block';
    });
    
    statsLink.addEventListener('click', function(e) {
        e.preventDefault();
        updateStatsDisplay();
        statsModal.style.display = 'block';
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            rulesModal.style.display = 'none';
            statsModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
        if (e.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });
}

// Handle search input
function handleSearch() {
    const searchTerm = pokemonGuessInput.value.trim().toLowerCase();
    console.log('Search term:', searchTerm);
    
    if (searchTerm.length < 1) {
        searchResults.style.display = 'none';
        return;
    }
    
    showSearchResults(searchTerm);
}

// Show search results based on input
function showSearchResults(searchTerm) {
    console.log('pokemonData length:', pokemonData ? pokemonData.length : 'undefined');
    
    // Filter Pokémon that match the search term
    const filteredPokemon = pokemonData.filter(pokemon => 
        pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('Filtered Pokémon:', filteredPokemon);
    
    // Clear previous results
    searchResults.innerHTML = '';
    
    // If no results, hide the container
    if (filteredPokemon.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    
    // Add results to the container
    filteredPokemon.slice(0, 5).forEach(pokemon => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.textContent = pokemon.name;
        
        // Add click event to select this Pokémon
        resultItem.addEventListener('click', function() {
            console.log('Pokemon selected:', pokemon.name);
            pokemonGuessInput.value = pokemon.name;
            searchResults.style.display = 'none';
        });
        
        searchResults.appendChild(resultItem);
    });
    
    console.log('Search results container display:', searchResults.style.display);
    // Show the results container
    searchResults.style.display = 'block';
}

// Select a daily Pokémon based on the date
function selectDailyPokemon() {
    try {
        // Use the date as a seed for the random selection
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const randomIndex = seededRandom(seed, pokemonData.length);
        
        // Set the target Pokémon
        gameState.targetPokemon = pokemonData[randomIndex];
        targetPokemon = pokemonData[randomIndex]; // For compatibility with existing code
        
        console.log("Today's Pokémon selected:", gameState.targetPokemon.name);
    } catch (error) {
        console.error('Error selecting daily Pokémon:', error);
        alert('There was a problem selecting today\'s Pokémon. Please refresh the page.');
    }
}

// Seeded random function to ensure the same Pokémon is selected for everyone on the same day
function seededRandom(seed, max) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let z = seed;
    
    z = (a * z + c) % m;
    return Math.floor((z / m) * max);
}

// Handle a guess submission
function handleGuess() {
    try {
        // Don't process guesses if the game is over
        if (gameState.isGameOver || gameOver) {
            console.log('Game is already over, ignoring guess');
            return;
        }
        
        const guess = pokemonGuessInput.value.trim();
        
        // Validate the guess
        if (!guess) {
            alert('Please enter a Pokémon name');
            return;
        }
        
        console.log('Processing guess:', guess);
        
        // Find the guessed Pokémon in our data
        const guessedPokemon = pokemonData.find(p => p.name.toLowerCase() === guess.toLowerCase());
        
        if (!guessedPokemon) {
            alert('Pokémon not found in our database. Please select from the suggestions.');
            return;
        }
        
        // Check if this Pokémon was already guessed
        if (gameState.guessHistory.some(g => g.name.toLowerCase() === guess.toLowerCase()) ||
            guessHistory.some(g => g.name.toLowerCase() === guess.toLowerCase())) {
            alert('You already guessed this Pokémon!');
            return;
        }
        
        // Add guess to game state
        gameState.addGuess(guessedPokemon);
        
        // Also update legacy variables for compatibility
        attempts++;
        guessHistory.push(guessedPokemon);
        
        // Update attempt counter in UI
        updateAttemptCounter();
        
        // Compare the guess with the target
        const comparison = comparePokemon(guessedPokemon, gameState.targetPokemon || targetPokemon);
        
        // Display the guess result
        displayGuessResult(guessedPokemon, comparison);
        
        // Clear the input
        pokemonGuessInput.value = '';
        searchResults.style.display = 'none';
        
        // Check if the game should end
        const gameStatus = gameState.shouldEndGame(guessedPokemon);
        
        if (gameStatus.ended) {
            endGame(gameStatus.won);
        }
        
        // Save the current game state
        saveTodaysGame();
        
    } catch (error) {
        console.error('Error in handleGuess:', error);
        alert('Something went wrong processing your guess. Please try again.');
    }
}

// Update the attempt counter in the UI
function updateAttemptCounter() {
    if (gameState.attempts < gameState.maxAttempts) {
        currentAttemptSpan.textContent = gameState.attempts + 1;
    } else {
        currentAttemptSpan.textContent = gameState.maxAttempts;
    }
}

// Compare the guessed Pokémon with the target Pokémon
function comparePokemon(guessed, target) {
    // Check if both Pokémon objects have the required properties
    if (!guessed || !target) {
        console.error('Invalid Pokémon objects for comparison', { guessed, target });
        return null;
    }

    // Create a safety fallback for missing properties
    const safeGuessed = {
        name: guessed.name || "Unknown",
        type1: guessed.type1 || "unknown",
        type2: guessed.type2 || "",
        pokedex_number: guessed.pokedex_number || 0,
        height_m: guessed.height_m || 0,
        weight_kg: guessed.weight_kg || 0,
        classfication: guessed.classfication || "Unknown Pokémon"
    };

    const safeTarget = {
        name: target.name || "Unknown",
        type1: target.type1 || "unknown",
        type2: target.type2 || "",
        pokedex_number: target.pokedex_number || 0,
        height_m: target.height_m || 0,
        weight_kg: target.weight_kg || 0,
        classfication: target.classfication || "Unknown Pokémon"
    };

    console.log('Comparing Pokémon:', safeGuessed.name, 'with', safeTarget.name);

    const result = {
        name: {
            value: safeGuessed.name,
            status: safeGuessed.name === safeTarget.name ? 'correct' : 'wrong'
        },
        type: {
            value: `${safeGuessed.type1}${safeGuessed.type2 ? '/' + safeGuessed.type2 : ''}`,
            status: 'wrong'
        },
        pokedex: {
            value: safeGuessed.pokedex_number,
            status: safeGuessed.pokedex_number === safeTarget.pokedex_number ? 'correct' : 'wrong',
            direction: safeGuessed.pokedex_number < safeTarget.pokedex_number ? 'up' : safeGuessed.pokedex_number > safeTarget.pokedex_number ? 'down' : null
        },
        classification: {
            value: safeGuessed.classfication,
            status: safeGuessed.classfication === safeTarget.classfication ? 'correct' : 'wrong'
        },
        height: {
            value: safeGuessed.height_m,
            status: 'wrong',
            direction: safeGuessed.height_m < safeTarget.height_m ? 'up' : safeGuessed.height_m > safeTarget.height_m ? 'down' : null
        },
        weight: {
            value: safeGuessed.weight_kg,
            status: 'wrong',
            direction: safeGuessed.weight_kg < safeTarget.weight_kg ? 'up' : safeGuessed.weight_kg > safeTarget.weight_kg ? 'down' : null
        }
    };
    
    // Check for type matches (both types)
    if (safeGuessed.type1 === safeTarget.type1 && safeGuessed.type2 === safeTarget.type2) {
        result.type.status = 'correct';
    } else if (
        safeGuessed.type1 === safeTarget.type1 || 
        safeGuessed.type1 === safeTarget.type2 || 
        (safeGuessed.type2 && (safeGuessed.type2 === safeTarget.type1 || safeGuessed.type2 === safeTarget.type2))
    ) {
        result.type.status = 'close';
    }
    
    // Check for height being close
    const heightDifference = Math.abs(safeGuessed.height_m - safeTarget.height_m);
    if (heightDifference === 0) {
        result.height.status = 'correct';
    } else if (heightDifference <= 0.5) {
        result.height.status = 'close';
    }
    
    // Check for weight being close
    const weightDifference = Math.abs(safeGuessed.weight_kg - safeTarget.weight_kg);
    if (weightDifference === 0) {
        result.weight.status = 'correct';
    } else if (weightDifference <= 5) {
        result.weight.status = 'close';
    }
    
    console.log('Comparison result:', result);
    return result;
}

// Display the guess result in the UI
function displayGuessResult(pokemon, comparison) {
    // Ensure comparison object is valid
    if (!comparison || !comparison.name || !comparison.type || !comparison.pokedex || 
        !comparison.classification || !comparison.height || !comparison.weight) {
        console.error('Invalid comparison object:', comparison);
        // Create a fallback comparison object if the original is invalid
        if (!comparison) {
            comparison = {
                name: { value: pokemon ? pokemon.name : "Unknown", status: "wrong" },
                type: { value: pokemon ? (pokemon.type1 + (pokemon.type2 ? '/' + pokemon.type2 : '')) : "unknown", status: "wrong" },
                pokedex: { value: pokemon ? pokemon.pokedex_number : 0, status: "wrong" },
                classification: { value: pokemon ? pokemon.classfication : "Unknown", status: "wrong" },
                height: { value: pokemon ? pokemon.height_m : 0, status: "wrong" },
                weight: { value: pokemon ? pokemon.weight_kg : 0, status: "wrong" }
            };
        }
        // Log fallback object creation
        console.log('Created fallback comparison object:', comparison);
    }

    console.log('Displaying result for:', pokemon ? pokemon.name : 'Unknown Pokémon');

    const guessRow = document.createElement('div');
    guessRow.className = 'guess-row';
    
    // Add Pokémon name
    const nameElement = document.createElement('div');
    nameElement.className = `guess-attribute ${comparison.name.status}`;
    nameElement.textContent = comparison.name.value;
    guessRow.appendChild(nameElement);
    
    // Add type (both types)
    const typeElement = document.createElement('div');
    typeElement.className = `guess-attribute ${comparison.type.status}`;
    typeElement.textContent = comparison.type.value;
    guessRow.appendChild(typeElement);
    
    // Add Pokédex number
    const pokedexElement = document.createElement('div');
    pokedexElement.className = `guess-attribute ${comparison.pokedex.status}`;
    pokedexElement.textContent = comparison.pokedex.value;
    if (comparison.pokedex.direction) {
        const directionSpan = document.createElement('span');
        directionSpan.className = 'direction';
        directionSpan.textContent = comparison.pokedex.direction === 'up' ? '↑' : '↓';
        pokedexElement.appendChild(directionSpan);
    }
    guessRow.appendChild(pokedexElement);
    
    // Add classification
    const classificationElement = document.createElement('div');
    classificationElement.className = `guess-attribute ${comparison.classification.status}`;
    classificationElement.textContent = comparison.classification.value;
    guessRow.appendChild(classificationElement);
    
    // Add height
    const heightElement = document.createElement('div');
    heightElement.className = `guess-attribute ${comparison.height.status}`;
    heightElement.textContent = comparison.height.value + 'm';
    if (comparison.height.direction) {
        const directionSpan = document.createElement('span');
        directionSpan.className = 'direction';
        directionSpan.textContent = comparison.height.direction === 'up' ? '↑' : '↓';
        heightElement.appendChild(directionSpan);
    }
    guessRow.appendChild(heightElement);
    
    // Add weight
    const weightElement = document.createElement('div');
    weightElement.className = `guess-attribute ${comparison.weight.status}`;
    weightElement.textContent = comparison.weight.value + 'kg';
    if (comparison.weight.direction) {
        const directionSpan = document.createElement('span');
        directionSpan.className = 'direction';
        directionSpan.textContent = comparison.weight.direction === 'up' ? '↑' : '↓';
        weightElement.appendChild(directionSpan);
    }
    guessRow.appendChild(weightElement);
    
    // Add the row to the container
    guessesContainer.appendChild(guessRow);
    
    // Scroll to show the new guess
    guessesContainer.scrollTop = guessesContainer.scrollHeight;

    console.log('Guess result displayed successfully');
}

// End the game
function endGame(won) {
    try {
        console.log(`Game ended. Result: ${won ? 'Won' : 'Lost'}`);
        
        // Update game state
        gameState.updateStats(won);
        
        // Update legacy variables for compatibility
        gameOver = true;
        gameWon = won;
        
        // Update stats
        stats.gamesPlayed++;
        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;
            stats.guessDistribution[attempts]++;
        } else {
            stats.currentStreak = 0;
        }
        
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.lastPlayed = new Date().toDateString();
        
        // Save stats
        saveStats();
        
        // Show result
        const targetName = gameState.targetPokemon ? gameState.targetPokemon.name : targetPokemon.name;
        if (won) {
            resultMessage.textContent = `Congratulations! You caught ${targetName} in ${gameState.attempts} ${gameState.attempts === 1 ? 'try' : 'tries'}!`;
        } else {
            resultMessage.textContent = `Game Over! The Pokémon was ${targetName}.`;
        }
        
        // Show Pokémon details with the correct stats
        const displayPokemon = gameState.targetPokemon || targetPokemon;
        pokemonReveal.innerHTML = `
            <p><strong>Type:</strong> ${displayPokemon.type1}${displayPokemon.type2 ? '/' + displayPokemon.type2 : ''}</p>
            <p><strong>Pokédex Number:</strong> ${displayPokemon.pokedex_number}</p>
            <p><strong>Classification:</strong> ${displayPokemon.classfication}</p>
            <p><strong>Height:</strong> ${displayPokemon.height_m}m</p>
            <p><strong>Weight:</strong> ${displayPokemon.weight_kg}kg</p>
        `;
        
        resultContainer.style.display = 'block';
        
        // Disable input
        pokemonGuessInput.disabled = true;
        guessButton.disabled = true;
    } catch (error) {
        console.error('Error ending game:', error);
        alert('There was a problem completing the game. Your progress might not be saved correctly.');
    }
}

// Share the result
function shareResult() {
    let shareText = `Guess the Pokémon - ${new Date().toLocaleDateString()}\n`;
    
    if (gameWon) {
        shareText += `Caught in ${attempts}/${maxAttempts} tries!\n\n`;
    } else {
        shareText += `Failed to catch ${targetPokemon.name}!\n\n`;
    }
    
    // Add emoji representation of guesses
    guessHistory.forEach((guess, index) => {
        const comparison = comparePokemon(guess, targetPokemon);
        
        let rowEmojis = '';
        
        // Name
        rowEmojis += comparison.name.status === 'correct' ? '🟩' : '🟥';
        
        // Type (both types)
        rowEmojis += comparison.type.status === 'correct' ? '🟩' : comparison.type.status === 'close' ? '🟨' : '🟥';
        
        // Pokédex number
        rowEmojis += comparison.pokedex.status === 'correct' ? '🟩' : '🟥';
        if (comparison.pokedex.direction === 'up') rowEmojis += '⬆️';
        if (comparison.pokedex.direction === 'down') rowEmojis += '⬇️';
        
        // Classification
        rowEmojis += comparison.classification.status === 'correct' ? '🟩' : '🟥';
        
        // Height
        rowEmojis += comparison.height.status === 'correct' ? '🟩' : comparison.height.status === 'close' ? '🟨' : '🟥';
        if (comparison.height.direction === 'up') rowEmojis += '⬆️';
        if (comparison.height.direction === 'down') rowEmojis += '⬇️';
        
        // Weight
        rowEmojis += comparison.weight.status === 'correct' ? '🟩' : comparison.weight.status === 'close' ? '🟨' : '🟥';
        if (comparison.weight.direction === 'up') rowEmojis += '⬆️';
        if (comparison.weight.direction === 'down') rowEmojis += '⬇️';
        
        shareText += `${rowEmojis} (${index + 1})\n`;
    });
    
    shareText += '\nPlay Guess the Pokémon: [your-game-url]';
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareText)
        .then(() => {
            alert('Result copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Result copied to clipboard!');
        });
}

// Reset the game
function resetGame() {
    try {
        console.log('Resetting game...');
        
        // Reset game state
        gameState.reset();
        
        // Reset legacy variables for compatibility
        attempts = 0;
        gameOver = false;
        gameWon = false;
        guessHistory = [];
        
        // Update UI
        currentAttemptSpan.textContent = '1';
        guessesContainer.innerHTML = '';
        resultContainer.style.display = 'none';
        
        // Re-enable input
        pokemonGuessInput.disabled = false;
        guessButton.disabled = false;
        
        // Clear localStorage if we're doing a complete reset
        localStorage.removeItem('todaysGame');
        
        // Select a new random Pokémon
        selectDailyPokemon();
        
        console.log('Game reset complete');
    } catch (error) {
        console.error('Error resetting game:', error);
        alert('There was a problem resetting the game. Please refresh the page.');
    }
}

// Save the current game state
function saveTodaysGame() {
    try {
        const gameStateToSave = {
            targetPokemon: gameState.targetPokemon || targetPokemon,
            attempts: gameState.attempts || attempts,
            guessHistory: gameState.guessHistory.length > 0 ? gameState.guessHistory : guessHistory,
            gameOver: gameState.isGameOver || gameOver,
            gameWon: gameState.isGameWon || gameWon
        };
        
        localStorage.setItem('todaysGame', JSON.stringify(gameStateToSave));
        console.log('Game state saved to localStorage');
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Load today's game state
function loadTodaysGame() {
    try {
        const savedGame = JSON.parse(localStorage.getItem('todaysGame'));
        
        if (savedGame) {
            console.log('Loading saved game state from localStorage');
            
            // Update game state object
            gameState.targetPokemon = savedGame.targetPokemon;
            gameState.attempts = savedGame.attempts;
            gameState.isGameOver = savedGame.gameOver;
            gameState.isGameWon = savedGame.gameWon;
            gameState.guessHistory = savedGame.guessHistory || [];
            
            // Update legacy variables for compatibility
            targetPokemon = savedGame.targetPokemon;
            attempts = savedGame.attempts;
            gameOver = savedGame.gameOver;
            gameWon = savedGame.gameWon;
            guessHistory = savedGame.guessHistory || [];
            
            // Update the UI
            // Make sure to display the correct attempt counter
            updateAttemptCounter();
            
            // Replay the guesses
            if (Array.isArray(savedGame.guessHistory)) {
                savedGame.guessHistory.forEach(guessedPokemon => {
                    const comparison = comparePokemon(guessedPokemon, gameState.targetPokemon);
                    displayGuessResult(guessedPokemon, comparison);
                });
            } else {
                console.error('Saved guessHistory is not an array:', savedGame.guessHistory);
            }
            
            // If the game was over, show the result
            if (gameState.isGameOver) {
                const targetName = gameState.targetPokemon.name;
                if (gameState.isGameWon) {
                    resultMessage.textContent = `Congratulations! You caught ${targetName} in ${gameState.attempts} ${gameState.attempts === 1 ? 'try' : 'tries'}!`;
                } else {
                    resultMessage.textContent = `Game Over! The Pokémon was ${targetName}.`;
                }
                
                const displayPokemon = gameState.targetPokemon;
                pokemonReveal.innerHTML = `
                    <p><strong>Type:</strong> ${displayPokemon.type1}${displayPokemon.type2 ? '/' + displayPokemon.type2 : ''}</p>
                    <p><strong>Pokédex Number:</strong> ${displayPokemon.pokedex_number}</p>
                    <p><strong>Classification:</strong> ${displayPokemon.classfication}</p>
                    <p><strong>Height:</strong> ${displayPokemon.height_m}m</p>
                    <p><strong>Weight:</strong> ${displayPokemon.weight_kg}kg</p>
                `;
                
                resultContainer.style.display = 'block';
                
                // Disable input
                pokemonGuessInput.disabled = true;
                guessButton.disabled = true;
            }
        }
    } catch (error) {
        console.error('Error loading game state:', error);
        alert('There was a problem loading your saved game. Starting a new game instead.');
        selectDailyPokemon();
    }
}

// Save stats to localStorage
function saveStats() {
    try {
        // Merge game state stats with legacy stats object
        const combinedStats = {
            gamesPlayed: Math.max(gameState.stats.gamesPlayed, stats.gamesPlayed),
            gamesWon: Math.max(gameState.stats.gamesWon, stats.gamesWon),
            currentStreak: Math.max(gameState.stats.currentStreak, stats.currentStreak),
            maxStreak: Math.max(gameState.stats.maxStreak, stats.maxStreak),
            guessDistribution: stats.guessDistribution, // Use the existing one for simplicity
            lastPlayed: stats.lastPlayed
        };
        
        localStorage.setItem('pokemonGameStats', JSON.stringify(combinedStats));
        console.log('Game stats saved to localStorage');
    } catch (error) {
        console.error('Error saving stats:', error);
    }
}

// Load stats from localStorage
function loadStats() {
    try {
        const savedStats = JSON.parse(localStorage.getItem('pokemonGameStats'));
        
        if (savedStats) {
            console.log('Loading saved stats from localStorage');
            
            // Update both state objects
            stats = savedStats;
            
            gameState.stats.gamesPlayed = savedStats.gamesPlayed;
            gameState.stats.gamesWon = savedStats.gamesWon;
            gameState.stats.currentStreak = savedStats.currentStreak;
            gameState.stats.maxStreak = savedStats.maxStreak;
            gameState.stats.lastPlayed = savedStats.lastPlayed;
            
            // Only update distribution if it exists in saved stats
            if (savedStats.guessDistribution) {
                gameState.stats.guessDistribution = savedStats.guessDistribution;
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Continue with default stats
    }
}

// Update the stats display
function updateStatsDisplay() {
    try {
        console.log('Updating stats display...');
        
        // Get latest stats (combine both objects to ensure we get the most up-to-date values)
        const currentStats = {
            gamesPlayed: Math.max(gameState.stats.gamesPlayed, stats.gamesPlayed),
            gamesWon: Math.max(gameState.stats.gamesWon, stats.gamesWon),
            currentStreak: Math.max(gameState.stats.currentStreak, stats.currentStreak),
            maxStreak: Math.max(gameState.stats.maxStreak, stats.maxStreak),
            guessDistribution: stats.guessDistribution // Use the existing one
        };
        
        // Update display elements
        document.getElementById('games-played').textContent = currentStats.gamesPlayed;
        
        const winPercentage = currentStats.gamesPlayed > 0 
            ? Math.round((currentStats.gamesWon / currentStats.gamesPlayed) * 100) 
            : 0;
        document.getElementById('win-percentage').textContent = winPercentage + '%';
        
        document.getElementById('current-streak').textContent = currentStats.currentStreak;
        document.getElementById('max-streak').textContent = currentStats.maxStreak;
        
        // Update guess distribution
        const guessDistribution = document.getElementById('guess-distribution');
        guessDistribution.innerHTML = '';
        
        // Find the highest value in distribution for scaling
        const distributionValues = Object.values(currentStats.guessDistribution);
        const maxGuesses = Math.max(...distributionValues);
        
        // Create distribution bars
        for (let i = 1; i <= gameState.maxAttempts; i++) {
            const row = document.createElement('div');
            row.className = 'distribution-row';
            
            const guessNumber = document.createElement('div');
            guessNumber.className = 'guess-number';
            guessNumber.textContent = i;
            
            const bar = document.createElement('div');
            bar.className = 'distribution-bar';
            const count = currentStats.guessDistribution[i] || 0;
            const percentage = maxGuesses > 0 ? (count / maxGuesses) * 100 : 0;
            bar.style.width = `${Math.max(percentage, 7)}%`;
            bar.textContent = count;
            
            row.appendChild(guessNumber);
            row.appendChild(bar);
            guessDistribution.appendChild(row);
        }
        
        console.log('Stats display updated successfully');
    } catch (error) {
        console.error('Error updating stats display:', error);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame); 