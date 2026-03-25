// ABOUTME: Shared storage helpers for reading and writing snapshots and settings.
// ABOUTME: Provides the data layer used by background, content script, and popup.

import browser from "webextension-polyfill";

const SNAPSHOTS_KEY = "recall_snapshots";
const SETTINGS_KEY = "recall_settings";

const DEFAULT_SETTINGS = {
  autoSave: false,
  autoSaveInterval: 30,
};

/**
 * Strips query parameters and hash from a URL, returning origin + pathname.
 */
export function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}

/**
 * Returns all snapshots organized by normalized URL.
 */
export async function getAllSnapshots() {
  const result = await browser.storage.local.get(SNAPSHOTS_KEY);
  return result[SNAPSHOTS_KEY] || {};
}

/**
 * Returns the array of snapshots for a given URL.
 */
export async function getSnapshots(url) {
  const all = await getAllSnapshots();
  const normalized = normalizeUrl(url);
  return all[normalized] || [];
}

/**
 * Appends a snapshot under its normalized URL.
 */
export async function saveSnapshot(snapshot) {
  const all = await getAllSnapshots();
  const normalized = normalizeUrl(snapshot.url);

  if (!all[normalized]) {
    all[normalized] = [];
  }

  all[normalized].push(snapshot);
  await browser.storage.local.set({ [SNAPSHOTS_KEY]: all });
}

/**
 * Removes a snapshot by ID from the given URL's snapshot list.
 * Returns true if a snapshot was removed, false otherwise.
 */
export async function deleteSnapshot(url, snapshotId) {
  const all = await getAllSnapshots();
  const normalized = normalizeUrl(url);
  const snapshots = all[normalized];

  if (!snapshots) {
    return false;
  }

  const index = snapshots.findIndex((s) => s.id === snapshotId);
  if (index === -1) {
    return false;
  }

  snapshots.splice(index, 1);

  if (snapshots.length === 0) {
    delete all[normalized];
  } else {
    all[normalized] = snapshots;
  }

  await browser.storage.local.set({ [SNAPSHOTS_KEY]: all });
  return true;
}

/**
 * Returns the current settings, merged with defaults.
 */
export async function getSettings() {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
}

/**
 * Persists settings, merged with defaults.
 */
export async function saveSettings(settings) {
  const current = await getSettings();
  const merged = { ...current, ...settings };
  await browser.storage.local.set({ [SETTINGS_KEY]: merged });
  return merged;
}
