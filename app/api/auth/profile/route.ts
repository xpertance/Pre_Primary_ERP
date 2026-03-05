import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    try {
        await connectDB();
        const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let user = null;
        if (decoded.role === "admin" || decoded.role === "parent") {
            user = await User.findById(decoded.id).select("-password").lean();
        } else if (decoded.role === "teacher") {
            user = await Teacher.findById(decoded.id).select("-password").lean();
        } else if (decoded.role === "student") {
            user = await Student.findById(decoded.id).select("-password").lean();
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.id = user._id.toString();
        user.role = decoded.role;

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("[api/auth/profile] GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, firstName, lastName, email, password } = body;

        let updateData: any = {};
        if (name) updateData.name = name;
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        let updatedUser = null;
        if (decoded.role === "admin" || decoded.role === "parent") {
            updatedUser = await User.findByIdAndUpdate(decoded.id, updateData, { new: true }).select("-password").lean();
        } else if (decoded.role === "teacher") {
            updatedUser = await Teacher.findByIdAndUpdate(decoded.id, updateData, { new: true }).select("-password").lean();
        } else if (decoded.role === "student") {
            updatedUser = await Student.findByIdAndUpdate(decoded.id, updateData, { new: true }).select("-password").lean();
        }

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("[api/auth/profile] PUT error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
