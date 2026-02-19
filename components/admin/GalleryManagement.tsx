"use client";
import React, { useState, useEffect } from "react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  ImagePlus,
} from "lucide-react";

interface GalleryItem {
  _id: string;
  title: string;
  albumName: string;
  category: string;
  description?: string;
  images: Array<{ url: string; caption: string }>;
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

export default function GalleryManagement() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    albumName: "",
    description: "",
    category: "event",
    eventDate: "",
    eventLocation: "",
    isPublished: false,
    featured: false,
    images: [] as { url: string; caption: string }[],
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

    const newImages: { url: string; caption: string }[] = [];

    try {
      await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();

            if (data.success) {
              newImages.push({ url: data.url, caption: "" });
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
        images: [...prev.images, ...newImages],
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
      const res = await fetch("/api/gallery");
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this album?")) return;

    try {
      const response = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });

      if (response.ok) {
        showToast.success("Album deleted successfully");
        fetchData();
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
    totalImages: galleries.reduce((sum, g) => sum + (g.images?.length || 0), 0),
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
      label: "Images",
      render: (value: unknown) => {
        const images = value as Array<{ url: string; caption: string }>;
        return (
          <div className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{images?.length || 0}</span>
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
            <button onClick={() => exportToCSV(galleries, "galleries.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Total Albums</p>
              <p className="text-4xl font-bold text-purple-600">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Published</p>
              <p className="text-4xl font-bold text-green-600">{stats.published}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium mb-2">Featured</p>
              <p className="text-4xl font-bold text-yellow-600">{stats.featured}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Star className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Total Images</p>
              <p className="text-4xl font-bold text-pink-600">{stats.totalImages}</p>
            </div>
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center">
              <Eye className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-sm text-purple-600 font-medium">Uploading photos...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Click or Drag photos here</p>
                    <p className="text-xs text-gray-500">Supports JPG, PNG (Max 5MB)</p>
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
                  <div className="aspect-square relative">
                    <img
                      src={img.url}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                      title="Remove photo"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
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
    </div>
  );
}