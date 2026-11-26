import { z } from "zod";

export const MAX_BOOKING_HOURS = 8;
const MAX_BOOKING_MS = MAX_BOOKING_HOURS * 60 * 60 * 1000;

const isoDateTime = z.iso
  .datetime({ offset: true, message: "ต้องเป็นวันเวลารูปแบบ ISO 8601" })
  .transform((s) => new Date(s));

export const pinSchema = z
  .string({ message: "กรุณากรอกรหัสยกเลิก" })
  .regex(/^\d{4,6}$/, "รหัสยกเลิกต้องเป็นตัวเลข 4–6 หลัก");

export const idParamSchema = z.coerce
  .number({ message: "id ต้องเป็นตัวเลข" })
  .int("id ต้องเป็นจำนวนเต็ม")
  .positive("id ต้องมากกว่า 0");

export const createBookingSchema = z
  .object({
    roomId: z
      .number({ message: "กรุณาเลือกห้อง" })
      .int("roomId ต้องเป็นจำนวนเต็ม")
      .positive("roomId ต้องมากกว่า 0"),
    bookerName: z
      .string({ message: "กรุณากรอกชื่อผู้จอง" })
      .trim()
      .min(1, "กรุณากรอกชื่อผู้จอง")
      .max(100, "ชื่อยาวได้ไม่เกิน 100 ตัวอักษร"),
    startTime: isoDateTime,
    endTime: isoDateTime,
    pin: pinSchema,
  })
  .superRefine((data, ctx) => {
    // zod 4 still runs this refinement when a field above failed, so the times
    // may not be Dates yet. Those fields already have their own error.
    if (!(data.startTime instanceof Date) || !(data.endTime instanceof Date)) return;

    if (data.endTime <= data.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "เวลาจบต้องหลังเวลาเริ่ม" });
      return;
    }
    if (data.startTime.getTime() < Date.now()) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "ไม่สามารถจองเวลาที่ผ่านไปแล้ว" });
    }
    if (data.endTime.getTime() - data.startTime.getTime() > MAX_BOOKING_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: `จองได้ไม่เกิน ${MAX_BOOKING_HOURS} ชั่วโมงต่อครั้ง`,
      });
    }
  });

export const cancelBookingSchema = z.object({ pin: pinSchema });

export const listBookingsQuerySchema = z.object({
  from: isoDateTime.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
