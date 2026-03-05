import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import ClassModel from "@/models/Class";
import Teacher from "@/models/Teacher"; // ✅ Fixed missing import
import { verifyToken } from "@/lib/auth";
import { ClassCreateZ } from "@/lib/validations/classSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const classData = await ClassModel.findById(id)
    .populate("teachers")
    .populate("students")
    .lean();

  if (!classData) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, class: classData });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);
  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = ClassCreateZ.partial().parse(body);

    // Get old class data to compare teachers
    const oldClass = await ClassModel.findById(id);
    if (!oldClass) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const updated = await ClassModel.findByIdAndUpdate(id, parsed, { new: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Class not found after update" }, { status: 404 });
    }

    // --- SYNC LOGIC: Class -> Teacher ---
    if (parsed.teachers) {
      const oldTeacherIds = oldClass.teachers.map((t: any) => t.toString());
      const newTeacherIds = parsed.teachers.map((t: any) => t.toString());

      const added = newTeacherIds.filter((tid: string) => !oldTeacherIds.includes(tid));
      const removed = oldTeacherIds.filter((tid: string) => !newTeacherIds.includes(tid));

      if (added.length > 0) {
        await Teacher.updateMany(
          { _id: { $in: added } },
          { $addToSet: { classes: { classId: updated._id, section: updated.section } } }
        );
      }

      if (removed.length > 0) {
        await Teacher.updateMany(
          { _id: { $in: removed } },
          { $pull: { classes: { classId: updated._id } } }
        );
      }
    }
    // ------------------------------------

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "update:class",
      message: `Class updated: ${updated.name} - ${updated.section}`,
      metadata: {
        classId: updated._id,
        name: updated.name,
        section: updated.section,
        roomNumber: updated.roomNumber,
      }
    });

    return NextResponse.json({ success: true, class: updated });
  } catch (err: any) {
    console.error("[api/classes/[id]] Update failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const deleted = await ClassModel.findByIdAndDelete(id);

  if (!deleted) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Log admin activity
  await logAdminActivity({
    actorId: String(user.id),
    actorRole: user.role,
    action: "delete:class",
    message: `Class deleted: ${deleted.name} - ${deleted.section}`,
    metadata: {
      classId: deleted._id,
      name: deleted.name,
      section: deleted.section,
      roomNumber: deleted.roomNumber,
    }
  });

  return NextResponse.json({ success: true, deletedId: id });
}
