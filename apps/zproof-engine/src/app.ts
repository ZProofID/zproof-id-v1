import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { allowedOrigins } from "./config/env.js";
import { humanityRouter } from "./routes/humanity.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: false,
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "humanity-backend", timestamp: new Date().toISOString() });
  });

  app.use("/api/humanity", humanityRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  });

  return app;
}
