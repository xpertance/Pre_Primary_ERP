import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  await connectDB();

  // Extract token from cookies
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  const user = verifyToken(token);

  // Must be logged in
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Must be PARENT
  if (user.role !== "parent") {
    return NextResponse.json({ success: false, error: "Only parents allowed" }, { status: 403 });
  }

  // Parent login can be via the direct Student email OR a parent's User email.
  // We search for children that match either:
  // 1. The ID is the direct Student _id
  // 2. The User ID is linked in the parents.parentId array
  // 3. The User email is linked in the parents.email array
  const studentId = (user as any).studentId || user.id;
  const userEmail = (user as any).email;

  const authQuery: any = {
    $or: [
      { _id: studentId },
      { "parents.parentId": user.id }
    ]
  };

  if (userEmail) {
    authQuery.$or.push({ "parents.email": userEmail });
  }

  const students = await Student.find(authQuery)
    .populate("classId", "name")
    .lean();

  return NextResponse.json({ success: true, students });
}
