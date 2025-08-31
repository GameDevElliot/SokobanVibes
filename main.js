const root = document.documentElement;
let cameFromEditor = false;
const wallImage = new Image();
wallImage.src = 'images/wall.png';
const crateImage = new Image();
crateImage.src = 'images/crate.png';
const characterImage = new Image();
characterImage.src = 'images/character_ghost.png';
const goalImage = new Image();
goalImage.src = 'images/goal.png';
const sock1Image = new Image();
sock1Image.src = 'images/sock1.png';
const sock2Image = new Image();
sock2Image.src = 'images/sock2.png';

// --- unsaved changes window warning ---
let hasUnsavedChanges = false;
window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();             // required by some browsers
        e.returnValue = "";             // triggers the confirmation dialog
        return "";                      // for older browsers
    }
});

// --- parse, state, draw functions ---
function parseLevel(raw) {
    const rows = raw.map(r => r.split(''));
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const grid = Array.from({ length: h }, () => Array(w).fill(' ')); let player = { x: 0, y: 0 };
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = (rows[y][x] || ' ');
            if (ch === '#') grid[y][x] = '#'; else if (ch === ' ') grid[y][x] = '.';
            else if (ch === "@") { grid[y][x] = '.'; player = { x, y }; }
            else if (ch === "$") { grid[y][x] = '$'; } else if (ch === '.') grid[y][x] = '.';
        }
    }
    return { grid, player, h, w };
}
function makeState(level) {
    const parsed = parseLevel(level.map);
    const crates = [], goals = [];
    for (let y = 0; y < parsed.h; y++) {
        for (let x = 0; x < parsed.w; x++) {
            const ch = level.map[y][x] || ' ';
            if (ch === '$' || ch === '*') crates.push({ x, y,type: Math.floor(Math.random() * 2) });
            if (ch === '.' || ch === '*') goals.push({ x, y });
        }
    }
    return { grid: parsed.grid, player: parsed.player, crates, goals, h: parsed.h, w: parsed.w, moves: 0, history: [] };
}

const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d'), tileSize = 64;
function DrawGrid(canvas, state) {
    const ctx = canvas.getContext('2d');
    const tileSize = 64;
    const W = state.w * tileSize, H = state.h * tileSize;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            const ch = state.grid[y][x] || ' ';
            const px = x * tileSize, py = y * tileSize;

            if (ch === '#') {
                ctx.drawImage(wallImage, px, py, tileSize, tileSize);
            } else {
                ctx.fillStyle = '#071627';
                ctx.fillRect(px, py, tileSize, tileSize);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
            }
        }
    }

    state.goals?.forEach(g =>
        ctx.drawImage(goalImage, g.x * tileSize, g.y * tileSize, tileSize, tileSize)
    );

    state.crates?.forEach(c =>{
        const img = (c.type === 0 ? sock1Image : sock2Image);
        ctx.drawImage(img, c.x * tileSize, c.y * tileSize, tileSize, tileSize)
    });
    if (state.player) {
        ctx.drawImage(characterImage, state.player.x * tileSize, state.player.y * tileSize, tileSize, tileSize);
    }
}

function isWall(s, x, y) { return (y < 0 || x < 0 || y >= s.h || x >= s.w) || (s.grid[y][x] === '#'); }
function crateAt(s, x, y) { return s.crates.find(c => c.x === x && c.y === y); }
function tryMove(s, dx, dy) {
    const nx = s.player.x + dx, ny = s.player.y + dy; if (isWall(s, nx, ny)) return false;
    const c = crateAt(s, nx, ny); if (!c) { pushHistory(s); s.player.x = nx; s.player.y = ny; s.moves++; return true; }
    const nnx = nx + dx, nny = ny + dy; if (isWall(s, nnx, nny) || crateAt(s, nnx, nny)) return false;
    pushHistory(s); c.x = nnx; c.y = nny; s.player.x = nx; s.player.y = ny; s.moves++; return true;
}
function checkWin(s) { return s.goals.every(g => s.crates.some(c => c.x === g.x && c.y === g.y)); }
function pushHistory(s)
{
    s.history.push({ player: { x: s.player.x, y: s.player.y }, crates: s.crates.map(c => ({ ...c })), moves: s.moves });
}
function undo(s) { if (!s.history.length) return; const last = s.history.pop(); s.player = last.player; s.crates = last.crates; s.moves = last.moves; }

// --- UI flow ---

let currentState = null, currentLevelIndex = 0, currentIsCustom = false, gameMode = false;
const mainMenu = document.getElementById('mainMenu');
const levelSelect = document.getElementById('levelSelect');
const customLevelSelect = document.getElementById('customLevelSelect');
const gameUI = document.getElementById('gameUI');
const levelsContainer = document.getElementById('levelsContainer');
const customLevelsContainer = document.getElementById('customLevelsContainer');
const levelName = document.getElementById('levelName');
const winMsg = document.getElementById('winMsg');
const movesEl = document.getElementById('moves');
const settingsUI = document.getElementById('settingsUI');

function ShowMenu() { HideEverything(); mainMenu.style.display = 'block'; }
function ShowLevelSelect() { HideEverything(); levelSelect.style.display = 'block'; }
function ShowCustomLevelSelect() { HideEverything(); customLevelSelect.style.display = 'block' }
function ShowGame(fromEditor) {
    cameFromEditor = fromEditor;
    if (fromEditor) {
        document.getElementById('ButtonExit').style.display = 'none';
        document.getElementById('StopPlayTest').style.display = 'inline-block';
    } else {
        document.getElementById('ButtonExit').style.display = 'inline-block';
        document.getElementById('StopPlayTest').style.display = 'none';
    }
    HideEverything();
    gameMode = true;
    gameUI.style.display = 'block';
}
function ShowEditor() { HideEverything(); editorUI.style.display = 'block'; }
function ShowSettings() { HideEverything(); settingsUI.style.display = 'block'; }
function HideEverything() {
    gameMode = false;
    mainMenu.style.display = 'none';
    levelSelect.style.display = 'none';
    customLevelSelect.style.display = 'none';
    gameUI.style.display = 'none';
    editorUI.style.display = 'none';
    editorOpenSelect.style.display = 'none';
    settingsUI.style.display = 'none';
}

function loadLevel(index, isCustom = false) {
    currentLevelIndex = index;
    currentIsCustom = isCustom;
    const src = isCustom ? getCustomLevels()[index] : LEVELS[index];
    currentState = makeState(src);
    levelName.textContent = src.name;
    winMsg.textContent = '';
    movesEl.textContent = '0';
    DrawGrid(canvas, currentState);
    ShowGame(false);
}
function LoadNextLevel() {
    // hide win popups
    document.getElementById('youWinPopup').style.display = 'none';
    document.getElementById('playtestPopup').style.display = 'none';

    // pick level list
    const levelsList = currentIsCustom ? getCustomLevels() : LEVELS;

    // advance
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex >= levelsList.length) {
        if (currentIsCustom) {
            ShowCustomLevelSelect();
        } else {
            ShowLevelSelect();
        }
        return;
    }

    // load via your existing loader
    loadLevel(nextIndex, currentIsCustom);
}
function buildLevelButtons() {
    levelsContainer.innerHTML = '';
    LEVELS.forEach((lev, i) => {
        const b = document.createElement('button'); // changed from 'div' to 'button'
        b.className = 'levelButton';
        b.textContent = lev.name;
        b.onclick = () => loadLevel(i);
        levelsContainer.appendChild(b);
    });
}

function buildCustomLevelButtons() {
    customLevelsContainer.innerHTML = '';
    const arr = getCustomLevels();
    arr.forEach((lev, i) => {
        const b = document.createElement('button'); // changed from 'div' to 'button'
        b.className = 'levelButton';
        b.textContent = lev.name;
        b.onclick = () => loadLevel(i, true);
        customLevelsContainer.appendChild(b);
    });
}
function getCustomLevels() { return JSON.parse(localStorage.getItem('custom_levels') || '[]'); }
function setCustomLevels(arr) { localStorage.setItem('custom_levels', JSON.stringify(arr)); }


// --- Event wiring stock/custom ---

document.getElementById('themeColorPicker').addEventListener('input', (e) => { root.style.setProperty('--bg', e.target.value); });
document.getElementById('playStockButton').onclick = () => { buildLevelButtons(); ShowLevelSelect(); };
document.getElementById('playCustomButton').onclick = () => { buildCustomLevelButtons(); ShowCustomLevelSelect(); };
document.getElementById('backToMenu1').onclick = () => ShowMenu();
document.getElementById('backToMenu2').onclick = () => ShowMenu();
document.getElementById('ButtonRestart').onclick = () => RestartLevel();
document.getElementById('ButtonUndo').onclick = () => {
    if (!currentState) return;
    undo(currentState);
    movesEl.textContent = currentState.moves;
    DrawGrid(canvas, currentState);
};
document.getElementById('ButtonExit').onclick = () => { ShowMenu() };
document.getElementById('StopPlayTest').onclick = () => { ShowEditor() };
document.getElementById('settingsButton').onclick = () => { ShowSettings() };
document.getElementById('backFromSettingsButton').onclick = () => { ShowMenu(); };
// Shared replay handler (same as restart button)
document.getElementById("replayButton").onclick = () => {
    document.getElementById("youWinPopup").style.display = "none";
    RestartLevel();
};
document.getElementById("replayButtonEditor").onclick = () => {
    document.getElementById("playtestPopup").style.display = "none";
    RestartLevel();
};

// Next level
document.getElementById("nextLevelButton").onclick = () => {
    document.getElementById("youWinPopup").style.display = "none";
    LoadNextLevel(); // you'll need to implement this if not done yet
};

// Main menu
document.getElementById("mainMenuButton").onclick = () => {
    document.getElementById("youWinPopup").style.display = "none";
    ShowMenu()
};

// Return to editor
document.getElementById("returnToEditorButton").onclick = () => {
    document.getElementById("playtestPopup").style.display = "none";
    ShowEditor();
};



const confirmPopup = document.getElementById("confirmPopup");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

document.getElementById("clearStorageButton").onclick = () => {
    confirmPopup.style.display = "flex";
};

confirmYes.onclick = () => {
    localStorage.clear();
    confirmPopup.style.display = "none";
    alert("All progress and custom levels cleared");
};

confirmNo.onclick = () => {
    confirmPopup.style.display = "none";
};

function RestartLevel() {
    if (cameFromEditor) {
        const name = document.getElementById('levelNameInput').value.trim() || 'Untitled';
        const map = editorGrid.map(r => r.join(''));
        currentState = makeState({ name, map });
        levelName.textContent = name;
        movesEl.textContent = '0';
        winMsg.textContent = '';
        DrawGrid(canvas, currentState);
    } else {
        loadLevel(currentLevelIndex, currentIsCustom);
    }
}


// keyboard
window.addEventListener('keydown', e => {
    if (!gameMode) return;
    if (!currentState) return;
    let moved = false;
    if (['ArrowUp', 'w', 'W'].includes(e.key)) moved = tryMove(currentState, 0, -1);
    if (['ArrowDown', 's', 'S'].includes(e.key)) moved = tryMove(currentState, 0, 1);
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) moved = tryMove(currentState, -1, 0);
    if (['ArrowRight', 'd', 'D'].includes(e.key)) moved = tryMove(currentState, 1, 0);
    if (moved)(HandleWinCondition())
});
function HandleWinCondition()
{
    movesEl.textContent = currentState.moves;
    DrawGrid(canvas, currentState);

    if (checkWin(currentState)) {
        winMsg.textContent = 'Level complete!';
        setTimeout(() => {
            if (cameFromEditor) {
                // Show the playtest popup
                document.getElementById("playtestPopup").style.display = "flex";
            } else {
                // Show the normal win popup
                document.getElementById("youWinPopup").style.display = "flex";
            }
        }, 200);
    }
}

// --- Editor ---
function makeEditorState() {
    const crates = [], goals = [];
    let player = null;
    for (let y = 0; y < editorGrid.length; y++) {
        for (let x = 0; x < editorGrid[0].length; x++) {
            const t = editorGrid[y][x];
            if (t === '$') crates.push({ x, y });
            if (t === '.') goals.push({ x, y });
            if (t === '@') player = { x, y };
        }
    }
    return {
        grid: editorGrid,
        h: editorGrid.length,
        w: editorGrid[0].length,
        crates,
        goals,
        player
    };
}

const editorUI = document.getElementById('editorUI');
const editorCanvas = document.getElementById('editorCanvas');
const ectx = editorCanvas.getContext('2d');
const TILE_TYPES = { 'Wall': '#', 'Floor': ' ', 'Goal': '.', 'Crate': '$', 'Player': '@' };
let selectedTile = '#';
let editorGrid = Array.from({ length: 10 }, () => Array(10).fill(' '));
// function drawEditor(){const size=64;editorCanvas.width=size*10;editorCanvas.height=size*10;
//   for(let y=0;y<10;y++){for(let x=0;x<10;x++){ectx.fillStyle='#071627';ectx.fillRect(x*size,y*size,size,size);ectx.fillStyle='#0f172a';ectx.fillRect(x*size+4,y*size+4,size-8,size-8);
//     const t=editorGrid[y][x];if(t==='#'){ectx.fillStyle='#888';ectx.fillRect(x*size+6,y*size+6,size-12,size-12);}
//     if(t==='.') {ectx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--goal');ectx.beginPath();ectx.arc(x*size+size/2,y*size+size/2,size*0.16,0,Math.PI*2);ectx.fill();}
//     if(t==='$'){ectx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--crate');ectx.fillRect(x*size+10,y*size+10,size-20,size-20);}
//     if(t==='@'){ectx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--player');ectx.beginPath();ectx.arc(x*size+size/2,y*size+size/2,size*0.18,0,Math.PI*2);ectx.fill();}
//   }}}
function setTileSelector() {
    const ts = document.getElementById('tileSelector'); ts.innerHTML = '';
    Object.entries(TILE_TYPES).forEach(([name, char]) => {
        const b = document.createElement('div');
        b.className = 'tileButton'; b.textContent = name;
        if (char === selectedTile) b.classList.add('active');
        b.onclick = () => {
            selectedTile = char;
            setTileSelector();
        };
        ts.appendChild(b);
    });
}
function DownloadLevel() {
    const name = document.getElementById('levelNameInput').value.trim();
    if (!name) return alert('Please enter a level name to export.');

    // Build the level object
    const level = {
        name: name,
        map: editorGrid.map(row => row.join(''))
    };

    // Create a blob with the JSON content
    const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' });

    // Generate a temporary URL and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Level "${name}" exported!`);
}

editorCanvas.onclick = (e) => {
    let changes = [];
    const rect = editorCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 64);
    const y = Math.floor((e.clientY - rect.top) / 64);
    // If the selected tile is a player, remove any other players first.
    if (selectedTile === '@') {
        for (let row = 0; row < editorGrid.length; row++) {
            for (let col = 0; col < editorGrid[row].length; col++) {
                if (editorGrid[row][col] === '@')
                {
                    changes.push({ x: col, y: row, prev: '@', next: ' ' });
                    editorGrid[row][col] = ' '; // Replace old player with floor
                }
            }
        }
    }


    // Place the new tile at the clicked position.
    changes.push({ x, y, prev: editorGrid[y][x], next: selectedTile });

    if (changes.length > 0)
    {
        commitEditorChange(changes);
    }
    editorGrid[y][x] = selectedTile;

    DrawGrid(editorCanvas, makeEditorState());
    hasUnsavedChanges = true;

    // localStorage.setItem('editor_cache', JSON.stringify({
    //   name: document.getElementById('levelNameInput').value.trim(),
    //   map: editorGrid.map(r => r.join(''))
    // }));
};
let undoStack = [];
let redoStack = [];
function clearEditorHistory() {
    undoStack = [];
    redoStack = [];
}

function commitEditorChange(changes) {
    undoStack.push({ changes });
    redoStack = []; // clear redo history
}

function undoEditor() {
    if (!undoStack.length) return;
    const tx = undoStack.pop();
    tx.changes.forEach(c => {
        editorGrid[c.y][c.x] = c.prev;
    });
    redoStack.push(tx);
    DrawGrid(editorCanvas, makeEditorState());
}

function redoEditor() {
    if (!redoStack.length) return;
    const tx = redoStack.pop();
    tx.changes.forEach(c => {
        editorGrid[c.y][c.x] = c.next;
    });
    undoStack.push(tx);
    DrawGrid(editorCanvas, makeEditorState());
}
window.addEventListener('keydown', e => {
    if (gameMode) return; // editor only

    if (e.ctrlKey && e.key === 'z')
    {

        undoEditor();
        e.preventDefault();
    }
    if (e.ctrlKey && e.key === 'y') {
        redoEditor();
        e.preventDefault();
    }
});

document.getElementById('editorButton').onclick = () => {
    // const cache = JSON.parse(localStorage.getItem('editor_cache') || 'null');
    // if (cache)
    // {
    //   editorGrid = cache.map.map(r => r.split(''));
    //   document.getElementById('levelNameInput').value = cache.name;
    // } else
    // {
    //   editorGrid = Array.from({ length: 10 }, () => Array(10).fill(' '));
    //   document.getElementById('levelNameInput').value = '';
    // }

    selectedTile = '#';
    setTileSelector();

    DrawGrid(editorCanvas, makeEditorState());
    ShowEditor();
};

document.getElementById('backFromEditorButton').onclick = () => ShowMenu();
document.getElementById('savelevelButton').onclick = () => {
    const name = document.getElementById('levelNameInput').value.trim();
    if (!name) return alert('Enter name');
    const map = editorGrid.map(r => r.join(''));
    let arr = getCustomLevels();
    const idx = arr.findIndex(l => l.name === name);
    if (idx >= 0) arr[idx] = { name, map };
    else arr.push({ name, map });
    setCustomLevels(arr);
    alert('Saved');
    hasUnsavedChanges = false;
};

// --- Editor open select screen ---
const editorOpenSelect = document.getElementById('editorOpenSelect');
const editorOpenLevelsContainer = document.getElementById('editorOpenLevelsContainer');
document.getElementById('openlevelButton').onclick = () =>
{
    clearEditorHistory();
    buildEditorOpenButtons();
    editorUI.style.display = 'none';
    editorOpenSelect.style.display = 'block';
};
document.getElementById('backToEditorButton').onclick = () => { editorOpenSelect.style.display = 'none'; editorUI.style.display = 'block'; };
function buildEditorOpenButtons() {
    editorOpenLevelsContainer.innerHTML = '';
    const arr = getCustomLevels();
    arr.forEach((lev) => {
        const b = document.createElement('button');  // changed from 'div' to 'button'
        b.className = 'levelButton';
        b.textContent = lev.name;

        b.onclick = () => {
            editorGrid = lev.map.map(r => r.split(''));
            document.getElementById('levelNameInput').value = lev.name;

            DrawGrid(editorCanvas, makeEditorState());
            editorOpenSelect.style.display = 'none';
            editorUI.style.display = 'block';
        };

        editorOpenLevelsContainer.appendChild(b);
    });
}

document.getElementById('downloadLevelButton').onclick = () => {
    DownloadLevel();
}
document.getElementById('deletelevelButton').onclick = () => {
    const name = document.getElementById('levelNameInput').value.trim();
    if (!name) return;
    let arr = getCustomLevels();
    arr = arr.filter(l => l.name !== name);
    setCustomLevels(arr);
    alert('Deleted');

    // wipe editor
    editorGrid = Array.from({ length: 10 }, () => Array(10).fill(' '));
    document.getElementById('levelNameInput').value = "";

    DrawGrid(editorCanvas, makeEditorState());

};
document.getElementById('playTestButton').onclick = () => {
    const name = document.getElementById('levelNameInput').value.trim() || 'Untitled';
    const map = editorGrid.map(r => r.join(''));
    currentState = makeState({ name, map });
    levelName.textContent = name;
    movesEl.textContent = '0';
    winMsg.textContent = '';
    DrawGrid(canvas, currentState);
    ShowGame(true);
    currentIsCustom = false;
};

// start menu
ShowMenu();