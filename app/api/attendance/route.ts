import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import Class from "@/models/Class";
import { logAdminActivity } from "@/lib/logAdminActivity";

// GET - List all attendance records with filters
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const filter: Record<string, unknown> = {};

    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const [sy, sm, sd] = startDate.split("-").map(Number);
        (filter.date as Record<string, unknown>).$gte = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      }

      if (endDate) {
        const [ey, em, ed] = endDate.split("-").map(Number);
        (filter.date as Record<string, unknown>).$lte = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
    }

    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      Attendance.find(filter)
        .populate("studentId", "firstName lastName admissionNo")
        .populate("classId", "name section")
        .populate("markedBy", "firstName lastName")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST - Create attendance record(s)
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { studentId, classId, date, status, markedBy, notes } = body;

    // Validate required fields
    if (!studentId || !date || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: studentId, date, status" },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ["present", "absent", "late", "excused"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Create attendance record
    const attendanceRecord = new Attendance({
      studentId,
      classId: classId || student.classId,
      date: new Date(date),
      status,
      markedBy,
      notes,
    });

    await attendanceRecord.save();

    const populated = await attendanceRecord.populate([
      { path: "studentId", select: "firstName lastName admissionNo" },
      { path: "classId", select: "name section" },
      { path: "markedBy", select: "firstName lastName" },
    ]);

    // Log admin activity - only if markedBy is an admin
    if (markedBy) {
      // Try to get the user info from the marked by field
      const marked = await Student.findById(markedBy).select("email role").catch(() => null);
      if (marked && marked.role === "admin") {
        await logAdminActivity({
          actorId: String(marked._id),
          actorEmail: marked.email,
          actorRole: "admin",
          action: "create:attendance",
          message: `Attendance marked for student`,
          metadata: {
            attendanceId: attendanceRecord._id,
            studentId: studentId,
            status: status,
          }
        });
      }
    }

    return NextResponse.json(
      { success: true, data: populated },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create attendance" },
      { status: 500 }
    );
  }
}

// PUT - Update attendance record
export async function PUT(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, date, status, notes, markedBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["present", "absent", "late", "excused"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (date) updateData.date = new Date(date);
    if (notes) updateData.notes = notes;
    if (markedBy) updateData.markedBy = markedBy;

    const attendance = await Attendance.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate([
      { path: "studentId", select: "firstName lastName admissionNo" },
      { path: "classId", select: "name section" },
      { path: "markedBy", select: "firstName lastName" },
    ]);

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error("[PUT /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance record
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
