# Nexus Arena

**Kimi**'s entry for Round 4 of [Vibe Coding Battle](https://github.com/vibecoding-battle).

A real-time card duel inspired by Clash Royale, built for the browser. Pick 8 cards from a 43-card collection, manage your elixir and destroy the enemy King Tower before the clock runs out. The interface is in French.

## Run it

**You need Node.js 18 or newer.** There are no dependencies to install.

```bash
npm start
```

Then open **http://localhost:8000**.

Other options:

```bash
# Start directly
node server.mjs

# Use another port
node server.mjs --port=8080

# No Node? Use Python
python -m http.server 8000
```

The game works on recent versions of Chromium, Firefox and Safari, with mouse, keyboard and touch controls.

## How to play

- Build a deck of **8 cards** from the collection. **DECK AUTO** picks a complete deck if you want to start quickly.
- Click a hand card then your territory, or drag the card into the arena. Keys **1 to 4** select cards.
- **P** pauses, **M** toggles sound, **Esc** cancels a selection or closes the current overlay.
- Elixir refills automatically. After each deployment, the next card in the deck enters your hand.
- Ground units use the bridges; flying units cross the river directly. Spells can target the whole arena.
- Destroy an enemy Princess Tower to open that lane and activate the enemy King Tower. Destroy the King Tower to win immediately.
- Otherwise, the player with the most towers after **3 minutes** wins. The last minute is **double elixir**.
- A tie triggers **60 seconds of sudden death**: the next tower wins. If still tied, remaining tower integrity decides.

## Characters and AI

- **43 playable cards** across Common, Rare, Epic and Legendary rarities, with troops, buildings and spells.
- The default deck mixes the Mega Knight, Fireball, Knight, Minions, Arrows, Archers, Goblins and Zap.
- Three opponents: **Recrue**, **Orion** and **Titan**. Each has its own deck and difficulty behaviour.
- The AI manages elixir, defends threats, supports pushes and uses spells tactically.
- Decks and the selected opponent are saved in `localStorage`.

## Technical choices

- **HTML, CSS and JavaScript ES modules**, with no framework or external dependency.
- **Canvas 2D** for the arena, units, projectiles, particles and deployment feedback.
- Fixed-step simulation at **60 Hz**, independent of the display refresh rate.
- **Web Audio API** for sounds synthesized in real time.
- A minimal static server built on Node.js native modules, including font MIME types.
- Responsive mobile-first interface with mouse, keyboard and touch controls.

The arena, interface, effects and sounds are built in code. Card portraits are local PNG assets under `assets/cards/`.

## Structure

```text
index.html          Screens, HUD and overlays
styles.css          Responsive design and visual system
js/cards.js         Arena, card roster, decks and helpers
js/game.js          Combat, elixir, rules, towers and AI
js/renderer.js      Canvas rendering and effects
js/audio.js         Procedural sounds
js/art.js           Card portrait helpers
js/main.js          Collection, controls, HUD and main loop
server.mjs          Local static server
assets/cards/       43 card portraits
assets/fonts/       Local display font
```

## Credits

Clash Royale is a trademark of Supercell. This is an unofficial, non-commercial fan project and is not affiliated with or endorsed by Supercell.

The project was tested in Chromium at mobile and desktop sizes, with full simulated matches and real runs through deck editing, deployment, pause, victory, defeat and rematch.
