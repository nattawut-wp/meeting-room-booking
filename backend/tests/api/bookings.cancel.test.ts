import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import { at, bookingBody, ROOM_A } from "../helpers";

const app = createApp();

async function createBooking(overrides: Record<string, unknown> = {}) {
  const res = await request(app).post("/api/bookings").send(bookingBody(overrides)).expect(201);
  return res.body as { id: number };
}

const cancel = (id: number | string, body?: object) => {
  const req = request(app).delete(`/api/bookings/${id}`);
  return body === undefined ? req : req.send(body);
};

// Spec: "ยกเลิกการจอง คนที่จองต้องลบเอง"
describe("DELETE /api/bookings/:id — only the booker can cancel", () => {
  it("cancels with the correct PIN (204) and the booking disappears from the list", async () => {
    const { id } = await createBooking({ pin: "2468" });

    const res = await cancel(id, { pin: "2468" }).expect(204);
    expect(res.body).toEqual({});

    const list = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(list.body).toEqual([]);
    expect(await prisma.booking.count()).toBe(0);
  });

  it("frees the slot so someone else can book the same time", async () => {
    const { id } = await createBooking({ pin: "2468" });
    await cancel(id, { pin: "2468" }).expect(204);
    await request(app).post("/api/bookings").send(bookingBody({ bookerName: "คนใหม่" })).expect(201);
  });

  it("refuses a wrong PIN with 403 and keeps the booking", async () => {
    const { id } = await createBooking({ pin: "2468" });

    const res = await cancel(id, { pin: "0000" }).expect(403);
    expect(res.body.error.code).toBe("INVALID_PIN");
    expect(await prisma.booking.count()).toBe(1);
  });

  it("does not let the PIN of booking A cancel booking B", async () => {
    await createBooking({ pin: "1111", startTime: at(9), endTime: at(10) });
    const b = await createBooking({ pin: "2222", startTime: at(10), endTime: at(11) });

    await cancel(b.id, { pin: "1111" }).expect(403);
    expect(await prisma.booking.count()).toBe(2);
  });

  it.each([
    ["no body", undefined],
    ["empty body", {}],
    ["PIN in the wrong format", { pin: "12" }],
    ["PIN as a number", { pin: 2468 }],
  ])("returns 400 for %s", async (_label, body) => {
    const { id } = await createBooking({ pin: "2468" });
    const res = await cancel(id, body).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(await prisma.booking.count()).toBe(1);
  });

  it("returns 404 for a booking that does not exist", async () => {
    const res = await cancel(999, { pin: "1234" }).expect(404);
    expect(res.body.error.code).toBe("BOOKING_NOT_FOUND");
  });

  it("returns 404 when cancelling the same booking twice", async () => {
    const { id } = await createBooking({ pin: "2468" });
    await cancel(id, { pin: "2468" }).expect(204);
    await cancel(id, { pin: "2468" }).expect(404);
  });

  it("returns 400 when the id is not a number", async () => {
    await cancel("abc", { pin: "1234" }).expect(400);
  });

  it("error responses never leak the PIN hash", async () => {
    const { id } = await createBooking({ pin: "2468" });
    const res = await cancel(id, { pin: "0000" }).expect(403);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$|pinHash|2468/);
  });
});
