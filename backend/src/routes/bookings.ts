import { Router } from "express";
import { cancelBooking, createBooking } from "../controllers/bookingsController";

export const bookingsRouter = Router();

bookingsRouter.post("/", createBooking);
bookingsRouter.delete("/:id", cancelBooking);
