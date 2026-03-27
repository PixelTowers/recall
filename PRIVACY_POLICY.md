# Privacy Policy for Recall Extension

**Last Updated**: March 2026

## Overview

Recall is a browser extension that saves, restores, and exports form data to prevent data loss. This privacy policy explains how we handle your data.

## Data Collection & Storage

### What Data We Collect
Recall captures and stores:
- **Form field data** — text, selections, and other values you enter into web forms
- **Page URLs** — the web addresses where you save form data (for organizing snapshots)
- **Timestamps** — when each snapshot was created
- **Snapshot metadata** — whether a snapshot was auto-saved or manually created

### How We Store It
All data is stored **locally on your device** in your browser's storage:
- **Chrome**: Uses `chrome.storage.local` (encrypted by your browser)
- **Firefox**: Uses `browser.storage.local` (encrypted by your browser)

**No data is sent to our servers, cloud services, or any third parties.**

## Data You Control

### Viewing Your Data
- Open the Recall popup to view all saved snapshots
- Click "View All" to see snapshots from any website

### Deleting Your Data
- Click the **Delete** button on any snapshot to remove it immediately
- Data is permanently deleted from your device

### Exporting Your Data
- Click **Export** on any snapshot to download it as a Markdown file
- You own all exported data

## Permissions

Recall requests the following browser permissions:

| Permission | Why |
|-----------|-----|
| `storage` | To save form data locally on your device |
| `activeTab` | To detect which page you're on when saving forms |

## Data Security

- All form data remains on your device and never leaves your browser
- We don't track you, monitor your activity, or sell your data
- We can't access your data — it's only accessible to you through the extension

## Third-Party Services

Recall does **not** use:
- Analytics services
- Advertising networks
- Cloud storage services
- Any external APIs (except browser APIs)

## Changes to This Policy

We may update this policy in future versions. Changes will be noted in the extension's release notes.

## Questions?

For questions about this privacy policy or Recall's data practices:
- Open an issue on [GitHub](https://github.com/PixelTowers/recall)
- Check the [README](https://github.com/PixelTowers/recall/blob/main/README.md)

---

**In Summary**: Your form data is yours alone. Recall stores it locally on your device and never shares it with anyone.
