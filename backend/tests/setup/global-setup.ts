import { execSync } from "node:child_process";

// Runs once before all API tests: apply any pending migrations to the test database (non-destructive).
export default function setup() {
  execSync("npm run db:test:migrate", { stdio: "inherit" });
}
