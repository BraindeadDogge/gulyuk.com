import { defineConfig } from '@playwright/test'

// Tests run against the static build. They use the Chrome installed on the machine.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    viewport: { width: 1360, height: 860 },
  },
  webServer: {
    command: 'npx --yes serve .output/public -l 4173 --no-clipboard',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
