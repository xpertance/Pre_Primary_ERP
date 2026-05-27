// lib/admissionNumber.ts
import Counter from "@/models/Counter";

/**
 * Generate a new Admission Number in the format:
 *   ADM-<YEAR>-<6_DIGIT_SEQUENCE>
 * Example: ADM-2026-000001
 *
 * Uses a dedicated Counter collection to guarantee atomic increments and
 * year‑based resetting. The Counter document key is "admissionNo".
 */
export async function generateAdmissionNo(prefix = "ADM") {
  const year = new Date().getFullYear();

  // Find the counter for the current year or create one if it doesn't exist.
  const result = await Counter.findOneAndUpdate(
    { _id: "admissionNo" },
    [
      // MongoDB aggregation pipeline update (requires MongoDB >=4.2)
      {
        $set: {
          year: {
            $cond: [{ $eq: ["$year", year] }, "$year", year]
          },
          seq: {
            $cond: [{ $eq: ["$year", year] }, { $add: ["$seq", 1] }, 1]
          }
        }
      }
    ],
    { new: true, upsert: true }
  );

  const seqPadded = String(result?.seq ?? 1).padStart(6, "0");
  return `${prefix}-${year}-${seqPadded}`;
}

