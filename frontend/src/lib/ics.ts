import type { Booking } from "@/lib/api";

// An .ics file is the one calendar format Google Calendar, Outlook and Apple Calendar all import.
// Times are written in UTC ("Z"), so every calendar shows them in its own time zone correctly.

/** 2030-01-15T03:00:00.000Z → 20300115T030000Z */
function icsTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Commas, semicolons, backslashes and newlines have special meaning in .ics text. */
function icsText(text: string): string {
  return text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function bookingToIcs(booking: Booking, roomName: string, now: Date = new Date()): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//meeting-room-booking//TH",
    "BEGIN:VEVENT",
    `UID:booking-${booking.id}@meeting-room-booking`,
    `DTSTAMP:${icsTime(now.toISOString())}`,
    `DTSTART:${icsTime(booking.startTime)}`,
    `DTEND:${icsTime(booking.endTime)}`,
    `SUMMARY:${icsText(`ประชุมที่ ${roomName}`)}`,
    `LOCATION:${icsText(roomName)}`,
    `DESCRIPTION:${icsText(`จองโดย ${booking.bookerName}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n"); // the format requires CRLF line endings
}
