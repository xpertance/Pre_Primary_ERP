import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Teacher from "@/models/Teacher";
import { TeacherCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function GET(req: Request) {
  await connectDB();
  // allow admin and teacher list access; parents should not see
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const limit = Math.min(1000, parseInt(url.searchParams.get("limit") || "500"));

  const filter: any = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

  const teachers = await Teacher.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ success: true, data: teachers, teachers });
}

export async function POST(req: Request) {
  await connectDB();
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Only admin can create teachers" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = TeacherCreateZ.parse(body);

    // Hash password before saving
    const hashedPassword = await bcryptjs.hash(parsed.password, 10);

    const teacher = await Teacher.create({
      ...parsed,
      password: hashedPassword,
    });

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:teacher",
      message: `Teacher created: ${teacher.name}`,
      metadata: {
        teacherId: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      }
    });

    return NextResponse.json({ success: true, teacher }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid" }, { status: 400 });
  }
}
