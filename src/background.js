// ABOUTME: Background service worker for the Recall extension.
// ABOUTME: Manages storage operations, badge updates, and message routing.

import browser from "webextension-polyfill";
import {
  getSnapshots,
  saveSnapshot,
  saveAutoSnapshot,
  deleteSnapshot,
  getSettings,
  saveSettings,
} from "./lib/storage.js";

/**
 * Updates the badge text for a given tab to show the snapshot count.
 */
async function updateBadge(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab.url) {
      await browser.action.setBadgeText({ text: "", tabId });
      return;
    }

    const snapshots = await getSnapshots(tab.url);
    const count = snapshots.length;

    await browser.action.setBadgeText({
      text: count > 0 ? String(count) : "",
      tabId,
    });
    await browser.action.setBadgeBackgroundColor({
      color: "#4A90D9",
      tabId,
    });
  } catch {
    // Tab may have been closed between check and update
  }
}

/**
 * Handles messages from the popup and content scripts.
 */
async function handleMessage(message, sender) {
  const { action, payload } = message;

  switch (action) {
    case "getSnapshots": {
      return await getSnapshots(payload.url);
    }

    case "saveSnapshot": {
      await saveSnapshot(payload.snapshot);
      // Update badge for the tab where the snapshot was saved
      const tabId = sender.tab?.id || payload.tabId;
      if (tabId) {
        await updateBadge(tabId);
      }
      return { success: true };
    }

    case "saveAutoSnapshot": {
      await saveAutoSnapshot(payload.snapshot);
      const tabId = sender.tab?.id || payload.tabId;
      if (tabId) {
        await updateBadge(tabId);
      }
      return { success: true };
    }

    case "deleteSnapshot": {
      const removed = await deleteSnapshot(payload.url, payload.snapshotId);
      const tabId = sender.tab?.id || payload.tabId;
      if (tabId) {
        await updateBadge(tabId);
      }
      return { success: removed };
    }

    case "getSettings": {
      return await getSettings();
    }

    case "saveSettings": {
      return await saveSettings(payload.settings);
    }

    case "updateBadge": {
      if (payload.tabId) {
        await updateBadge(payload.tabId);
      }
      return { success: true };
    }

    default:
      return { error: `Unknown action: ${action}` };
  }
}

// Listen for messages from popup and content scripts
browser.runtime.onMessage.addListener(handleMessage);

// Update badge when the active tab changes
browser.tabs.onActivated.addListener(async (activeInfo) => {
  await updateBadge(activeInfo.tabId);
});

// Update badge when a tab finishes loading
browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    await updateBadge(tabId);
  }
});
