import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SubstituteAssignment from "@/models/SubstituteAssignment";
import TeacherLeave from "@/models/TeacherLeave";
import { verifyToken } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const substituteTeacherId = url.searchParams.get("substituteTeacherId");

    const filter: Record<string, unknown> = { status: "assigned" };

    if (date) {
      // Find assignments exactly on this date (start of day to end of day)
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: queryDate, $lt: nextDay };
    }

    if (user.role === "teacher") {
      filter.substituteTeacherId = user.id;
    } else if (substituteTeacherId) {
      filter.substituteTeacherId = substituteTeacherId;
    }

    const assignments = await SubstituteAssignment.find(filter)
      .populate("originalTeacherId", "name")
      .populate("substituteTeacherId", "name")
      .populate("classId", "name section")
      .populate("leaveId")
      .sort({ date: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("[GET /api/substitutes]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch substitutes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { leaveId, originalTeacherId, substituteTeacherId, classId, subject, date, startTime, endTime } = body;

    if (!leaveId || !originalTeacherId || !substituteTeacherId || !classId || !subject || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Verify leave exists and is approved
    const leave = await TeacherLeave.findById(leaveId);
    if (!leave || leave.status !== "approved") {
      return NextResponse.json({ success: false, error: "Valid approved leave is required" }, { status: 400 });
    }

    const newAssignment = new SubstituteAssignment({
      leaveId,
      originalTeacherId,
      substituteTeacherId,
      classId,
      subject,
      date: new Date(date),
      startTime,
      endTime,
      status: "assigned",
    });

    await newAssignment.save();

    // Notify the substitute teacher
    await Notification.create({
      recipientId: substituteTeacherId,
      type: "leave",
      title: "New Substitute Assignment",
      message: `You have been assigned as a substitute for ${subject} on ${new Date(date).toLocaleDateString()} from ${startTime} to ${endTime}.`,
      priority: "high",
      icon: "Calendar",
      actionUrl: "/teacher-dashboard/timetable"
    });

    return NextResponse.json({ success: true, assignment: newAssignment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/substitutes]", error);
    return NextResponse.json({ success: false, error: "Failed to assign substitute" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const assignment = await SubstituteAssignment.findById(id);
    if (!assignment) return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });

    assignment.status = "cancelled";
    await assignment.save();

    return NextResponse.json({ success: true, message: "Substitute assignment cancelled" });
  } catch (error) {
    console.error("[DELETE /api/substitutes]", error);
    return NextResponse.json({ success: false, error: "Failed to cancel assignment" }, { status: 500 });
  }
}
