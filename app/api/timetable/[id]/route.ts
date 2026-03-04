import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Timetable from "@/models/Timetable";
import { verifyToken } from "@/lib/auth";
import { TimetableCreateZ } from "@/lib/validations/timetableSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";

// ---------------------- PUT ----------------------
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const { id } = await context.params;

    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || user.role !== "admin")
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    try {
        const body = await req.json();
        const parsed = TimetableCreateZ.parse(body);

        // Verify teacher exists
        const teacher = await import("@/models/Teacher").then((mod) => mod.default.findById(parsed.teacherId));
        if (!teacher) {
            return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
        }

        const updated = await Timetable.findByIdAndUpdate(id, parsed, { new: true });

        if (!updated) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }

        // Log admin activity
        await logAdminActivity({
            actorId: String(user.id),
            actorRole: user.role,
            action: "update:timetable",
            message: `Timetable updated: ${updated.subject}`,
            metadata: {
                timetableId: updated._id,
                classId: updated.classId,
                teacherId: updated.teacherId,
                subject: updated.subject,
            }
        });

        return NextResponse.json({ success: true, timetable: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

// ---------------------- DELETE ----------------------
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const { id } = await context.params;

    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Only admin can delete" }, { status: 403 });
    }

    const deleted = await Timetable.findByIdAndDelete(id);

    if (!deleted) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Log admin activity
    await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "delete:timetable",
        message: `Timetable deleted: ${deleted.subject}`,
        metadata: {
            timetableId: deleted._id,
            subject: deleted.subject,
        }
    });

    return NextResponse.json({ success: true, deletedId: id });
}
