"use client";

import { useState, type ReactNode } from "react";
import { BookingForm } from "@/components/BookingForm";
import { DayTimeline, type TimeSelection } from "@/components/DayTimeline";
import type { Booking, Room } from "@/lib/api";
import { todayInBangkok } from "@/lib/datetime";

/**
 * Owns the state the timeline and the form share: which day is shown, and which time is picked.
 * `children` (the server-rendered booking list) goes under the timeline.
 */
export function RoomScheduler({ room, bookings, children }: { room: Room; bookings: Booking[]; children: ReactNode }) {
  const [date, setDate] = useState(() => todayInBangkok());
  const [picked, setPicked] = useState<TimeSelection | null>(null); // sent to the form
  const [typed, setTyped] = useState<TimeSelection | null>(null); // what the form currently holds

  function handleTimeChange(sel: TimeSelection) {
    setTyped(sel);
    // Follow the form to the day the user typed, if it is a real date not in the past.
    if (/^\d{4}-\d{2}-\d{2}$/.test(sel.date) && sel.date >= todayInBangkok()) setDate(sel.date);
  }

  function handleSelect(sel: TimeSelection) {
    setPicked(sel);
    setTyped(sel);
    // On small screens the form sits above the timeline: bring it into view.
    document.getElementById("bookerName")?.focus({ preventScroll: true });
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <div id="booking-form" className="scroll-mt-4 lg:sticky lg:top-6">
        <BookingForm roomId={room.id} roomName={room.name} prefill={picked} onTimeChange={handleTimeChange} />
      </div>
      <div className="grid gap-6">
        <section aria-labelledby="timeline-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="timeline-heading" className="font-medium">
              ตารางห้อง
            </h2>
            <Legend />
          </div>
          <DayTimeline
            bookings={bookings}
            date={date}
            onDateChange={setDate}
            selection={typed}
            onSelect={handleSelect}
          />
          <p className="mt-2 text-xs text-muted-foreground">กดช่องที่ว่างเพื่อกรอกเวลาในฟอร์มให้อัตโนมัติ (1 ชั่วโมง)</p>
        </section>
        {children}
      </div>
    </div>
  );
}

function Legend() {
  const item = (swatch: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-sm ${swatch}`} aria-hidden />
      {label}
    </span>
  );
  return (
    <div className="flex gap-3 text-xs text-muted-foreground">
      {item("border border-available/40 bg-available/10", "ว่าง")}
      {item("border bg-muted bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_8px)]", "ไม่ว่าง")}
      {item("bg-primary", "ที่เลือก")}
    </div>
  );
}
