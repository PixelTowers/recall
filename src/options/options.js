// ABOUTME: Options page script for the Recall extension settings.
// ABOUTME: Manages auto-save toggle, interval configuration, and persistence.

import browser from "webextension-polyfill";

const autoSaveToggle = document.getElementById("auto-save-toggle");
const autoSaveInterval = document.getElementById("auto-save-interval");
const intervalSetting = document.getElementById("interval-setting");
const saveFeedback = document.getElementById("save-feedback");

let feedbackTimeout = null;

/**
 * Shows a brief "Settings saved" confirmation message.
 */
function showFeedback() {
  saveFeedback.hidden = false;
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout);
  }
  feedbackTimeout = setTimeout(() => {
    saveFeedback.hidden = true;
  }, 1500);
}

/**
 * Updates the interval input's disabled state based on the toggle.
 */
function updateIntervalState() {
  autoSaveInterval.disabled = !autoSaveToggle.checked;
}

/**
 * Saves the current settings to storage via the background worker.
 */
async function saveSettings() {
  const interval = parseInt(autoSaveInterval.value, 10);
  const clampedInterval = Math.min(300, Math.max(10, interval || 30));
  autoSaveInterval.value = clampedInterval;

  await browser.runtime.sendMessage({
    action: "saveSettings",
    payload: {
      settings: {
        autoSave: autoSaveToggle.checked,
        autoSaveInterval: clampedInterval,
      },
    },
  });

  showFeedback();
}

/**
 * Loads settings from storage and populates the form controls.
 */
async function loadSettings() {
  const settings = await browser.runtime.sendMessage({
    action: "getSettings",
    payload: {},
  });

  autoSaveToggle.checked = settings.autoSave;
  autoSaveInterval.value = settings.autoSaveInterval;
  updateIntervalState();
}

// Save on change
autoSaveToggle.addEventListener("change", () => {
  updateIntervalState();
  saveSettings();
});

autoSaveInterval.addEventListener("change", () => {
  saveSettings();
});

/**
 * Initializes the footer emoji cycling animation.
 */
function initFooterEmoji() {
  const emojiEl = document.querySelector('[data-footer-emoji]');
  if (emojiEl) {
    const emojis = ['\u2764\uFE0F', '\u2615', '\u{1F950}', '\u{1F4AA}', '\u{1F370}', '\u{1F3B5}', '\u{1F33B}', '\u{1F436}'];
    let idx = 0;
    setInterval(() => {
      emojiEl.classList.add('swapping');
      setTimeout(() => {
        idx = (idx + 1) % emojis.length;
        emojiEl.textContent = emojis[idx];
        emojiEl.classList.remove('swapping');
      }, 250);
    }, 2000);
  }
}

// Load settings on page open
loadSettings();
initFooterEmoji();
