"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/common/Badge";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Calendar, MapPin, ImageIcon, Loader2, Video, Play } from "lucide-react";

interface GalleryItem {
    _id: string;
    title: string;
    albumName: string;
    category: string;
    description?: string;
    images: Array<{ url: string; caption: string; type: "image" | "video" }>;
    eventDate: string;
    eventLocation?: string;
    isPublished: boolean;
    featured: boolean;
}

export default function GalleryDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [gallery, setGallery] = useState<GalleryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await fetch(`/api/gallery/${id}`);
                const data = await res.json();
                if (data.success) {
                    setGallery(data.gallery);
                } else {
                    showToast.error("Failed to fetch gallery details");
                    router.push("/dashboard/gallery");
                }
            } catch (err) {
                showToast.error("An error occurred");
                router.push("/dashboard/gallery");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchGallery();
        }
    }, [id, router]);

    const getCategoryColor = (
        category: string
    ): "success" | "warning" | "danger" | "info" | "primary" => {
        const colors: Record<string, "success" | "warning" | "danger" | "info" | "primary"> = {
            event: "primary",
            activity: "success",
            achievement: "warning",
            campus: "info",
            celebration: "danger",
            other: "info",
        };
        return colors[category] || "info";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!gallery) return null;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Back Button */}
            <button
                onClick={() => router.push("/dashboard/gallery")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Gallery
            </button>

            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-800">{gallery.albumName}</h1>
                                <Badge variant={getCategoryColor(gallery.category)}>{gallery.category}</Badge>
                            </div>
                            <p className="text-gray-600 text-lg">{gallery.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {gallery.isPublished ? (
                                <Badge variant="success">Published</Badge>
                            ) : (
                                <Badge variant="warning">Draft</Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Date:</span>
                            {gallery.eventDate ? new Date(gallery.eventDate).toLocaleDateString() : "No Date"}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Location:</span>
                            {gallery.eventLocation || "No Location"}
                        </div>
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Media:</span>
                            {gallery.images?.filter(i => i.type !== "video").length || 0} Photos, {gallery.images?.filter(i => i.type === "video").length || 0} Videos
                        </div>
                    </div>

                    {gallery.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800 mb-1">Description</h3>
                            <p className="text-gray-700 leading-relaxed">{gallery.description}</p>
                        </div>
                    )}
                </div>

                {/* Media Grid */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                        Media Gallery
                    </h2>

                    {gallery.images && gallery.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {gallery.images.map((img, index) => (
                                <div key={index} className="group relative">
                                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square cursor-pointer hover:shadow-lg transition-all relative group">
                                        {img.type === "video" ? (
                                            <div className="w-full h-full relative">
                                                <video
                                                    src={img.url}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                        <Play className="w-6 h-6 text-purple-600 fill-purple-600 ml-1" />
                                                    </div>
                                                </div>
                                                {/* Play on click - full screen or simple overlay */}
                                                <button 
                                                    onClick={() => window.open(img.url, '_blank')}
                                                    className="absolute inset-0 w-full h-full opacity-0"
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                src={img.url}
                                                alt={img.caption || `Photo ${index + 1}`}
                                                loading="lazy"
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                onClick={() => window.open(img.url, '_blank')}
                                            />
                                        )}
                                        
                                        {img.type === "video" && (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md flex items-center gap-1 uppercase tracking-wider">
                                                <Video className="w-3 h-3" />
                                                Video
                                            </div>
                                        )}
                                    </div>
                                    {img.caption && (
                                        <div className="mt-3 text-sm font-medium text-gray-700 truncate px-1" title={img.caption}>
                                            {img.caption}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="font-medium">No media in this album</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
