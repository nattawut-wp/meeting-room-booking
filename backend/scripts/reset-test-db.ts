// Empties the TEST database and re-creates the 3 rooms. Used by the E2E tests.
import { config } from "dotenv";
config({ path: ".env.test", override: true, quiet: true });

if (!process.env.DATABASE_URL?.includes("meeting_test")) {
  throw new Error("Refusing to reset: DATABASE_URL is not the test database");
}

const { prisma } = await import("../src/db");
const { ROOMS } = await import("../tests/helpers");

await prisma.$executeRawUnsafe('TRUNCATE "bookings", "rooms" RESTART IDENTITY CASCADE');
await prisma.room.createMany({ data: ROOMS });
await prisma.$disconnect();
