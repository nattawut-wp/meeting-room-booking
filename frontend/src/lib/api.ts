export interface Room {
  id: number;
  name: string;
  capacity: number | null;
}

export interface Booking {
  id: number;
  roomId: number;
  bookerName: string;
  startTime: string; // ISO 8601 (UTC)
  endTime: string;
  createdAt: string;
}

export interface BookingConflict {
  bookerName: string;
  startTime: string;
  endTime: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: {
    fields?: Record<string, string[] | undefined>;
    conflict?: BookingConflict | null;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store", // bookings change all the time: always ask the API
    ...init,
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? { code: "UNKNOWN", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
    );
  }
  return body as T;
}

export function getRooms() {
  return request<Room[]>("/api/rooms");
}

export function getRoomBookings(roomId: number) {
  return request<Booking[]>(`/api/rooms/${roomId}/bookings`);
}

export interface CreateBookingInput {
  roomId: number;
  bookerName: string;
  startTime: string;
  endTime: string;
  pin: string;
}

export function createBooking(input: CreateBookingInput) {
  return request<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(input) });
}

export function cancelBooking(id: number, pin: string) {
  return request<void>(`/api/bookings/${id}`, { method: "DELETE", body: JSON.stringify({ pin }) });
}
