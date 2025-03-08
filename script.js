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
    gameMode: 'daily', // 'daily' or 'freePlay'
    
    // Game statistics
    stats: {
        daily: {
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
        freePlay: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalAttempts: 0,
            bestScore: Infinity
        }
    },
    
    // Reset game state for a new game
    reset: function(keepMode = true) {
        this.attempts = 0;
        this.isGameOver = false;
        this.isGameWon = false;
        this.guessHistory = [];
        if (!keepMode) {
            this.gameMode = 'daily';
        }
        
        // Set max attempts based on mode
        this.maxAttempts = this.gameMode === 'daily' ? 6 : Infinity;
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
        } else if (this.gameMode === 'daily' && this.attempts >= this.maxAttempts) {
            return { ended: true, won: false };
        }
        return { ended: false, won: false };
    },
    
    // Update game stats when game ends
    updateStats: function(won) {
        this.isGameOver = true;
        this.isGameWon = won;
        
        if (this.gameMode === 'daily') {
            this.stats.daily.gamesPlayed++;
            if (won) {
                this.stats.daily.gamesWon++;
                this.stats.daily.currentStreak++;
                this.stats.daily.guessDistribution[this.attempts]++;
            } else {
                this.stats.daily.currentStreak = 0;
            }
            
            this.stats.daily.maxStreak = Math.max(this.stats.daily.maxStreak, this.stats.daily.currentStreak);
            this.stats.daily.lastPlayed = new Date().toDateString();
        } else {
            this.stats.freePlay.gamesPlayed++;
            if (won) {
                this.stats.freePlay.gamesWon++;
                this.stats.freePlay.totalAttempts += this.attempts;
                this.stats.freePlay.bestScore = Math.min(this.stats.freePlay.bestScore, this.attempts);
            }
        }
    },
    
    // Check if player has access to free play mode
    canAccessFreePlay: function() {
        const today = new Date().toDateString();
        return this.stats.daily.lastPlayed === today;
    },
    
    // Set game mode
    setGameMode: function(mode) {
        this.gameMode = mode;
        this.maxAttempts = mode === 'daily' ? 6 : Infinity;
    }
};

// Maintain legacy variables for compatibility with existing code
let targetPokemon = null;
let attempts = 0;
let maxAttempts = 6;
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
const freePlayButton = document.getElementById('free-play-button');
const currentAttemptSpan = document.getElementById('current-attempt');
const maxAttemptsSpan = document.getElementById('max-attempts');
const rulesLink = document.getElementById('rules-link');
const statsLink = document.getElementById('stats-link');
const rulesModal = document.getElementById('rules-modal');
const statsModal = document.getElementById('stats-modal');
const closeButtons = document.querySelectorAll('.close-button');
const searchResults = document.getElementById('search-results');
const currentModeSpan = document.getElementById('current-mode');
const modeSwitch = document.getElementById('mode-switch');
const dailyStatsTab = document.getElementById('daily-stats-tab');
const freePlayStatsTab = document.getElementById('free-play-stats-tab');
const dailyStatsContainer = document.getElementById('daily-stats-container');
const freePlayStatsContainer = document.getElementById('free-play-stats-container');

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
    
    // Hide mode switch initially
    if (gameState.stats.daily.lastPlayed === today) {
        // Player has already played or failed today, enable free play
        console.log('Player already played today, can access free play');
        document.querySelector('.mode-toggle').style.display = 'flex';
    } else {
        // New day, start with daily challenge
        console.log('New game for today');
        document.querySelector('.mode-toggle').style.display = 'none';
        gameState.setGameMode('daily');
        updateModeDisplay();
    }
    
    // Update game mode display
    updateModeDisplay();
    
    // Select appropriate Pokémon based on mode
    if (gameState.stats.daily.lastPlayed === today) {
        // Player has already played today, load saved game
        console.log('Loading saved game');
        loadTodaysGame();
    } else {
        // New daily challenge
        selectPokemon();
    }
    
    // Add event listeners
    setupEventListeners();
    
    console.log('Game initialized successfully');
}

// Setup event listeners
function setupEventListeners() {
    try {
        console.log('Setting up event listeners...');
        
        // Game input events
        pokemonGuessInput.addEventListener('input', handleSearch);
        guessButton.addEventListener('click', handleGuess);
        pokemonGuessInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGuess();
            }
        });
        
        // Search dropdown handling
        pokemonGuessInput.addEventListener('focus', function() {
            if (pokemonGuessInput.value.length > 0) {
                showSearchResults(pokemonGuessInput.value);
            } else {
                // When input is empty, show first 5 Pokemon
                showInitialSearchResults();
            }
        });
        
        pokemonGuessInput.addEventListener('click', function() {
            if (searchResults.style.display !== 'block') {
                if (pokemonGuessInput.value.length > 0) {
                    showSearchResults(pokemonGuessInput.value);
                } else {
                    showInitialSearchResults();
                }
            }
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== pokemonGuessInput && e.target !== searchResults) {
                searchResults.style.display = 'none';
            }
        });
        
        // Modal events
        rulesLink.addEventListener('click', function(e) {
            e.preventDefault();
            rulesModal.style.display = 'block';
        });
        
        statsLink.addEventListener('click', function(e) {
            e.preventDefault();
            statsModal.style.display = 'block';
            updateStatsDisplay();
        });
        
        closeButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                button.closest('.modal').style.display = 'none';
            });
        });
        
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Share and play again buttons
        shareButton.addEventListener('click', shareResult);
        playAgainButton.addEventListener('click', resetGame);
        
        // Free Play button
        freePlayButton.addEventListener('click', function() {
            if (gameState.canAccessFreePlay()) {
                gameState.setGameMode('freePlay');
                updateModeDisplay();
                resetGame(true); // Keep the mode
            } else {
                alert('Complete today\'s daily challenge first to unlock Free Play mode!');
            }
        });
        
        // Mode toggle switch
        modeSwitch.addEventListener('change', function() {
            if (!gameState.canAccessFreePlay() && this.checked) {
                // Trying to switch to free play without completing daily challenge
                alert('Complete today\'s daily challenge first to unlock Free Play mode!');
                this.checked = false;
                return;
            }
            
            gameState.setGameMode(this.checked ? 'freePlay' : 'daily');
            updateModeDisplay();
            resetGame(true); // Keep the mode
        });
        
        // Stats tab buttons
        dailyStatsTab.addEventListener('click', function() {
            dailyStatsTab.classList.add('active');
            freePlayStatsTab.classList.remove('active');
            dailyStatsContainer.style.display = 'block';
            freePlayStatsContainer.style.display = 'none';
        });
        
        freePlayStatsTab.addEventListener('click', function() {
            freePlayStatsTab.classList.add('active');
            dailyStatsTab.classList.remove('active');
            freePlayStatsContainer.style.display = 'block';
            dailyStatsContainer.style.display = 'none';
        });
        
        console.log('Event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Handle search input
function handleSearch() {
    try {
        const searchTerm = pokemonGuessInput.value.trim();
        if (searchTerm.length > 0) {
            showSearchResults(searchTerm);
        } else {
            searchResults.style.display = 'none';
        }
    } catch (error) {
        console.error('Error handling search:', error);
    }
}

// Show search results based on input
function showSearchResults(searchTerm) {
    try {
        // Clear previous results
        searchResults.innerHTML = '';
        
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        // Filter Pokémon that match the search term
        const matchingPokemon = pokemonData.filter(pokemon => 
            pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
        ); // Show all matching results
        
        if (matchingPokemon.length === 0) {
            searchResults.style.display = 'none';
            return;
        }
        
        // Performance optimization - use document fragment
        const fragment = document.createDocumentFragment();
        
        // Create result elements
        matchingPokemon.forEach(pokemon => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            // Create info container with image and text
            const infoContainer = document.createElement('div');
            infoContainer.className = 'pokemon-info-container';
            
            // Add Pokémon image
            const imageElement = document.createElement('img');
            imageElement.className = 'pokemon-image';
            // Convert pokemon name to lowercase for the filename
            const imagePath = `data/pictures/${pokemon.name.toLowerCase()}.png`;
            imageElement.src = imagePath;
            imageElement.alt = pokemon.name;
            // Handle image loading errors
            imageElement.onerror = function() {
                this.src = 'data/pictures/placeholder.png'; // Fallback image
                this.onerror = null; // Prevent infinite loop
            };
            infoContainer.appendChild(imageElement);
            
            // Create text content container
            const textContainer = document.createElement('div');
            textContainer.className = 'pokemon-text-container';
            
            // Create name element
            const nameElement = document.createElement('div');
            nameElement.className = 'pokemon-name';
            nameElement.textContent = pokemon.name;
            textContainer.appendChild(nameElement);
            
            // Create info elements
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'pokemon-info';
            
            // Add Pokédex Number
            const pokedexElement = document.createElement('span');
            pokedexElement.textContent = `#${pokemon.pokedex_number}`;
            detailsContainer.appendChild(pokedexElement);
            
            // Add Type(s)
            const type1Element = document.createElement('span');
            type1Element.className = `pokemon-type ${pokemon.type1}`;
            type1Element.textContent = pokemon.type1;
            detailsContainer.appendChild(type1Element);
            
            if (pokemon.type2) {
                const type2Element = document.createElement('span');
                type2Element.className = `pokemon-type ${pokemon.type2}`;
                type2Element.textContent = pokemon.type2;
                detailsContainer.appendChild(type2Element);
            }
            
            // Add Classification
            const classElement = document.createElement('span');
            classElement.textContent = pokemon.classfication;
            detailsContainer.appendChild(classElement);
            
            // Add Height & Weight
            const heightWeightElement = document.createElement('span');
            heightWeightElement.textContent = `${pokemon.height_m}m, ${pokemon.weight_kg}kg`;
            detailsContainer.appendChild(heightWeightElement);
            
            textContainer.appendChild(detailsContainer);
            infoContainer.appendChild(textContainer);
            resultItem.appendChild(infoContainer);
            
            resultItem.addEventListener('click', function() {
                pokemonGuessInput.value = pokemon.name;
                searchResults.style.display = 'none';
                handleGuess();
            });
            
            fragment.appendChild(resultItem);
        });
        
        // Add all items to DOM at once for better performance
        searchResults.appendChild(fragment);
        
        searchResults.style.display = 'block';
    } catch (error) {
        console.error('Error showing search results:', error);
    }
}

// Show initial list of Pokémon when input is clicked without text
function showInitialSearchResults() {
    try {
        // Clear previous results
        searchResults.innerHTML = '';
        
        // Performance optimization - use document fragment
        const fragment = document.createDocumentFragment();
        
        // Show all Pokémon in the data
        pokemonData.forEach(pokemon => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            // Create info container with image and text
            const infoContainer = document.createElement('div');
            infoContainer.className = 'pokemon-info-container';
            
            // Add Pokémon image
            const imageElement = document.createElement('img');
            imageElement.className = 'pokemon-image';
            // Convert pokemon name to lowercase for the filename
            const imagePath = `data/pictures/${pokemon.name.toLowerCase()}.png`;
            imageElement.src = imagePath;
            imageElement.alt = pokemon.name;
            // Handle image loading errors
            imageElement.onerror = function() {
                this.src = 'data/pictures/placeholder.png'; // Fallback image
                this.onerror = null; // Prevent infinite loop
            };
            infoContainer.appendChild(imageElement);
            
            // Create text content container
            const textContainer = document.createElement('div');
            textContainer.className = 'pokemon-text-container';
            
            // Create name element
            const nameElement = document.createElement('div');
            nameElement.className = 'pokemon-name';
            nameElement.textContent = pokemon.name;
            textContainer.appendChild(nameElement);
            
            // Create info elements
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'pokemon-info';
            
            // Add Pokédex Number
            const pokedexElement = document.createElement('span');
            pokedexElement.textContent = `#${pokemon.pokedex_number}`;
            detailsContainer.appendChild(pokedexElement);
            
            // Add Type(s)
            const type1Element = document.createElement('span');
            type1Element.className = `pokemon-type ${pokemon.type1}`;
            type1Element.textContent = pokemon.type1;
            detailsContainer.appendChild(type1Element);
            
            if (pokemon.type2) {
                const type2Element = document.createElement('span');
                type2Element.className = `pokemon-type ${pokemon.type2}`;
                type2Element.textContent = pokemon.type2;
                detailsContainer.appendChild(type2Element);
            }
            
            // Add Classification
            const classElement = document.createElement('span');
            classElement.textContent = pokemon.classfication;
            detailsContainer.appendChild(classElement);
            
            // Add Height & Weight
            const heightWeightElement = document.createElement('span');
            heightWeightElement.textContent = `${pokemon.height_m}m, ${pokemon.weight_kg}kg`;
            detailsContainer.appendChild(heightWeightElement);
            
            textContainer.appendChild(detailsContainer);
            infoContainer.appendChild(textContainer);
            resultItem.appendChild(infoContainer);
            
            resultItem.addEventListener('click', function() {
                pokemonGuessInput.value = pokemon.name;
                searchResults.style.display = 'none';
                handleGuess();
            });
            
            fragment.appendChild(resultItem);
        });
        
        // Add all items to DOM at once for better performance
        searchResults.appendChild(fragment);
        
        searchResults.style.display = 'block';
    } catch (error) {
        console.error('Error showing initial search results:', error);
    }
}

// Select a Pokémon based on the current game mode
function selectPokemon() {
    if (gameState.gameMode === 'daily') {
        selectDailyPokemon();
    } else {
        selectRandomPokemon();
    }
}

// Select daily Pokémon (seeded random based on date)
function selectDailyPokemon() {
    try {
        console.log('Selecting daily Pokémon...');
        
        // Daily challenge mode - use date-based selection
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const randomIndex = seededRandom(seed, pokemonData.length);
        const selectedPokemon = pokemonData[randomIndex];
        
        // Update game state
        gameState.targetPokemon = selectedPokemon;
        
        // Update legacy variable for compatibility
        targetPokemon = selectedPokemon;
        
        console.log(`Selected Pokémon for daily challenge: ${selectedPokemon.name}`);
        
        // Save game state
        saveTodaysGame();
    } catch (error) {
        console.error('Error selecting Pokémon:', error);
        alert('There was a problem selecting a Pokémon. Please refresh the page.');
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

// Select completely random Pokémon for free play
function selectRandomPokemon() {
    try {
        console.log('Selecting random Pokémon for free play...');
        
        // Free play mode - use pure random selection
        const randomIndex = Math.floor(Math.random() * pokemonData.length);
        const selectedPokemon = pokemonData[randomIndex];
        
        // Update game state
        gameState.targetPokemon = selectedPokemon;
        
        // Update legacy variable for compatibility
        targetPokemon = selectedPokemon;
        
        console.log(`Selected random Pokémon for free play: ${selectedPokemon.name}`);
    } catch (error) {
        console.error('Error selecting random Pokémon:', error);
        alert('There was a problem selecting a Pokémon. Please refresh the page.');
    }
}

// Reset game
function resetGame(keepMode = false) {
    try {
        console.log('Resetting game...');
        
        // Reset game state
        gameState.reset(keepMode);
        
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
        // (only for daily mode or if not keeping mode)
        if (gameState.gameMode === 'daily' || !keepMode) {
            localStorage.removeItem('todaysGame');
        }
        
        // Select a new Pokémon based on game mode
        selectPokemon();
        
        // Update mode display
        updateModeDisplay();
        
        console.log('Game reset complete');
    } catch (error) {
        console.error('Error resetting game:', error);
        alert('There was a problem resetting the game. Please refresh the page.');
    }
}

// Handle a guess submission
function handleGuess() {
    try {
        if (gameState.isGameOver) {
            console.log('Game already over');
            return;
        }
        
        const pokemonName = pokemonGuessInput.value.trim();
        if (!pokemonName) {
            alert('Please enter a Pokémon name');
            return;
        }
        
        // Check if the entered Pokémon is valid
        const guessedPokemon = pokemonData.find(p => p.name.toLowerCase() === pokemonName.toLowerCase());
        if (!guessedPokemon) {
            alert('Invalid Pokémon name. Please select from the dropdown.');
            return;
        }
        
        // Check if the Pokémon has already been guessed
        if (gameState.guessHistory.some(p => p.name.toLowerCase() === guessedPokemon.name.toLowerCase())) {
            alert('You already guessed this Pokémon!');
            return;
        }
        
        // Add to guess history
        gameState.addGuess(guessedPokemon);
        
        // For compatibility with legacy code
        attempts = gameState.attempts;
        guessHistory.push(guessedPokemon);
        
        // Update UI
        updateAttemptCounter();
        
        // Compare with target
        const comparison = comparePokemon(guessedPokemon, gameState.targetPokemon);
        
        // Display result
        displayGuessResult(guessedPokemon, comparison);
        
        // Clear input
        pokemonGuessInput.value = '';
        searchResults.style.display = 'none';
        
        // Check if game should end
        const gameStatus = gameState.shouldEndGame(guessedPokemon);
        if (gameStatus.ended) {
            endGame(gameStatus.won);
        }
        
        // Save game state
        if (gameState.gameMode === 'daily') {
            saveTodaysGame();
        }
    } catch (error) {
        console.error('Error handling guess:', error);
        alert('There was a problem processing your guess. Please try again.');
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
    
    // Add Pokémon image
    const imageCell = document.createElement('div');
    imageCell.className = 'guess-attribute';
    const imageElement = document.createElement('img');
    imageElement.className = 'pokemon-image-small';
    // Convert pokemon name to lowercase for the filename
    const imagePath = `data/pictures/${pokemon.name.toLowerCase()}.png`;
    imageElement.src = imagePath;
    imageElement.alt = pokemon.name;
    // Handle image loading errors
    imageElement.onerror = function() {
        this.src = 'data/pictures/placeholder.png'; // Fallback image
        this.onerror = null; // Prevent infinite loop
    };
    imageCell.appendChild(imageElement);
    guessRow.appendChild(imageCell);
    
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
        
        // Update stats based on mode
        if (gameState.gameMode === 'daily') {
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
        }
        
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
        
        // Create image element for the Pokemon
        const imagePath = `data/pictures/${displayPokemon.name.toLowerCase()}.png`;
        const imageHTML = `<img src="${imagePath}" alt="${displayPokemon.name}" class="pokemon-reveal-image" onerror="this.src='data/pictures/placeholder.png'; this.onerror=null;">`;
        
        pokemonReveal.innerHTML = `
            ${imageHTML}
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
        
        // Show/hide free play button
        freePlayButton.style.display = gameState.gameMode === 'daily' ? 'inline-block' : 'none';
        
        // If won or lost daily challenge, enable access to free play
        if (gameState.gameMode === 'daily') {
            document.querySelector('.mode-toggle').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error ending game:', error);
        alert('There was a problem completing the game. Your progress might not be saved correctly.');
    }
}

// Share the result
function shareResult() {
    try {
        // Different share text based on game mode
        let shareText = gameState.gameMode === 'daily' 
            ? `Guess the Pokémon - Daily Challenge (${new Date().toLocaleDateString()})\n` 
            : `Guess the Pokémon - Free Play Mode\n`;
        
        if (gameState.isGameWon) {
            if (gameState.gameMode === 'daily') {
                shareText += `Caught in ${gameState.attempts}/${gameState.maxAttempts} tries!\n\n`;
            } else {
                shareText += `Caught in ${gameState.attempts} tries!\n\n`;
            }
        } else {
            shareText += `Failed to catch ${gameState.targetPokemon.name}!\n\n`;
        }
        
        // Add emoji representation of guesses
        gameState.guessHistory.forEach((guess, index) => {
            const comparison = comparePokemon(guess, gameState.targetPokemon);
            
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
        
        // Add game url and mode
        if (gameState.gameMode === 'daily') {
            shareText += '\nPlay Guess the Pokémon Daily Challenge: [your-game-url]';
        } else {
            shareText += '\nPlay Guess the Pokémon Free Play Mode: [your-game-url]';
        }
        
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
    } catch (error) {
        console.error('Error sharing result:', error);
        alert('There was a problem sharing your result.');
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
            gameWon: gameState.isGameWon || gameWon,
            gameMode: gameState.gameMode // Store the current game mode
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
            gameState.gameMode = savedGame.gameMode || 'daily'; // Default to daily if not specified
            
            // Update legacy variables for compatibility
            targetPokemon = savedGame.targetPokemon;
            attempts = savedGame.attempts;
            gameOver = savedGame.gameOver;
            gameWon = savedGame.gameWon;
            guessHistory = savedGame.guessHistory || [];
            
            // Update the UI
            // Make sure to display the correct attempt counter
            updateAttemptCounter();
            
            // Update mode display
            updateModeDisplay();
            
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
                
                // Show/hide free play button
                freePlayButton.style.display = gameState.gameMode === 'daily' ? 'inline-block' : 'none';
                
                // Disable input
                pokemonGuessInput.disabled = true;
                guessButton.disabled = true;
            }
        }
    } catch (error) {
        console.error('Error loading game state:', error);
        alert('There was a problem loading your saved game. Starting a new game instead.');
        selectPokemon();
    }
}

// Save stats to localStorage
function saveStats() {
    try {
        // Save the daily stats in the legacy format for backward compatibility
        const dailyStats = {
            gamesPlayed: gameState.stats.daily.gamesPlayed,
            gamesWon: gameState.stats.daily.gamesWon,
            currentStreak: gameState.stats.daily.currentStreak,
            maxStreak: gameState.stats.daily.maxStreak,
            guessDistribution: gameState.stats.daily.guessDistribution,
            lastPlayed: gameState.stats.daily.lastPlayed
        };
        
        // Save free play stats separately
        const freePlayStats = {
            gamesPlayed: gameState.stats.freePlay.gamesPlayed,
            gamesWon: gameState.stats.freePlay.gamesWon,
            totalAttempts: gameState.stats.freePlay.totalAttempts,
            bestScore: gameState.stats.freePlay.bestScore
        };
        
        localStorage.setItem('pokemonGameStats', JSON.stringify(dailyStats));
        localStorage.setItem('pokemonGameFreePlayStats', JSON.stringify(freePlayStats));
        console.log('Game stats saved to localStorage');
    } catch (error) {
        console.error('Error saving stats:', error);
    }
}

// Load stats from localStorage
function loadStats() {
    try {
        // Load daily stats
        const savedDailyStats = JSON.parse(localStorage.getItem('pokemonGameStats'));
        
        if (savedDailyStats) {
            console.log('Loading saved daily stats from localStorage');
            
            // Update both state objects
            stats = savedDailyStats;
            
            gameState.stats.daily.gamesPlayed = savedDailyStats.gamesPlayed;
            gameState.stats.daily.gamesWon = savedDailyStats.gamesWon;
            gameState.stats.daily.currentStreak = savedDailyStats.currentStreak;
            gameState.stats.daily.maxStreak = savedDailyStats.maxStreak;
            gameState.stats.daily.lastPlayed = savedDailyStats.lastPlayed;
            
            // Only update distribution if it exists in saved stats
            if (savedDailyStats.guessDistribution) {
                gameState.stats.daily.guessDistribution = savedDailyStats.guessDistribution;
            }
        }
        
        // Load free play stats
        const savedFreePlayStats = JSON.parse(localStorage.getItem('pokemonGameFreePlayStats'));
        
        if (savedFreePlayStats) {
            console.log('Loading saved free play stats from localStorage');
            
            gameState.stats.freePlay.gamesPlayed = savedFreePlayStats.gamesPlayed;
            gameState.stats.freePlay.gamesWon = savedFreePlayStats.gamesWon;
            gameState.stats.freePlay.totalAttempts = savedFreePlayStats.totalAttempts;
            gameState.stats.freePlay.bestScore = savedFreePlayStats.bestScore;
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
        
        // Update daily stats
        document.getElementById('games-played').textContent = gameState.stats.daily.gamesPlayed;
        
        const winPercentage = gameState.stats.daily.gamesPlayed > 0 
            ? Math.round((gameState.stats.daily.gamesWon / gameState.stats.daily.gamesPlayed) * 100) 
            : 0;
        document.getElementById('win-percentage').textContent = `${winPercentage}%`;
        
        document.getElementById('current-streak').textContent = gameState.stats.daily.currentStreak;
        document.getElementById('max-streak').textContent = gameState.stats.daily.maxStreak;
        
        // Update guess distribution
        const guessDistributionDiv = document.getElementById('guess-distribution');
        guessDistributionDiv.innerHTML = '';
        
        // Find the max value in the distribution for scaling
        const maxDistValue = Math.max(
            ...Object.values(gameState.stats.daily.guessDistribution), 
            1
        );
        
        for (let i = 1; i <= 6; i++) {
            const count = gameState.stats.daily.guessDistribution[i] || 0;
            const percentage = Math.max((count / maxDistValue) * 100, 5); // Min 5% width for visibility
            
            const row = document.createElement('div');
            row.className = 'distribution-row';
            row.innerHTML = `
                <span class="attempt-number">${i}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%;">${count}</div>
                </div>
            `;
            guessDistributionDiv.appendChild(row);
        }
        
        // Update free play stats
        document.getElementById('fp-games-played').textContent = gameState.stats.freePlay.gamesPlayed;
        document.getElementById('fp-wins').textContent = gameState.stats.freePlay.gamesWon;
        
        const avgAttempts = gameState.stats.freePlay.gamesWon > 0 
            ? (gameState.stats.freePlay.totalAttempts / gameState.stats.freePlay.gamesWon).toFixed(1) 
            : '-';
        document.getElementById('fp-avg-attempts').textContent = avgAttempts;
        
        const bestScore = gameState.stats.freePlay.bestScore < Infinity 
            ? gameState.stats.freePlay.bestScore 
            : '-';
        document.getElementById('fp-best-score').textContent = bestScore;
        
        console.log('Stats display updated successfully');
    } catch (error) {
        console.error('Error updating stats display:', error);
    }
}

// Update mode display
function updateModeDisplay() {
    // Update the mode indicator text
    currentModeSpan.textContent = gameState.gameMode === 'daily' ? 'Daily Challenge' : 'Free Play';
    
    // Update toggle switch
    modeSwitch.checked = gameState.gameMode === 'freePlay';
    
    // Update max attempts display
    if (gameState.gameMode === 'daily') {
        maxAttemptsSpan.textContent = '6';
        document.querySelector('.attempts-counter').style.display = 'block';
    } else {
        maxAttemptsSpan.textContent = '∞';
        // No need to hide the counter for free play
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame); 