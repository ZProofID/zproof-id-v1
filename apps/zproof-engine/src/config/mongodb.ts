// src/config/mongodb.ts
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;

  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(env.MONGODB_URI);

  console.log("MongoDB connected");
}
