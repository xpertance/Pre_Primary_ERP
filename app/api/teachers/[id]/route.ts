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
      return NextResponse.json({ success: false, error: "Forbidden: You can only edit your own profile" }, { status: 403 });
    }

    // Get old teacher data to compare classes for sync
    const oldTeacher = await Teacher.findById(id);
    if (!oldTeacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

    // Hash password if provided
    const updateData = { ...body };
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const updated = await Teacher.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      console.error("[api/teachers/[id]] Teacher not found:", id);
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    // --- SYNC LOGIC: Teacher -> Class ---
    // Update Class model so its 'teachers' array reflects this teacher mapping
    if (updateData.classes && Array.isArray(updateData.classes)) {
      try {
        const { default: ClassModel } = await import("@/models/Class");
        const oldClassIds = oldTeacher.classes.map((c: any) => c.classId.toString());
        const newClassIds = updateData.classes.map((c: any) => c.classId.toString());

        const added = newClassIds.filter((cid: string) => !oldClassIds.includes(cid));
        const removed = oldClassIds.filter((cid: string) => !newClassIds.includes(cid));

        if (added.length > 0) {
          await ClassModel.updateMany({ _id: { $in: added } }, { $addToSet: { teachers: updated._id } });
        }
        if (removed.length > 0) {
          await ClassModel.updateMany({ _id: { $in: removed } }, { $pull: { teachers: updated._id } });
        }
      } catch (syncError) {
        console.error("[api/teachers/[id]] Sync with classes failed:", syncError);
        // We don't fail the whole update just because class sync failed, but it's good to log
      }
    }
    // ------------------------------------

    // Log admin activity only if admin is updating
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "update:teacher",
        message: `Teacher updated: ${updated.name}`,
        metadata: { teacherId: updated._id, name: updated.name, email: updated.email },
      });
    }

    return NextResponse.json({ success: true, teacher: updated });
  } catch (err: any) {
    console.error("[api/teachers/[id]] Update failed:", err);
    return NextResponse.json({ success: false, error: err.message || "Invalid update data" }, { status: 400 });
  }
}



export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = req.cookies.get(\"token\")?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({
        success: false, error: \"Unauthorized\" }, { status: 401 });
    }

    // Fetch user from DB for fresh role check
    const User = (await import(\"@/models/User\")).default;
    const authUser = await User.findById(decoded.id);

      if (!authUser || authUser.role !== \"admin\") {
      return NextResponse.json({
        success: false, error: \"Only admin can delete teachers\" }, { status: 403 });
    }

    // 1. Fetch the teacher to get their name and classes for logging/cleanup
    const teacher = await Teacher.findById(id);
      if (!teacher) {
        return NextResponse.json({
          success: false, error: \"Teacher not found\" }, { status: 404 });
    }

    // 2. Clean up teacher from all classes they are assigned to
    try {
          const { default: ClassModel } = await import(\"@/models/Class\");
      await ClassModel.updateMany(
            { teachers: id },
            { $pull: { teachers: id } }
          );
        } catch (cleanupErr) {
          console.error(\"[api/teachers/delete] Class cleanup failed:\", cleanupErr);
    }

        // 3. Delete the teacher record
        await Teacher.findByIdAndDelete(id);

        // 4. Log admin activity
        await logAdminActivity({
          actorId: String(authUser._id),
          actorRole: authUser.role,
          action: \"delete:teacher\",
      message: `Teacher deleted: ${teacher.name}`,
          metadata: { teacherId: id, name: teacher.name, email: teacher.email },
    });

      return NextResponse.json({
        success: true, message: \"Teacher deleted successfully\" });
  } catch (error: any) {
        console.error(\"[api/teachers/delete] Error:\", error);
    return NextResponse.json({
          success: false, error: error.message || \"Failed to delete teacher\" }, { status: 500 });
  }
}
