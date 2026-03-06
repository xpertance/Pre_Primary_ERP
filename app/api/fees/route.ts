import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeStructure from "@/models/FeeStructure";
import { verifyToken } from "@/lib/auth";
import { FeeStructureCreateZ } from "@/lib/validations/feeSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";

export async function GET(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || !["admin", "finance", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    FeeStructure.find().skip(skip).limit(limit).lean(),
    FeeStructure.countDocuments()
  ]);

  return NextResponse.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(req: Request) {
  await connectDB();
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = FeeStructureCreateZ.parse(body);
    const created = await FeeStructure.create(parsed);

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:fee",
      message: `Fee structure created: ${created.name}`,
      metadata: {
        feeId: created._id,
        name: created.name,
      },
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    // Surface Zod validation details for easier debugging
    const details = err?.issues ?? err?.errors ?? undefined;
    return NextResponse.json(
      { success: false, error: err.message, ...(details ? { details } : {}) },
      { status: 400 }
    );
  }
}
