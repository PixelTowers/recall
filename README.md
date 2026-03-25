# Recall

A browser extension for Chrome and Firefox that saves, restores, and exports form data so you never lose what you've typed.

## The Problem

You're halfway through a long job application, government form, or survey. Your browser crashes, the session times out, or the page auto-reloads. Everything you typed is gone.

Browsers offer autofill for common fields like name and email, but they don't help with free-text fields like "describe your experience" or custom form inputs.

## What Recall Does

- **Save** all form field data on any page with a single click
- **Restore** saved data back into the form after a reload or crash
- **Export** snapshots as Markdown files in a Q&A format (question/label + your answer)
- **Auto-save** form data at a configurable interval (opt-in)
- **Badge count** shows how many saved snapshots exist for the current page

Recall captures each field's label and value, stores everything locally in your browser (nothing is sent to any server), and fires the right DOM events when restoring so that JavaScript frameworks (React, Vue, Angular) pick up the changes.

## Prerequisites

- [mise](https://mise.jdx.dev/) for toolchain management

## Setup

```sh
mise install
npm install
```

## Development

### Build

```sh
# Build for both browsers
npm run build

# Build for a specific browser
npm run build:chrome
npm run build:firefox
```

Build output goes to `dist/chrome/` and `dist/firefox/`.

### Test

```sh
npm test
```

### Lint

```sh
npm run lint
```

## Testing Locally

### Chrome

1. Run `npm run build`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `dist/chrome/` folder
6. Navigate to any page with a form and click the Recall icon in the toolbar

### Firefox

1. Run `npm run build`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select the file `dist/firefox/manifest.json`
5. Navigate to any page with a form and click the Recall icon in the toolbar

Alternatively, use the dev command which launches Firefox with the extension loaded and live-reloads on file changes:

```sh
npm run dev
```

### Test Flow

1. Go to any page with a form (login page, search bar, contact form, etc.)
2. Fill in some fields
3. Click the Recall icon in the toolbar, then **Save Current Form**
4. Reload the page
5. Click Recall, then **Restore** on your saved snapshot — the fields refill
6. Click **Export** to download a Markdown file with your answers
7. Click **Delete** to remove a snapshot you no longer need

### Packaging

```sh
npm run package
```

Produces an installable `.zip` / `.xpi` in `web-ext-artifacts/`.

## How It Works

### Architecture

| Layer | File | Role |
|---|---|---|
| Background Service Worker | `src/background.js` | Storage operations, badge updates, message routing |
| Content Script | `src/content.js` | Form detection, snapshot capture, value restoration, auto-save |
| Popup | `src/popup/` | Snapshot list with save, restore, delete, export actions |
| Options | `src/options/` | Settings page (auto-save toggle and interval) |
| Shared Libraries | `src/lib/` | Storage helpers, field detection, markdown export |

### Label Extraction

Recall identifies form field labels using a 6-level priority chain:

1. Explicit `<label for="id">` association
2. Parent `<label>` wrapping the input
3. `aria-label` or `aria-labelledby` attribute
4. Preceding sibling text content
5. `placeholder` attribute
6. `name` or `id` attribute as fallback

### Data Storage

All data stays local in `browser.storage.local`. No accounts, no servers, no tracking. Snapshots are keyed by page URL (normalized, without query parameters) so each page has its own independent set of saves.

### Permissions

- `storage` — persist snapshots and settings locally
- `activeTab` — access the current tab's URL and title when you interact with the extension

## License

MIT
