import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { RoomDetail, RoomDetailSkeleton } from "@/features/rooms/components/RoomDetail";

export default function RoomPage({ params }: PageProps<"/rooms/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" nativeButton={false} render={<Link href="/" />}>
        <ArrowLeft aria-hidden />
        ห้องทั้งหมด
      </Button>
      {/* params and the bookings are only known at request time, so they stream behind a fallback. */}
      <Suspense fallback={<RoomDetailSkeleton />}>
        <RoomFromParams params={params} />
      </Suspense>
    </main>
  );
}

async function RoomFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isInteger(roomId) || roomId <= 0) notFound();
  return <RoomDetail roomId={roomId} />;
}
