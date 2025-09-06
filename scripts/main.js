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
    ctx.imageSmoothingEnabled = false;
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
function tryMove(s, dx, dy)
{
    const nx = s.player.x + dx, ny = s.player.y + dy;
    if (isWall(s, nx, ny)) return false;
    const c = crateAt(s, nx, ny);
    if (!c)
    {
        pushHistory(s); s.player.x = nx;
        s.player.y = ny; s.moves++;
        return true;
    }
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

function loadLevel(index, pack = LEVELS) {
    currentLevelIndex = index;
    currentPack = pack;
    currentIsCustom = pack.isCustom;

    const src = pack.levels[index];
    currentState = makeState(src);

    levelName.textContent = src.name;
    winMsg.textContent = '';
    movesEl.textContent = '0';

    DrawGrid(canvas, currentState);
    ShowGame(false);
}
function updateNextLevelButton() {
    const nextBtn = document.getElementById('nextLevelButton');
    if (!currentPack) return;

    const nextIndex = currentLevelIndex + 1;

    if (nextIndex >= currentPack.levels.length) {
        // No more levels in the current pack
        if (currentPack === TUTORIAL_LEVELS) {
            // Tutorial finished → start main levels
            nextBtn.style.display = 'inline-block';
            nextBtn.textContent = "🎯 Start Main Levels";
        } else {
            // Other packs → hide button
            nextBtn.style.display = 'none';
        }
    } else {
        // More levels → show normal "Next Level"
        nextBtn.style.display = 'inline-block';
        nextBtn.textContent = "➡️ Next Level";
    }
}


function LoadNextLevel() {
    // hide win popups
    document.getElementById('darkOverlay').style.display = 'none';
    document.getElementById('youWinPopup').style.display = 'none';
    document.getElementById('playtestPopup').style.display = 'none';

    // get current pack
    const pack = currentPack || LEVELS;

    // advance
    const nextIndex = currentLevelIndex + 1;

    if (nextIndex >= pack.levels.length) {
        if (pack === TUTORIAL_LEVELS) {
            // Tutorial finished → start main levels
            loadLevel(0, LEVELS);
        } else if (pack.isCustom) {
            ShowCustomLevelSelect();
        } else {
            ShowLevelSelect();
        }
        return;
    }

    // load next level in the same pack
    loadLevel(nextIndex, pack);
}


function buildLevelButtons() {
    // Tutorial buttons
    tutorialsContainer.innerHTML = '';
    TUTORIAL_LEVELS.levels.forEach((lev, i) => {
        const b = document.createElement('button');
        b.className = 'levelButton';
        b.textContent = lev.name;
        b.onclick = () => loadLevel(i, TUTORIAL_LEVELS);
        tutorialsContainer.appendChild(b);
    });

    // Main levels buttons
    levelsContainer.innerHTML = '';
    LEVELS.levels.forEach((lev, i) => {
        const b = document.createElement('button');
        b.className = 'levelButton';
        b.textContent = lev.name;
        b.onclick = () => loadLevel(i, LEVELS);
        levelsContainer.appendChild(b);
    });
}


function buildCustomLevelButtons() {
    customLevelsContainer.innerHTML = '';

    const levels = JSON.parse(localStorage.getItem('custom_levels') || '[]');
    const customPack = {
        levels,
        isCustom: true,
        name: "Custom Levels"
    };

    levels.forEach((lev, i) => {
        const b = document.createElement('button');
        b.className = 'levelButton';
        b.textContent = lev.name;
        b.onclick = () => loadLevel(i, customPack);
        customLevelsContainer.appendChild(b);
    });
}

function getCustomLevels() {
    return JSON.parse(localStorage.getItem('custom_levels') || '[]');
}

function setCustomLevels(arr) {
    localStorage.setItem('custom_levels', JSON.stringify(arr));
}



// --- Event wiring stock/custom ---
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
    document.getElementById('darkOverlay').style.display = 'none';
    document.getElementById("youWinPopup").style.display = "none";
    RestartLevel();
};
document.getElementById("replayButtonEditor").onclick = () => {
    document.getElementById('darkOverlay').style.display = 'none';
    document.getElementById("playtestPopup").style.display = "none";
    RestartLevel();
};

// Next level
document.getElementById("nextLevelButton").onclick = () => {
    document.getElementById('darkOverlay').style.display = 'none';
    document.getElementById("youWinPopup").style.display = "none";
    LoadNextLevel();
};

// Main menu
document.getElementById("mainMenuButton").onclick = () => {
    document.getElementById('darkOverlay').style.display = 'none';
    document.getElementById("youWinPopup").style.display = "none";
    ShowMenu()
};

// Return to editor
document.getElementById("returnToEditorButton").onclick = () => {
    document.getElementById('darkOverlay').style.display = 'none';
    document.getElementById("playtestPopup").style.display = "none";
    ShowEditor();
};

function handleMove(dx, dy) {
    if (!gameMode || !currentState) return;
    stopMove();
    if (tryMove(currentState, dx, dy)) HandleWinCondition();
}

// document.getElementById('btnUp').addEventListener('touchstart', () => handleMove(0, -1));
// document.getElementById('btnDown').addEventListener('touchstart', () => handleMove(0, 1));
// document.getElementById('btnLeft').addEventListener('touchstart', () => handleMove(-1, 0));
// document.getElementById('btnRight').addEventListener('touchstart', () => handleMove(1, 0));

const confirmPopup = document.getElementById("confirmPopup");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

document.getElementById("clearStorageButton").onclick = () => {
    document.getElementById('darkOverlay').style.display = 'flex';
    confirmPopup.style.display = "flex";
};

confirmYes.onclick = () => {
    localStorage.clear();
        document.getElementById('darkOverlay').style.display = 'none';
    confirmPopup.style.display = "none";
    alert("All progress and custom levels cleared");
};

confirmNo.onclick = () => {
    
    document.getElementById('darkOverlay').style.display = 'none';
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
        loadLevel(currentLevelIndex, currentPack);
    }
}

// Touch Swipe - It works, but Commented out because it conficts with refresh, and click controls works for touch anyway.
// let startX, startY;
// window.addEventListener("touchstart", e => {
//     console.log("touch start");
//   const t = e.touches[0];
//   startX = t.clientX;
//   startY = t.clientY;
// });
// window.addEventListener("touchend", e => {
//     if (!gameMode) return;
//     if (!currentState) return;
//     let moved = false;
//     const t = e.changedTouches[0];
//     const dx = t.clientX - startX;
//     const dy = t.clientY - startY;
//     if (Math.abs(dx) > Math.abs(dy)) {
//         if (dx > 30) moved = tryMove(currentState, 1,0); else if (dx < -30) moved = tryMove(currentState, -1,0);
//     } else {
//         if (dy > 30) moved = tryMove(currentState, 0,1); else if (dy < -30) moved = tryMove(currentState, 0,-1);
//     }
//     if (moved)(HandleWinCondition())
// });
//mouse

var moveIntervalId = null;

canvas.onclick = e => {
    if (!gameMode || !currentState) return;

    if (moveIntervalId !== null) {
        clearInterval(moveIntervalId);
    }

    const rect = canvas.getBoundingClientRect();
    const targetX = Math.floor((e.clientX - rect.left) / tileSize);
    const targetY = Math.floor((e.clientY - rect.top) / tileSize);

    moveIntervalId = setInterval(() => {
        if (!currentState) return stopMove();

        const dx = targetX - currentState.player.x;
        const dy = targetY - currentState.player.y;

        if (dx === 0 && dy === 0) return stopMove();

        // try move on the primary access || then try move on the secondary axis.
        if (Math.abs(dx) >= Math.abs(dy)) {
            moved = tryMove(currentState, dx > 0 ? 1 : -1, 0) || (dy !== 0 && tryMove(currentState, 0, dy > 0 ? 1 : -1)); }
        else {
            moved = tryMove(currentState, 0, dy > 0 ? 1 : -1) || (dx !== 0 && tryMove(currentState, dx > 0 ? 1 : -1, 0)); }

        if (!moved) return stopMove();

        HandleWinCondition();
    }, stepDelay);

};
function stopMove() {
    clearInterval(moveIntervalId);
    moveIntervalId = null;
}


// keyboard
window.addEventListener('keydown', e => {
    if (!gameMode) return;
    if (!currentState) return;
    let moved = false;
    if (['ArrowUp', 'w', 'W'].includes(e.key)) moved = handleMove(0, -1);
    if (['ArrowDown', 's', 'S'].includes(e.key)) moved = handleMove(0, 1);
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) moved = handleMove(-1, 0);
    if (['ArrowRight', 'd', 'D'].includes(e.key)) moved = handleMove(1, 0);
    if (moved)(HandleWinCondition())
});
function HandleWinCondition()
{
    updateNextLevelButton();
    movesEl.textContent = currentState.moves;
    DrawGrid(canvas, currentState);

    if (checkWin(currentState)) {

        winMsg.textContent = 'Level complete!';
        setTimeout(() => {
            if (cameFromEditor) {
                // Show the playtest popup
                document.getElementById('darkOverlay').style.display = 'flex';
                document.getElementById("playtestPopup").style.display = "flex";
            } else {
                // Show the normal win popup
                document.getElementById('darkOverlay').style.display = 'flex';
                document.getElementById("youWinPopup").style.display = "flex";
            }
            triggerConfetti();
            PlaySound(victorySound);
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


// start menu
ShowMenu();