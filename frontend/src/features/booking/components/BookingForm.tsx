"use client";

import { CalendarPlus, Loader2, TriangleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingSummary } from "@/features/booking/components/BookingSummary";
import type { TimeSelection } from "@/features/booking/components/DayTimeline";
import { useBookingForm, type Field } from "@/features/booking/hooks/useBookingForm";
import { todayInBangkok } from "@/lib/datetime";

interface Props {
  roomId: number;
  roomName?: string;
  /** A time picked on the timeline; when it changes, it is copied into the date and time inputs. */
  prefill?: TimeSelection | null;
  /** Called whenever the user edits the date or a time, so the timeline can follow. */
  onTimeChange?: (selection: TimeSelection) => void;
}

export function BookingForm({ roomId, roomName = "ห้องประชุม", prefill = null, onTimeChange }: Props) {
  const { values, errors, formError, booked, pending, update, submit } = useBookingForm({
    roomId,
    prefill,
    onTimeChange,
  });

  // Everything a field needs from the form state, so each field below states only what makes it different.
  const field = (name: Field) => ({
    name,
    value: values[name],
    error: errors[name],
    onValueChange: (value: string) => update(name, value),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarPlus className="size-5 text-primary" aria-hidden />
          จองห้องนี้
        </CardTitle>
        <CardDescription>เวลาทั้งหมดเป็นเวลาประเทศไทย</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="grid gap-4" aria-label="ฟอร์มจองห้อง">
          {formError && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertTitle>จองไม่สำเร็จ</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {booked && <BookingSummary booking={booked} roomName={roomName} />}

          <FormField
            label="ชื่อผู้จอง"
            {...field("bookerName")}
            placeholder="เช่น สมชาย ใจดี"
            maxLength={100}
            autoComplete="name"
          />
          <FormField label="วันที่" {...field("date")} type="date" min={todayInBangkok()} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="เวลาเริ่ม" {...field("start")} type="time" step={300} />
            <FormField label="เวลาจบ" {...field("end")} type="time" step={300} />
          </div>
          <FormField
            label="รหัสยกเลิก (ตัวเลข 4–6 หลัก)"
            hint="จำรหัสนี้ไว้ ใช้ตอนยกเลิกการจอง"
            {...field("pin")}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder="••••"
          />

          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? "กำลังจอง..." : "ยืนยันการจอง"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type FormFieldProps = Omit<ComponentProps<typeof Input>, "name" | "value" | "onChange"> & {
  label: string;
  name: Field;
  value: string;
  error?: string;
  /** Shown under the input while there is no error. */
  hint?: ReactNode;
  onValueChange: (value: string) => void;
};

/** Label + input + error message, wired for screen readers (aria-invalid / aria-describedby). */
function FormField({ label, name, value, error, hint, onValueChange, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        {...inputProps}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
