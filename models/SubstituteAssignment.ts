import mongoose from "mongoose";

export type ISubstituteAssignmentDoc = mongoose.Document & {
  leaveId: mongoose.Types.ObjectId;
  originalTeacherId: mongoose.Types.ObjectId;
  substituteTeacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subject: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "assigned" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
};

const SubstituteAssignmentSchema = new mongoose.Schema<ISubstituteAssignmentDoc>(
  {
    leaveId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherLeave", required: true },
    originalTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    substituteTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["assigned", "cancelled"], 
      default: "assigned" 
    },
  },
  { timestamps: true }
);

delete mongoose.models.SubstituteAssignment;
export default mongoose.models.SubstituteAssignment || mongoose.model("SubstituteAssignment", SubstituteAssignmentSchema);
