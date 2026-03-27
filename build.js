// ABOUTME: Build script for bundling the Recall extension for Chrome and Firefox.
// ABOUTME: Uses esbuild to bundle JS modules and copies static assets to dist/.

import { build } from "esbuild";
import {
  cpSync,
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const targets = process.argv.includes("--target=chrome")
  ? ["chrome"]
  : process.argv.includes("--target=firefox")
    ? ["firefox"]
    : ["chrome", "firefox"];

const entryPoints = [
  "src/background.js",
  "src/content.js",
  "src/popup/popup.js",
  "src/options/options.js",
];

const staticFiles = [
  { src: "src/popup/popup.html", dest: "popup/popup.html" },
  { src: "src/popup/popup.css", dest: "popup/popup.css" },
  { src: "src/options/options.html", dest: "options/options.html" },
  { src: "src/options/options.css", dest: "options/options.css" },
];

/**
 * Generates a browser-specific manifest from the base manifest.json.
 */
function generateManifest(target) {
  const base = JSON.parse(
    readFileSync(resolve(__dirname, "manifest.json"), "utf-8"),
  );

  if (target === "firefox") {
    // Firefox MV3 uses "scripts" array instead of "service_worker"
    base.background = {
      scripts: ["background.js"],
      type: "module",
    };

    // Firefox requires browser_specific_settings for extension ID
    base.browser_specific_settings = {
      gecko: {
        id: "recall@pixeltowers.com",
        strict_min_version: "112.0",
      },
      gecko_android: {
        strict_min_version: "112.0",
      },
    };
  }

  return base;
}

async function buildTarget(target) {
  const outdir = resolve(__dirname, `dist/${target}`);

  // Clean previous build
  if (existsSync(outdir)) {
    rmSync(outdir, { recursive: true });
  }
  mkdirSync(outdir, { recursive: true });

  // Bundle JS entry points
  await build({
    entryPoints,
    bundle: true,
    outdir,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify: process.argv.includes("--minify"),
    sourcemap: process.argv.includes("--sourcemap"),
    outExtension: { ".js": ".js" },
    outbase: "src",
  });

  // Generate browser-specific manifest
  const manifest = generateManifest(target);
  writeFileSync(
    resolve(outdir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Copy static files
  for (const { src, dest } of staticFiles) {
    const destPath = resolve(outdir, dest);
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(resolve(__dirname, src), destPath);
  }

  // Copy icons
  cpSync(resolve(__dirname, "icons"), resolve(outdir, "icons"), {
    recursive: true,
  });

  console.log(`Built for ${target} → dist/${target}/`);
}

for (const target of targets) {
  await buildTarget(target);
}
