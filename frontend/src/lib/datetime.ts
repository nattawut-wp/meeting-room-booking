// Every meeting room is in Thailand, so dates and times are always shown and
// entered in Bangkok time, whatever time zone the visitor's computer uses.
//
// We do NOT use Intl.DateTimeFormat for display text: Node (which renders the
// booking list on the server) and browsers ship different locale data, e.g.
// Node writes Thursday as "พฤ." but Chrome writes "พฤหัส". Building the text
// ourselves gives the same result everywhere.
export const TIME_ZONE = "Asia/Bangkok";
const BANGKOK_OFFSET = "+07:00";
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // Thailand has no daylight saving time

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const BUDDHIST_ERA_OFFSET = 543;

/**
 * The same instant shifted by +7h, so its getUTC* methods return Bangkok wall-clock values.
 * Only read it with getUTC* methods.
 */
function bangkokClock(date: Date): Date {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "พฤ. 3 ธ.ค. 2569" */
export function formatDate(iso: string): string {
  const d = bangkokClock(new Date(iso));
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear() + BUDDHIST_ERA_OFFSET}`;
}

/** "09:00" */
export function formatTime(iso: string): string {
  const d = bangkokClock(new Date(iso));
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
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
  const d = bangkokClock(now);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Shift a "YYYY-MM-DD" date by n days: addDays("2030-01-31", 1) → "2030-02-01". */
export function addDays(dateKey: string, n: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Minutes since midnight → "HH:MM": minutesToTime(570) → "09:30". */
export function minutesToTime(minutes: number): string {
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

/** The instant (ms since epoch) of a Bangkok wall-clock time on a "YYYY-MM-DD" date. */
export function bangkokMs(dateKey: string, minutes: number): number {
  return Date.parse(toBangkokIso(dateKey, minutesToTime(minutes)));
}
