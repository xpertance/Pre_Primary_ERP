import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Teacher from "@/models/Teacher";
import { TeacherCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { logAdminActivity } from "@/lib/logAdminActivity";


// ---------------------- GET ----------------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params; // ✅ FIX

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const teacher = await Teacher.findById(id).lean();
  if (!teacher) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, teacher });
}



// ---------------------- PUT ----------------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params; // ✅ FIX
  console.log("Updating teacher with ID:", id);
  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || (!["admin"].includes(user.role) && user.role !== "teacher")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  console.log("User role:", user.role, "User ID:", user.id);

  try {
    const body = await req.json();

    if (user.role === "teacher" && String(user.id) !== String(id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Get old teacher data to compare classes
    const oldTeacher = await Teacher.findById(id);
    if (!oldTeacher) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Hash password if provided
    const updateData = { ...body };
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const updated = await Teacher.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // --- SYNC LOGIC: Teacher -> Class ---
    // Only admin can change classes, usually.
    if (updateData.classes) {
      const oldClassIds = oldTeacher.classes.map((c: any) => c.classId.toString());
      const newClassIds = updateData.classes.map((c: any) => c.classId.toString());

      import("@/models/Class").then(async ({ default: ClassModel }) => {
        const added = newClassIds.filter((cid: string) => !oldClassIds.includes(cid));
        const removed = oldClassIds.filter((cid: string) => !newClassIds.includes(cid));

        if (added.length > 0) {
          await ClassModel.updateMany(
            { _id: { $in: added } },
            { $addToSet: { teachers: updated._id } }
          );
        }

        if (removed.length > 0) {
          await ClassModel.updateMany(
            { _id: { $in: removed } },
            { $pull: { teachers: updated._id } }
          );
        }
      });
    }
    // ------------------------------------

    // Log admin activity only if admin is updating
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "update:teacher",
        message: `Teacher updated: ${updated.name}`,
        metadata: {
          teacherId: updated._id,
          name: updated.name,
          email: updated.email,
          department: updated.department,
        }
      });
    }

    return NextResponse.json({ success: true, teacher: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid" }, { status: 400 });
  }
}



// ---------------------- DELETE ----------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params; // ✅ FIX

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Only admin can delete" }, { status: 403 });
  }

  const deleted = await Teacher.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // Log admin activity
  await logAdminActivity({
    actorId: String(user.id),
    actorRole: user.role,
    action: "delete:teacher",
    message: `Teacher deleted: ${deleted.name}`,
    metadata: {
      teacherId: deleted._id,
      name: deleted.name,
      email: deleted.email,
      department: deleted.department,
    }
  });

  return NextResponse.json({ success: true, deletedId: id });
}
