import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import { at, bookingBody, ROOM_A } from "../helpers";

const app = createApp();

describe("race conditions — the database is the final guard", () => {
  it("of 5 simultaneous requests for the same slot, exactly one wins", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app).post("/api/bookings").send(bookingBody({ bookerName: `user-${i}` })),
      ),
    );

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    for (const r of results.filter((r) => r.status === 409)) {
      expect(r.body.error.code).toBe("BOOKING_CONFLICT");
    }
    expect(await prisma.booking.count()).toBe(1);
  });

  it("simultaneous overlapping (not identical) requests also leave only one booking", async () => {
    const ranges: [number, number][] = [[9, 11], [10, 12], [10.5, 11.5], [9.5, 10.5]];
    const results = await Promise.all(
      ranges.map(([s, e]) =>
        request(app).post("/api/bookings").send(bookingBody({ startTime: at(s), endTime: at(e) })),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await prisma.booking.count()).toBe(1);
  });

  it("the exclusion constraint rejects an overlapping row even when the app is bypassed", async () => {
    const insert = (start: string, end: string) =>
      prisma.$executeRaw`
        INSERT INTO "bookings" ("room_id", "booker_name", "start_time", "end_time", "pin_hash")
        VALUES (${ROOM_A}, 'raw', ${new Date(start)}, ${new Date(end)}, 'x')`;

    await insert(at(10), at(11));
    await expect(insert(at(10.5), at(11.5))).rejects.toThrow(/bookings_no_overlap|23P01|exclu/i);
    await insert(at(11), at(12)); // touching edges are fine at the DB level too
    expect(await prisma.booking.count()).toBe(2);
  });

  it("the check constraint rejects end <= start even when the app is bypassed", async () => {
    await expect(
      prisma.$executeRaw`
        INSERT INTO "bookings" ("room_id", "booker_name", "start_time", "end_time", "pin_hash")
        VALUES (${ROOM_A}, 'raw', ${new Date(at(11))}, ${new Date(at(10))}, 'x')`,
    ).rejects.toThrow(/bookings_valid_range|23514|check/i);
  });
});
