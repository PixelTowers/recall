// ABOUTME: Markdown generation from snapshot data and file download trigger.
// ABOUTME: Converts snapshots to Q&A formatted Markdown for export.

/**
 * Formats a timestamp as a human-readable date string.
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generates a URL-safe slug from a string, for use in filenames.
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Converts a Snapshot into Q&A formatted Markdown.
 */
export function snapshotToMarkdown(snapshot) {
  const lines = [
    `# Form Snapshot: ${snapshot.title}`,
    `**URL:** ${snapshot.url}`,
    `**Saved:** ${formatTimestamp(snapshot.timestamp)}`,
    "",
    "---",
    "",
  ];

  for (const field of snapshot.fields) {
    lines.push(`## ${field.label}`);
    lines.push(field.value || "*empty*");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generates a filename for the exported Markdown.
 */
export function generateFilename(snapshot) {
  const urlSlug = slugify(snapshot.url);
  const dateSlug = new Date(snapshot.timestamp).toISOString().slice(0, 10);
  return `recall-${urlSlug}-${dateSlug}.md`;
}

/**
 * Triggers a file download of the snapshot as Markdown.
 * Only works in browser contexts (requires document and URL APIs).
 */
export function downloadMarkdown(snapshot) {
  const markdown = snapshotToMarkdown(snapshot);
  const filename = generateFilename(snapshot);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
