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

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  
  const query: any = {};
  if (teacherId) query.teacherId = teacherId;

  const timetable = await Timetable.find(query)
    .populate("classId")
    .populate("teacherId")
    .lean();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch active leaves and substitutes to show in the timetable UI
  const activeLeaves = await import("@/models/TeacherLeave").then(mod =>
    mod.default.find({
      status: "approved",
      endDate: { $gte: today }
    }).lean()
  );

  const activeSubstitutes = await import("@/models/SubstituteAssignment").then(mod =>
    mod.default.find({
      status: "assigned",
      date: { $gte: today }
    }).populate("substituteTeacherId", "name").lean()
  );

  return NextResponse.json({ success: true, timetable, activeLeaves, activeSubstitutes });
}

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = TimetableCreateZ.parse(body);

    // Verify teacher exists
    const teacher = await import("@/models/Teacher").then((mod) => mod.default.findById(parsed.teacherId));
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    // Check for overlap
    const overlap = await Timetable.findOne({
      teacherId: parsed.teacherId,
      day: parsed.day,
      startTime: { $lt: parsed.endTime },
      endTime: { $gt: parsed.startTime }
    });

    if (overlap) {
      if (user.role === "admin") {
        await import("@/models/Notification").then((mod) => mod.default.create({
          recipientId: user.id, 
          type: "system",
          title: "Schedule Conflict Prevented",
          message: `Attempted to double-book ${teacher.name} on ${parsed.day} at ${parsed.startTime}-${parsed.endTime}, but they are already booked for ${overlap.subject}.`,
          priority: "high",
          icon: "Calendar"
        }));
      }
      return NextResponse.json({ success: false, error: "Teacher is already scheduled for another class during this time." }, { status: 400 });
    }

    const created = await Timetable.create(parsed);

    // Log activity only for admin
    if (user.role === "admin") {
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
    }

    return NextResponse.json({ success: true, timetable: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
