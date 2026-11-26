import { CalendarCheck, Clock, DoorOpen } from "lucide-react";

const STEPS = [
  { icon: DoorOpen, title: "เลือกห้อง", text: "ดูความจุที่เหมาะกับจำนวนคน" },
  { icon: Clock, title: "เลือกช่วงที่ว่าง", text: "กดช่องสีเขียวบนตารางห้อง" },
  { icon: CalendarCheck, title: "ยืนยัน", text: "ใส่ชื่อและรหัสยกเลิก แล้วเพิ่มลงปฏิทินได้" },
];

/** The three steps of making a booking, shown on the home page. */
export function BookingSteps() {
  return (
    <ol className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="ขั้นตอนการจอง">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="flex items-start gap-3 rounded-xl border bg-background p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {i + 1}
          </span>
          <div>
            <p className="flex items-center gap-1.5 font-medium">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
