import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import FeeTransaction from "@/models/FeeTransaction";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
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
        const user = await User.findById(decoded.id);

        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Access denied. Admin only." },
                { status: 403 }
            );
        }

        // Fetch all students with their class information
        const students = await Student.find()
            .populate({
                path: "classId",
                select: "name section teachers",
                populate: { path: "teachers", select: "name email phone" }
            })
            .lean();

        // Fetch all fee transactions
        const allTransactions = await FeeTransaction.find().lean();

        // Build student fee data
        const studentFeeData = await Promise.all(
            students.map(async (student: any) => {
                // Get transactions for this student
                const transactions = allTransactions.filter(
                    (t: any) => t.studentId.toString() === student._id.toString()
                );

                // Calculate totals
                const totalDue = transactions.reduce((sum: number, t: any) => sum + (t.amountDue || 0), 0);
                const totalPaid = transactions.reduce((sum: number, t: any) => sum + (t.amountPaid || 0), 0);
                const totalFine = transactions.reduce((sum: number, t: any) => sum + (t.fineAmount || 0), 0);
                const totalPending = totalDue - totalPaid;

                // Determine overall status
                let status: "paid" | "partial" | "due" = "due";
                if (totalPending === 0 && totalDue > 0) {
                    status = "paid";
                } else if (totalPaid > 0 && totalPending > 0) {
                    status = "partial";
                }

                return {
                    student: {
                        _id: student._id,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        email: student.email,
                        admissionNo: student.admissionNo,
                        classId: student.classId,
                        dob: student.dob,
                        gender: student.gender,
                        parents: student.parents,
                        medical: student.medical,
                        photo: student.photo,
                    },
                    totalDue,
                    totalPaid,
                    totalPending,
                    totalFine,
                    transactions: transactions.map((t: any) => ({
                        _id: t._id,
                        studentId: t.studentId,
                        amountDue: t.amountDue,
                        amountPaid: t.amountPaid,
                        fineAmount: t.fineAmount,
                        status: t.status,
                        items: t.items,
                        dueDate: t.dueDate,
                        note: t.note || "",
                        createdAt: t.createdAt,
                        updatedAt: t.updatedAt,
                    })),
                    status,
                };
            })
        );

        return NextResponse.json({
            success: true,
            students: studentFeeData,
        });
    } catch (error: any) {
        console.error("Error fetching student fee summary:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch student fee summary" },
            { status: 500 }
        );
    }
}
