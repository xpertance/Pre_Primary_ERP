import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeHead from "@/models/FeeHead";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// Helper to check admin access
async function checkAdmin(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") return null;

    return user;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await checkAdmin(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, type, defaultAmount, description } = body;

        const head = await FeeHead.findById(id);
        if (!head) {
            return NextResponse.json({ success: false, error: "Fee Head not found" }, { status: 404 });
        }

        if (name) head.name = name;
        if (type) head.type = type;
        if (defaultAmount !== undefined) head.defaultAmount = Number(defaultAmount);
        if (description !== undefined) head.description = description;

        await head.save();

        return NextResponse.json({ success: true, head });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await checkAdmin(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Soft delete
        const head = await FeeHead.findByIdAndUpdate(id, { active: false }, { new: true });

        if (!head) {
            return NextResponse.json({ success: false, error: "Fee Head not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Fee Head deactivated" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
