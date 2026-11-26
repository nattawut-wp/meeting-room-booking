import { ArrowRight, CalendarCheck, Clock, DoorOpen, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRooms } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">ห้องประชุม</h1>
      <p className="mt-1 text-muted-foreground">เลือกห้องเพื่อดูว่าใครจองไว้บ้าง และจองช่วงเวลาที่ว่าง</p>
      <Steps />
      {/* The room list is fetched fresh on every request, so it streams in behind a fallback. */}
      <Suspense fallback={<RoomGridSkeleton />}>
        <RoomGrid />
      </Suspense>
    </main>
  );
}

async function RoomGrid() {
  const rooms = await getRooms();
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link
            href={`/rooms/${room.id}`}
            className="group block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <DoorOpen className="size-5" aria-hidden />
                </div>
                <CardTitle className="flex items-center justify-between text-base">
                  {room.name}
                  <ArrowRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </CardTitle>
                {room.capacity && (
                  <CardDescription>
                    <Badge variant="secondary">
                      <Users aria-hidden />
                      {room.capacity} ที่นั่ง
                    </Badge>
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  { icon: DoorOpen, title: "เลือกห้อง", text: "ดูความจุที่เหมาะกับจำนวนคน" },
  { icon: Clock, title: "เลือกช่วงที่ว่าง", text: "กดช่องสีเขียวบนตารางห้อง" },
  { icon: CalendarCheck, title: "ยืนยัน", text: "ใส่ชื่อและรหัสยกเลิก แล้วเพิ่มลงปฏิทินได้" },
];

function Steps() {
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

function RoomGridSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="กำลังโหลดรายชื่อห้อง">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
