import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User receiving notification
    type: { type: String, enum: ["event", "announcement", "fee", "attendance", "exam", "transport", "meal", "system", "leave"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of related resource (exam, event, etc)
    relatedModel: String, // Model name (Exam, Event, etc)
    isRead: { type: Boolean, default: false },
    readAt: Date,
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    actionUrl: String, // URL to navigate to related resource
    icon: String, // icon name for UI
    metadata: mongoose.Schema.Types.Mixed, // additional data
  },
  { timestamps: true }
);

delete mongoose.models.Notification;
export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
