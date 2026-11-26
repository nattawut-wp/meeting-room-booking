import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">ไม่พบห้องนี้</h1>
      <p className="text-sm text-muted-foreground">ห้องที่คุณหาอาจไม่มีอยู่ในระบบ</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        กลับไปหน้าห้องทั้งหมด
      </Button>
    </main>
  );
}
