import { describe, expect, it } from "vitest";
import { formatTime, formatTimeRange, toBangkokIso, todayInBangkok } from "./datetime";

describe("datetime helpers (always Bangkok time)", () => {
  it("builds an ISO string with the +07:00 offset from date and time inputs", () => {
    expect(toBangkokIso("2030-01-15", "09:30")).toBe("2030-01-15T09:30:00+07:00");
    expect(new Date(toBangkokIso("2030-01-15", "09:30")).toISOString()).toBe("2030-01-15T02:30:00.000Z");
  });

  it("shows UTC instants in Bangkok time", () => {
    expect(formatTime("2030-01-15T03:00:00.000Z")).toBe("10:00");
    expect(formatTimeRange("2030-01-15T03:00:00.000Z", "2030-01-15T04:30:00.000Z")).toBe("10:00–11:30");
  });

  it("knows it is already tomorrow in Bangkok late in the UTC evening", () => {
    expect(todayInBangkok(new Date("2030-01-15T18:00:00Z"))).toBe("2030-01-16");
    expect(todayInBangkok(new Date("2030-01-15T16:00:00Z"))).toBe("2030-01-15");
  });
});
