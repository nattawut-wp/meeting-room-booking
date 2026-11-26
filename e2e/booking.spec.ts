import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

/** A date one week from today in Bangkok, as YYYY-MM-DD, so bookings are never in the past. */
function nextWeek(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);
}

const DATE = nextWeek();

// Every test starts with 3 empty rooms.
test.beforeEach(() => {
  execSync("npm --prefix backend run -s db:test:clean", { stdio: "inherit" });
});

async function openRoom(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

async function book(page: Page, values: { name: string; start: string; end: string; pin: string }) {
  await page.getByLabel("ชื่อผู้จอง").fill(values.name);
  await page.getByLabel("วันที่").fill(DATE);
  await page.getByLabel("เวลาเริ่ม").fill(values.start);
  await page.getByLabel("เวลาจบ").fill(values.end);
  await page.getByLabel(/รหัสยกเลิก/).fill(values.pin);
  await page.getByRole("button", { name: "ยืนยันการจอง" }).click();
}

const bookingRows = (page: Page) => page.getByRole("table", { name: "รายการจอง" }).locator("tbody tr");

test("1. home page lists the 3 rooms and opens a room", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ห้องประชุม", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /ห้องประชุม [ABC]/ })).toHaveCount(3);

  await openRoom(page, "ห้องประชุม A");
  await expect(page.getByText("ยังไม่มีการจอง")).toBeVisible();
});

test("2. anyone can book a room and see the booking in the list", async ({ page }) => {
  await openRoom(page, "ห้องประชุม A");
  await book(page, { name: "สมชาย", start: "10:00", end: "11:00", pin: "1234" });

  await expect(page.getByText(/จองสำเร็จ/)).toBeVisible();
  await expect(bookingRows(page)).toHaveCount(1);
  await expect(bookingRows(page).first()).toContainText("สมชาย");
  await expect(bookingRows(page).first()).toContainText("10:00–11:00");
});

test("3. an overlapping booking in the same room is refused and says who holds the slot", async ({ page }) => {
  await openRoom(page, "ห้องประชุม A");
  await book(page, { name: "สมชาย", start: "10:00", end: "11:00", pin: "1234" });
  await expect(bookingRows(page)).toHaveCount(1);

  await book(page, { name: "สมหญิง", start: "10:30", end: "11:30", pin: "5678" });
  await expect(page.getByText(/ห้องนี้ถูก สมชาย จองไว้แล้ว/)).toBeVisible();
  await expect(bookingRows(page)).toHaveCount(1);

  // Back-to-back is fine.
  await book(page, { name: "สมหญิง", start: "11:00", end: "12:00", pin: "5678" });
  await expect(bookingRows(page)).toHaveCount(2);
});

test("4. the same time can be booked in a different room", async ({ page }) => {
  await openRoom(page, "ห้องประชุม A");
  await book(page, { name: "สมชาย", start: "10:00", end: "11:00", pin: "1234" });
  await expect(bookingRows(page)).toHaveCount(1);

  await openRoom(page, "ห้องประชุม B");
  await book(page, { name: "สมหญิง", start: "10:00", end: "11:00", pin: "5678" });
  await expect(page.getByText(/จองสำเร็จ/)).toBeVisible();
  await expect(bookingRows(page)).toHaveCount(1);
});

test("5. only the booker (with the PIN) can cancel", async ({ page }) => {
  await openRoom(page, "ห้องประชุม A");
  await book(page, { name: "สมชาย", start: "10:00", end: "11:00", pin: "1234" });
  await expect(bookingRows(page)).toHaveCount(1);

  await page.getByRole("button", { name: "ยกเลิกการจองของ สมชาย" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("รหัสยกเลิก").fill("9999");
  await dialog.getByRole("button", { name: "ยืนยันยกเลิก" }).click();
  await expect(dialog.getByText("รหัสไม่ถูกต้อง")).toBeVisible();
  await dialog.getByRole("button", { name: "ปิด" }).click();
  await expect(bookingRows(page)).toHaveCount(1);

  await page.getByRole("button", { name: "ยกเลิกการจองของ สมชาย" }).click();
  await dialog.getByLabel("รหัสยกเลิก").fill("1234");
  await dialog.getByRole("button", { name: "ยืนยันยกเลิก" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("ยังไม่มีการจอง")).toBeVisible();
});

test("6. submitting an empty form shows an error under each required field", async ({ page }) => {
  await openRoom(page, "ห้องประชุม A");
  await page.getByRole("button", { name: "ยืนยันการจอง" }).click();

  for (const message of ["กรุณากรอกชื่อผู้จอง", "กรุณาเลือกวันที่", "กรุณาเลือกเวลาเริ่ม", "กรุณาเลือกเวลาจบ", "กรุณาตั้งรหัสยกเลิก"]) {
    await expect(page.getByText(message)).toBeVisible();
  }
  await expect(page.getByText("ยังไม่มีการจอง")).toBeVisible();
});
