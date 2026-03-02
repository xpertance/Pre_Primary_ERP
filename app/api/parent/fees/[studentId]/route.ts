import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeTransaction from "@/models/FeeTransaction";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";

export async function GET(req: Request, context: any) {
  await connectDB();
  const { studentId } = await context.params;

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const parent = verifyToken(token);
  if (!parent || parent.role !== "parent") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const student = await parentOwnsStudent(studentId, parent.id, (parent as any).email);
  if (!student) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  // return transactions for this student
  const tx = await FeeTransaction.find({ studentId }).sort({ createdAt: -1 }).lean();
  const totalPaid = tx.reduce((s: any, t: any) => s + (t.amountPaid || 0), 0);
  const totalDue = tx.reduce((s: any, t: any) => s + ((t.amountDue || 0) - (t.amountPaid || 0)), 0);

  return NextResponse.json({ success: true, fees: tx, totalPaid, totalDue });
}
