"use client";

import { CheckCircle2, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/api";
import { formatDate, formatTimeRange } from "@/lib/datetime";
import { bookingToIcs } from "@/lib/ics";

function downloadIcs(booking: Booking, roomName: string) {
  const blob = new Blob([bookingToIcs(booking, roomName)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking-${booking.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Confirmation shown after a booking: what was booked, and a way to put it in a calendar. */
export function BookingSummary({ booking, roomName }: { booking: Booking; roomName: string }) {
  return (
    <Alert role="status" className="border-available/30 bg-available/5">
      <CheckCircle2 className="text-available" aria-hidden />
      <AlertTitle>จองสำเร็จ</AlertTitle>
      <AlertDescription>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-foreground">
          <dt className="text-muted-foreground">ห้อง</dt>
          <dd>{roomName}</dd>
          <dt className="text-muted-foreground">วันที่</dt>
          <dd>{formatDate(booking.startTime)}</dd>
          <dt className="text-muted-foreground">เวลา</dt>
          <dd className="font-medium tabular-nums">{formatTimeRange(booking.startTime, booking.endTime)}</dd>
          <dt className="text-muted-foreground">ผู้จอง</dt>
          <dd>{booking.bookerName}</dd>
        </dl>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => downloadIcs(booking, roomName)}>
          <Download aria-hidden />
          เพิ่มลงปฏิทิน (.ics)
        </Button>
      </AlertDescription>
    </Alert>
  );
}
