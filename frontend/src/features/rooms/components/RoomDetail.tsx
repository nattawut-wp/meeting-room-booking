import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingList } from "@/features/booking/components/BookingList";
import { RoomScheduler } from "@/features/booking/components/RoomScheduler";
import { CapacityBadge } from "@/features/rooms/components/RoomGrid";
import { getRoom, getRoomBookings, orNullIfNotFound } from "@/lib/api";

/** Server Component: one room, its timeline + booking form, and who has booked it. */
export async function RoomDetail({ roomId }: { roomId: number }) {
  const [room, bookings] = await Promise.all([
    orNullIfNotFound(getRoom(roomId)),
    orNullIfNotFound(getRoomBookings(roomId)),
  ]);
  if (!room || !bookings) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
        {room.capacity && <CapacityBadge capacity={room.capacity} />}
      </div>

      <RoomScheduler room={room} bookings={bookings}>
        <section aria-labelledby="bookings-heading">
          <h2 id="bookings-heading" className="mb-3 font-medium">
            รายการจองที่จะถึง <span className="text-muted-foreground">({bookings.length})</span>
          </h2>
          <BookingList bookings={bookings} />
        </section>
      </RoomScheduler>
    </>
  );
}

export function RoomDetailSkeleton() {
  return (
    <div aria-label="กำลังโหลด">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Skeleton className="h-[28rem] rounded-xl" />
        <div className="grid gap-6">
          <Skeleton className="h-[30rem] rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
