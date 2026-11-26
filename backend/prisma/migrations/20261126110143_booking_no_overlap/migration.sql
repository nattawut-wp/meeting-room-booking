-- Guarantee at the database level that bookings in the same room never overlap.
-- The app checks first (to return a friendly message); this constraint also
-- protects against two requests racing each other.
-- Ranges are half-open [start, end), so 09:00-10:00 and 10:00-11:00 do NOT overlap.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "room_id" WITH =,
    tstzrange("start_time", "end_time", '[)') WITH &&
  );

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_valid_range" CHECK ("end_time" > "start_time");
