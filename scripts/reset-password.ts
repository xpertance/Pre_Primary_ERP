import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

const resetPassword = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const email = "admin123@school.com";
    const newPassword = "123456";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Try User model (collection 'users')
    const result = await mongoose.connection.collection("users").updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount > 0) {
      console.log(`Password reset successfully for ${email}`);
    } else {
      console.log(`User ${email} not found in 'users' collection`);
      
      // Try 'teachers'
      const tResult = await mongoose.connection.collection("teachers").updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );
      
      if (tResult.matchedCount > 0) {
        console.log(`Password reset successfully for ${email} in 'teachers' collection`);
      } else {
         // Try 'students'
         const sResult = await mongoose.connection.collection("students").updateOne(
           { email },
           { $set: { password: hashedPassword } }
         );
         
         if (sResult.matchedCount > 0) {
           console.log(`Password reset successfully for ${email} in 'students' collection`);
         } else {
           console.log(`User ${email} not found in any collection`);
         }
      }
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
  }
};

resetPassword();
