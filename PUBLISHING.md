# Publishing Recall to Browser Extension Stores

This guide covers publishing Recall to both the Chrome Web Store and Firefox Add-ons (AMO).

## Quick Start

### Manual Release Creation

Push a version tag to trigger automatic GitHub Release creation with packaged artifacts:

```bash
# Update version in package.json first
npm version minor  # or major/patch/prerelease
git push origin main
git push origin v0.1.0  # pushes the tag created by npm version
```

The `.github/workflows/release.yml` workflow automatically:
1. Builds both Chrome and Firefox extensions
2. Packages them as `.zip` files
3. Creates a GitHub Release with all artifacts attached
4. Downloads are available immediately for manual distribution

### Automated Store Publishing

To enable automated publishing to either store, uncomment the relevant job in `.github/workflows/release.yml` and configure credentials below.

---

## Chrome Web Store

### One-Time Setup

#### 1. Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "Create new item"
3. Pay the $5 one-time developer registration fee
4. Copy your **Extension ID** (32-character string) — you'll need this later

#### 2. Set Up OAuth Credentials in Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Recall Extension Publishing"
3. Enable the **Chrome Web Store Publish API**:
   - Search for "Chrome Web Store API"
   - Enable it on this project
4. Go to **APIs & Services** → **OAuth Consent Screen**
   - Configure as "External" application
   - Add yourself as a test user
5. Go to **Credentials** → **Create OAuth Client ID**
   - Application type: "Web application"
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
   - Save the `Client ID` and `Client Secret`

#### 3. Generate Refresh Token

1. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. In the top-right settings (⚙️), check "Use your own OAuth credentials"
   - Paste your `Client ID` and `Client Secret`
3. On the left:
   - Paste this scope: `https://www.googleapis.com/auth/chromewebstore`
   - Click "Authorize APIs"
   - Grant permission
4. Click "Exchange authorization code for tokens"
5. Copy the **Refresh Token**

#### 4. Configure GitHub Secrets

In your repo:
1. Settings → Secrets and variables → Actions
2. Create these secrets:
   - `CHROME_CLIENT_ID` — your Client ID from step 2
   - `CHROME_CLIENT_SECRET` — your Client Secret from step 2
   - `CHROME_REFRESH_TOKEN` — from step 3
   - `CHROME_EXTENSION_ID` — from step 1

#### 5. Enable Automated Publishing

In `.github/workflows/release.yml`, uncomment the `publish-chrome` job:

```yaml
  publish-chrome:
    name: Publish to Chrome Web Store
    runs-on: ubuntu-latest
    needs: build-and-release
    environment: chrome-store
    steps:
      - uses: actions/checkout@v4
      # ... rest of job
```

#### 6. First Submission

For your first release, manually upload a draft through the Chrome Web Store dashboard to complete the store listing:

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click your extension
3. Upload the Chrome `.zip` from the GitHub Release
4. Complete the listing: add screenshots, description, privacy policy, support URL, etc.
5. Save as draft (do NOT publish yet)

Subsequent releases will auto-publish via the GitHub Actions workflow.

### Manual Chrome Publishing

If you don't have GitHub Actions automation set up, publish manually:

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click your extension
3. Click "Package" or "Upload new package"
4. Select `recall-chrome-v0.1.0.zip` from the GitHub Release
5. Click "Publish" to submit for review (1–3 business days)

---

## Firefox Add-ons (AMO)

### One-Time Setup

#### 1. Create Mozilla Account

1. Go to [addons.mozilla.org](https://addons.mozilla.org)
2. Sign up or log in
3. Agree to the [Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)

#### 2. Generate API Credentials

1. Go to [API Key page](https://addons.mozilla.org/developers/addon/api/key/)
2. Click "Generate new credentials"
3. Copy:
   - `JWT Issuer` — looks like `user:12345:67`
   - `JWT Secret` — long string

#### 3. Configure GitHub Secrets

In your repo:
1. Settings → Secrets and variables → Actions
2. Create these secrets:
   - `AMO_SIGN_KEY` — your JWT Issuer
   - `AMO_SIGN_SECRET` — your JWT Secret

#### 4. Enable Automated Publishing

In `.github/workflows/release.yml`, uncomment the `publish-firefox` job:

```yaml
  publish-firefox:
    name: Publish to Firefox Add-ons
    runs-on: ubuntu-latest
    needs: build-and-release
    environment: firefox-store
    steps:
      - uses: actions/checkout@v4
      # ... rest of job
```

#### 5. First Submission

For your first release, create an entry on AMO manually:

1. Go to [AMO Developer Hub](https://addons.mozilla.org/developers/)
2. Click "Submit a new add-on"
3. Choose "On this website" for distribution
4. Upload `recall-firefox-v0.1.0.zip`
5. Fill in:
   - Name: "Recall"
   - Summary: "Save, restore, and export form data"
   - Category: "Utilities"
   - License: (choose or leave as-is)
   - Support URL and privacy policy
6. Save as draft

You must submit at least once manually to create the addon entry. Subsequent releases will auto-publish via GitHub Actions.

### Manual Firefox Publishing

If you don't have automation, publish with the `web-ext` CLI:

```bash
npx web-ext sign \
  --channel listed \
  --source-dir ./dist/firefox \
  --api-key "user:12345:67" \
  --api-secret "long-secret-string"
```

The signed `.xpi` is saved to `web-ext-artifacts/`.

---

## Important Notes

### Source Code Archive

Firefox requires source code when extensions use bundlers/minifiers (like esbuild). The `release.yml` workflow automatically creates `recall-source-v0.1.0.zip` containing:
- All source files
- `package.json` and build configuration
- Excludes: `node_modules/`, `dist/`, `.git/`, built zips

Upload this alongside the Firefox extension if AMO requests it.

### Version Numbers

When publishing a new release:

1. Update `package.json` version
2. Commit and push
3. Tag the commit: `git tag v0.1.0 && git push origin v0.1.0`
4. The release workflow runs automatically
5. For Chrome Web Store: version in `manifest.json` must be incremented each time
   - (The build process uses `manifest.json` from repo, so update it if needed)
6. For Firefox AMO: version is detected from `manifest.json`

### Review Times

- **Chrome Web Store**: 1–3 business days
- **Firefox AMO (listed)**: Days to weeks, depending on queue
- **Firefox AMO (unlisted)**: Instant signing, no human review (for self-distribution)

### Unlisted vs Listed on Firefox

- **Listed** (default): Public add-on, Mozilla reviews, appears in AMO search
- **Unlisted**: No human review, instant signing, only shareable via direct link

To switch, change `channel: listed` to `channel: unlisted` in the `publish-firefox` job.

---

## Troubleshooting

### Chrome: "Invalid OAuth token"

1. Regenerate the refresh token in [OAuth Playground](https://developers.google.com/oauthplayground)
2. Update the `CHROME_REFRESH_TOKEN` secret
3. Re-run the workflow

### Firefox: "Invalid JWT credentials"

1. Regenerate credentials at [addons.mozilla.org/developers/addon/api/key/](https://addons.mozilla.org/developers/addon/api/key/)
2. Update `AMO_SIGN_KEY` and `AMO_SIGN_SECRET` secrets
3. Re-run the workflow

### Zip File Errors

Ensure the zip file is created with the manifest at the root (not inside a nested folder):

```bash
# Correct structure:
unzip -l recall-chrome-v0.1.0.zip
  manifest.json
  background.js
  content.js
  ...

# Incorrect (do not do this):
unzip -l bad.zip
  recall-chrome/
    manifest.json
    ...
```

Our build process creates zips correctly, but verify if you're packaging manually.

---

## References

- [Chrome Web Store Publishing API](https://developer.chrome.com/docs/webstore/using-api)
- [Chrome Extension MV3 Manifest](https://developer.chrome.com/docs/extensions/mv3/manifest/)
- [Firefox Extension Workshop — Publishing](https://extensionworkshop.com/documentation/publish/)
- [web-ext CLI Reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Firefox Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
