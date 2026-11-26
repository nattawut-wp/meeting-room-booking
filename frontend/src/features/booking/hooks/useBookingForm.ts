"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { TimeSelection } from "@/features/booking/components/DayTimeline";
import { ApiError, createBooking, type Booking } from "@/lib/api";
import { formatDate, formatTimeRange, toBangkokIso } from "@/lib/datetime";

export type Field = "bookerName" | "date" | "start" | "end" | "pin";
export type FormValues = Record<Field, string>;
export type FieldErrors = Partial<Record<Field, string>>;

const EMPTY: FormValues = { bookerName: "", date: "", start: "", end: "", pin: "" };

// The API reports errors on startTime/endTime; the form splits those into date + time inputs.
const API_FIELD_TO_FORM: Record<string, Field> = {
  bookerName: "bookerName",
  startTime: "start",
  endTime: "end",
  pin: "pin",
};

export function validateLocally(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.bookerName.trim()) errors.bookerName = "กรุณากรอกชื่อผู้จอง";
  if (!values.date) errors.date = "กรุณาเลือกวันที่";
  if (!values.start) errors.start = "กรุณาเลือกเวลาเริ่ม";
  if (!values.end) errors.end = "กรุณาเลือกเวลาจบ";
  if (!values.pin) errors.pin = "กรุณาตั้งรหัสยกเลิก";
  return errors;
}

/** Turns a failed createBooking call into what the form shows: per-field errors or one message. */
export function describeSubmitError(err: unknown): { fieldErrors?: FieldErrors; formError?: string } {
  if (!(err instanceof ApiError)) return { formError: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่" };

  if (err.status === 409) {
    const c = err.body.details?.conflict;
    return {
      formError: c
        ? `ห้องนี้ถูก ${c.bookerName} จองไว้แล้ว ${formatDate(c.startTime)} ${formatTimeRange(c.startTime, c.endTime)}`
        : err.body.message,
    };
  }

  if (err.status === 400 && err.body.details?.fields) {
    const fieldErrors: FieldErrors = {};
    for (const [apiField, messages] of Object.entries(err.body.details.fields)) {
      const field = API_FIELD_TO_FORM[apiField];
      if (field && messages?.[0]) fieldErrors[field] = messages[0];
    }
    return { fieldErrors };
  }

  return { formError: err.body.message };
}

interface Options {
  roomId: number;
  /** A time picked on the timeline; when it changes, it is copied into the date and time inputs. */
  prefill: TimeSelection | null;
  /** Called whenever the user edits the date or a time, so the timeline can follow. */
  onTimeChange?: (selection: TimeSelection) => void;
}

/** All state and behaviour of the booking form; the component only renders what this returns. */
export function useBookingForm({ roomId, prefill, onTimeChange }: Options) {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [pending, setPending] = useState(false);

  // Copy a new timeline pick into the form. Adjusting state while rendering (instead of in an
  // effect) is React's recommended way to react to a changed prop: no extra render with stale values.
  const [lastPrefill, setLastPrefill] = useState(prefill);
  if (prefill !== lastPrefill) {
    setLastPrefill(prefill);
    if (prefill) {
      setValues((v) => ({ ...v, date: prefill.date, start: prefill.start, end: prefill.end }));
      setErrors((e) => ({ ...e, date: undefined, start: undefined, end: undefined }));
      setBooked(null);
      setFormError(null);
    }
  }

  function update(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrors((e) => ({ ...e, [field]: undefined }));
    if (field === "date" || field === "start" || field === "end") {
      onTimeChange?.({ date: next.date, start: next.start, end: next.end });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setBooked(null);

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
      setBooked(booking);
      router.refresh(); // re-fetch the booking list on the server
    } catch (err) {
      const { fieldErrors, formError } = describeSubmitError(err);
      if (fieldErrors) setErrors(fieldErrors);
      if (formError) setFormError(formError);
    } finally {
      setPending(false);
    }
  }

  return { values, errors, formError, booked, pending, update, submit };
}
