// ------------------- Variables -------------------
var volume = 1;
var muted = false;
var stepDelay = 100;
var themeColor = "#071627";
var panelColor = "#0077ffff";
var autoMove = false;

// ------------------- Init -------------------
loadSettings();
hookUpSettingsUI();

// ------------------- Load Settings -------------------
function loadSettings() {
    var savedVolume = parseFloat(localStorage.getItem("volume"));
    if (!isNaN(savedVolume)) volume = savedVolume;

    var savedMuted = localStorage.getItem("muted");
    if (savedMuted !== null) muted = JSON.parse(savedMuted);

    var savedDelay = parseInt(localStorage.getItem("stepDelay"), 10);
    if (!isNaN(savedDelay)) stepDelay = savedDelay;

    var savedColor = localStorage.getItem("theme_color");
    if (savedColor) {
        themeColor = JSON.parse(savedColor);
        ProcessDocumentColors(themeColor);
    }

    var savedAuto = localStorage.getItem("autoMove");
    if (savedAuto !== null) autoMove = JSON.parse(savedAuto);
}

// ------------------- Hook Up UI -------------------
function hookUpSettingsUI() {
    // Volume + mute
    var volumeSlider = document.getElementById("volumeSlider");
    var muteCheckbox = document.getElementById("muteCheckbox");

    if (volumeSlider) {
        volumeSlider.value = volume;
        volumeSlider.addEventListener("input", function (e) {
            volume = parseFloat(e.target.value);
            localStorage.setItem("volume", volume);
        });
    }

    if (muteCheckbox) {
        muteCheckbox.checked = muted;
        muteCheckbox.addEventListener("change", function (e) {
            muted = e.target.checked;
            localStorage.setItem("muted", JSON.stringify(muted));
        });
    }

    // Step delay
    var clickStepIntervalInput = document.getElementById("clickStepInterval");
    var clickStepValue = document.getElementById("clickStepValue");

    if (clickStepIntervalInput && clickStepValue) {
        clickStepIntervalInput.value = stepDelay;
        clickStepValue.textContent = stepDelay + "ms";

        clickStepIntervalInput.addEventListener("input", function () {
            stepDelay = parseInt(clickStepIntervalInput.value, 10) || 100;
            clickStepValue.textContent = stepDelay + "ms";
            localStorage.setItem("stepDelay", stepDelay);
        });
    }

    // Theme color
    var colorPicker = document.getElementById("themeColorPicker");
    if (colorPicker) {
        colorPicker.value = themeColor;
        colorPicker.addEventListener("input", function (e) {
            themeColor = e.target.value;
            ProcessDocumentColors(themeColor);
            localStorage.setItem("theme_color", JSON.stringify(themeColor));
        });
    }
  
}


// ------------------- Helper Functions -------------------
function ProcessDocumentColors(newThemeColor)
{
    document.documentElement.style.setProperty("--bg", newThemeColor);
    // Remove leading # if present
    newThemeColor = newThemeColor.replace(/^#/, '');
    if (newThemeColor.length !== 6) throw new Error('Invalid hex color');

    // Parse RGB (0-255)
    let r = parseInt(newThemeColor.slice(0, 2), 16) / 255;
    let g = parseInt(newThemeColor.slice(2, 4), 16) / 255;
    let b = parseInt(newThemeColor.slice(4, 6), 16) / 255;

    // --- RGB to HSL ---
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // gray
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // --- Adjust lightness ---
    if (l < 0.5) {
        l = Math.min(0.8, l + 0.5);
    } else {
        l = Math.max(0.2, l - 0.5);
    }
    document.documentElement.style.setProperty("--text",l>0.5?  '#000000' : '#ffffff');
    // --- HSL to RGB ---
    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    let r2, g2, b2;
    if (s === 0) {
        r2 = g2 = b2 = l; // gray
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r2 = hue2rgb(p, q, h + 1/3);
        g2 = hue2rgb(p, q, h);
        b2 = hue2rgb(p, q, h - 1/3);
    }

    // Back to hex
    const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
    const newPanelColor = '#' + toHex(r2) + toHex(g2) + toHex(b2);
    document.documentElement.style.setProperty("--panel",newPanelColor);
}