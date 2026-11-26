import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingList } from "@/features/booking/components/BookingList";
import { booking } from "@/test/utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("BookingList", () => {
  it("shows an empty state when nobody has booked the room", () => {
    render(<BookingList bookings={[]} />);
    expect(screen.getByText("ยังไม่มีการจอง")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows who booked and when, in Bangkok time", () => {
    render(
      <BookingList
        bookings={[
          booking,
          { ...booking, id: 8, bookerName: "สมหญิง", startTime: "2030-01-15T06:00:00.000Z", endTime: "2030-01-15T07:00:00.000Z" },
        ]}
      />,
    );
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1); // skip header
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("สมชาย");
    expect(rows[0]).toHaveTextContent("10:00–11:30");
    expect(rows[1]).toHaveTextContent("สมหญิง");
    expect(rows[1]).toHaveTextContent("13:00–14:00");
    expect(within(rows[0]).getByRole("button", { name: "ยกเลิกการจองของ สมชาย" })).toBeInTheDocument();
  });
});
