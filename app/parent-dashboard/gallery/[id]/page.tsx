"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

export default function ParentGalleryDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [gallery, setGallery] = useState<GalleryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await fetch(`/api/gallery/${id}`);
                const data = await res.json();
                if (data.success) {
                    // Check if published (safety check for parents)
                    if (!data.gallery.isPublished) {
                        showToast.error("Album not available");
                        router.push(`/${user?.role}-dashboard/gallery`);
                        return;
                    }
                    setGallery(data.gallery);
                } else {
                    showToast.error("Failed to fetch gallery details");
                    router.push(`/${user?.role}-dashboard/gallery`);
                }
            } catch (err) {
                showToast.error("An error occurred");
                router.push(`/${user?.role}-dashboard/gallery`);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchGallery();
        }
    }, [id, router, user]);

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
                onClick={() => router.push(`/${user?.role}-dashboard/gallery`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
            >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-purple-300 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Back to Memories</span>
            </button>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                    <div className="relative p-8 md:p-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="space-y-4 max-w-2xl">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={getCategoryColor(gallery.category)} size="sm">
                                        <span className="capitalize">{gallery.category}</span>
                                    </Badge>
                                    {gallery.featured && (
                                        <Badge variant="warning" size="sm">Featured</Badge>
                                    )}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                                    {gallery.title}
                                </h1>
                                <p className="text-xl text-gray-500 font-medium">
                                    {gallery.albumName}
                                </p>
                            </div>
                            
                            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-500 border-l border-gray-100 pl-6 md:pl-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Event Date</p>
                                        <p className="text-gray-900">{gallery.eventDate ? new Date(gallery.eventDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : "No Date"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Location</p>
                                        <p className="text-gray-900">{gallery.eventLocation || "School Campus"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {gallery.description && (
                            <div className="mt-8 pt-8 border-t border-gray-50">
                                <p className="text-lg text-gray-600 leading-relaxed max-w-4xl">
                                    {gallery.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Media Gallery Grid */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                <ImageIcon className="w-5 h-5 text-white" />
                            </div>
                            The Gallery
                        </h2>
                        <div className="text-sm font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
                            {gallery.images?.length || 0} Items
                        </div>
                    </div>

                    {gallery.images && gallery.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {gallery.images.map((img, index) => (
                                <div 
                                    key={index} 
                                    className="group relative bg-white p-2 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:-translate-y-2 cursor-pointer overflow-hidden"
                                    onClick={() => window.open(img.url, '_blank')}
                                >
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 relative">
                                        {img.type === "video" ? (
                                            <div className="w-full h-full relative">
                                                <video src={img.url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                                    <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                                                        <Play className="w-8 h-8 text-purple-600 fill-purple-600 ml-1" />
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Video className="w-3.5 h-3.5" />
                                                    Video
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={img.url}
                                                alt={img.caption || `Memory ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        )}
                                        
                                        {/* Caption Overlay */}
                                        {img.caption && (
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <p className="text-white text-sm font-medium line-clamp-2">
                                                    {img.caption}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {img.caption && (
                                        <div className="p-3 text-center">
                                            <p className="text-sm font-bold text-gray-700 truncate group-hover:text-purple-600 transition-colors">
                                                {img.caption}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm mt-8">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <ImageIcon className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">No memories yet</h3>
                            <p className="text-gray-500 mt-2">Check back later for photos and videos!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
