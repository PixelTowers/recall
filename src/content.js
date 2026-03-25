// ABOUTME: Content script injected into web pages.
// ABOUTME: Handles form field capture, value restoration, and auto-save.

import browser from "webextension-polyfill";
import { captureFields } from "./lib/fields.js";

/**
 * Captures the current form state and sends it to the background worker for storage.
 */
async function captureSnapshot() {
  const fields = captureFields();

  if (fields.length === 0) {
    return { success: false, reason: "No form fields found on this page" };
  }

  const snapshot = {
    id: crypto.randomUUID(),
    url: window.location.href,
    title: document.title || window.location.hostname,
    timestamp: Date.now(),
    fields,
    source: "manual",
  };

  const response = await browser.runtime.sendMessage({
    action: "saveSnapshot",
    payload: { snapshot },
  });

  return response;
}

/**
 * Dispatches input, change, and blur events on an element so that
 * JS frameworks (React, Vue, etc.) detect the value change.
 */
function dispatchInputEvents(element) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

/**
 * Restores a single field's value based on its type.
 */
function restoreFieldValue(element, field) {
  const type = field.type || element.type || "";

  if (type === "checkbox") {
    element.checked = field.value === "true";
    dispatchInputEvents(element);
    return true;
  }

  if (type === "radio") {
    if (element.value === field.value) {
      element.checked = true;
      dispatchInputEvents(element);
    }
    return true;
  }

  if (element.tagName.toLowerCase() === "select" || type === "select-one") {
    const optionExists = Array.from(element.options).some(
      (opt) => opt.value === field.value,
    );
    if (optionExists) {
      element.value = field.value;
      dispatchInputEvents(element);
    }
    return true;
  }

  // Text, textarea, email, etc.
  element.value = field.value;
  dispatchInputEvents(element);
  return true;
}

/**
 * Restores a snapshot's field values back into the page's form fields.
 * Returns a summary of restored vs failed fields.
 */
function restoreSnapshot(snapshot) {
  let restored = 0;
  let failed = 0;

  for (const field of snapshot.fields) {
    const element = document.querySelector(field.selector);
    if (element) {
      restoreFieldValue(element, field);
      restored++;
    } else {
      failed++;
    }
  }

  return { restored, failed, total: snapshot.fields.length };
}

/**
 * Handles messages from the background worker and popup.
 */
function handleMessage(message) {
  const { action, payload } = message;

  switch (action) {
    case "capture":
      return captureSnapshot();

    case "restore":
      return Promise.resolve(restoreSnapshot(payload.snapshot));

    default:
      return Promise.resolve({ error: `Unknown action: ${action}` });
  }
}

// Listen for messages from background/popup
browser.runtime.onMessage.addListener(handleMessage);
