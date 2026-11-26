"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, cancelBooking, type Booking } from "@/lib/api";
import { formatDate, formatTimeRange } from "@/lib/datetime";

export function CancelBookingButton({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPin("");
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("รหัสยกเลิกต้องเป็นตัวเลข 4–6 หลัก");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await cancelBooking(booking.id, pin);
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setError("รหัสไม่ถูกต้อง");
      else if (err instanceof ApiError && err.status === 404) {
        setError("การจองนี้ถูกยกเลิกไปแล้ว");
        router.refresh();
      } else setError("ยกเลิกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  const pinId = `cancel-pin-${booking.id}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`ยกเลิกการจองของ ${booking.bookerName}`}
          />
        }
      >
        ยกเลิก
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>ยกเลิกการจอง</DialogTitle>
            <DialogDescription>
              {booking.bookerName} · {formatDate(booking.startTime)}{" "}
              {formatTimeRange(booking.startTime, booking.endTime)}
              <br />
              กรอกรหัสยกเลิกที่ตั้งไว้ตอนจอง
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor={pinId}>รหัสยกเลิก</Label>
            <Input
              id={pinId}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${pinId}-error` : undefined}
            />
            {error && (
              <p id={`${pinId}-error`} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>ปิด</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              ยืนยันยกเลิก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
