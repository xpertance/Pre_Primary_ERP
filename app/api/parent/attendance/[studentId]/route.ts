import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  await connectDB();

  const { studentId } = await context.params;   // ✅ IMPORTANT FIX

  const token = req.cookies.get("token")?.value;
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const student = await parentOwnsStudent(studentId, parent.id, (parent as any).email);
  if (!student) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const attendance = await Attendance.find({ studentId }).lean();

  return NextResponse.json({ success: true, attendance });
}
