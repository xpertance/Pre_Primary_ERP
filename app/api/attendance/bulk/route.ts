import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student"; // ensure model is registered
import { logAdminActivity } from "@/lib/logAdminActivity"; // if available, or skip

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { date, classId, records, markedBy } = body;

        if (!date || !classId || !Array.isArray(records)) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: date, classId, records[]" },
                { status: 400 }
            );
        }

        // Parse the input date string (YYYY-MM-DD) explicitly to avoid UTC shifts
        const [year, month, day] = date.split('-').map(Number);

        // Create dates using local time components
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        const operations = records.map(async (record: any) => {
            const { studentId, status, notes } = record;

            // Find if record exists for this student on this date
            const existing = await Attendance.findOne({
                studentId,
                date: { $gte: startOfDay, $lte: endOfDay },
            });

            if (existing) {
                // Update
                existing.status = status;
                if (notes !== undefined) existing.notes = notes;
                if (markedBy) existing.markedBy = markedBy;
                return existing.save();
            } else {
                // Create
                return Attendance.create({
                    studentId,
                    classId,
                    date: startOfDay,
                    status,
                    notes,
                    markedBy,
                });
            }
        });

        await Promise.all(operations);

        return NextResponse.json({ success: true, message: "Attendance marked successfully" });

    } catch (error: any) {
        console.error("[POST /api/attendance/bulk]", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to mark attendance" },
            { status: 500 }
        );
    }
}
