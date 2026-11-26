import bcrypt from "bcryptjs";
import { Router } from "express";
import { config } from "../config";
import { prisma } from "../db";
import { HttpError, isOverlapViolation } from "../lib/errors";
import { cancelBookingSchema, createBookingSchema, idParamSchema } from "../lib/validation";

export const bookingsRouter = Router();

/** Find a booking in the same room whose time overlaps [start, end). */
function findConflict(roomId: number, start: Date, end: Date) {
  return prisma.booking.findFirst({
    where: { roomId, startTime: { lt: end }, endTime: { gt: start } },
    orderBy: { startTime: "asc" },
  });
}

function conflictError(conflict: { bookerName: string; startTime: Date; endTime: Date } | null) {
  return new HttpError(409, "BOOKING_CONFLICT", "ช่วงเวลานี้มีคนจองห้องนี้ไว้แล้ว", {
    conflict: conflict && {
      bookerName: conflict.bookerName,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
    },
  });
}

bookingsRouter.post("/", async (req, res) => {
  const input = createBookingSchema.parse(req.body);

  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw new HttpError(404, "ROOM_NOT_FOUND", "ไม่พบห้องนี้");

  // Layer 1: check in the app so we can say who holds the slot.
  const conflict = await findConflict(input.roomId, input.startTime, input.endTime);
  if (conflict) throw conflictError(conflict);

  const pinHash = await bcrypt.hash(input.pin, config.bcryptRounds);

  try {
    const booking = await prisma.booking.create({
      data: {
        roomId: input.roomId,
        bookerName: input.bookerName,
        startTime: input.startTime,
        endTime: input.endTime,
        pinHash,
      },
    });
    res.status(201).json(booking);
  } catch (err) {
    // Layer 2: another request won the race; the DB exclusion constraint rejected us.
    if (isOverlapViolation(err)) {
      throw conflictError(await findConflict(input.roomId, input.startTime, input.endTime));
    }
    throw err;
  }
});

// Only the person who booked (who knows the PIN) can cancel.
bookingsRouter.delete("/:id", async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  const { pin } = cancelBookingSchema.parse(req.body ?? {});

  const booking = await prisma.booking.findUnique({
    where: { id },
    omit: { pinHash: false },
  });
  if (!booking) throw new HttpError(404, "BOOKING_NOT_FOUND", "ไม่พบการจองนี้");

  const ok = await bcrypt.compare(pin, booking.pinHash);
  if (!ok) throw new HttpError(403, "INVALID_PIN", "รหัสยกเลิกไม่ถูกต้อง");

  // deleteMany does not throw if a parallel request already deleted it.
  const { count } = await prisma.booking.deleteMany({ where: { id } });
  if (count === 0) throw new HttpError(404, "BOOKING_NOT_FOUND", "ไม่พบการจองนี้");

  res.status(204).end();
});
