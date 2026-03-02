import mongoose from "mongoose";

export type ITeacherDoc = mongoose.Document & {
  name: string;
  email: string;
  password: string; // hashed
  phone?: string;
  subjects?: string[]; // e.g., ["Math", "EVS"]
  classes?: { classId: mongoose.Types.ObjectId; section?: string }[];
  qualifications?: string[];
  createdAt: Date;
  updatedAt: Date;
};

const TeacherSchema = new mongoose.Schema<ITeacherDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed password
    phone: String,
    subjects: [String],
    classes: [
      {
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
        section: String,
      },
    ],
    qualifications: [String],
  },
  { timestamps: true }
);
delete mongoose.models.Teacher;
export default mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);
