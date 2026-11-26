import { describe, expect, it } from "vitest";
import { booking } from "@/test/utils";
import { bookingToIcs } from "./ics";

describe("bookingToIcs", () => {
  const ics = bookingToIcs(booking, "ห้องประชุม A, ชั้น 2", new Date("2030-01-01T00:00:00Z"));
  const lines = ics.split("\r\n");

  it("writes start and end in UTC", () => {
    expect(lines).toContain("DTSTART:20300115T030000Z");
    expect(lines).toContain("DTEND:20300115T043000Z");
  });

  it("escapes commas in text fields", () => {
    expect(lines).toContain("LOCATION:ห้องประชุม A\\, ชั้น 2");
  });

  it("uses CRLF line endings and a stable UID", () => {
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(lines).toContain("UID:booking-7@meeting-room-booking");
  });
});
