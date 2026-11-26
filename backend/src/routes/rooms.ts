import { Router } from "express";
import { prisma } from "../db";
import { HttpError } from "../lib/errors";
import { idParamSchema, listBookingsQuerySchema } from "../lib/validation";

export const roomsRouter = Router();

roomsRouter.get("/", async (_req, res) => {
  const rooms = await prisma.room.findMany({ orderBy: { id: "asc" } });
  res.json(rooms);
});

// Who has booked this room? By default only bookings that have not ended yet.
roomsRouter.get("/:id/bookings", async (req, res) => {
  const roomId = idParamSchema.parse(req.params.id);
  const { from = new Date() } = listBookingsQuerySchema.parse(req.query);

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new HttpError(404, "ROOM_NOT_FOUND", "ไม่พบห้องนี้");

  const bookings = await prisma.booking.findMany({
    where: { roomId, endTime: { gt: from } },
    orderBy: { startTime: "asc" },
  });
  res.json(bookings);
});
