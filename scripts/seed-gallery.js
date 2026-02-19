const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
    const envConfig = require("dotenv").parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

const gallerySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    albumName: { type: String, required: true },
    category: {
        type: String,
        enum: ["event", "activity", "achievement", "campus", "celebration", "other"],
        default: "event",
    },
    images: [
        {
            url: { type: String, required: true },
            caption: String,
            uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            uploadedAt: { type: Date, default: Date.now },
            likes: { type: Number, default: 0 },
        },
    ],
    eventDate: Date,
    eventLocation: String,
    isPublished: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Gallery = mongoose.models.Gallery || mongoose.model("Gallery", gallerySchema);

async function seedGallery() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Find or create "Sports Day" album
        let album = await Gallery.findOne({ albumName: "Sports Day" });

        if (!album) {
            console.log("Creating new 'Sports Day' album...");
            album = new Gallery({
                title: "Annual Sports Meet 2025",
                albumName: "Sports Day",
                description: "Highlights from our annual sports event.",
                category: "event",
                eventDate: new Date(),
                eventLocation: "School Ground",
                isPublished: true,
                images: [],
            });
        } else {
            console.log("Found existing 'Sports Day' album, adding images...");
        }

        const newImages = [];
        for (let i = 1; i <= 50; i++) {
            newImages.push({
                url: `https://picsum.photos/seed/${i}/800/600`, // Using structured placeholder images
                caption: `Sports Day Highlight #${i} - Action Shot`,
            });
        }

        album.images.push(...newImages);
        await album.save();

        console.log(`Successfully added ${newImages.length} images to '${album.albumName}'`);
        console.log(`Total images in album: ${album.images.length}`);

    } catch (error) {
        console.error("Error seeding gallery:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seedGallery();
