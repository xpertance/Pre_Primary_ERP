import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Timetable from "@/models/Timetable";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { entries } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const savedEntries = [];
    const conflicts = [];

    for (const entry of entries) {
        const teacher = await import("@/models/Teacher").then((mod) => mod.default.findById(entry.teacherId));
        if (!teacher) {
            conflicts.push(`Teacher not found for ${entry.subject} on ${entry.day}`);
            continue;
        }

        // Check for overlap
        const overlap = await Timetable.findOne({
            teacherId: entry.teacherId,
            day: entry.day,
            startTime: { $lt: entry.endTime },
            endTime: { $gt: entry.startTime }
        });

        if (overlap) {
            conflicts.push(`Double-book prevented: ${teacher.name} is already booked for ${overlap.subject} on ${entry.day} at ${overlap.startTime}-${overlap.endTime}.`);
            continue;
        }

        const created = await Timetable.create(entry);
        savedEntries.push(created);
    }

    if (conflicts.length > 0 && user.role === "admin") {
        await import("@/models/Notification").then((mod) => mod.default.create({
            recipientId: user.id, 
            type: "system",
            title: "Bulk Schedule Conflicts",
            message: conflicts.join(" \n"),
            priority: "high",
            icon: "Calendar"
        }));
    }

    if (savedEntries.length > 0 && user.role === "admin") {
        await logAdminActivity({
            actorId: String(user.id),
            actorRole: user.role,
            action: "create:timetable:bulk",
            message: `Created ${savedEntries.length} timetable entries`,
            metadata: { count: savedEntries.length }
        });
    }

    // Return an error status ONLY if zero entries were saved, otherwise return 201 with conflicts info
    if (savedEntries.length === 0 && conflicts.length > 0) {
        return NextResponse.json({ success: false, error: conflicts.join(" \n") }, { status: 400 });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Created ${savedEntries.length} entries. ${conflicts.length} conflicts skipped.`,
        conflicts,
        count: savedEntries.length
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
