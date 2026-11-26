# ระบบจองห้องประชุม (Meeting Room Booking)

ระบบจองห้องประชุมที่ทุกคนจองได้ ไม่ต้อง login

- จองห้องโดยกรอกชื่อผู้จอง วัน และช่วงเวลา
- ดูได้ว่าแต่ละห้องมีใครจองไว้ช่วงไหน
- ห้องเดียวกันจองช่วงเวลาซ้อนกันไม่ได้ (ช่วงที่ต่อกันพอดี เช่น 09:00–10:00 กับ 10:00–11:00 จองได้)
- ยกเลิกได้เฉพาะคนที่จอง โดยใช้รหัสยกเลิก (PIN) ที่ตั้งไว้ตอนจอง

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui |
| Backend | Node.js, Express 5, zod, bcryptjs |
| Database | PostgreSQL 16 (Docker), Prisma 7 |
| Tests | Vitest, Supertest, Testing Library, Playwright |

## โครงสร้างโปรเจกต์

```
meeting/
├── docker-compose.yml     # PostgreSQL: DB "meeting" (dev) + "meeting_test" (tests)
├── backend/               # REST API (port 4000)
│   ├── prisma/            # schema, migrations, seed (3 ห้อง)
│   ├── src/
│   │   ├── routes/        # แค่ผูก URL → controller
│   │   ├── controllers/   # เรื่อง HTTP: validate request, ส่ง response
│   │   ├── services/      # กฎของระบบ: ห้ามจองชน, ตรวจ PIN (ไม่รู้จัก req/res)
│   │   ├── repositories/  # คุยกับ DB (Prisma) ที่เดียว
│   │   └── lib/           # validation, errors (code → HTTP status), overlap
│   └── tests/             # unit (service ไม่ใช้ DB) + API tests
├── frontend/              # เว็บ (port 3000)
│   └── src/
│       ├── app/           # route บางๆ: หน้า / และ /rooms/[id]
│       ├── features/
│       │   ├── booking/   # components, hooks (useBookingForm), __tests__
│       │   └── rooms/     # RoomGrid, RoomDetail
│       ├── components/ui/ # component กลางจาก shadcn (ไม่มี business logic)
│       └── lib/           # api client, datetime, ics helpers
└── e2e/                   # Playwright tests
```

## เริ่มใช้งาน

ต้องมี **Node.js 22+** และ **Docker Desktop**

```bash
# 1. เปิดฐานข้อมูล
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
cp .env.test.example .env.test
npm install              # รัน prisma generate ให้อัตโนมัติ
npx prisma migrate dev   # สร้างตาราง
npm run db:seed          # เพิ่ม 3 ห้อง
npm run dev              # http://localhost:4000

# 3. Frontend (เปิดอีก terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

## การทดสอบ

| คำสั่ง | ที่ไหน | ทดสอบอะไร |
|---|---|---|
| `npm test` | `backend/` | unit + API tests กับ DB จริง (`meeting_test`) |
| `npm run test:coverage` | `backend/` | เหมือนข้างบน พร้อมรายงาน coverage |
| `npm test` | `frontend/` | component tests |
| `npm install` แล้ว `npm run test:e2e` | root | E2E ใน Chromium (ติดตั้งครั้งแรก: `npx playwright install chromium`) |

- เทสต์ทุกตัวใช้ DB `meeting_test` เท่านั้น ไม่แตะข้อมูลใน DB dev
- E2E เปิด backend ที่ port 4001 และ frontend (production build) ที่ port 3001 ให้เอง จึงรันพร้อม dev server ได้
- อย่ารัน backend tests กับ E2E พร้อมกัน เพราะใช้ DB เดียวกัน

## API

| Method | Path | ผลลัพธ์ |
|---|---|---|
| GET | `/api/rooms` | รายชื่อห้อง |
| GET | `/api/rooms/:id` | ข้อมูลห้องเดียว (404 ถ้าไม่มี) |
| GET | `/api/rooms/:id/bookings?from=ISO` | การจองของห้อง เรียงตามเวลา (ค่า default: เฉพาะที่ยังไม่จบ) |
| POST | `/api/bookings` | จอง: `{ roomId, bookerName, startTime, endTime, pin }` → `201`, `400`, `404`, `409` |
| DELETE | `/api/bookings/:id` | ยกเลิก: `{ pin }` → `204`, `400`, `403`, `404` |

เวลาเป็น ISO 8601 พร้อม offset เช่น `2030-01-15T10:00:00+07:00`
error ทุกตัวใช้รูปแบบเดียวกัน: `{ "error": { "code", "message", "details" } }`

## การออกแบบที่สำคัญ

**กันจองซ้อน 2 ชั้น**
1. **ชั้น app:** ก่อนบันทึกจะค้นหาการจองที่ `start < newEnd AND end > newStart` ถ้าเจอจะตอบ `409` พร้อมบอกว่าใครจองไว้ช่วงไหน
2. **ชั้น DB:** exclusion constraint `EXCLUDE USING gist (room_id WITH =, tstzrange(start, end, '[)') WITH &&)` กันกรณีที่มีหลายคนกดจองพร้อมกัน (race condition) เทสต์ยิง request พร้อมกัน 5 ครั้งแล้วยืนยันว่าบันทึกได้แค่ครั้งเดียว

**ยกเลิกด้วย PIN:** เก็บเฉพาะ bcrypt hash ของ PIN และ Prisma ตั้ง `omit` ไว้ให้ hash ไม่หลุดออกไปใน response

**เวลา:** เก็บใน DB เป็น `timestamptz` (UTC) ส่วนหน้าเว็บกรอกและแสดงผลเป็นเวลา Asia/Bangkok เสมอ ไม่ว่าเครื่องผู้ใช้จะตั้ง timezone ไว้ที่ไหน

## Git workflow

ใช้ Gitflow
- `main` = โค้ดที่ release แล้ว (มี tag เช่น `v1.0.0`)
- `develop` = รวมงานที่เสร็จแล้ว
- งานใหม่ทำบน `feature/<ชื่อ>` แตกจาก `develop` แล้ว merge กลับด้วย `--no-ff`
- เตรียม release บน `release/<version>` แล้ว merge เข้าทั้ง `main` และ `develop`
