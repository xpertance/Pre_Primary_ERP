import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    // Only admin and finance should see total revenue
    if (!user || !["admin", "finance"].includes(user.role)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const result = await FeeTransaction.aggregate([
            { $match: { status: "paid" } },
            { $group: { _id: null, totalCollected: { $sum: "$amountPaid" } } }
        ]);

        const totalCollected = result.length > 0 ? result[0].totalCollected : 0;

        return NextResponse.json({ success: true, totalCollected });
    } catch (error) {
        console.error("Error fetching fee summary:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch summary" }, { status: 500 });
    }
}
