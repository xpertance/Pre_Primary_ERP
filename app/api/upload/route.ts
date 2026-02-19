import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { success: false, error: "Only image files are allowed" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Cloudinary folder "gallery_uploads"
        const result = await uploadFile(buffer, "gallery_uploads");

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
