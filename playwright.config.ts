import { defineConfig } from '@playwright/test'

// Tests run against the static build, which must be built with `pnpm generate:test` so the analytics tests have a
// collector to talk to (a stub on port 4174). They use the Chrome installed on the machine.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  // One worker: the stub collector is shared, and its log is reset per test.
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    viewport: { width: 1360, height: 860 },
  },
  webServer: [
    {
      command: 'npx --yes serve .output/public -l 4173 --no-clipboard',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'node tests/e2e/stub-umami.mjs',
      url: 'http://127.0.0.1:4174/script.js',
      reuseExistingServer: true,
      timeout: 10_000,
    },
  ],
})
