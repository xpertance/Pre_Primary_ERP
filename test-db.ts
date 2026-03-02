import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI as string);
};

async function check() {
    await connectDB();

    const email = "ramesh.gupta@parent.com";

    const user = await mongoose.connection.collection("users").findOne({ email });
    console.log("User:", user);

    const student = await mongoose.connection.collection("students").findOne({ email });
    console.log("Student by student email:", student);

    const studentByParent = await mongoose.connection.collection("students").find({ "parents.email": email }).toArray();
    console.log("Student by parent email:", studentByParent.length, "found", studentByParent);

    process.exit();
}

check();
