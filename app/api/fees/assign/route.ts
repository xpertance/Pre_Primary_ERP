import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeStructure from "@/models/FeeStructure";
import Student from "@/models/Student";
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

export async function POST(req: NextRequest) {
    try {
        const authUser = await checkAuth(req);
        if (!authUser) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { structureId, classId, month, year, dueDate } = body;

        if (!structureId || !classId) {
            return NextResponse.json({ success: false, error: "Structure and Class are required" }, { status: 400 });
        }

        // 1. Fetch Structure
        const structure = await FeeStructure.findById(structureId);
        if (!structure) {
            return NextResponse.json({ success: false, error: "Fee Structure not found" }, { status: 404 });
        }

        // 2. Fetch Students by classId
        const students = await Student.find({ classId: classId, active: { $ne: false } });
        if (students.length === 0) {
            return NextResponse.json({ success: false, error: "No active students found in this class" }, { status: 404 });
        }

        // 3. Prepare Transaction Details
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let title = structure.name;
        if (month !== undefined && year) {
            title = `${structure.name} - ${monthNames[parseInt(month)]} ${year}`;
        }

        const totalAmount = structure.heads.reduce((sum: number, head: any) => sum + head.amount, 0);

        const items = structure.heads.map((head: any) => ({
            head: head.title,
            amount: head.amount,
        }));

        const finalDueDate = dueDate ? new Date(dueDate) : new Date();

        // 4. Create Transactions
        const transactionsToCreate = students.map((student: any) => ({
            studentId: student._id,
            amountDue: totalAmount,
            amountPaid: 0,
            status: "due",
            dueDate: finalDueDate,
            items: items,
            note: title,
        }));

        // Bulk Insert
        await FeeTransaction.insertMany(transactionsToCreate);

        return NextResponse.json({
            success: true,
            message: `Successfully generated fees for ${students.length} students.`,
            count: students.length
        });

    } catch (error: any) {
        console.error("Bulk assign error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
