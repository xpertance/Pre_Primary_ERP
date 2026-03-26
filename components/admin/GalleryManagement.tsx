"use client";
import React, { useState, useEffect } from "react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/Table";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { showToast } from "@/lib/toast";
import { exportToCSV } from "@/utils/exportData";
import {
  ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Search,
  Star,
  CheckCircle2,
  Calendar,
  MapPin,
  Eye,
  XCircle,
  Loader2,
  Video,
  ImagePlus,
} from "lucide-react";

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
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

const CATEGORIES = [
  { value: "event", label: "Event" },
  { value: "activity", label: "Activity" },
  { value: "achievement", label: "Achievement" },
  { value: "campus", label: "Campus" },
  { value: "celebration", label: "Celebration" },
  { value: "other", label: "Other" },
];

export default function GalleryManagement({ isViewer = false }: { isViewer?: boolean }) {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" && !isViewer;

  const [formData, setFormData] = useState({
    title: "",
    albumName: "",
    description: "",
    category: "event",
    eventDate: "",
    eventLocation: "",
    isPublished: false,
    featured: false,
    images: [] as { url: string; caption: string; type: "image" | "video" }[],
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Helper to handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadImages(Array.from(e.target.files));
    }
  };

  const uploadImages = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    const total = files.length;
    let completed = 0;

    const newItems: { url: string; caption: string; type: "image" | "video" }[] = [];

    try {
      await Promise.all(
        files.map(async (file) => {
          const type = file.type.startsWith("video") ? "video" : "image";
          const formData = new FormData();
          formData.append("file", file);

          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();

            if (data.success) {
              newItems.push({ url: data.url, caption: "", type });
            } else {
              showToast.error(`Failed to upload ${file.name}`);
            }
          } catch (err) {
            console.error(err);
            showToast.error(`Error uploading ${file.name}`);
          } finally {
            completed++;
            setUploadProgress(Math.round((completed / total) * 100));
          }
        })
      );

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newItems],
      }));

    } catch (error) {
      console.error("Upload error", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const updateCaption = (index: number, caption: string) => {
    setFormData((prev) => {
      const updated = [...prev.images];
      updated[index].caption = caption;
      return { ...prev, images: updated };
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = isAdmin ? "/api/gallery" : "/api/gallery?status=published";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGalleries(data.galleries || data.data || []);
      }
    } catch (err) {
      showToast.error("Failed to fetch galleries");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.albumName) {
      showToast.error("Title and album name are required");
      return;
    }

    try {
      const url = "/api/gallery";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (response.ok) {
        showToast.success(`Album ${editingId ? "updated" : "created"} successfully`);
        fetchData();
        setShowModal(false);
        resetForm();
      } else {
        showToast.error("Failed to save album");
      }
    } catch (err) {
      showToast.error("Error saving album");
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/gallery?id=${deletingId}`, { method: "DELETE" });

      if (response.ok) {
        showToast.success("Album deleted successfully");
        fetchData();
        setShowDeleteModal(false);
        setDeletingId(null);
      } else {
        showToast.error("Failed to delete album");
      }
    } catch (err) {
      showToast.error("Error deleting album");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      albumName: "",
      description: "",
      category: "event",
      eventDate: "",
      eventLocation: "",
      isPublished: false,
      featured: false,
      images: [],
    });
    setEditingId(null);
  };

  const handleEdit = (gallery: GalleryItem) => {
    setFormData({
      title: gallery.title,
      albumName: gallery.albumName,
      description: gallery.description || "",
      category: gallery.category,
      eventDate: gallery.eventDate?.split("T")[0] || "",
      eventLocation: gallery.eventLocation || "",
      isPublished: gallery.isPublished,
      featured: gallery.featured,
      images: gallery.images || [],
    });
    setEditingId(gallery._id);
    setShowModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const filteredGalleries = galleries.filter((gallery) => {
    const matchesSearch =
      gallery.albumName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gallery.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || gallery.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: galleries.length,
    published: galleries.filter((g) => g.isPublished).length,
    featured: galleries.filter((g) => g.featured).length,
    totalPhotos: galleries.reduce((sum, g) => sum + (g.images?.filter(i => i.type !== "video").length || 0), 0),
    totalVideos: galleries.reduce((sum, g) => sum + (g.images?.filter(i => i.type === "video").length || 0), 0),
  };

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

  const columns: Column[] = [
    {
      key: "albumName",
      label: "Album",
      render: (value: unknown, row: Record<string, unknown>) => {
        const gallery = row as GalleryItem;
        return (
          <div>
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              {String(value)}
              {gallery.featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{gallery.title}</div>
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      render: (value: unknown) => (
        <Badge variant={getCategoryColor(String(value))} size="sm">
          <span className="capitalize">{String(value)}</span>
        </Badge>
      ),
    },
    {
      key: "eventDate",
      label: "Event Date",
      render: (value: unknown) =>
        value ? new Date(String(value)).toLocaleDateString() : <span className="text-gray-400">-</span>,
    },
    {
      key: "images",
      label: "Media",
      render: (value: unknown) => {
        const items = value as Array<{ url: string; caption: string; type: string }>;
        const imagesCount = items?.filter(i => i.type !== "video").length || 0;
        const videosCount = items?.filter(i => i.type === "video").length || 0;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{imagesCount}</span>
            </div>
            {videosCount > 0 && (
              <div className="flex items-center gap-1">
                <Video className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-600">{videosCount}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "isPublished",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={value ? "success" : "warning"} size="sm">
          {value ? "Published" : "Draft"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Gallery" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Photo Gallery</h1>
            <p className="text-gray-600 mt-1">Manage photo albums and event galleries</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button onClick={() => exportToCSV(galleries, "galleries.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            )}
          </div>
        </div>
      </div>




      {!isAdmin ? (
        /* Parent/Student Viewer Grid */
        <div className="mt-8 space-y-12">
          {filteredGalleries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">No memories found yet</h3>
              <p className="text-gray-500 mt-2">School will share photos and videos here soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGalleries.map((gallery) => (
                <div 
                  key={gallery._id}
                  onClick={() => router.push(`/${user?.role}-dashboard/gallery/${gallery._id}`)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer flex flex-col h-full"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {gallery.images?.[0] ? (
                      gallery.images[0].type === "video" ? (
                        <div className="w-full h-full relative">
                          <video src={gallery.images[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={gallery.images[0].url} 
                          alt={gallery.albumName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant={getCategoryColor(gallery.category)} size="sm">
                        <span className="capitalize">{gallery.category}</span>
                      </Badge>
                      {gallery.featured && (
                        <div className="bg-yellow-400 text-white p-1.5 rounded-lg shadow-sm">
                          <Star className="w-4 h-4 fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Media Count Overlay */}
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-semibold flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{gallery.images?.filter(i => i.type !== "video").length || 0}</span>
                      </div>
                      {gallery.images?.some(i => i.type === "video") && (
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-blue-300" />
                          <span>{gallery.images?.filter(i => i.type === "video").length || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3 text-xs font-medium text-gray-500 uppercase tracking-widest">
                      <span>{gallery.albumName}</span>
                      {gallery.eventDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(gallery.eventDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1 mb-2">
                      {gallery.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 flex-1">
                      {gallery.description || "School event and classroom memories..."}
                    </p>
                    <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs truncate max-w-[120px]">{gallery.eventLocation || "School Campus"}</span>
                      </div>
                      <span className="text-purple-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Memories <Plus className="w-4 h-4 rotate-45" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Admin Management List */
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium mb-1">Total Albums</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium mb-1">Published</p>
                  <p className="text-3xl font-bold text-green-600">{stats.published}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium mb-1">Featured</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.featured}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-700 text-sm font-medium mb-1">Total Photos</p>
                  <p className="text-3xl font-bold text-pink-600">{stats.totalPhotos}</p>
                </div>
                <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium mb-1">Total Videos</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalVideos}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">All Albums</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {filteredGalleries.length} {filteredGalleries.length === 1 ? "album" : "albums"} found
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Album
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search albums..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              data={filteredGalleries}
              loading={loading}
              actions={(row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/gallery/${(row as GalleryItem)._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(row as GalleryItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete((row as GalleryItem)._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            />
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Album" : "Add New Album"}
        size="md"
        footer={
          <>
            <Button
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="primary">
              {editingId ? "Update" : "Create"} Album
            </Button>
          </>
        }
      >
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
              {editingId ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingId ? "Edit Album" : "Add New Album"}
            </h2>
          </div>

          <Input
            label="Album Name *"
            name="albumName"
            placeholder="e.g., Sports Day 2025"
            value={formData.albumName}
            onChange={handleInputChange}
            fullWidth
          />

          <Input
            label="Title *"
            name="title"
            placeholder="Album title"
            value={formData.title}
            onChange={handleInputChange}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              placeholder="Describe the album..."
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all appearance-none bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Event Date
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                name="eventLocation"
                placeholder="Event location"
                value={formData.eventLocation}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ImageIcon className="w-4 h-4 inline mr-1" />
            Photos
          </label>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:bg-purple-50 transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-sm text-purple-600 font-medium">Uploading media...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Click or Drag photos/videos here</p>
                    <p className="text-xs text-gray-500">Supports JPG, PNG, MP4 (Max 10MB)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Image Grid */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {formData.images.map((img, index) => (
                <div key={index} className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <div className="aspect-square relative bg-gray-200">
                    {img.type === "video" ? (
                      <video
                        src={img.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={img.url}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-100 transition-opacity transform hover:scale-110"
                      title="Remove item"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    {img.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <Video className="w-8 h-8 text-white opacity-70" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Add caption..."
                      value={img.caption}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      className="w-full text-xs border-none bg-transparent focus:ring-0 placeholder-gray-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-400"
            />
            <span className="text-sm font-medium text-gray-700">Publish album</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-400"
            />
            <span className="text-sm font-medium text-gray-700">Mark as featured</span>
          </label>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
        title="Delete Album"
        size="sm"
        footer={
          <>
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingId(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Album
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h3>
          <p className="text-gray-500">
            This action cannot be undone. All photos and videos in this album will be permanently deleted.
          </p>
        </div>
      </Modal>
    </div>
  );
}