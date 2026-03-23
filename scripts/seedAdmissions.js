const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load .env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
}

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
}

// Define Admission Schema (must match models/Admission.ts)
const AdmissionSchema = new mongoose.Schema(
    {
        childFirstName: { type: String, required: true },
        childLastName: String,
        dob: Date,
        gender: String,
        preferredClass: String,
        status: { type: String, enum: ["submitted","pending","approved","rejected","enrolled"], default: "submitted" },
        admissionDate: Date,
    },
    { timestamps: true }
);

const Admission = mongoose.models.Admission || mongoose.model("Admission", AdmissionSchema);

async function seedAdmissions() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected!\n");

        const existing = await Admission.countDocuments();
        if (existing > 0) {
            console.log(`ℹ️ Database already contains ${existing} admissions. Skipping seeding to avoid duplication.`);
            return;
        }

        console.log("🌱 Seeding Sample Admissions...");
        
        const sampleAdmissions = [
            { childFirstName: "Aarav", childLastName: "Sharma", preferredClass: "Nursery", status: "pending", admissionDate: new Date() },
            { childFirstName: "Anaya", childLastName: "Patil", preferredClass: "KG1", status: "pending", admissionDate: new Date() },
            { childFirstName: "Vivaan", childLastName: "Mehta", preferredClass: "KG1", status: "pending", admissionDate: new Date() },
            { childFirstName: "Diya", childLastName: "Kulkarni", preferredClass: "KG2", status: "pending", admissionDate: new Date() },
            { childFirstName: "Kabir", childLastName: "Singh", preferredClass: "Nursery", status: "pending", admissionDate: new Date() },
            { childFirstName: "Saanvi", childLastName: "Iyer", preferredClass: "KG2", status: "approved", admissionDate: new Date() },
            { childFirstName: "Reyansh", childLastName: "Jain", preferredClass: "Nursery", status: "submitted", admissionDate: new Date() },
            { childFirstName: "Myra", childLastName: "Reddy", preferredClass: "KG1", status: "pending", admissionDate: new Date() },
        ];

        await Admission.insertMany(sampleAdmissions);
        console.log(`✅ Successfully seeded ${sampleAdmissions.length} admissions.\n`);

    } catch (error) {
        console.error("❌ Error seeding admissions:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmissions();
