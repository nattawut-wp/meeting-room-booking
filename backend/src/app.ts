import cors from "cors";
import express from "express";
import { config } from "./config";
import { errorHandler, notFoundRoute } from "./lib/errors";
import { bookingsRouter } from "./routes/bookings";
import { roomsRouter } from "./routes/rooms";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/rooms", roomsRouter);
  app.use("/api/bookings", bookingsRouter);

  app.use(notFoundRoute);
  app.use(errorHandler); // must be registered last
  return app;
}
