// ABOUTME: Popup script for the Recall extension toolbar popup.
// ABOUTME: Renders snapshot list and handles user actions (save, restore, delete, export).

import browser from "webextension-polyfill";
import { snapshotToMarkdown, generateFilename } from "../lib/export.js";

const snapshotListEl = document.getElementById("snapshot-list");
const emptyStateEl = document.getElementById("empty-state");
const saveBtnEl = document.getElementById("save-btn");
const settingsBtnEl = document.getElementById("settings-btn");

/**
 * Gets the current active tab.
 */
async function getCurrentTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Formats a timestamp for display in the snapshot card.
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Renders a single snapshot card.
 */
function renderSnapshotCard(snapshot) {
  const card = document.createElement("div");
  card.className = "snapshot-card";

  const badgeClass =
    snapshot.source === "auto"
      ? "snapshot-card__badge--auto"
      : "snapshot-card__badge--manual";

  card.innerHTML = `
    <div class="snapshot-card__header">
      <span class="snapshot-card__time">${formatTime(snapshot.timestamp)}</span>
      <span class="snapshot-card__badge ${badgeClass}">${snapshot.source}</span>
    </div>
    <div class="snapshot-card__fields">${snapshot.fields.length} field(s)</div>
    <div class="snapshot-card__actions">
      <button class="snapshot-card__action snapshot-card__action--restore" data-action="restore">Restore</button>
      <button class="snapshot-card__action snapshot-card__action--export" data-action="export">Export</button>
      <button class="snapshot-card__action snapshot-card__action--delete" data-action="delete">Delete</button>
    </div>
  `;

  // Restore action
  card.querySelector('[data-action="restore"]').addEventListener("click", async () => {
    const tab = await getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: "restore",
      payload: { snapshot },
    });
    window.close();
  });

  // Export action
  card.querySelector('[data-action="export"]').addEventListener("click", () => {
    const markdown = snapshotToMarkdown(snapshot);
    const filename = generateFilename(snapshot);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Delete action
  card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    const tab = await getCurrentTab();
    await browser.runtime.sendMessage({
      action: "deleteSnapshot",
      payload: { url: tab.url, snapshotId: snapshot.id, tabId: tab.id },
    });
    await loadSnapshots();
  });

  return card;
}

/**
 * Loads and renders snapshots for the current page.
 */
async function loadSnapshots() {
  const tab = await getCurrentTab();
  const snapshots = await browser.runtime.sendMessage({
    action: "getSnapshots",
    payload: { url: tab.url },
  });

  snapshotListEl.innerHTML = "";

  if (!snapshots || snapshots.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  // Show most recent first
  const sorted = [...snapshots].sort((a, b) => b.timestamp - a.timestamp);
  for (const snapshot of sorted) {
    snapshotListEl.appendChild(renderSnapshotCard(snapshot));
  }
}

// Save button: capture current form
saveBtnEl.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  const result = await browser.tabs.sendMessage(tab.id, { action: "capture" });

  if (result && result.success === false) {
    saveBtnEl.textContent = result.reason || "No fields found";
    setTimeout(() => {
      saveBtnEl.textContent = "Save Current Form";
    }, 2000);
    return;
  }

  await loadSnapshots();
});

// Settings button: open options page
settingsBtnEl.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

// Load snapshots on popup open
loadSnapshots();
