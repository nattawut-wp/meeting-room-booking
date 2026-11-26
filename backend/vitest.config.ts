import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**", "src/index.ts"],
      reporter: ["text", "html"],
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "api",
          include: ["tests/api/**/*.test.ts"],
          // Every API test file shares one real test database, so run them one at a time.
          fileParallelism: false,
          setupFiles: ["tests/setup/load-test-env.ts", "tests/setup/reset-db.ts"],
          globalSetup: ["tests/setup/global-setup.ts"],
        },
      },
    ],
  },
});
