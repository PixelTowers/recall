// ABOUTME: Configuration for Mozilla's web-ext CLI tool.
// ABOUTME: Used for running, linting, and packaging the Firefox extension.

export default {
  sourceDir: "dist/firefox",
  artifactsDir: "web-ext-artifacts",
  run: {
    startUrl: ["about:debugging#/runtime/this-firefox"],
  },
  build: {
    overwriteDest: true,
  },
};
