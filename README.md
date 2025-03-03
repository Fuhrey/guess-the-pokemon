# Pokémon Guessing Game

A Wordle-like game where players try to guess the daily Pokémon based on various attributes like type, height, weight, and more.

## Features

- Daily unique Pokémon to guess
- Six attempts to guess correctly
- Feedback on each guess with color-coded hints
- Attribute comparisons (type, Pokédex number, classification, height, weight)
- Share your results with friends
- Statistics tracking
- Mobile-responsive design
- Beautiful retro-style Pokémon interface

## Technologies Used

- HTML5
- CSS3 (with CSS Variables and Grid)
- Vanilla JavaScript
- Python (for data conversion)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/pokemon-guessing-game.git
cd pokemon-guessing-game
```

2. If you want to update the Pokémon data:
   - Update the `pokemon.csv` file
   - Run the Python converter:
   ```bash
   cd helpers/converters
   python convert_pokemon.py
   ```
   - The new `pokemon-data.js` will be generated

3. Open `index.html` in your browser or serve it using a local server.

## Project Structure

```
pokemon-guessing-game/
├── index.html
├── styles.css
├── script.js
├── pokemon-data.js
├── README.md
├── data/
│   └── pokemon.csv
└── helpers/
    └── converters/
        └── convert_pokemon.py
```

## How to Play

1. You have 6 attempts to guess the daily Pokémon
2. After each guess, you'll get feedback:
   - 🟩 Green: Exact match
   - 🟨 Yellow: Close match
   - 🟥 Red: Wrong match
   - ↑/↓ Arrows indicate if the value is higher/lower

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- Pokémon data sourced from public Pokémon databases
- Icons from Font Awesome
- Font: Press Start 2P from Google Fonts 