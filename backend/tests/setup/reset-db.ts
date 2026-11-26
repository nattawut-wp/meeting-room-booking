import { afterAll, beforeEach } from "vitest";
import { prisma } from "../../src/db";
import { ROOMS } from "../helpers";

// Every test starts from the same state: 3 rooms (ids 1, 2, 3) and no bookings.
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE "bookings", "rooms" RESTART IDENTITY CASCADE');
  await prisma.room.createMany({ data: ROOMS });
});

afterAll(async () => {
  await prisma.$disconnect();
});
