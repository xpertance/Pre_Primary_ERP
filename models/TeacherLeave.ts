import mongoose from "mongoose";

export type ITeacherLeaveDoc = mongoose.Document & {
  teacherId: mongoose.Types.ObjectId;
  leaveType: "sick" | "casual" | "emergency" | "half-day" | "paid" | "unpaid";
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  adminRemarks?: string;
  attachment?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const TeacherLeaveSchema = new mongoose.Schema<ITeacherLeaveDoc>(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    leaveType: { 
      type: String, 
      enum: ["sick", "casual", "emergency", "half-day", "paid", "unpaid"], 
      required: true 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected", "cancelled"], 
      default: "pending" 
    },
    adminRemarks: String,
    attachment: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

delete mongoose.models.TeacherLeave;
export default mongoose.models.TeacherLeave || mongoose.model("TeacherLeave", TeacherLeaveSchema);
