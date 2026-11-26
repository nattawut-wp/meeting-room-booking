import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import { booking, mockFetch, sentBody } from "@/test/utils";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => refresh.mockReset());

async function openAndEnterPin(pin: string) {
  const user = userEvent.setup();
  render(<CancelBookingButton booking={booking} />);
  await user.click(screen.getByRole("button", { name: "ยกเลิกการจองของ สมชาย" }));
  await user.type(await screen.findByLabelText("รหัสยกเลิก"), pin);
  await user.click(screen.getByRole("button", { name: "ยืนยันยกเลิก" }));
  return user;
}

describe("CancelBookingButton", () => {
  it("opens a dialog describing the booking", async () => {
    const user = userEvent.setup();
    render(<CancelBookingButton booking={booking} />);
    await user.click(screen.getByRole("button", { name: "ยกเลิกการจองของ สมชาย" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("ยกเลิกการจอง");
    expect(dialog).toHaveTextContent("10:00–11:30");
  });

  it("sends DELETE with the PIN, closes the dialog and refreshes the list", async () => {
    const fetchMock = mockFetch({ status: 204 });
    await openAndEnterPin("2468");

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/bookings\/7$/);
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(sentBody(fetchMock)).toEqual({ pin: "2468" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows 'รหัสไม่ถูกต้อง' on a wrong PIN and keeps the dialog open", async () => {
    mockFetch({ status: 403, body: { error: { code: "INVALID_PIN", message: "รหัสยกเลิกไม่ถูกต้อง" } } });
    await openAndEnterPin("0000");

    expect(await screen.findByRole("alert")).toHaveTextContent("รหัสไม่ถูกต้อง");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rejects a malformed PIN without calling the API", async () => {
    const fetchMock = mockFetch();
    await openAndEnterPin("12");

    expect(await screen.findByRole("alert")).toHaveTextContent("ตัวเลข 4–6 หลัก");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes the list when the booking was already cancelled (404)", async () => {
    mockFetch({ status: 404, body: { error: { code: "BOOKING_NOT_FOUND", message: "ไม่พบการจองนี้" } } });
    await openAndEnterPin("2468");

    expect(await screen.findByRole("alert")).toHaveTextContent("ถูกยกเลิกไปแล้ว");
    expect(refresh).toHaveBeenCalledOnce();
  });
});
