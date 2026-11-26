import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  cancelBookingSchema,
  createBookingSchema,
  idParamSchema,
} from "../../src/lib/validation";

// Freeze "now" so past/future checks never depend on the real clock.
const NOW = new Date("2030-01-01T00:00:00.000Z");
const iso = (h: number, m = 0) => new Date(Date.UTC(2030, 0, 1, h, m)).toISOString();

const valid = {
  roomId: 1,
  bookerName: "สมชาย",
  startTime: iso(10),
  endTime: iso(11),
  pin: "1234",
};

/** Field names that failed validation, e.g. ["endTime"]. */
function failedFields(input: unknown): string[] {
  const result = createBookingSchema.safeParse(input);
  if (result.success) return [];
  return Object.keys(z.flattenError(result.error).fieldErrors);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createBookingSchema", () => {
  it("accepts a valid booking and converts times to Date", () => {
    const parsed = createBookingSchema.parse(valid);
    expect(parsed.startTime).toBeInstanceOf(Date);
    expect(parsed.startTime.toISOString()).toBe(valid.startTime);
  });

  describe("bookerName", () => {
    it.each([
      ["empty", ""],
      ["only spaces", "   "],
      ["101 characters", "ก".repeat(101)],
      ["not a string", 123],
      ["missing", undefined],
    ])("rejects %s", (_label, bookerName) => {
      expect(failedFields({ ...valid, bookerName })).toEqual(["bookerName"]);
    });

    it("accepts exactly 100 characters", () => {
      expect(failedFields({ ...valid, bookerName: "ก".repeat(100) })).toEqual([]);
    });

    it("trims surrounding whitespace", () => {
      expect(createBookingSchema.parse({ ...valid, bookerName: "  สมชาย  " }).bookerName).toBe("สมชาย");
    });
  });

  describe("roomId", () => {
    it.each([
      ["zero", 0],
      ["negative", -1],
      ["a decimal", 1.5],
      ["a string", "1"],
      ["missing", undefined],
    ])("rejects %s", (_label, roomId) => {
      expect(failedFields({ ...valid, roomId })).toEqual(["roomId"]);
    });
  });

  describe("startTime / endTime", () => {
    it.each([
      ["not a date", "tomorrow"],
      ["a date without time", "2030-01-01"],
      ["a time without timezone offset", "2030-01-01T10:00:00"],
      ["a number", 1893492000000],
    ])("rejects startTime that is %s", (_label, startTime) => {
      expect(failedFields({ ...valid, startTime })).toContain("startTime");
    });

    it("accepts a +07:00 offset and keeps the same instant", () => {
      const parsed = createBookingSchema.parse({
        ...valid,
        startTime: "2030-01-01T17:00:00+07:00",
        endTime: "2030-01-01T18:00:00+07:00",
      });
      expect(parsed.startTime.toISOString()).toBe("2030-01-01T10:00:00.000Z");
    });

    it("rejects end equal to start", () => {
      expect(failedFields({ ...valid, endTime: valid.startTime })).toEqual(["endTime"]);
    });

    it("rejects end before start", () => {
      expect(failedFields({ ...valid, startTime: iso(11), endTime: iso(10) })).toEqual(["endTime"]);
    });

    it("rejects a start time in the past", () => {
      const past = new Date(NOW.getTime() - 60_000).toISOString();
      const end = new Date(NOW.getTime() + 60 * 60_000).toISOString();
      expect(failedFields({ ...valid, startTime: past, endTime: end })).toEqual(["startTime"]);
    });

    it("accepts a start time exactly now", () => {
      const end = new Date(NOW.getTime() + 60 * 60_000).toISOString();
      expect(failedFields({ ...valid, startTime: NOW.toISOString(), endTime: end })).toEqual([]);
    });

    it("accepts exactly 8 hours", () => {
      expect(failedFields({ ...valid, startTime: iso(8), endTime: iso(16) })).toEqual([]);
    });

    it("rejects 8 hours and 1 minute", () => {
      expect(failedFields({ ...valid, startTime: iso(8), endTime: iso(16, 1) })).toEqual(["endTime"]);
    });
  });

  describe("pin", () => {
    it.each(["1234", "12345", "123456"])("accepts %s", (pin) => {
      expect(failedFields({ ...valid, pin })).toEqual([]);
    });

    it.each([
      ["3 digits", "123"],
      ["7 digits", "1234567"],
      ["letters", "12a4"],
      ["spaces", "12 34"],
      ["a number instead of string", 1234],
      ["missing", undefined],
    ])("rejects %s", (_label, pin) => {
      expect(failedFields({ ...valid, pin })).toEqual(["pin"]);
    });
  });

  it("reports every missing field at once", () => {
    expect(failedFields({}).sort()).toEqual(["bookerName", "endTime", "pin", "roomId", "startTime"]);
  });
});

describe("cancelBookingSchema", () => {
  it("accepts a valid pin", () => {
    expect(cancelBookingSchema.safeParse({ pin: "9999" }).success).toBe(true);
  });
  it.each([{}, { pin: "" }, { pin: "12" }, { pin: "abcd" }])("rejects %j", (body) => {
    expect(cancelBookingSchema.safeParse(body).success).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("parses a numeric string", () => {
    expect(idParamSchema.parse("42")).toBe(42);
  });
  it.each(["abc", "0", "-1", "1.5", ""])("rejects %j", (id) => {
    expect(idParamSchema.safeParse(id).success).toBe(false);
  });
});
