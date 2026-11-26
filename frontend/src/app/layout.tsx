import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "จองห้องประชุม",
  description: "ระบบจองห้องประชุม ใครก็จองได้ ดูได้ว่าใครจองไว้บ้าง",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background">
        <header className="border-b bg-card">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CalendarDays className="size-4" aria-hidden />
              </span>
              จองห้องประชุม
            </Link>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
