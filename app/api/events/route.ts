import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
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
    const status = url.searchParams.get("status") || "published";

    const filter: Record<string, unknown> = { status };

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("classIds", "name section")
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
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
    const { title, description, eventType, startDate, endDate, location, image, targetAudience, classIds, status, notify } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const event = new Event({
      title,
      description,
      eventType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      location,
      image,
      targetAudience,
      classIds,
      status: status || "draft",
      notify,
    });

    await event.save();
    await event.populate("classIds", "name section");

    // Log activity only for admin
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "create:event",
        message: `Event created: ${event.title}`,
        metadata: {
          eventId: event._id,
          title: event.title,
          eventType: event.eventType,
          status: event.status,
        },
      });
    }

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
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
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "classIds",
      "name section"
    );

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[PUT /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
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
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
