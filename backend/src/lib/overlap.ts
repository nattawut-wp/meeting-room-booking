export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Two half-open ranges [start, end) overlap when each one starts before the
 * other ends. Touching edges (a.end === b.start) do NOT overlap.
 */
export function isOverlapping(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}
