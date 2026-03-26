import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Gallery from "@/models/Gallery";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "500")));

    const filter: Record<string, unknown> = {};
    
    // Safety: If user is not admin, they should ONLY see published albums
    if (user.role !== "admin") {
      filter.isPublished = true;
    } else {
      // Admins can filter by choice
      const status = url.searchParams.get("status");
      if (status === "published") filter.isPublished = true;
      if (status === "draft") filter.isPublished = false;
    }

    const skip = (page - 1) * limit;

    const [galleries, total] = await Promise.all([
      Gallery.find(filter)
        .populate("images.uploadedBy", "name email")
        .populate("images.comments.userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gallery.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      galleries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch galleries" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, albumName, category, images, eventDate, eventLocation, visibility } = body;

    if (!title || !albumName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const gallery = new Gallery({
      title,
      description,
      albumName,
      category,
      images: images || [],
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventLocation,
      visibility,
    });

    await gallery.save();

    return NextResponse.json({ success: true, gallery }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create gallery" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Gallery ID is required" },
        { status: 400 }
      );
    }

    const gallery = await Gallery.findByIdAndUpdate(id, updateData, { new: true });

    if (!gallery) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error("[PUT /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update gallery" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Gallery ID is required" },
        { status: 400 }
      );
    }

    const gallery = await Gallery.findByIdAndDelete(id);

    if (!gallery) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Gallery deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/gallery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete gallery" },
      { status: 500 }
    );
  }
}
