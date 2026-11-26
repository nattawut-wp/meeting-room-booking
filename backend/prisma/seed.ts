import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export const ROOMS = [
  { name: "ห้องประชุม A", capacity: 6 },
  { name: "ห้องประชุม B", capacity: 10 },
  { name: "ห้องประชุม C", capacity: 20 },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

for (const room of ROOMS) {
  await prisma.room.upsert({ where: { name: room.name }, update: room, create: room });
}
console.log(`Seeded ${ROOMS.length} rooms`);
await prisma.$disconnect();
