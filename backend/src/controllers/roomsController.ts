import type { RequestHandler } from "express";
import { idParamSchema, listBookingsQuerySchema } from "../lib/validation";
import { roomService } from "../services/roomService";

// Controllers only speak HTTP: validate the request, call a service, send the response.

export const listRooms: RequestHandler = async (_req, res) => {
  res.json(await roomService.listRooms());
};

export const getRoom: RequestHandler = async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  res.json(await roomService.getRoom(id));
};

export const listRoomBookings: RequestHandler = async (req, res) => {
  const roomId = idParamSchema.parse(req.params.id);
  const { from } = listBookingsQuerySchema.parse(req.query);
  res.json(await roomService.listRoomBookings(roomId, from));
};
