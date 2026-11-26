import { describe, expect, it, vi } from "vitest";
import {
  addDays,
  bangkokMs,
  formatDate,
  formatTime,
  formatTimeRange,
  minutesToTime,
  toBangkokIso,
  todayInBangkok,
} from "./datetime";

describe("datetime helpers (always Bangkok time)", () => {
  it("builds an ISO string with the +07:00 offset from date and time inputs", () => {
    expect(toBangkokIso("2030-01-15", "09:30")).toBe("2030-01-15T09:30:00+07:00");
    expect(new Date(toBangkokIso("2030-01-15", "09:30")).toISOString()).toBe("2030-01-15T02:30:00.000Z");
  });

  it("shows UTC instants in Bangkok time", () => {
    expect(formatTime("2030-01-15T03:00:00.000Z")).toBe("10:00");
    expect(formatTime("2030-01-15T16:05:00.000Z")).toBe("23:05");
    expect(formatTime("2030-01-15T17:00:00.000Z")).toBe("00:00");
    expect(formatTimeRange("2030-01-15T03:00:00.000Z", "2030-01-15T04:30:00.000Z")).toBe("10:00–11:30");
  });

  it("knows it is already tomorrow in Bangkok late in the UTC evening", () => {
    expect(todayInBangkok(new Date("2030-01-15T18:00:00Z"))).toBe("2030-01-16");
    expect(todayInBangkok(new Date("2030-01-15T16:00:00Z"))).toBe("2030-01-15");
  });

  describe("formatDate", () => {
    // 2026-11-29 is a Sunday. 03:00 UTC = 10:00 in Bangkok, the same day.
    it.each([
      ["2026-11-29T03:00:00Z", "อา. 29 พ.ย. 2569"],
      ["2026-11-30T03:00:00Z", "จ. 30 พ.ย. 2569"],
      ["2026-12-01T03:00:00Z", "อ. 1 ธ.ค. 2569"],
      ["2026-12-02T03:00:00Z", "พ. 2 ธ.ค. 2569"],
      ["2026-12-03T03:00:00Z", "พฤ. 3 ธ.ค. 2569"],
      ["2026-12-04T03:00:00Z", "ศ. 4 ธ.ค. 2569"],
      ["2026-12-05T03:00:00Z", "ส. 5 ธ.ค. 2569"],
      ["2027-01-01T03:00:00Z", "ศ. 1 ม.ค. 2570"],
    ])("%s → %s", (iso, expected) => {
      expect(formatDate(iso)).toBe(expected);
    });

    it("uses the Bangkok date, not the UTC date", () => {
      // 20:00 UTC on Wed 2 Dec is already 03:00 on Thu 3 Dec in Bangkok.
      expect(formatDate("2026-12-02T20:00:00Z")).toBe("พฤ. 3 ธ.ค. 2569");
    });

    it("gives the same text whatever the runtime's Intl data says", async () => {
      // Chromium abbreviates Thursday as "พฤหัส" while Node says "พฤ.".
      // Server and browser render the same booking, so the result must not depend on Intl.
      vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
        () =>
          ({
            format: () => "พฤหัส 3 ธ.ค. 2569",
            formatToParts: () => [{ type: "weekday", value: "พฤหัส" }],
          }) as unknown as Intl.DateTimeFormat,
      );
      // Load a fresh copy of the module so anything it builds at import time sees the mock too.
      vi.resetModules();
      const fresh = await import("./datetime");
      expect(fresh.formatDate("2026-12-03T03:00:00Z")).toBe("พฤ. 3 ธ.ค. 2569");
      expect(fresh.formatTime("2026-12-03T03:00:00Z")).toBe("10:00");
    });
  });
});

describe("timeline helpers", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2030-01-31", 1)).toBe("2030-02-01");
    expect(addDays("2030-12-31", 1)).toBe("2031-01-01");
    expect(addDays("2030-03-01", -1)).toBe("2030-02-28");
  });

  it("turns minutes since midnight into HH:MM", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(1200)).toBe("20:00");
  });

  it("gives the instant of a Bangkok wall-clock time", () => {
    expect(new Date(bangkokMs("2030-01-15", 600)).toISOString()).toBe("2030-01-15T03:00:00.000Z");
  });
});
