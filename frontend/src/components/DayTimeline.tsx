"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/api";
import { addDays, bangkokMs, formatDate, minutesToTime, toBangkokIso, todayInBangkok } from "@/lib/datetime";
import { cn } from "cn";

export const DAY_START = 8 * 60; // 08:00
export const DAY_END = 20 * 60; // 20:00
export const SLOT = 30; // minutes
const DEFAULT_LENGTH = 60; // a click books one hour, or less if the next booking starts sooner

export interface TimeSelection {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
}

// The current minute, read only in the browser. On the server (and during hydration) it is null,
// so the server HTML and the first browser render match; past slots get disabled right after.
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
const getNowMinute = () => Math.floor(Date.now() / 60_000);
const getServerNow = () => null;

interface Props {
  bookings: Booking[];
  date: string;
  onDateChange: (date: string) => void;
  selection: TimeSelection | null;
  onSelect: (selection: TimeSelection) => void;
}

export function DayTimeline({ bookings, date, onDateChange, selection, onSelect }: Props) {
  const nowMinute = useSyncExternalStore(subscribe, getNowMinute, getServerNow);
  const nowMs = nowMinute === null ? null : nowMinute * 60_000;
  const today = todayInBangkok();

  const slots: { minute: number; booking: Booking | undefined }[] = [];
  for (let m = DAY_START; m < DAY_END; m += SLOT) {
    const from = bangkokMs(date, m);
    const to = bangkokMs(date, m + SLOT);
    const booking = bookings.find((b) => Date.parse(b.startTime) < to && Date.parse(b.endTime) > from);
    slots.push({ minute: m, booking });
  }

  function pick(minute: number) {
    // Stretch from the clicked slot up to one hour, stopping at the next booking or the end of the day.
    let end = minute + SLOT;
    while (end < Math.min(minute + DEFAULT_LENGTH, DAY_END) && !slots.find((s) => s.minute === end)?.booking) {
      end += SLOT;
    }
    onSelect({ date, start: minutesToTime(minute), end: minutesToTime(end) });
  }

  const selFrom = selection?.date === date ? toMinutes(selection.start) : null;
  const selTo = selection?.date === date ? toMinutes(selection.end) : null;
  const freeCount = slots.filter((s) => !s.booking && !isPast(s.minute)).length;

  function isPast(minute: number) {
    return nowMs !== null && bangkokMs(date, minute + SLOT) <= nowMs;
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b bg-secondary/60 p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(addDays(date, -1))}
          disabled={date <= today}
          aria-label="วันก่อนหน้า"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div className="text-center">
          <p className="font-medium" aria-live="polite">
            {formatDate(toBangkokIso(date, "12:00"))}
          </p>
          <p className="text-xs text-muted-foreground">
            {date === today ? "วันนี้ · " : ""}ว่าง {freeCount} ช่วง
          </p>
        </div>
        <div className="flex items-center gap-1">
          {date !== today && (
            <Button variant="ghost" size="sm" onClick={() => onDateChange(today)}>
              วันนี้
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onDateChange(addDays(date, 1))} aria-label="วันถัดไป">
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <ol className="grid max-h-[26rem] gap-1 overflow-y-auto p-3" aria-label="ช่วงเวลาในตารางห้อง">
        {slots.map(({ minute, booking }) => {
          const label = `${minutesToTime(minute)}–${minutesToTime(minute + SLOT)}`;
          const time = (
            <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{minutesToTime(minute)}</span>
          );

          if (booking) {
            const first = Date.parse(booking.startTime) >= bangkokMs(date, minute);
            return (
              <li key={minute} className="flex items-center gap-2">
                {time}
                <div className="flex h-9 flex-1 items-center rounded-md bg-muted bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_8px)] px-3 text-sm text-muted-foreground">
                  {first ? (
                    <span className="truncate">
                      <span className="font-medium text-foreground/70">ไม่ว่าง</span> · {booking.bookerName}
                    </span>
                  ) : (
                    <span className="sr-only">ไม่ว่าง</span>
                  )}
                </div>
              </li>
            );
          }

          const past = isPast(minute);
          const selected = selFrom !== null && selTo !== null && minute >= selFrom && minute < selTo;
          return (
            <li key={minute} className="flex items-center gap-2">
              {time}
              <button
                type="button"
                disabled={past}
                onClick={() => pick(minute)}
                aria-pressed={selected}
                aria-label={past ? `${label} ผ่านไปแล้ว` : `${label} ว่าง กดเพื่อเลือก`}
                className={cn(
                  "flex h-9 flex-1 items-center rounded-md border px-3 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  past && "cursor-not-allowed border-dashed text-muted-foreground/60",
                  !past &&
                    !selected &&
                    "border-available/30 bg-available/5 text-available hover:border-available/60 hover:bg-available/10",
                  selected && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {past ? "ผ่านไปแล้ว" : selected ? "เลือกแล้ว" : "ว่าง"}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
