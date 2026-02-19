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

export async function GET(req: NextRequest) {
    try {
        const user = await checkAdmin(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const heads = await FeeHead.find({ active: true }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, heads });
    } catch (error: any) {
        console.error("Fetch fee heads error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await checkAdmin(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, type, defaultAmount, description } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
        }

        const existing = await FeeHead.findOne({ name });
        if (existing) {
            return NextResponse.json({ success: false, error: "Fee Head with this name already exists" }, { status: 400 });
        }

        const newHead = await FeeHead.create({
            name,
            type,
            defaultAmount: Number(defaultAmount) || 0,
            description,
        });

        return NextResponse.json({ success: true, head: newHead });
    } catch (error: any) {
        console.error("Create fee head error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
