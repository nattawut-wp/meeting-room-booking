import { CalendarX2 } from "lucide-react";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Booking } from "@/lib/api";
import { formatDate, formatTimeRange } from "@/lib/datetime";

export function BookingList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
        <CalendarX2 className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">ยังไม่มีการจอง</p>
        <p className="text-sm text-muted-foreground">ห้องนี้ว่างทุกช่วงเวลา จองได้เลย</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table aria-label="รายการจอง">
        <TableHeader>
          <TableRow>
            <TableHead>วันที่</TableHead>
            <TableHead>เวลา</TableHead>
            <TableHead>ผู้จอง</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">การจัดการ</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="whitespace-nowrap">{formatDate(b.startTime)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium tabular-nums">
                {formatTimeRange(b.startTime, b.endTime)}
              </TableCell>
              <TableCell>{b.bookerName}</TableCell>
              <TableCell className="text-right">
                <CancelBookingButton booking={b} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
