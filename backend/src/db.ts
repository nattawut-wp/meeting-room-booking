import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { config } from "./config";

// One PrismaClient for the whole app (each instance opens its own connection pool).
// `omit` hides pinHash from every query result by default, so it can never
// leak into an API response by accident. Ask for it explicitly when needed.
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.databaseUrl }),
  omit: { booking: { pinHash: true } },
});
