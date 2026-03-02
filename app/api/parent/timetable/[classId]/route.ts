import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Timetable from "@/models/Timetable";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ classId: string }> }
) {
  await connectDB();

  const { classId } = await context.params;   // ✅ FIX — MUST await params

  const token = req.cookies.get("token")?.value;
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  // Verify the parent actually manages a child assigned to this class
  const studentId = (parent as any).studentId || parent.id;
  const parentEmail = (parent as any).email;

  const authQuery: any = {
    classId: classId,
    $or: [
      { _id: studentId },
      { "parents.parentId": parent.id }
    ]
  };

  if (parentEmail) {
    authQuery.$or.push({ "parents.email": parentEmail });
  }

  const student = await Student.findOne(authQuery).lean();

  if (!student) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const timetable = await Timetable.find({ classId })
    .populate("teacherId", "name")
    .lean();

  return NextResponse.json({ success: true, timetable });
}
