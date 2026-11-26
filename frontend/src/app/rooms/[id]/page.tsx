import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingForm } from "@/components/BookingForm";
import { BookingList } from "@/components/BookingList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, getRoomBookings, getRooms } from "@/lib/api";

export default function RoomPage({ params }: PageProps<"/rooms/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" nativeButton={false} render={<Link href="/" />}>
        <ArrowLeft aria-hidden />
        ห้องทั้งหมด
      </Button>
      {/* params and the bookings are only known at request time, so they stream behind a fallback. */}
      <Suspense fallback={<RoomSkeleton />}>
        <RoomDetail params={params} />
      </Suspense>
    </main>
  );
}

async function RoomDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isInteger(roomId) || roomId <= 0) notFound();

  const [rooms, bookings] = await Promise.all([
    getRooms(),
    getRoomBookings(roomId).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }),
  ]);
  const room = rooms.find((r) => r.id === roomId);
  if (!room || !bookings) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
        {room.capacity && (
          <Badge variant="secondary">
            <Users aria-hidden />
            {room.capacity} ที่นั่ง
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <div className="lg:sticky lg:top-6">
          <BookingForm roomId={room.id} />
        </div>
        <section aria-labelledby="bookings-heading">
          <h2 id="bookings-heading" className="mb-3 font-medium">
            รายการจอง <span className="text-muted-foreground">({bookings.length})</span>
          </h2>
          <BookingList bookings={bookings} />
        </section>
      </div>
    </>
  );
}

function RoomSkeleton() {
  return (
    <div aria-label="กำลังโหลด">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Skeleton className="h-[28rem] rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
