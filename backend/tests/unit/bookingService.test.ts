import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The service is tested without a database: its repositories are replaced by fakes.
vi.mock("../../src/config", () => ({ config: { bcryptRounds: 4 } }));
vi.mock("../../src/repositories/roomRepository", () => ({
  roomRepository: { findAll: vi.fn(), findById: vi.fn() },
}));
vi.mock("../../src/repositories/bookingRepository", async (importOriginal) => ({
  // Keep the real BookingOverlapError class so `instanceof` works.
  BookingOverlapError: (await importOriginal<typeof import("../../src/repositories/bookingRepository")>())
    .BookingOverlapError,
  bookingRepository: {
    findFirstOverlapping: vi.fn(),
    create: vi.fn(),
    findByIdWithPinHash: vi.fn(),
    deleteById: vi.fn(),
    findByRoomEndingAfter: vi.fn(),
  },
}));

const { bookingService } = await import("../../src/services/bookingService");
const { BookingOverlapError, bookingRepository } = await import("../../src/repositories/bookingRepository");
const { roomRepository } = await import("../../src/repositories/roomRepository");

const repo = vi.mocked(bookingRepository);
const rooms = vi.mocked(roomRepository);

const input = {
  roomId: 1,
  bookerName: "สมชาย",
  startTime: new Date("2030-01-15T03:00:00Z"),
  endTime: new Date("2030-01-15T04:00:00Z"),
  pin: "1234",
};
const holder = { id: 7, bookerName: "สมหญิง", startTime: input.startTime, endTime: input.endTime };

beforeEach(() => {
  vi.resetAllMocks();
  rooms.findById.mockResolvedValue({ id: 1, name: "A", capacity: 6 } as never);
});

describe("bookingService.createBooking", () => {
  it("rejects an unknown room with ROOM_NOT_FOUND", async () => {
    rooms.findById.mockResolvedValue(null);
    await expect(bookingService.createBooking(input)).rejects.toMatchObject({ code: "ROOM_NOT_FOUND" });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("names who holds the slot when the app-level check finds a conflict", async () => {
    repo.findFirstOverlapping.mockResolvedValue(holder as never);
    await expect(bookingService.createBooking(input)).rejects.toMatchObject({
      code: "BOOKING_CONFLICT",
      details: { conflict: { bookerName: "สมหญิง" } },
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("turns a lost race (DB constraint) into BOOKING_CONFLICT too", async () => {
    repo.findFirstOverlapping.mockResolvedValueOnce(null).mockResolvedValueOnce(holder as never);
    repo.create.mockRejectedValue(new BookingOverlapError());
    await expect(bookingService.createBooking(input)).rejects.toMatchObject({ code: "BOOKING_CONFLICT" });
  });

  it("stores a hash of the PIN, never the PIN itself", async () => {
    repo.findFirstOverlapping.mockResolvedValue(null);
    repo.create.mockImplementation(async (data) => ({ id: 1, createdAt: new Date(), ...data }) as never);
    await bookingService.createBooking(input);
    const saved = repo.create.mock.calls[0][0];
    expect(saved.pinHash).not.toBe("1234");
    expect(await bcrypt.compare("1234", saved.pinHash)).toBe(true);
  });
});

describe("bookingService.cancelBooking", () => {
  const stored = async (pin: string) => ({ ...holder, pinHash: await bcrypt.hash(pin, 4) }) as never;

  it("refuses a wrong PIN with INVALID_PIN and deletes nothing", async () => {
    repo.findByIdWithPinHash.mockResolvedValue(await stored("1234"));
    await expect(bookingService.cancelBooking(7, "9999")).rejects.toMatchObject({ code: "INVALID_PIN" });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it("reports BOOKING_NOT_FOUND when a parallel cancel already deleted it", async () => {
    repo.findByIdWithPinHash.mockResolvedValue(await stored("1234"));
    repo.deleteById.mockResolvedValue(false);
    await expect(bookingService.cancelBooking(7, "1234")).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
  });
});
