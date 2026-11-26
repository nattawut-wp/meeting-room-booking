import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import { at, bookingBody, ROOM_A, ROOM_B } from "../helpers";

const app = createApp();
const post = (body: unknown) => request(app).post("/api/bookings").send(body as object);

// Spec: "ระบบจองห้องประชุม ที่ทุกคนสามารถมาจองได้" + ชื่อผู้จอง / วันเวลา / ห้อง
describe("POST /api/bookings — creating a booking", () => {
  it("lets anyone book without logging in (no auth header)", async () => {
    const res = await post(bookingBody()).expect(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      roomId: ROOM_A,
      bookerName: "สมชาย",
      startTime: at(10),
      endTime: at(11),
    });
    expect(await prisma.booking.count()).toBe(1);
  });

  it("trims the booker name before saving", async () => {
    const res = await post(bookingBody({ bookerName: "  สมชาย  " })).expect(201);
    expect(res.body.bookerName).toBe("สมชาย");
  });

  it("stores times as the same instant when sent with a +07:00 offset", async () => {
    const startUtc = at(10);
    const startBkk = new Date(new Date(startUtc).getTime() + 7 * 3600_000)
      .toISOString()
      .replace(".000Z", "+07:00");
    const endBkk = new Date(new Date(at(11)).getTime() + 7 * 3600_000)
      .toISOString()
      .replace(".000Z", "+07:00");

    const res = await post(bookingBody({ startTime: startBkk, endTime: endBkk })).expect(201);
    expect(res.body.startTime).toBe(startUtc);
  });

  it("never returns the PIN or its hash, and stores only a bcrypt hash", async () => {
    const res = await post(bookingBody({ pin: "4321" })).expect(201);
    expect(res.body).not.toHaveProperty("pinHash");
    expect(res.body).not.toHaveProperty("pin");

    const row = await prisma.booking.findUniqueOrThrow({ where: { id: res.body.id }, omit: { pinHash: false } });
    expect(row.pinHash).not.toBe("4321");
    expect(row.pinHash).toMatch(/^\$2[aby]\$/);
  });

  describe("validation → 400 VALIDATION_ERROR naming the bad field", () => {
    it.each([
      ["empty name", { bookerName: "" }, "bookerName"],
      ["name of only spaces", { bookerName: "   " }, "bookerName"],
      ["name over 100 chars", { bookerName: "ก".repeat(101) }, "bookerName"],
      ["roomId 0", { roomId: 0 }, "roomId"],
      ["roomId as string", { roomId: "1" }, "roomId"],
      ["start not ISO", { startTime: "tomorrow 10am" }, "startTime"],
      ["end equal to start", { endTime: at(10) }, "endTime"],
      ["end before start", { startTime: at(11), endTime: at(10) }, "endTime"],
      ["longer than 8 hours", { startTime: at(8), endTime: at(16.5) }, "endTime"],
      ["start in the past", { startTime: new Date(Date.now() - 3600_000).toISOString(), endTime: at(1) }, "startTime"],
      ["pin too short", { pin: "123" }, "pin"],
      ["pin too long", { pin: "1234567" }, "pin"],
      ["pin with letters", { pin: "12a4" }, "pin"],
    ])("%s", async (_label, override, field) => {
      const res = await post(bookingBody(override)).expect(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Object.keys(res.body.error.details.fields)).toContain(field);
      expect(await prisma.booking.count()).toBe(0);
    });

    it.each(["roomId", "bookerName", "startTime", "endTime", "pin"])(
      "missing %s",
      async (field) => {
        const body: Record<string, unknown> = bookingBody();
        delete body[field];
        const res = await post(body).expect(400);
        expect(Object.keys(res.body.error.details.fields)).toContain(field);
      },
    );

    it("an exactly 8 hour booking is allowed", async () => {
      await post(bookingBody({ startTime: at(8), endTime: at(16) })).expect(201);
    });

    it("body that is not valid JSON", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Content-Type", "application/json")
        .send('{"roomId": 1,')
        .expect(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  it("returns 404 ROOM_NOT_FOUND for a room that does not exist", async () => {
    const res = await post(bookingBody({ roomId: 999 })).expect(404);
    expect(res.body.error.code).toBe("ROOM_NOT_FOUND");
  });
});

// Spec: "วันเวลาจองห้ามซ้อนในห้องเดียวกัน"
describe("POST /api/bookings — no overlapping times in the same room", () => {
  // Existing booking: Room A, 10:00–11:00, by สมชาย
  const existing = () => post(bookingBody({ bookerName: "สมชาย" })).expect(201);

  it.each([
    ["identical time", 10, 11],
    ["overlaps the start", 9.5, 10.5],
    ["overlaps the end", 10.5, 11.5],
    ["inside the existing booking", 10.25, 10.75],
    ["contains the existing booking", 9, 12],
    ["overlaps by one minute at the start", 9, 10 + 1 / 60],
    ["overlaps by one minute at the end", 11 - 1 / 60, 12],
  ])("rejects %s with 409 and says who holds the slot", async (_label, start, end) => {
    await existing();
    const res = await post(
      bookingBody({ bookerName: "สมหญิง", startTime: at(start), endTime: at(end) }),
    ).expect(409);

    expect(res.body.error.code).toBe("BOOKING_CONFLICT");
    expect(res.body.error.details.conflict).toEqual({
      bookerName: "สมชาย",
      startTime: at(10),
      endTime: at(11),
    });
    expect(await prisma.booking.count()).toBe(1); // nothing was saved
  });

  it.each([
    ["ending exactly when it starts (09:00–10:00)", 9, 10],
    ["starting exactly when it ends (11:00–12:00)", 11, 12],
    ["well before", 7, 8],
    ["well after", 13, 14],
  ])("allows a booking %s", async (_label, start, end) => {
    await existing();
    await post(bookingBody({ startTime: at(start), endTime: at(end) })).expect(201);
    expect(await prisma.booking.count()).toBe(2);
  });

  it("allows the same time in a different room", async () => {
    await existing();
    await post(bookingBody({ roomId: ROOM_B })).expect(201);
  });

  it("allows back-to-back bookings filling a whole morning", async () => {
    for (const h of [8, 9, 10, 11]) {
      await post(bookingBody({ startTime: at(h), endTime: at(h + 1), bookerName: `p${h}` })).expect(201);
    }
    expect(await prisma.booking.count()).toBe(4);
  });
});
