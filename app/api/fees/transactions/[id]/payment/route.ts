import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication
        const token = req.cookies.get("token")?.value;
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch user to check role
        await connectDB();
        let user: any = null;
        if (decoded.role === "teacher") {
            const Teacher = (await import("@/models/Teacher")).default;
            user = await Teacher.findById(decoded.id);
            if (user) user.role = "teacher";
        } else {
            user = await User.findById(decoded.id);
        }

        if (!user || !["admin", "teacher"].includes(user.role)) {
            return NextResponse.json(
                { success: false, error: "Access denied. Admin or Teacher only." },
                { status: 403 }
            );
        }

        // Fix for Next.js 15: params is a Promise
        const { id: transactionId } = await params;
        const body = await req.json();
        const { amountPaid, paymentMethod, paymentDate, note, fineAdjustment } = body;

        if (!amountPaid || amountPaid <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid payment amount" },
                { status: 400 }
            );
        }

        const transaction = await FeeTransaction.findById(transactionId);

        if (!transaction) {
            return NextResponse.json(
                { success: false, error: "Transaction not found" },
                { status: 404 }
            );
        }

        const currentPaid = transaction.amountPaid || 0;
        const newTotalPaid = currentPaid + amountPaid;
        const totalDue = transaction.amountDue + (transaction.fineAmount || 0);

        // Update transaction
        transaction.amountPaid = newTotalPaid;

        // Determine status
        if (newTotalPaid >= totalDue) {
            transaction.status = "paid";
        } else if (newTotalPaid > 0) {
            transaction.status = "partial";
        } else {
            transaction.status = "due";
        }

        // Add payment record (if schema supports it, otherwise just update totals)
        // Assuming we might want to store payment history in the future, 
        // but for now the model only has amountPaid. 
        // Ideally we should have a separate Payment model or an array in FeeTransaction.
        // For this iteration, we update the totals as per current schema.

        await transaction.save();

        return NextResponse.json({
            success: true,
            transaction,
        });

    } catch (error: any) {
        console.error("Error recording payment:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to record payment" },
            { status: 500 }
        );
    }
}
