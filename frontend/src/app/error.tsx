"use client"; // Error boundaries must be Client Components

import { ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
      <ServerCrash className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="text-sm text-muted-foreground">
        เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend รันอยู่ แล้วลองใหม่
      </p>
      <Button onClick={() => retry()}>ลองใหม่</Button>
    </main>
  );
}
