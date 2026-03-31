import mongoose from "mongoose";
import User from "../models/User"; // adjust path if needed
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env" });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await User.findOne({ email: "admin@school.com" });
  if (exists) { console.log("admin exists"); process.exit(); }

  const plainPassword = "admin123";
  const hashed = await bcrypt.hash(plainPassword, 10);

  const u = new User({ name: "Admin", email: "admin@school.com", role: "admin", password: hashed });
  await u.save();
  console.log("created admin", u._id);
  process.exit();
}

main().catch(console.error);
