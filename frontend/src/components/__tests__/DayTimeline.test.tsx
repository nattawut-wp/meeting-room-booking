import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DayTimeline } from "@/components/DayTimeline";
import { booking } from "@/test/utils"; // 10:00–11:30 Bangkok on 2030-01-15

const DATE = "2030-01-15";

function setup(onSelect = vi.fn()) {
  render(
    <DayTimeline bookings={[booking]} date={DATE} onDateChange={vi.fn()} selection={null} onSelect={onSelect} />,
  );
  return onSelect;
}

describe("DayTimeline", () => {
  it("shows booked slots with the booker's name, not as buttons", () => {
    setup();
    expect(screen.getByText(/สมชาย/)).toHaveTextContent("ไม่ว่าง · สมชาย");
    expect(screen.queryByRole("button", { name: /^10:00–10:30/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "09:00–09:30 ว่าง กดเพื่อเลือก" })).toBeEnabled();
  });

  it("picks one hour from a free slot", async () => {
    const onSelect = setup();
    await userEvent.click(screen.getByRole("button", { name: /^13:00–13:30/ }));
    expect(onSelect).toHaveBeenCalledWith({ date: DATE, start: "13:00", end: "14:00" });
  });

  it("stops the pick where the next booking starts", async () => {
    const onSelect = setup();
    await userEvent.click(screen.getByRole("button", { name: /^09:30–10:00/ }));
    expect(onSelect).toHaveBeenCalledWith({ date: DATE, start: "09:30", end: "10:00" });
  });
});
