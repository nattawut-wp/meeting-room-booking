// Every meeting room is in Thailand, so dates and times are always shown and
// entered in Bangkok time, whatever time zone the visitor's computer uses.
export const TIME_ZONE = "Asia/Bangkok";
const BANGKOK_OFFSET = "+07:00";

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("th-TH", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "พฤ. 3 ธ.ค. 2569" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** "09:00" */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** "09:00–10:30" */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)}–${formatTime(endIso)}`;
}

/** Combine values from <input type="date"> and <input type="time"> into an ISO string in Bangkok time. */
export function toBangkokIso(date: string, time: string): string {
  return `${date}T${time}:00${BANGKOK_OFFSET}`;
}

/** Today's date in Bangkok as "YYYY-MM-DD" (the format <input type="date"> uses). */
export function todayInBangkok(now: Date = new Date()): string {
  // en-CA happens to format dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}
