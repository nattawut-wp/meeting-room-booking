import { AppError } from "../lib/errors";
import { bookingRepository } from "../repositories/bookingRepository";
import { roomRepository } from "../repositories/roomRepository";

export const roomService = {
  listRooms() {
    return roomRepository.findAll();
  },

  async getRoom(id: number) {
    const room = await roomRepository.findById(id);
    if (!room) throw new AppError("ROOM_NOT_FOUND", "ไม่พบห้องนี้");
    return room;
  },

  /** Who has booked this room: bookings that have not ended by `from` (default: now). */
  async listRoomBookings(roomId: number, from: Date = new Date()) {
    await roomService.getRoom(roomId); // 404 for an unknown room rather than an empty list
    return bookingRepository.findByRoomEndingAfter(roomId, from);
  },
};
