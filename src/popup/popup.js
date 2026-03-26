// ABOUTME: Popup script for the Recall extension toolbar popup.
// ABOUTME: Renders snapshot list and handles user actions (save, restore, delete, export).

import browser from "webextension-polyfill";
import { snapshotToMarkdown, generateFilename } from "../lib/export.js";

const snapshotListEl = document.getElementById("snapshot-list");
const emptyStateEl = document.getElementById("empty-state");
const saveBtnEl = document.getElementById("save-btn");
const settingsBtnEl = document.getElementById("settings-btn");
const viewAllBtnEl = document.getElementById("view-all-btn");

let viewingAll = false;

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
 * Truncates a URL for display purposes.
 */
function truncateUrl(url, maxLength = 40) {
  if (url.length <= maxLength) {
    return url;
  }
  return url.substring(0, maxLength) + "...";
}

/**
 * Renders a single snapshot card.
 * When showUrl is true, displays the URL the snapshot belongs to.
 */
function renderSnapshotCard(snapshot, { showUrl = false } = {}) {
  const card = document.createElement("div");
  card.className = "snapshot-card";

  const badgeClass =
    snapshot.source === "auto"
      ? "snapshot-card__badge--auto"
      : "snapshot-card__badge--manual";

  const urlHtml = showUrl
    ? `<div class="snapshot-card__url" title="${snapshot.url}">${truncateUrl(snapshot.url)}</div>`
    : "";

  card.innerHTML = `
    ${urlHtml}
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
    await browser.runtime.sendMessage({
      action: "deleteSnapshot",
      payload: { url: snapshot.url, snapshotId: snapshot.id },
    });
    if (viewingAll) {
      await loadAllSnapshots();
    } else {
      await loadSnapshots();
    }
  });

  return card;
}

/**
 * Loads and renders snapshots for the current page.
 */
async function loadSnapshots() {
  viewingAll = false;
  viewAllBtnEl.classList.remove("header__btn--active");
  saveBtnEl.hidden = false;

  const tab = await getCurrentTab();
  const snapshots = await browser.runtime.sendMessage({
    action: "getSnapshots",
    payload: { url: tab.url },
  });

  snapshotListEl.innerHTML = "";

  if (!snapshots || snapshots.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.querySelector("p").textContent = "No saved snapshots for this page.";
    return;
  }

  emptyStateEl.hidden = true;

  // Show most recent first
  const sorted = [...snapshots].sort((a, b) => b.timestamp - a.timestamp);
  for (const snapshot of sorted) {
    snapshotListEl.appendChild(renderSnapshotCard(snapshot));
  }
}

/**
 * Loads and renders all snapshots across all URLs.
 */
async function loadAllSnapshots() {
  viewingAll = true;
  viewAllBtnEl.classList.add("header__btn--active");
  saveBtnEl.hidden = true;

  const allSnapshots = await browser.runtime.sendMessage({
    action: "getAllSnapshots",
    payload: {},
  });

  snapshotListEl.innerHTML = "";

  // Flatten all snapshots from all URLs into a single array
  const flatSnapshots = [];
  for (const [url, snapshots] of Object.entries(allSnapshots)) {
    for (const snapshot of snapshots) {
      flatSnapshots.push({ ...snapshot, url });
    }
  }

  if (flatSnapshots.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.querySelector("p").textContent = "No saved snapshots anywhere.";
    return;
  }

  emptyStateEl.hidden = true;

  // Show most recent first, with URL visible
  const sorted = flatSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  for (const snapshot of sorted) {
    snapshotListEl.appendChild(renderSnapshotCard(snapshot, { showUrl: true }));
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

// View all button: toggle between current page and all pages
viewAllBtnEl.addEventListener("click", () => {
  if (viewingAll) {
    loadSnapshots();
  } else {
    loadAllSnapshots();
  }
});

// Settings button: open options page
settingsBtnEl.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

// Load snapshots on popup open
loadSnapshots();
