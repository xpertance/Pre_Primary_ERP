import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/models/Exam";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function GET(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10")));
    const classId = url.searchParams.get("classId");
    const classIds = url.searchParams.get("classIds");
    const status = url.searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (classId) filter.classId = classId;
    if (classIds) {
      const ids = classIds.split(",").filter(Boolean);
      if (ids.length > 0) filter.classId = { $in: ids };
    }
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate("classId", "name section")
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      exams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, classId, subjects, startDate, endDate, totalMarks, passingMarks, examType, schedule } = body;

    if (!name || !classId || !startDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const exam = new Exam({
      name,
      description,
      classId,
      subjects,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      totalMarks,
      passingMarks,
      examType,
      schedule,
    });

    await exam.save();
    await exam.populate("classId", "name section");

    // Log activity only for admin
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "create:exam",
        message: `Exam created: ${exam.name}`,
        metadata: {
          examId: exam._id,
          name: exam.name,
          examType: exam.examType,
          totalMarks: exam.totalMarks,
        },
      });
    }

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create exam" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const exam = await Exam.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "classId",
      "name section"
    );

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error("[PUT /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const exam = await Exam.findByIdAndDelete(id);

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
