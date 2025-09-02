// ------------------- Variables -------------------
var volume = 1;
var muted = false;
var stepDelay = 100;
var themeColor = "#071627";
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
        document.documentElement.style.setProperty("--bg", themeColor);
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
            document.documentElement.style.setProperty("--bg", themeColor);
            localStorage.setItem("theme_color", JSON.stringify(themeColor));
        });
    }

    // Auto-move
    var autoMoveCheckbox = document.getElementById("autoMoveCheckbox");
    if (autoMoveCheckbox) {
        autoMoveCheckbox.checked = autoMove;
        autoMoveCheckbox.addEventListener("change", function (e) {
            autoMove = e.target.checked;
            localStorage.setItem("autoMove", JSON.stringify(autoMove));
        });
    }
}
