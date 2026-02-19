import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import Student from "@/models/Student";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
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

        await connectDB();
        const user = await User.findById(decoded.id);

        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Access denied. Admin only." },
                { status: 403 }
            );
        }

        const { studentId, items, dueDate, note } = await req.json();

        if (!studentId || !items || items.length === 0) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return NextResponse.json(
                { success: false, error: "Student not found" },
                { status: 404 }
            );
        }

        const amountDue = items.reduce((sum: number, item: any) => sum + item.amount, 0);

        const newTransaction = await FeeTransaction.create({
            studentId: student._id,
            amountDue,
            amountPaid: 0,
            fineAmount: 0,
            status: "due",
            items,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            note,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({
            success: true,
            transaction: newTransaction,
        });

    } catch (error: any) {
        console.error("Error creating fee transaction:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create fee transaction" },
            { status: 500 }
        );
    }
}
