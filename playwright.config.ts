import { defineConfig, devices } from "@playwright/test";

// E2E runs the real stack against the TEST database:
//   backend  → http://localhost:4001 (backend/.env.test)
//   frontend → http://localhost:3001 (production build in frontend/.next-e2e)
// so it never touches dev data or a dev server you have running on 3000/4000.
const API_URL = "http://localhost:4001";
const WEB_URL = "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1, // tests share one database
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: WEB_URL,
    locale: "th-TH",
    timezoneId: "Asia/Bangkok",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm --prefix backend run start:test",
      url: `${API_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm --prefix frontend run build && npm --prefix frontend run start -- -p 3001",
      url: WEB_URL,
      env: { NEXT_DIST_DIR: ".next-e2e", NEXT_PUBLIC_API_URL: API_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
