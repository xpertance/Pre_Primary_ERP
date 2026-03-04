import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TransportRoute from "@/models/TransportRoute";
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
    const status = url.searchParams.get("status") || "active";

    const filter: Record<string, unknown> = { status };

    const skip = (page - 1) * limit;

    const [routes, total] = await Promise.all([
      TransportRoute.find(filter)
        .populate("driverId", "name phone email")
        .populate("students", "firstName lastName admissionNo")
        .sort({ routeName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransportRoute.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      routes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch routes" },
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
    const {
      routeName,
      routeCode,
      description,
      driverId,
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleType,
      capacity,
      stops,
      students,
      status,
      isActive
    } = body;

    if (!routeName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const routeData = {
      routeName,
      routeCode: routeCode?.trim() || undefined,
      description,
      driverId: driverId && driverId !== "" ? driverId : null,
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleType,
      capacity,
      stops,
      students: students || [],
      status: status || "active",
      isActive: isActive !== undefined ? isActive : true,
    };

    const route = new TransportRoute(routeData);

    await route.save();
    await route.populate("driverId", "name phone email");

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:transport",
      message: `Transport route created: ${route.routeName}`,
      metadata: {
        routeId: route._id,
        routeName: route.routeName,
        routeCode: route.routeCode,
      },
    });

    return NextResponse.json({ success: true, route }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create route" },
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
        { success: false, error: "Route ID is required" },
        { status: 400 }
      );
    }

    // Clean up empty strings for IDs and unique fields
    if (updateData.driverId === "") updateData.driverId = null;
    if (updateData.routeCode === "") updateData.routeCode = undefined;

    const route = await TransportRoute.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("driverId", "name phone email");

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("[PUT /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update route" },
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
        { success: false, error: "Route ID is required" },
        { status: 400 }
      );
    }

    const route = await TransportRoute.findByIdAndDelete(id);

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/transport/routes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete route" },
      { status: 500 }
    );
  }
}
