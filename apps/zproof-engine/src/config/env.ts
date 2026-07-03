import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4300),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1),
  ATTESTATION_PRIVATE_KEY_HEX: z.string().optional().default(""),
  CHALLENGE_TTL_MS: z.coerce.number().default(120_000),
  MAX_ATTEMPTS_PER_CHALLENGE: z.coerce.number().default(1),
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
