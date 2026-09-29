const fs = require('fs');
const path = require('path');
const { GAME_SHELL_CSS } = require('../dist/index.js');

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'game-shell.css'), GAME_SHELL_CSS);
