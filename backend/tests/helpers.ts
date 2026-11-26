export const ROOMS = [
  { name: "ห้องประชุม A", capacity: 6 },
  { name: "ห้องประชุม B", capacity: 10 },
  { name: "ห้องประชุม C", capacity: 20 },
];

export const ROOM_A = 1;
export const ROOM_B = 2;

const HOUR = 60 * 60 * 1000;

/**
 * A fixed base time far enough in the future that "not in the past" always
 * holds, aligned to a whole day so test cases can say "10:00", "11:00", ...
 */
const base = new Date(Date.now() + 7 * 24 * HOUR);
base.setUTCHours(0, 0, 0, 0);

/** ISO string for `hour` (may be fractional, e.g. 10.5 = 10:30) on the base day, in UTC. */
export function at(hour: number): string {
  return new Date(base.getTime() + hour * HOUR).toISOString();
}

export function bookingBody(overrides: Record<string, unknown> = {}) {
  return {
    roomId: ROOM_A,
    bookerName: "สมชาย",
    startTime: at(10),
    endTime: at(11),
    pin: "1234",
    ...overrides,
  };
}
