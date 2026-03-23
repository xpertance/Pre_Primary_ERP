// app/api/admission/list/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admission from "@/models/Admission";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

    let admissions = await Admission.find().sort({ createdAt: -1 }).lean();
    
    // Auto-seed if database is empty
    if (admissions.length === 0) {
      console.log("🌱 Admissions collection empty. Auto-seeding sample data...");
      const sampleAdmissions = [
        { childFirstName: "Aarav", childLastName: "Sharma", preferredClass: "Nursery", status: "pending", createdAt: new Date() },
        { childFirstName: "Anaya", childLastName: "Patil", preferredClass: "KG1", status: "pending", createdAt: new Date() },
        { childFirstName: "Vivaan", childLastName: "Mehta", preferredClass: "KG1", status: "pending", createdAt: new Date() },
        { childFirstName: "Diya", childLastName: "Kulkarni", preferredClass: "KG2", status: "pending", createdAt: new Date() },
        { childFirstName: "Kabir", childLastName: "Singh", preferredClass: "Nursery", status: "pending", createdAt: new Date() },
      ];
      await Admission.insertMany(sampleAdmissions);
      admissions = await Admission.find().sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json({ success: true, admissions });
  } catch (error: any) {
    console.error("Admissions GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
