import { ArrowRight, DoorOpen, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRooms, type Room } from "@/lib/api";

/** Server Component: fetches the rooms and links each one to its booking page. */
export async function RoomGrid() {
  const rooms = await getRooms();
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <RoomCard room={room} />
        </li>
      ))}
    </ul>
  );
}

function RoomCard({ room }: { room: Room }) {
  return (
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
              <CapacityBadge capacity={room.capacity} />
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

export function CapacityBadge({ capacity }: { capacity: number }) {
  return (
    <Badge variant="secondary">
      <Users aria-hidden />
      {capacity} ที่นั่ง
    </Badge>
  );
}

export function RoomGridSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="กำลังโหลดรายชื่อห้อง">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
