import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// Helper to check authorized access (admin or teacher)
async function checkAuth(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();
    let user: any = null;
    if (decoded.role === "teacher") {
        const Teacher = (await import("@/models/Teacher")).default;
        user = await Teacher.findById(decoded.id);
        if (user) user.role = "teacher";
    } else {
        user = await User.findById(decoded.id);
    }

    if (!user || !["admin", "teacher"].includes(user.role)) return null;

    return user;
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15
) {
    try {
        const user = await checkAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const transaction = await FeeTransaction.findById(id);

        if (!transaction) {
            return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
        }

        if (transaction.amountPaid > 0) {
            return NextResponse.json(
                { success: false, error: "Cannot delete a transaction that has collected payments. Please delete/refund payments first mainly by database access for now." },
                { status: 400 }
            );
        }

        await FeeTransaction.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
    } catch (error: any) {
        console.error("Delete transaction error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await checkAuth(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { note, dueDate, items } = body;

        const transaction = await FeeTransaction.findById(id);
        if (!transaction) {
            return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
        }

        // update allowed fields
        if (note !== undefined) transaction.note = note;
        if (dueDate !== undefined) transaction.dueDate = new Date(dueDate);

        // Update items/amount only if no payments made (to avoid data inconsistency)
        if (items && items.length > 0) {
            if (transaction.amountPaid > 0) {
                // For now restrictive: don't allow changing amount if paid. 
                // We could allow if new amount >= paid, but let's be safe.
                // Ideally we allow changing items but ensure total amount is valid.
                // Let's Skip item update if paid > 0 for now or verify logic.
                return NextResponse.json(
                    { success: false, error: "Cannot update fee items/amount when partial payment exists." },
                    { status: 400 }
                );
            } else {
                transaction.items = items;
                // Recalculate total
                transaction.amountDue = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
            }
        }

        await transaction.save();

        return NextResponse.json({ success: true, transaction });
    } catch (error: any) {
        console.error("Update transaction error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
