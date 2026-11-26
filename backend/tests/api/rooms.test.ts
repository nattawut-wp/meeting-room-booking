import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/db";
import { at, bookingBody, ROOM_A, ROOM_B } from "../helpers";

const app = createApp();
const HOUR = 60 * 60 * 1000;

describe("GET /api/rooms", () => {
  it("lists the 3 seeded rooms in id order", async () => {
    const res = await request(app).get("/api/rooms").expect(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.map((r: { id: number }) => r.id)).toEqual([1, 2, 3]);
    expect(res.body[0]).toMatchObject({ id: 1, name: "ห้องประชุม A", capacity: 6 });
  });
});

// Spec: "ต้องดูรายการได้ว่าห้องนี้ใครจองไว้บ้าง"
describe("GET /api/rooms/:id/bookings", () => {
  it("returns an empty list for a room with no bookings", async () => {
    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(res.body).toEqual([]);
  });

  it("shows who booked the room and when", async () => {
    await request(app).post("/api/bookings").send(bookingBody({ bookerName: "สมหญิง" })).expect(201);

    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      roomId: ROOM_A,
      bookerName: "สมหญิง",
      startTime: at(10),
      endTime: at(11),
    });
  });

  it("returns only bookings of that room", async () => {
    await request(app).post("/api/bookings").send(bookingBody({ roomId: ROOM_A, bookerName: "A-user" }));
    await request(app).post("/api/bookings").send(bookingBody({ roomId: ROOM_B, bookerName: "B-user" }));

    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(res.body.map((b: { bookerName: string }) => b.bookerName)).toEqual(["A-user"]);
  });

  it("sorts bookings by start time even when created out of order", async () => {
    for (const [start, name] of [[14, "third"], [9, "first"], [11, "second"]] as const) {
      await request(app)
        .post("/api/bookings")
        .send(bookingBody({ startTime: at(start), endTime: at(start + 1), bookerName: name }))
        .expect(201);
    }
    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(res.body.map((b: { bookerName: string }) => b.bookerName)).toEqual(["first", "second", "third"]);
  });

  it("hides bookings that have already ended, but keeps ones still in progress", async () => {
    const now = Date.now();
    // Inserted directly: the API itself refuses bookings in the past.
    await prisma.booking.createMany({
      data: [
        { roomId: ROOM_A, bookerName: "ended", startTime: new Date(now - 3 * HOUR), endTime: new Date(now - 2 * HOUR), pinHash: "x" },
        { roomId: ROOM_A, bookerName: "in-progress", startTime: new Date(now - HOUR), endTime: new Date(now + HOUR), pinHash: "x" },
      ],
    });
    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(res.body.map((b: { bookerName: string }) => b.bookerName)).toEqual(["in-progress"]);
  });

  it("filters with ?from=", async () => {
    await request(app).post("/api/bookings").send(bookingBody({ startTime: at(9), endTime: at(10), bookerName: "early" }));
    await request(app).post("/api/bookings").send(bookingBody({ startTime: at(15), endTime: at(16), bookerName: "late" }));

    const res = await request(app)
      .get(`/api/rooms/${ROOM_A}/bookings`)
      .query({ from: at(12) })
      .expect(200);
    expect(res.body.map((b: { bookerName: string }) => b.bookerName)).toEqual(["late"]);
  });

  it("returns 400 for an invalid ?from=", async () => {
    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings?from=yesterday`).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for a room that does not exist", async () => {
    const res = await request(app).get("/api/rooms/999/bookings").expect(404);
    expect(res.body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("returns 400 when the room id is not a number", async () => {
    const res = await request(app).get("/api/rooms/abc/bookings").expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("never exposes the PIN hash", async () => {
    await request(app).post("/api/bookings").send(bookingBody()).expect(201);
    const res = await request(app).get(`/api/rooms/${ROOM_A}/bookings`).expect(200);
    expect(res.body[0]).not.toHaveProperty("pinHash");
    expect(res.body[0]).not.toHaveProperty("pin");
  });
});
