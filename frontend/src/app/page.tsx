import { Suspense } from "react";
import { BookingSteps } from "@/features/booking/components/BookingSteps";
import { RoomGrid, RoomGridSkeleton } from "@/features/rooms/components/RoomGrid";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">ห้องประชุม</h1>
      <p className="mt-1 text-muted-foreground">เลือกห้องเพื่อดูว่าใครจองไว้บ้าง และจองช่วงเวลาที่ว่าง</p>
      <BookingSteps />
      {/* The room list is fetched fresh on every request, so it streams in behind a fallback. */}
      <Suspense fallback={<RoomGridSkeleton />}>
        <RoomGrid />
      </Suspense>
    </main>
  );
}
