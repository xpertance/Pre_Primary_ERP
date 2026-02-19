import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ClassModel from "@/models/Class";
import { verifyToken } from "@/lib/auth";
import { ClassCreateZ } from "@/lib/validations/classSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function GET(req: Request, { params }: any) {
  await connectDB();

  const classData = await ClassModel.findById(params.id)
    .populate("teachers")
    .populate("students")
    .lean();

  if (!classData) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, class: classData });
}

export async function PUT(req: Request, { params }: any) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = ClassCreateZ.partial().parse(body);

    // Get old class data to compare teachers
    const oldClass = await ClassModel.findById(params.id);
    if (!oldClass) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const updated = await ClassModel.findByIdAndUpdate(params.id, parsed, { new: true });

    // --- SYNC LOGIC: Class -> Teacher ---
    if (parsed.teachers) {
      const oldTeacherIds = oldClass.teachers.map((t: any) => t.toString());
      const newTeacherIds = parsed.teachers.map((t: any) => t.toString());

      const added = newTeacherIds.filter((id: string) => !oldTeacherIds.includes(id));
      const removed = oldTeacherIds.filter((id: string) => !newTeacherIds.includes(id));

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
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: any) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const deleted = await ClassModel.findByIdAndDelete(params.id);

  if (!deleted) return NextResponse.json({ success: false, error: "Not found" });

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

  return NextResponse.json({ success: true, deletedId: params.id });
}
