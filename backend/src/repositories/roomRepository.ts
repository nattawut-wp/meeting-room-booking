import { prisma } from "../db";

/** Data access for rooms. The only place that knows rooms live in Prisma. */
export const roomRepository = {
  findAll() {
    return prisma.room.findMany({ orderBy: { id: "asc" } });
  },

  findById(id: number) {
    return prisma.room.findUnique({ where: { id } });
  },
};
