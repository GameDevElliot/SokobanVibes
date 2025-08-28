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
        const b = document.createElement('div');
        b.className = 'levelButton'; b.textContent = lev.name;
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