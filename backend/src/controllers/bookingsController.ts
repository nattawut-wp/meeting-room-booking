import type { RequestHandler } from "express";
import { cancelBookingSchema, createBookingSchema, idParamSchema } from "../lib/validation";
import { bookingService } from "../services/bookingService";

// Controllers only speak HTTP: validate the request, call a service, send the response.

export const createBooking: RequestHandler = async (req, res) => {
  const input = createBookingSchema.parse(req.body);
  const booking = await bookingService.createBooking(input);
  res.status(201).location(`/api/bookings/${booking.id}`).json(booking);
};

export const cancelBooking: RequestHandler = async (req, res) => {
  const id = idParamSchema.parse(req.params.id);
  const { pin } = cancelBookingSchema.parse(req.body ?? {});
  await bookingService.cancelBooking(id, pin);
  res.status(204).end();
};
