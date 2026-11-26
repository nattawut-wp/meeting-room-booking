"use client";

import { CalendarPlus, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, createBooking } from "@/lib/api";
import { formatDate, formatTimeRange, toBangkokIso, todayInBangkok } from "@/lib/datetime";

type Field = "bookerName" | "date" | "start" | "end" | "pin";
type FieldErrors = Partial<Record<Field, string>>;

const EMPTY = { bookerName: "", date: "", start: "", end: "", pin: "" };

// The API reports errors on startTime/endTime; the form splits those into date + time inputs.
const API_FIELD_TO_FORM: Record<string, Field> = {
  bookerName: "bookerName",
  startTime: "start",
  endTime: "end",
  pin: "pin",
};

function validateLocally(values: typeof EMPTY): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.bookerName.trim()) errors.bookerName = "กรุณากรอกชื่อผู้จอง";
  if (!values.date) errors.date = "กรุณาเลือกวันที่";
  if (!values.start) errors.start = "กรุณาเลือกเวลาเริ่ม";
  if (!values.end) errors.end = "กรุณาเลือกเวลาจบ";
  if (!values.pin) errors.pin = "กรุณาตั้งรหัสยกเลิก";
  return errors;
}

export function BookingForm({ roomId }: { roomId: number }) {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const localErrors = validateLocally(values);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setPending(true);
    try {
      const booking = await createBooking({
        roomId,
        bookerName: values.bookerName,
        startTime: toBangkokIso(values.date, values.start),
        endTime: toBangkokIso(values.date, values.end),
        pin: values.pin,
      });
      setValues(EMPTY);
      setSuccess(
        `จองสำเร็จ: ${formatDate(booking.startTime)} ${formatTimeRange(booking.startTime, booking.endTime)}`,
      );
      router.refresh(); // re-fetch the booking list on the server
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setFormError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
      } else if (err.status === 409) {
        const c = err.body.details?.conflict;
        setFormError(
          c
            ? `ห้องนี้ถูก ${c.bookerName} จองไว้แล้ว ${formatDate(c.startTime)} ${formatTimeRange(c.startTime, c.endTime)}`
            : err.body.message,
        );
      } else if (err.status === 400 && err.body.details?.fields) {
        const fieldErrors: FieldErrors = {};
        for (const [apiField, messages] of Object.entries(err.body.details.fields)) {
          const field = API_FIELD_TO_FORM[apiField];
          if (field && messages?.[0]) fieldErrors[field] = messages[0];
        }
        setErrors(fieldErrors);
      } else {
        setFormError(err.body.message);
      }
    } finally {
      setPending(false);
    }
  }

  const fieldProps = (field: Field) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => update(field, e.target.value),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${field}-error`} className="text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;

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
        <form onSubmit={handleSubmit} noValidate className="grid gap-4" aria-label="ฟอร์มจองห้อง">
          {formError && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertTitle>จองไม่สำเร็จ</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <CheckCircle2 aria-hidden />
              <AlertTitle>เรียบร้อย</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="bookerName">ชื่อผู้จอง</Label>
            <Input {...fieldProps("bookerName")} placeholder="เช่น สมชาย ใจดี" maxLength={100} autoComplete="name" />
            {errorText("bookerName")}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">วันที่</Label>
            <Input {...fieldProps("date")} type="date" min={todayInBangkok()} />
            {errorText("date")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="start">เวลาเริ่ม</Label>
              <Input {...fieldProps("start")} type="time" step={300} />
              {errorText("start")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">เวลาจบ</Label>
              <Input {...fieldProps("end")} type="time" step={300} />
              {errorText("end")}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pin">รหัสยกเลิก (ตัวเลข 4–6 หลัก)</Label>
            <Input
              {...fieldProps("pin")}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              placeholder="••••"
            />
            {errorText("pin") ?? (
              <p className="text-xs text-muted-foreground">จำรหัสนี้ไว้ ใช้ตอนยกเลิกการจอง</p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? "กำลังจอง..." : "ยืนยันการจอง"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
