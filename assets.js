// assets.js

// --- Images ---
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const wallImage = loadImage('images/wall.png');
const crateImage = loadImage('images/crate.png');
const characterImage = loadImage('images/character_ghost.png');
const goalImage = loadImage('images/goal.png');
const sock1Image = loadImage('images/sock1.png');
const sock2Image = loadImage('images/sock2.png');

// --- Audio ---
function loadAudio(src) {
    return new Audio(src);
}

const pushSound = loadAudio('sounds/push.wav');
const progressSound = loadAudio('sounds/progress.wav');
const regressSound = loadAudio('sounds/regress.wav');
const victorySound = loadAudio('sounds/victory.mp3');

// --- Play sound helper (kept for existing code) ---
function PlaySound(audio) {
    audio.volume = audioSettings.muted ? 0 : audioSettings.volume;
    audio.play();
}
