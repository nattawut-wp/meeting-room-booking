import { prisma } from "../db";

export interface NewBooking {
  roomId: number;
  bookerName: string;
  startTime: Date;
  endTime: Date;
  pinHash: string;
}

/**
 * Thrown by `create` when the database's exclusion constraint rejects an overlapping booking
 * (another request won the race). Callers deal with this, never with Postgres error codes.
 */
export class BookingOverlapError extends Error {
  constructor() {
    super("Booking overlaps an existing booking");
    this.name = "BookingOverlapError";
  }
}

/** Data access for bookings. The only place that knows bookings live in Prisma/Postgres. */
export const bookingRepository = {
  /** Bookings of a room that end after `from`, earliest first. */
  findByRoomEndingAfter(roomId: number, from: Date) {
    return prisma.booking.findMany({
      where: { roomId, endTime: { gt: from } },
      orderBy: { startTime: "asc" },
    });
  },

  /** The earliest booking in the same room whose time overlaps [start, end). */
  findFirstOverlapping(roomId: number, start: Date, end: Date) {
    return prisma.booking.findFirst({
      where: { roomId, startTime: { lt: end }, endTime: { gt: start } },
      orderBy: { startTime: "asc" },
    });
  },

  async create(data: NewBooking) {
    try {
      return await prisma.booking.create({ data });
    } catch (err) {
      if (isOverlapViolation(err)) throw new BookingOverlapError();
      throw err;
    }
  },

  /** The one query that reads pinHash, which every other query omits (see db.ts). */
  findByIdWithPinHash(id: number) {
    return prisma.booking.findUnique({ where: { id }, omit: { pinHash: false } });
  },

  /** Returns false when the booking was already gone (e.g. a parallel cancel deleted it). */
  async deleteById(id: number): Promise<boolean> {
    // deleteMany does not throw when nothing matches, unlike delete.
    const { count } = await prisma.booking.deleteMany({ where: { id } });
    return count > 0;
  },
};

/** True when a database error is the bookings_no_overlap exclusion violation (SQLSTATE 23P01). */
function isOverlapViolation(err: unknown): boolean {
  const seen = new Set<unknown>();
  const walk = (value: unknown): boolean => {
    if (!value || typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const obj = value as Record<string, unknown>;
    if (obj.code === "23P01" || obj.originalCode === "23P01") return true;
    if (typeof obj.message === "string" && obj.message.includes("bookings_no_overlap")) return true;
    return walk(obj.cause) || walk(obj.meta) || walk(obj.driverAdapterError);
  };
  return walk(err);
}
