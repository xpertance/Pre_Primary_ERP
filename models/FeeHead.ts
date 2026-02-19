import mongoose from "mongoose";

const FeeHeadSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true }, // e.g., "Tuition Fee", "Transport Fee"
        type: {
            type: String,
            enum: ["recurring", "one-time", "optional", "transport"],
            default: "recurring"
        },
        defaultAmount: { type: Number, default: 0 },
        description: String,
        active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export default mongoose.models.FeeHead || mongoose.model("FeeHead", FeeHeadSchema);
