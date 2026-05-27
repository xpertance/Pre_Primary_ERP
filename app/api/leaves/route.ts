import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TeacherLeave from "@/models/TeacherLeave";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const teacherId = url.searchParams.get("teacherId");
    const status = url.searchParams.get("status");

    const filter: Record<string, unknown> = {};

    // Teachers can only see their own leaves
    if (user.role === "teacher") {
      filter.teacherId = user.id;
    } else if (teacherId) {
      filter.teacherId = teacherId;
    }

    if (status) filter.status = status;

    const leaves = await TeacherLeave.find(filter)
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, leaves });
  } catch (error) {
    console.error("[GET /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Only teachers can apply for leave" }, { status: 403 });
    }

    const body = await req.json();
    const { leaveType, startDate, endDate, reason, attachment } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const newLeave = new TeacherLeave({
      teacherId: user.id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      attachment,
      status: "pending",
    });

    await newLeave.save();

    // Fetch all admins to notify them
    const admins = await User.find({ role: "admin" }).select("_id");
    
    const notifications = admins.map(admin => ({
      recipientId: admin._id,
      type: "leave",
      title: "New Leave Request",
      message: `A new ${leaveType} leave request was submitted.`,
      priority: "normal",
      icon: "Clock",
      actionUrl: "/dashboard/leaves"
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({ success: true, leave: newLeave }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to apply for leave" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    // Only admins can approve/reject
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminRemarks } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status or missing ID" }, { status: 400 });
    }

    const leave = await TeacherLeave.findByIdAndUpdate(
      id,
      { status, adminRemarks, approvedBy: user.id },
      { new: true }
    ).populate("teacherId", "name email");

    if (!leave) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });

    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "update:leave",
      message: `Leave ${status} for teacher ${leave.teacherId?.name || "Unknown"}`,
      metadata: { leaveId: leave._id, status },
    });

    // Notify the teacher if they still exist
    if (leave.teacherId && leave.teacherId._id) {
      await Notification.create({
        recipientId: leave.teacherId._id,
        type: "leave",
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} has been ${status}.`,
        priority: "normal",
        icon: status === "approved" ? "CheckCircle2" : "XCircle",
        actionUrl: "/teacher-dashboard/leaves"
      });
    }

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error("[PUT /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to update leave" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "Missing leave ID" }, { status: 400 });

    const leave = await TeacherLeave.findById(id);
    if (!leave) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });

    // A teacher can only cancel their own pending leave
    if (user.role === "teacher") {
      if (String(leave.teacherId) !== String(user.id)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      if (leave.status !== "pending") {
        return NextResponse.json({ success: false, error: "Cannot cancel a processed leave" }, { status: 400 });
      }
    }

    leave.status = "cancelled";
    await leave.save();

    return NextResponse.json({ success: true, message: "Leave cancelled successfully" });
  } catch (error) {
    console.error("[DELETE /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to cancel leave" }, { status: 500 });
  }
}
