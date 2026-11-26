import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingForm } from "@/components/BookingForm";
import { booking, mockFetch, sentBody } from "@/test/utils";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => refresh.mockReset());

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const user = userEvent.setup();
  const values = { name: "สมชาย", date: "2030-01-15", start: "10:00", end: "11:30", pin: "1234", ...overrides };
  if (values.name) await user.type(screen.getByLabelText("ชื่อผู้จอง"), values.name);
  if (values.date) await user.type(screen.getByLabelText("วันที่"), values.date);
  if (values.start) await user.type(screen.getByLabelText("เวลาเริ่ม"), values.start);
  if (values.end) await user.type(screen.getByLabelText("เวลาจบ"), values.end);
  if (values.pin) await user.type(screen.getByLabelText(/รหัสยกเลิก/), values.pin);
  return user;
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "ยืนยันการจอง" }));

describe("BookingForm", () => {
  it("shows an error under every empty field and does not call the API", async () => {
    const fetchMock = mockFetch();
    render(<BookingForm roomId={1} />);
    await submit(userEvent.setup());

    expect(screen.getByText("กรุณากรอกชื่อผู้จอง")).toBeInTheDocument();
    expect(screen.getByText("กรุณาเลือกวันที่")).toBeInTheDocument();
    expect(screen.getByText("กรุณาเลือกเวลาเริ่ม")).toBeInTheDocument();
    expect(screen.getByText("กรุณาเลือกเวลาจบ")).toBeInTheDocument();
    expect(screen.getByText("กรุณาตั้งรหัสยกเลิก")).toBeInTheDocument();
    expect(screen.getByLabelText("ชื่อผู้จอง")).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends Bangkok times as ISO, then clears the form and refreshes the list", async () => {
    const fetchMock = mockFetch({ status: 201, body: booking });
    render(<BookingForm roomId={3} />);
    const user = await fillForm();
    await submit(user);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/bookings$/);
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(sentBody(fetchMock)).toEqual({
      roomId: 3,
      bookerName: "สมชาย",
      startTime: "2030-01-15T10:00:00+07:00",
      endTime: "2030-01-15T11:30:00+07:00",
      pin: "1234",
    });

    const summary = await screen.findByRole("status");
    expect(summary).toHaveTextContent("จองสำเร็จ");
    expect(summary).toHaveTextContent("10:00–11:30");
    expect(screen.getByRole("button", { name: /เพิ่มลงปฏิทิน/ })).toBeInTheDocument();
    expect(screen.getByLabelText("ชื่อผู้จอง")).toHaveValue("");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("says who already holds the slot when the API answers 409", async () => {
    mockFetch({
      status: 409,
      body: {
        error: {
          code: "BOOKING_CONFLICT",
          message: "ช่วงเวลานี้มีคนจองห้องนี้ไว้แล้ว",
          details: { conflict: { bookerName: "สมหญิง", startTime: booking.startTime, endTime: booking.endTime } },
        },
      },
    });
    render(<BookingForm roomId={1} />);
    await submit(await fillForm());

    const alert = await screen.findByText(/ห้องนี้ถูก สมหญิง จองไว้แล้ว/);
    expect(alert).toHaveTextContent("10:00–11:30");
    expect(screen.getByLabelText("ชื่อผู้จอง")).toHaveValue("สมชาย"); // input kept so the user can adjust
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows API validation errors under the matching input", async () => {
    mockFetch({
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "ข้อมูลไม่ถูกต้อง",
          details: { fields: { endTime: ["เวลาจบต้องหลังเวลาเริ่ม"], pin: ["รหัสยกเลิกต้องเป็นตัวเลข 4–6 หลัก"] } },
        },
      },
    });
    render(<BookingForm roomId={1} />);
    await submit(await fillForm({ end: "09:00", pin: "12" }));

    const endError = await screen.findByText("เวลาจบต้องหลังเวลาเริ่ม");
    expect(screen.getByLabelText("เวลาจบ")).toHaveAttribute("aria-describedby", endError.id);
    expect(screen.getByText("รหัสยกเลิกต้องเป็นตัวเลข 4–6 หลัก")).toBeInTheDocument();
  });

  it("copies a time picked on the timeline into the inputs", () => {
    const { rerender } = render(<BookingForm roomId={1} />);
    rerender(<BookingForm roomId={1} prefill={{ date: "2030-01-15", start: "13:00", end: "14:00" }} />);
    expect(screen.getByLabelText("วันที่")).toHaveValue("2030-01-15");
    expect(screen.getByLabelText("เวลาเริ่ม")).toHaveValue("13:00");
    expect(screen.getByLabelText("เวลาจบ")).toHaveValue("14:00");
  });

  it("explains when the server cannot be reached", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    render(<BookingForm roomId={1} />);
    await submit(await fillForm());
    expect(await screen.findByText(/เชื่อมต่อเซิร์ฟเวอร์ไม่ได้/)).toBeInTheDocument();
  });
});
