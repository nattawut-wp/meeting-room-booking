import bcrypt from "bcryptjs";
import { config } from "../config";
import { AppError } from "../lib/errors";
import type { CreateBookingInput } from "../lib/validation";
import { BookingOverlapError, bookingRepository } from "../repositories/bookingRepository";
import { roomService } from "./roomService";

type Conflict = { bookerName: string; startTime: Date; endTime: Date } | null;

function conflictError(conflict: Conflict) {
  return new AppError("BOOKING_CONFLICT", "ช่วงเวลานี้มีคนจองห้องนี้ไว้แล้ว", {
    conflict: conflict && {
      bookerName: conflict.bookerName,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
    },
  });
}

export const bookingService = {
  async createBooking(input: CreateBookingInput) {
    await roomService.getRoom(input.roomId);

    // Layer 1: check in the app so we can say who holds the slot.
    const { roomId, startTime, endTime } = input;
    const conflict = await bookingRepository.findFirstOverlapping(roomId, startTime, endTime);
    if (conflict) throw conflictError(conflict);

    const pinHash = await bcrypt.hash(input.pin, config.bcryptRounds);

    try {
      return await bookingRepository.create({ roomId, bookerName: input.bookerName, startTime, endTime, pinHash });
    } catch (err) {
      // Layer 2: another request won the race; the DB exclusion constraint rejected us.
      if (err instanceof BookingOverlapError) {
        throw conflictError(await bookingRepository.findFirstOverlapping(roomId, startTime, endTime));
      }
      throw err;
    }
  },

  /** Only the person who booked (who knows the PIN) can cancel. */
  async cancelBooking(id: number, pin: string) {
    const booking = await bookingRepository.findByIdWithPinHash(id);
    if (!booking) throw new AppError("BOOKING_NOT_FOUND", "ไม่พบการจองนี้");

    const ok = await bcrypt.compare(pin, booking.pinHash);
    if (!ok) throw new AppError("INVALID_PIN", "รหัสยกเลิกไม่ถูกต้อง");

    const deleted = await bookingRepository.deleteById(id);
    if (!deleted) throw new AppError("BOOKING_NOT_FOUND", "ไม่พบการจองนี้");
  },
};
