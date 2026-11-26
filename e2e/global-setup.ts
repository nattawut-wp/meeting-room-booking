import { execSync } from "node:child_process";

// Make sure the test database has every migration before the servers start using it.
export default function globalSetup() {
  execSync("npm --prefix backend run -s db:test:migrate", { stdio: "inherit" });
}
