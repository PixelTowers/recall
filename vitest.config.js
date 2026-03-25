// ABOUTME: Vitest configuration for the Recall extension test suite.
// ABOUTME: Configures jsdom environment for DOM-dependent tests.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
