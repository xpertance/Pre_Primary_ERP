import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    schoolName: String,
    schoolLogo: String,
    schoolAddress: String,
    schoolPhone: String,
    schoolEmail: String,
    principalName: String,
    academicYear: String, // e.g., "2024-2025"
    subjects: { type: [String], default: [] },
    termDates: [
      {
        termName: String,
        startDate: Date,
        endDate: Date,
      }
    ],
    holidays: [
      {
        holidayName: String,
        startDate: Date,
        endDate: Date,
        type: { type: String, enum: ["national", "optional", "school"], default: "national" },
      }
    ],
    leaveQuotas: {
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 5 },
      emergency: { type: Number, default: 3 },
    },
    featureFlags: {
      enableTransport: { type: Boolean, default: true },
      enableMealPlan: { type: Boolean, default: true },
      enableGallery: { type: Boolean, default: true },
      enableEvents: { type: Boolean, default: true },
      enableOnlinePayment: { type: Boolean, default: true },
      enableClaudeHaiku45: { type: Boolean, default: true },
    },
    paymentGateway: {
      provider: { type: String, enum: ["razorpay", "stripe", "paytm", "none"], default: "razorpay" },
      apiKey: String,
      secretKey: String,
    },
    emailSettings: {
      smtpServer: String,
      smtpPort: Number,
      senderEmail: String,
      senderPassword: String,
    },
    notificationSettings: {
      enableEmailNotifications: { type: Boolean, default: true },
      enableSmsNotifications: { type: Boolean, default: true },
      enablePushNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
