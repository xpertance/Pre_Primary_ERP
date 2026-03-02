import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import LogActivity from "@/models/LogActivity";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password, role } = await req.json();
    console.log("[api/auth/login] Login attempt for email:", email, "role:", role);
    console.log("[api/auth/login] Password length received:", password ? password.length : "N/A");
    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate input
    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "teacher", "student", "parent"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided" },
        { status: 400 }
      );
    }

    let user = null;
    let detectedRole = role || "admin";

    console.log(`[api/auth/login] Searching for user: ${trimmedEmail} with role hint: ${role}`);

    // Search based on the role provided
    if (role === "teacher") {
      user = await Teacher.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = "teacher";
      }
    } else if (role === "student") {
      user = await Student.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = "student";
      }
    } else if (role === "parent") {
      // Parent logs in using the email/password that was set on the Student record
      // by the admin when the student was created. No separate User record needed.
      user = await Student.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = "parent";
      }
    } else if (role === "admin" || !role) {
      // Try User model first (admin/parent)
      user = await User.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = user.role || "admin";
      }
    }

    // If user not found with specified role, try other models as fallback
    if (!user) {
      console.log("[api/auth/login] User not found with primary role search, trying fallbacks...");
      // Try User model
      user = await User.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = user.role || "admin";
      }
    }

    if (!user) {
      // Try Teacher model
      user = await Teacher.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = "teacher";
      }
    }

    if (!user) {
      // Try Student model
      user = await Student.findOne({ email: trimmedEmail });
      if (user) {
        detectedRole = "student";
      }
    }

    // If still not found in any model, return error
    if (!user) {
      console.log(`[api/auth/login] User not found: ${trimmedEmail}`);
      try {
        await LogActivity.create({
          actorEmail: trimmedEmail,
          actorRole: role || "unknown",
          action: "login",
          result: "failure",
          message: "Invalid email",
          ip: req.headers.get("x-forwarded-for") || undefined,
          userAgent: req.headers.get("user-agent") || undefined,
        });
      } catch (e) {
        console.error("Failed to save log activity (invalid email):", e);
      }
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    console.log(`[api/auth/login] User found: ${user.email} (${user._id}), Role: ${detectedRole}`);

    // Check if password field exists
    if (!user.password) {
      console.error("[api/auth/login] User has no password set");
      return NextResponse.json(
        { error: "User password not set" },
        { status: 400 }
      );
    }

    // Verify password
    console.log("[api/auth/login] Verifying password...");
    // const match = await bcrypt.compare(trimmedPassword, user.password); // Use trimmed password

    // DEBUG: Direct comparison for diagnosis if bcrypt fails confusingly
    let match = false;
    try {
      match = await bcrypt.compare(trimmedPassword, user.password);
    } catch (err) {
      console.error("[api/auth/login] bcrypt error:", err);
    }

    console.log(`[api/auth/login] Password match result: ${match}`);

    if (!match) {
      try {
        await LogActivity.create({
          actorId: user._id,
          actorEmail: user.email,
          actorRole: detectedRole,
          action: "login",
          result: "failure",
          message: "Invalid password",
          ip: req.headers.get("x-forwarded-for") || undefined,
          userAgent: req.headers.get("user-agent") || undefined,
        });
      } catch (e) {
        console.error("Failed to save log activity (invalid password):", e);
      }
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // Ensure JWT_SECRET is defined
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[api/auth/login] JWT_SECRET is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // For parent role: embed studentId so /api/parent/students can directly
    // return the child without needing a separate parent-user linkage.
    const tokenPayload: Record<string, unknown> = { id: user._id, role: detectedRole, email: user.email };
    if (detectedRole === "parent") {
      tokenPayload.studentId = user._id; // student._id IS the child
    }
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "7d",
    });

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    const res = NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          role: detectedRole,
          name: user.name || user.firstName,
        },
      },
      { status: 200 }
    );

    // DEBUG: log environment and token length (do not log token in production)
    try {
      console.log('[api/auth/login] setting cookie, NODE_ENV=', process.env.NODE_ENV, 'token_len=', token.length);
    } catch {
      // ignore logging errors
    }

    // Use NextResponse cookies helper to set an HttpOnly cookie (works in dev & prod)
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Also set a Set-Cookie header string as a fallback for some clients/dev setups
    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const cookieString = `token=${token}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${maxAge}`;
    res.headers.set("Set-Cookie", cookieString);

    try {
      await LogActivity.create({
        actorId: user._id,
        actorEmail: user.email,
        actorRole: detectedRole,
        action: "login",
        result: "success",
        message: "Login successful",
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
    } catch (e) {
      console.error("Failed to save log activity (success):", e);
    }

    return res;
  } catch (error) {
    console.error("[api/auth/login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
