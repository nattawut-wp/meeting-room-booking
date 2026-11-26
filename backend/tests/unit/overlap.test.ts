import { describe, expect, it } from "vitest";
import { isOverlapping } from "../../src/lib/overlap";

// Existing booking A = 10:00–11:00. Times are minutes since midnight for readability.
const t = (h: number, m = 0) => new Date(Date.UTC(2030, 0, 1, h, m));
const A = { start: t(10), end: t(11) };

describe("isOverlapping (half-open [start, end))", () => {
  it.each([
    ["B entirely before A", t(8), t(9), false],
    ["B entirely after A", t(12), t(13), false],
    ["B ends exactly when A starts (touching)", t(9), t(10), false],
    ["B starts exactly when A ends (touching)", t(11), t(12), false],
    ["B overlaps A on the left", t(9, 30), t(10, 30), true],
    ["B overlaps A on the right", t(10, 30), t(11, 30), true],
    ["B inside A", t(10, 15), t(10, 45), true],
    ["B contains A", t(9), t(12), true],
    ["B identical to A", t(10), t(11), true],
    ["B overlaps by one minute at the start", t(9), t(10, 1), true],
    ["B overlaps by one minute at the end", t(10, 59), t(12), true],
  ])("%s → %s", (_label, start, end, expected) => {
    const B = { start, end };
    expect(isOverlapping(A, B)).toBe(expected);
    // Overlap is symmetric: the order of the arguments must not matter.
    expect(isOverlapping(B, A)).toBe(expected);
  });
});
