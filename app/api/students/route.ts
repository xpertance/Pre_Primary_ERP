// app/api/students/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import { StudentCreateZ } from "@/lib/validations/studentSchema";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";
import bcryptjs from "bcryptjs";

export async function GET(req: Request) {
  await connectDB();

  // pagination
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  // optional filter by classId, name, etc.
  const filter: any = {};
  if (url.searchParams.get("classId")) filter.classId = url.searchParams.get("classId");
  if (url.searchParams.get("q")) {
    const q = url.searchParams.get("q");
    filter.$or = [
      { firstName: { $regex: q!, $options: "i" } },
      { lastName: { $regex: q!, $options: "i" } },
      { admissionNo: { $regex: q!, $options: "i" } },
    ];
  }

  // RBAC: allow parent to fetch only records they are related to.
  // Identify user from cookie token (server-side)
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  const user = verifyToken(token);

  if (user?.role === "parent") {
    // Example: parents have id equal to parent's user id; students.parents[].email or phone may link.
    // This is an example fallback. You'll likely map parent->students in DB; adjust accordingly.
    // For demo, if parent's id stored in admissionNo or similar, you'd filter.
    // Here we simply return 403 for parent unless further mapping implemented.
    return NextResponse.json({ success: false, error: "Parents must use parent-portal endpoints" }, { status: 403 });
  }

  const [students, total] = await Promise.all([
    Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Student.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: students,
    students,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  await connectDB();

  // RBAC: only admin or teacher can create
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    console.log("Creating student with data:", body);

    // Sanitize: convert empty strings to undefined so optional Zod fields
    // (like email, phone) don't fail validation when form inputs are empty.
    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj;
      const copy: any = Array.isArray(obj) ? [] : {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string") {
          copy[key] = val.trim() === "" ? undefined : val;
        } else if (Array.isArray(val)) {
          copy[key] = val.map((v) =>
            typeof v === "string" && v.trim() === "" ? undefined : sanitize(v)
          );
        } else if (val && typeof val === "object") {
          copy[key] = sanitize(val);
        } else {
          copy[key] = val;
        }
      }
      return copy;
    };

    const cleanBody = sanitize(body);
    if (Array.isArray(cleanBody.parents)) {
      cleanBody.parents = cleanBody.parents.map((p: any) => {
        if (p && typeof p === "object") {
          if (p.email === "" || p.email === undefined) delete p.email;
          if (p.phone === "" || p.phone === undefined) delete p.phone;
        }
        return p;
      });
    }

    const parsed = StudentCreateZ.parse(cleanBody);
    console.log("Parsed student data:", parsed);

    // Hash password if provided
    let hashedPassword = undefined;
    if (parsed.password) {
      hashedPassword = await bcryptjs.hash(parsed.password, 10);
    }

    const created = await Student.create({
      ...parsed,
      password: hashedPassword,
      dob: parsed.dob ? new Date(parsed.dob) : undefined,
      admissionDate: parsed.admissionDate ? new Date(parsed.admissionDate) : undefined,
    });
    console.log("Student created with ID:", created._id);

    // Log admin activity
    await logAdminActivity({
      actorId: user?.id,
      actorRole: user?.role || "unknown",
      action: "create:student",
      message: `Created student: ${parsed.firstName} ${parsed.lastName || ""} (Admission No: ${parsed.admissionNo || "N/A"})`,
      metadata: { studentId: created._id, firstName: parsed.firstName, lastName: parsed.lastName, admissionNo: parsed.admissionNo },
    });


    // Fee assignment is now handled explicitly via the UI during enrollment.
    // No automatic fee creation here to avoid duplicate transactions.

    return NextResponse.json({ success: true, student: created }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error creating student:", error);

    let errorMessage = error.message || "Invalid data";

    // Handle MongoDB duplicate key errors
    if (error.message?.includes("duplicate key")) {
      const match = error.message.match(/key:\s*\{([^}]+)\}/);
      if (match) {
        const field = match[1].split(":")[0].trim();
        errorMessage = `${field} already exists`;
      } else {
        errorMessage = "Duplicate entry found";
      }
    }

    // Handle validation errors
    if (err instanceof Error && 'errors' in err) {
      const validationErrors = (err as any).errors;
      errorMessage = Object.values(validationErrors)
        .map((e: any) => e.message || String(e))
        .join(", ");
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 400 });
  }
}
