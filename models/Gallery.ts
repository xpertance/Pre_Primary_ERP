import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    albumName: { type: String, required: true }, // e.g., "Sports Day 2025", "Annual Function"
    category: { type: String, enum: ["event", "activity", "achievement", "campus", "celebration", "other"], default: "other" },
    images: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], default: "image" },
        caption: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
        likes: { type: Number, default: 0 },
        comments: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            text: String,
            createdAt: { type: Date, default: Date.now },
          }
        ],
      }
    ],
    eventDate: Date,
    eventLocation: String,
    visibility: { type: String, enum: ["public", "parents", "staff", "private"], default: "parents" },
    isPublished: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Gallery || mongoose.model("Gallery", GallerySchema);
