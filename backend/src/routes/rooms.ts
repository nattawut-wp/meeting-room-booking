import { Router } from "express";
import { getRoom, listRoomBookings, listRooms } from "../controllers/roomsController";

export const roomsRouter = Router();

roomsRouter.get("/", listRooms);
roomsRouter.get("/:id", getRoom);
roomsRouter.get("/:id/bookings", listRoomBookings);
