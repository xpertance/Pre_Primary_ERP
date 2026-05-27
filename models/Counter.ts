// models/Counter.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  _id: string; // e.g., "admissionNo"
  seq: number; // last used sequence for the current year
  year: number; // year the sequence belongs to
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
  year: { type: Number, required: true },
});

export default mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);
