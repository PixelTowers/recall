// ABOUTME: Unit tests for the markdown export module.
// ABOUTME: Verifies markdown generation, filename creation, and edge cases.

import { describe, it, expect } from "vitest";
import {
  formatTimestamp,
  slugify,
  snapshotToMarkdown,
  generateFilename,
} from "../src/lib/export.js";

function makeSnapshot(overrides = {}) {
  return {
    id: "snap-1",
    url: "https://example.com/apply",
    title: "Job Application",
    timestamp: 1700000000000,
    fields: [
      { label: "Full Name", value: "Alice Smith", selector: "#name", type: "text" },
      { label: "Cover Letter", value: "I am excited to apply...", selector: "#cover", type: "textarea" },
    ],
    source: "manual",
    ...overrides,
  };
}

describe("formatTimestamp", () => {
  it("returns a human-readable date string", () => {
    const result = formatTimestamp(1700000000000);
    // The exact format depends on locale, but it should contain the year
    expect(result).toContain("2023");
  });
});

describe("slugify", () => {
  it("converts a URL to a filename-safe slug", () => {
    expect(slugify("https://example.com/apply")).toBe("example-com-apply");
  });

  it("strips protocol prefix", () => {
    expect(slugify("http://test.org/form")).toBe("test-org-form");
  });

  it("replaces special characters with dashes", () => {
    expect(slugify("Hello World! @#$")).toBe("hello-world");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("--test--")).toBe("test");
  });
});

describe("snapshotToMarkdown", () => {
  it("produces correct Q&A markdown format", () => {
    const snapshot = makeSnapshot();
    const md = snapshotToMarkdown(snapshot);

    expect(md).toContain("# Form Snapshot: Job Application");
    expect(md).toContain("**URL:** https://example.com/apply");
    expect(md).toContain("**Saved:**");
    expect(md).toContain("---");
    expect(md).toContain("## Full Name");
    expect(md).toContain("Alice Smith");
    expect(md).toContain("## Cover Letter");
    expect(md).toContain("I am excited to apply...");
  });

  it("shows *empty* for fields with no value", () => {
    const snapshot = makeSnapshot({
      fields: [{ label: "Notes", value: "", selector: "#notes", type: "textarea" }],
    });
    const md = snapshotToMarkdown(snapshot);

    expect(md).toContain("## Notes");
    expect(md).toContain("*empty*");
  });

  it("handles multiple fields in order", () => {
    const snapshot = makeSnapshot();
    const md = snapshotToMarkdown(snapshot);
    const nameIndex = md.indexOf("## Full Name");
    const coverIndex = md.indexOf("## Cover Letter");

    expect(nameIndex).toBeLessThan(coverIndex);
  });

  it("handles special markdown characters in values", () => {
    const snapshot = makeSnapshot({
      fields: [
        { label: "Bio", value: "I like *bold* and **bolder** text", selector: "#bio", type: "text" },
      ],
    });
    const md = snapshotToMarkdown(snapshot);

    expect(md).toContain("I like *bold* and **bolder** text");
  });

  it("handles snapshots with no fields", () => {
    const snapshot = makeSnapshot({ fields: [] });
    const md = snapshotToMarkdown(snapshot);

    expect(md).toContain("# Form Snapshot: Job Application");
    expect(md).toContain("---");
  });
});

describe("generateFilename", () => {
  it("creates a filename with url slug and date", () => {
    const snapshot = makeSnapshot();
    const filename = generateFilename(snapshot);

    expect(filename).toMatch(/^recall-example-com-apply-2023-11-\d{2}\.md$/);
  });

  it("starts with 'recall-' prefix", () => {
    const snapshot = makeSnapshot();
    const filename = generateFilename(snapshot);

    expect(filename.startsWith("recall-")).toBe(true);
  });

  it("ends with .md extension", () => {
    const snapshot = makeSnapshot();
    const filename = generateFilename(snapshot);

    expect(filename.endsWith(".md")).toBe(true);
  });
});
