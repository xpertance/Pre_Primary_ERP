const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB.");

    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    const studentsExists = collections.some((col) => col.name === "students");
    
    if (studentsExists) {
        const indexes = await db.collection("students").indexes();
        const hasEmailIndex = indexes.some(index => index.name === "email_1");

        if (hasEmailIndex) {
            await db.collection("students").dropIndex("email_1");
            console.log("Successfully dropped 'email_1' index from 'students' collection.");
        } else {
            console.log("'email_1' index does not exist in 'students' collection.");
        }
    } else {
        console.log("Collection 'students' does not exist.");
    }
  } catch (error) {
    console.error("Error dropping index:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB.");
  }
}

main();
