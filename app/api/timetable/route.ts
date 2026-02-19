import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Timetable from "@/models/Timetable";
import { verifyToken } from "@/lib/auth";
import { TimetableCreateZ } from "@/lib/validations/timetableSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function GET(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Admin + Teacher can fetch all
  if (!["admin", "teacher"].includes(user.role))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const timetable = await Timetable.find()
    .populate("classId")
    .populate("teacherId")
    .lean();

  return NextResponse.json({ success: true, timetable });
}

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = TimetableCreateZ.parse(body);

    // Validate Teacher Subject
    const teacher = await import("@/models/Teacher").then((mod) => mod.default.findById(parsed.teacherId));
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    if (!teacher.subjects?.includes(parsed.subject)) {
      return NextResponse.json(
        {
          success: false,
          error: `Verification Failed: ${teacher.name} is not assigned to teach ${parsed.subject}. Please update the teacher's profile first.`,
        },
        { status: 400 }
      );
    }

    const created = await Timetable.create(parsed);

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:timetable",
      message: `Timetable created: ${parsed.subject} on ${parsed.day}`,
      metadata: {
        timetableId: created._id,
        classId: parsed.classId,
        teacherId: parsed.teacherId,
        subject: parsed.subject,
      },
    });

    return NextResponse.json({ success: true, timetable: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
