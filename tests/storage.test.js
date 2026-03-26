// ABOUTME: Unit tests for the shared storage helpers module.
// ABOUTME: Verifies snapshot CRUD, settings persistence, and URL normalization.

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock browser.storage.local before importing the module
const store = {};
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(async (key) => {
          if (typeof key === "string") {
            return { [key]: store[key] };
          }
          return {};
        }),
        set: vi.fn(async (obj) => {
          Object.assign(store, obj);
        }),
      },
    },
  },
}));

import {
  normalizeUrl,
  getAllSnapshots,
  getSnapshots,
  saveSnapshot,
  saveAutoSnapshot,
  deleteSnapshot,
  deleteAllAutoSnapshots,
  getSettings,
  saveSettings,
} from "../src/lib/storage.js";

function clearStore() {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}

function makeSnapshot(overrides = {}) {
  return {
    id: "snap-1",
    url: "https://example.com/form",
    title: "Test Form",
    timestamp: 1700000000000,
    fields: [{ label: "Name", value: "Alice", selector: "#name", type: "text" }],
    source: "manual",
    ...overrides,
  };
}

describe("normalizeUrl", () => {
  it("strips query parameters", () => {
    expect(normalizeUrl("https://example.com/form?step=2&ref=email")).toBe(
      "https://example.com/form",
    );
  });

  it("strips hash fragments", () => {
    expect(normalizeUrl("https://example.com/form#section")).toBe(
      "https://example.com/form",
    );
  });

  it("preserves origin and pathname", () => {
    expect(normalizeUrl("https://example.com/apply/step-3")).toBe(
      "https://example.com/apply/step-3",
    );
  });

  it("returns the original string for invalid URLs", () => {
    expect(normalizeUrl("not-a-url")).toBe("not-a-url");
  });
});

describe("getAllSnapshots", () => {
  beforeEach(clearStore);

  it("returns an empty object when no snapshots exist", async () => {
    const result = await getAllSnapshots();
    expect(result).toEqual({});
  });

  it("returns all stored snapshots", async () => {
    const snapshot = makeSnapshot();
    store.recall_snapshots = {
      "https://example.com/form": [snapshot],
    };

    const result = await getAllSnapshots();
    expect(result).toEqual({
      "https://example.com/form": [snapshot],
    });
  });
});

describe("getSnapshots", () => {
  beforeEach(clearStore);

  it("returns an empty array when no snapshots exist for the URL", async () => {
    const result = await getSnapshots("https://example.com/nothing");
    expect(result).toEqual([]);
  });

  it("returns snapshots for a matching URL", async () => {
    const snapshot = makeSnapshot();
    store.recall_snapshots = {
      "https://example.com/form": [snapshot],
    };

    const result = await getSnapshots("https://example.com/form");
    expect(result).toEqual([snapshot]);
  });

  it("normalizes the URL before lookup", async () => {
    const snapshot = makeSnapshot();
    store.recall_snapshots = {
      "https://example.com/form": [snapshot],
    };

    const result = await getSnapshots("https://example.com/form?query=1");
    expect(result).toEqual([snapshot]);
  });
});

describe("saveSnapshot", () => {
  beforeEach(clearStore);

  it("saves a snapshot under its normalized URL", async () => {
    const snapshot = makeSnapshot();
    await saveSnapshot(snapshot);

    expect(store.recall_snapshots).toEqual({
      "https://example.com/form": [snapshot],
    });
  });

  it("appends to existing snapshots for the same URL", async () => {
    const snap1 = makeSnapshot({ id: "snap-1" });
    const snap2 = makeSnapshot({ id: "snap-2", timestamp: 1700000001000 });

    await saveSnapshot(snap1);
    await saveSnapshot(snap2);

    expect(store.recall_snapshots["https://example.com/form"]).toHaveLength(2);
    expect(store.recall_snapshots["https://example.com/form"][0].id).toBe("snap-1");
    expect(store.recall_snapshots["https://example.com/form"][1].id).toBe("snap-2");
  });

  it("keeps snapshots for different URLs separate", async () => {
    const snap1 = makeSnapshot({ id: "snap-1", url: "https://a.com/form" });
    const snap2 = makeSnapshot({ id: "snap-2", url: "https://b.com/form" });

    await saveSnapshot(snap1);
    await saveSnapshot(snap2);

    expect(Object.keys(store.recall_snapshots)).toHaveLength(2);
    expect(store.recall_snapshots["https://a.com/form"]).toHaveLength(1);
    expect(store.recall_snapshots["https://b.com/form"]).toHaveLength(1);
  });
});

describe("saveAutoSnapshot", () => {
  beforeEach(clearStore);

  it("saves an auto snapshot", async () => {
    const snapshot = makeSnapshot({ source: "auto" });
    await saveAutoSnapshot(snapshot);

    expect(store.recall_snapshots["https://example.com/form"]).toHaveLength(1);
    expect(store.recall_snapshots["https://example.com/form"][0].source).toBe("auto");
  });

  it("replaces the previous auto-save for the same URL", async () => {
    const snap1 = makeSnapshot({ id: "auto-1", source: "auto", timestamp: 1 });
    const snap2 = makeSnapshot({ id: "auto-2", source: "auto", timestamp: 2 });

    await saveAutoSnapshot(snap1);
    await saveAutoSnapshot(snap2);

    const snapshots = store.recall_snapshots["https://example.com/form"];
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].id).toBe("auto-2");
  });

  it("does not affect manual snapshots", async () => {
    const manual = makeSnapshot({ id: "manual-1", source: "manual" });
    store.recall_snapshots = {
      "https://example.com/form": [manual],
    };

    const auto = makeSnapshot({ id: "auto-1", source: "auto" });
    await saveAutoSnapshot(auto);

    const snapshots = store.recall_snapshots["https://example.com/form"];
    expect(snapshots).toHaveLength(2);
    expect(snapshots.find((s) => s.id === "manual-1")).toBeDefined();
    expect(snapshots.find((s) => s.id === "auto-1")).toBeDefined();
  });

  it("replaces only auto-saves while preserving manual saves", async () => {
    const manual = makeSnapshot({ id: "manual-1", source: "manual" });
    const oldAuto = makeSnapshot({ id: "auto-old", source: "auto" });
    store.recall_snapshots = {
      "https://example.com/form": [manual, oldAuto],
    };

    const newAuto = makeSnapshot({ id: "auto-new", source: "auto" });
    await saveAutoSnapshot(newAuto);

    const snapshots = store.recall_snapshots["https://example.com/form"];
    expect(snapshots).toHaveLength(2);
    expect(snapshots.find((s) => s.id === "manual-1")).toBeDefined();
    expect(snapshots.find((s) => s.id === "auto-new")).toBeDefined();
    expect(snapshots.find((s) => s.id === "auto-old")).toBeUndefined();
  });
});

describe("deleteAllAutoSnapshots", () => {
  beforeEach(clearStore);

  it("removes all auto-save snapshots across all URLs", async () => {
    store.recall_snapshots = {
      "https://a.com/form": [
        makeSnapshot({ id: "a-manual", source: "manual", url: "https://a.com/form" }),
        makeSnapshot({ id: "a-auto", source: "auto", url: "https://a.com/form" }),
      ],
      "https://b.com/form": [
        makeSnapshot({ id: "b-auto", source: "auto", url: "https://b.com/form" }),
      ],
    };

    const removed = await deleteAllAutoSnapshots();

    expect(removed).toBe(2);
    expect(store.recall_snapshots["https://a.com/form"]).toHaveLength(1);
    expect(store.recall_snapshots["https://a.com/form"][0].id).toBe("a-manual");
    expect(store.recall_snapshots["https://b.com/form"]).toBeUndefined();
  });

  it("preserves all manual snapshots", async () => {
    store.recall_snapshots = {
      "https://a.com/form": [
        makeSnapshot({ id: "m1", source: "manual" }),
        makeSnapshot({ id: "m2", source: "manual" }),
      ],
    };

    const removed = await deleteAllAutoSnapshots();

    expect(removed).toBe(0);
    expect(store.recall_snapshots["https://a.com/form"]).toHaveLength(2);
  });

  it("returns 0 when no auto-saves exist", async () => {
    const removed = await deleteAllAutoSnapshots();
    expect(removed).toBe(0);
  });
});

describe("deleteSnapshot", () => {
  beforeEach(clearStore);

  it("removes a snapshot by ID", async () => {
    const snap1 = makeSnapshot({ id: "snap-1" });
    const snap2 = makeSnapshot({ id: "snap-2" });
    store.recall_snapshots = {
      "https://example.com/form": [snap1, snap2],
    };

    const result = await deleteSnapshot("https://example.com/form", "snap-1");

    expect(result).toBe(true);
    expect(store.recall_snapshots["https://example.com/form"]).toHaveLength(1);
    expect(store.recall_snapshots["https://example.com/form"][0].id).toBe("snap-2");
  });

  it("removes the URL key when the last snapshot is deleted", async () => {
    const snapshot = makeSnapshot();
    store.recall_snapshots = {
      "https://example.com/form": [snapshot],
    };

    await deleteSnapshot("https://example.com/form", "snap-1");

    expect(store.recall_snapshots["https://example.com/form"]).toBeUndefined();
  });

  it("returns false when no snapshots exist for the URL", async () => {
    const result = await deleteSnapshot("https://example.com/nothing", "snap-1");
    expect(result).toBe(false);
  });

  it("returns false when the snapshot ID is not found", async () => {
    const snapshot = makeSnapshot();
    store.recall_snapshots = {
      "https://example.com/form": [snapshot],
    };

    const result = await deleteSnapshot("https://example.com/form", "nonexistent");
    expect(result).toBe(false);
  });
});

describe("getSettings", () => {
  beforeEach(clearStore);

  it("returns default settings when none are stored", async () => {
    const settings = await getSettings();
    expect(settings).toEqual({
      autoSave: false,
      autoSaveInterval: 30,
    });
  });

  it("returns stored settings merged with defaults", async () => {
    store.recall_settings = { autoSave: true };

    const settings = await getSettings();
    expect(settings).toEqual({
      autoSave: true,
      autoSaveInterval: 30,
    });
  });
});

describe("saveSettings", () => {
  beforeEach(clearStore);

  it("persists settings", async () => {
    await saveSettings({ autoSave: true });

    expect(store.recall_settings).toEqual({
      autoSave: true,
      autoSaveInterval: 30,
    });
  });

  it("merges with existing settings", async () => {
    store.recall_settings = { autoSave: true, autoSaveInterval: 30 };

    await saveSettings({ autoSaveInterval: 60 });

    expect(store.recall_settings).toEqual({
      autoSave: true,
      autoSaveInterval: 60,
    });
  });
});
