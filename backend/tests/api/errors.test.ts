import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/db";

const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("general error handling", () => {
  it("health check responds", async () => {
    await request(app).get("/api/health").expect(200, { ok: true });
  });

  it("unknown routes return 404 in the standard error shape", async () => {
    const res = await request(app).get("/api/nope").expect(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: expect.any(String) },
    });
  });

  it("unexpected errors return 500 without leaking internals", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(prisma.room, "findMany").mockRejectedValueOnce(new Error("secret db password in stack"));

    const res = await request(app).get("/api/rooms").expect(500);
    expect(res.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: expect.any(String) },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/secret|stack|at /);
  });

  it("CORS allows only the configured frontend origin", async () => {
    const res = await request(app)
      .get("/api/rooms")
      .set("Origin", process.env.CORS_ORIGIN!)
      .expect(200);
    expect(res.headers["access-control-allow-origin"]).toBe(process.env.CORS_ORIGIN);

    const other = await request(app).get("/api/rooms").set("Origin", "http://evil.example");
    expect(other.headers["access-control-allow-origin"]).not.toBe("http://evil.example");
  });
});
