import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

import User from "@/models/User";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Class from "@/models/Class";
import FeeStructure from "@/models/FeeStructure";
import FeeTransaction from "@/models/FeeTransaction";
import LogActivity from "@/models/LogActivity";

export async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI as string;
  if (!MONGO_URI) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn("Please define MONGODB_URI in env file");
    }
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => {
      // Access the imported models to ensure they are registered
      User; Student; Teacher; Class; FeeStructure; FeeTransaction; LogActivity;
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
