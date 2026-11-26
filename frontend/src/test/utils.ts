import { vi } from "vitest";

/** Replace global fetch with a mock that returns the given responses in order. */
export function mockFetch(...responses: Array<{ status: number; body?: unknown } | Error>) {
  const fn = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else
      fn.mockResolvedValueOnce(
        new Response(r.body === undefined ? null : JSON.stringify(r.body), {
          status: r.status,
          headers: { "Content-Type": "application/json" },
        }),
      );
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** Parsed JSON body of the n-th fetch call. */
export function sentBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

export const booking = {
  id: 7,
  roomId: 1,
  bookerName: "สมชาย",
  startTime: "2030-01-15T03:00:00.000Z", // 10:00 Bangkok
  endTime: "2030-01-15T04:30:00.000Z", // 11:30 Bangkok
  createdAt: "2030-01-01T00:00:00.000Z",
};
