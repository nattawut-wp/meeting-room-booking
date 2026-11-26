import { config } from "dotenv";

// Always point API tests at the separate test database, never the dev one.
config({ path: ".env.test", override: true, quiet: true });

if (!process.env.DATABASE_URL?.includes("meeting_test")) {
  throw new Error("Refusing to run API tests: DATABASE_URL is not the test database");
}
