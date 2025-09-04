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
function ProcessDocumentColors(newThemeColor) {
    // Set panel to theme color directly
    document.documentElement.style.setProperty("--panel", newThemeColor);

    // Remove leading # if present
    newThemeColor = newThemeColor.replace(/^#/, '');
    if (newThemeColor.length !== 6) throw new Error('Invalid hex color');

    // Parse RGB (0-255)
    let r = parseInt(newThemeColor.slice(0, 2), 16) / 255;
    let g = parseInt(newThemeColor.slice(2, 4), 16) / 255;
    let b = parseInt(newThemeColor.slice(4, 6), 16) / 255;

    const avgLightness = (r + g + b) / 3;
    document.documentElement.style.setProperty("--text", avgLightness > 0.5 ? '#000000' : '#ffffff');
    document.documentElement.style.setProperty("--bg", '#8a8a8aff');

    // Attempts to create small amounts of constrasting color value or lightness didn't look as good as I hoped it would across all possible theme colors.
    // With lots of experimentation, I might get it to feel right, but for the sake of time, I've opted for a simpler aproach.
    // HSV feels a little better than HSL, but perhaps the key is shifting the hue in the direction towards trhe closest secondary colour instead of a unniform shift. I haven't tried this aproach yet, so it's worth trying some time.
    // I also attempted to use OKLab / OKLCH but had some wild unexpected results. This aproach is also worth trying again some time, for no other reason but to see how it feels when it actually works.

    // // --- RGB to HSV ---
    // const max = Math.max(r, g, b);
    // const min = Math.min(r, g, b);
    // let h, s, v = max; // value = max of RGB

    // const d = max - min;
    // s = max === 0 ? 0 : d / max;

    // if (d === 0) {
    //     h = 0; // gray
    // } else {
    //     switch (max) {
    //         case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    //         case g: h = (b - r) / d + 2; break;
    //         case b: h = (r - g) / d + 4; break;
    //     }
    //     h /= 6;
    // }

    // // --- Adjust brightness (V) for background ---
    // if (v > 0.5) {
    //     v = Math.max(0.2, v - 0.2);
    // } else {
    //     v = Math.min(0.8, v + 0.2);
    // }
    // h=(h+0.04) % 1;

    // // HSV → RGB for background
    // function hsv2rgb(h, s, v) {
    //     let r, g, b;
    //     const i = Math.floor(h * 6);
    //     const f = h * 6 - i;
    //     const p = v * (1 - s);
    //     const q = v * (1 - f * s);
    //     const t = v * (1 - (1 - f) * s);

    //     switch (i % 6) {
    //         case 0: r = v; g = t; b = p; break;
    //         case 1: r = q; g = v; b = p; break;
    //         case 2: r = p; g = v; b = t; break;
    //         case 3: r = p; g = q; b = v; break;
    //         case 4: r = t; g = p; b = v; break;
    //         case 5: r = v; g = p; b = q; break;
    //     }
    //     return [r, g, b];
    // }

    // const [r2, g2, b2] = hsv2rgb(h, s, v);

    // // Convert to hex
    // const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
    // const bgColor = '#' + toHex(r2) + toHex(g2) + toHex(b2);
    // document.documentElement.style.setProperty("--bg", bgColor);


}


