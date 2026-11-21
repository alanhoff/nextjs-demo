import { defineConfig } from "@playwright/test";

const runningServer = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = runningServer ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests",
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL, trace: "retain-on-failure" },
  webServer: runningServer
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
