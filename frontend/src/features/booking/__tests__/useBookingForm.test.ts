import { describe, expect, it } from "vitest";
import { describeSubmitError, validateLocally } from "@/features/booking/hooks/useBookingForm";
import { ApiError } from "@/lib/api";

describe("validateLocally", () => {
  it("flags every empty field, and a name made of spaces", () => {
    const errors = validateLocally({ bookerName: "   ", date: "", start: "", end: "", pin: "" });
    expect(Object.keys(errors).sort()).toEqual(["bookerName", "date", "end", "pin", "start"]);
  });

  it("passes a filled-in form", () => {
    expect(
      validateLocally({ bookerName: "สมชาย", date: "2030-01-15", start: "10:00", end: "11:00", pin: "1234" }),
    ).toEqual({});
  });
});

describe("describeSubmitError", () => {
  it("says the server is unreachable for a network failure", () => {
    expect(describeSubmitError(new TypeError("fetch failed")).formError).toMatch("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  });

  it("names who holds the slot on 409", () => {
    const err = new ApiError(409, {
      code: "BOOKING_CONFLICT",
      message: "conflict",
      details: {
        conflict: { bookerName: "สมหญิง", startTime: "2030-01-15T03:00:00Z", endTime: "2030-01-15T04:00:00Z" },
      },
    });
    expect(describeSubmitError(err).formError).toMatch(/สมหญิง.*10:00/);
  });

  it("maps API field names onto the form's inputs on 400", () => {
    const err = new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "invalid",
      details: { fields: { startTime: ["ไม่สามารถจองเวลาที่ผ่านไปแล้ว"], unknownField: ["ignored"] } },
    });
    expect(describeSubmitError(err)).toEqual({ fieldErrors: { start: "ไม่สามารถจองเวลาที่ผ่านไปแล้ว" } });
  });

  it("falls back to the API message for anything else", () => {
    const err = new ApiError(500, { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดในระบบ" });
    expect(describeSubmitError(err)).toEqual({ formError: "เกิดข้อผิดพลาดในระบบ" });
  });
});
