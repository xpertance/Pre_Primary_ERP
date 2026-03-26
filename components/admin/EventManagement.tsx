"use client";
import React, { useState, useEffect } from "react";
import { ReactNode } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/Table";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { showToast } from "@/lib/toast";
import { exportToCSV } from "@/utils/exportData";
import {
  PartyPopper,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  MapPin,
  Bell,
  Users,
  Image as ImageIcon,
  FileText,
  X,
  Paperclip,
  Eye,
  Search,
} from "lucide-react";

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface Attachment {
  name: string;
  url: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  eventType: "meeting" | "holiday" | "celebration" | "workshop" | "competition" | "notification";
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  image?: string;
  targetAudience: "all" | "parents" | "students" | "teachers" | "staff";
  classIds: Class[];
  attachments: Attachment[];
  status: "draft" | "published" | "archived";
  notify: boolean;
  notificationType: "email" | "sms" | "in-app" | "all";
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

const EVENT_TYPES = [
  { value: "meeting", label: "Meeting", color: "blue" },
  { value: "holiday", label: "Holiday", color: "green" },
  { value: "celebration", label: "Celebration", color: "pink" },
  { value: "workshop", label: "Workshop", color: "purple" },
  { value: "competition", label: "Competition", color: "orange" },
  { value: "notification", label: "Notification", color: "gray" },
];

const TARGET_AUDIENCE = [
  { value: "all", label: "All" },
  { value: "parents", label: "Parents" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "staff", label: "Staff" },
];

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("published");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    eventType: "meeting" | "holiday" | "celebration" | "workshop" | "competition" | "notification";
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    image: string;
    targetAudience: "all" | "parents" | "students" | "teachers" | "staff";
    classIds: string[];
    attachments: Attachment[];
    status: "draft" | "published" | "archived";
    notify: boolean;
    notificationType: "email" | "sms" | "in-app" | "all";
  }>({
    title: "",
    description: "",
    eventType: "notification",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "11:00",
    location: "",
    image: "",
    targetAudience: "all",
    classIds: [],
    attachments: [],
    status: "draft",
    notify: true,
    notificationType: "all",
  });

  useEffect(() => {
    fetchEvents();
    fetchClasses();
  }, [statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events?status=${statusFilter}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      showToast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
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

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const handleAddAttachment = () => {
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { name: "", url: "" }],
    }));
  };

  const handleAttachmentChange = (index: number, field: keyof Attachment, value: string) => {
    const updatedAttachments = [...formData.attachments];
    updatedAttachments[index] = { ...updatedAttachments[index], [field]: value };
    setFormData((prev) => ({ ...prev, attachments: updatedAttachments }));
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.startDate) {
      showToast.error("Title and start date are required");
      return;
    }

    try {
      const method = editingEvent ? "PUT" : "POST";
      const url = "/api/events";

      const payload = editingEvent ? { id: editingEvent._id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to save event");
        return;
      }

      showToast.success(`Event ${editingEvent ? "updated" : "created"} successfully`);
      setModalOpen(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      showToast.error("Failed to save event");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventType: "notification",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "11:00",
      location: "",
      image: "",
      targetAudience: "all",
      classIds: [],
      attachments: [],
      status: "draft",
      notify: true,
      notificationType: "all",
    });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      eventType: event.eventType,
      startDate: new Date(event.startDate).toISOString().split("T")[0],
      endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "11:00",
      location: event.location || "",
      image: event.image || "",
      targetAudience: event.targetAudience,
      classIds: event.classIds.map((c) => c._id),
      attachments: event.attachments,
      status: event.status,
      notify: event.notify,
      notificationType: event.notificationType,
    });
    setModalOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setDeletingEvent(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    try {
      const res = await fetch(`/api/events?id=${deletingEvent._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Event deleted successfully");
        setShowDeleteModal(false);
        setDeletingEvent(null);
        fetchEvents();
      }
    } catch (error) {
      showToast.error("Failed to delete event");
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.startDate) > new Date()).length;
  const todayEvents = events.filter((e) => {
    const today = new Date().toDateString();
    return new Date(e.startDate).toDateString() === today;
  }).length;

  const getEventTypeColor = (type: string) => {
    const eventType = EVENT_TYPES.find((t) => t.value === type);
    return eventType?.color || "gray";
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: "success" | "warning" | "info" } = {
      published: "success",
      draft: "warning",
      archived: "info",
    };
    return colors[status] || "info";
  };

  const columns: Column[] = [
    {
      key: "title",
      label: "Event",
      render: (value: unknown, row: Record<string, unknown>) => {
        const event = row as Event;
        return (
          <div>
            <div className="font-semibold text-gray-800">{String(value)}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" size="sm">
                {EVENT_TYPES.find((t) => t.value === event.eventType)?.label}
              </Badge>
              {event.notify && <Bell className="w-3 h-3 text-amber-500" />}
            </div>
          </div>
        );
      },
    },
    {
      key: "startDate",
      label: "Date & Time",
      render: (value: unknown, row: Record<string, unknown>) => {
        const event = row as Event;
        const date = value as Date;
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1 text-gray-800">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(date).toLocaleDateString()}
            </div>
            {event.startTime && (
              <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {event.startTime} - {event.endTime}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "targetAudience",
      label: "Audience",
      render: (value: unknown) => (
        <Badge variant="info" size="sm">
          {TARGET_AUDIENCE.find((a) => a.value === String(value))?.label}
        </Badge>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value: unknown) => (value ? String(value) : <span className="text-gray-400">-</span>),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={getStatusColor(String(value))} size="sm">
          {String(value).toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Events" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Event Management</h1>
            <p className="text-gray-600 mt-1">Manage school events, holidays, and notifications</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(events, "events.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium mb-2">Total Events</p>
              <p className="text-4xl font-bold text-yellow-600">{totalEvents}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
              <PartyPopper className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-2">Today</p>
              <p className="text-4xl font-bold text-orange-600">{todayEvents}</p>
            </div>
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Upcoming</p>
              <p className="text-4xl font-bold text-pink-600">{upcomingEvents}</p>
            </div>
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center">
              <Bell className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Events</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none bg-white"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredEvents}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleEditEvent(row as Event)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteEvent(row as Event)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? "Edit Event" : "Create Event"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingEvent(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} variant="primary">
              {editingEvent ? "Update" : "Create"} Event
            </Button>
          </>
        }
      >
        <div className="space-y-5 mt-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              {editingEvent ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingEvent ? "Edit Event" : "Create Event"}
            </h2>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <Input
                label="Event Title *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Annual Sports Day, Parent-Teacher Meeting"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the event..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    {TARGET_AUDIENCE.map((audience) => (
                      <option key={audience.value} value={audience.value}>
                        {audience.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date *"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  fullWidth
                />
                <Input
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  fullWidth
                />
                <Input
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Location & Image */}
          <div className="border-t pt-5">
            <div className="space-y-4">
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., School Auditorium, Sports Ground"
                fullWidth
              />

              <Input
                label="Image URL"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                fullWidth
              />
            </div>
          </div>

          {/* Classes */}
          {formData.targetAudience === "students" && (
            <div className="border-t pt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Classes (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {classes.map((cls) => (
                  <label
                    key={cls._id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.classIds.includes(cls._id)}
                      onChange={() => handleClassToggle(cls._id)}
                      className="w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="text-sm text-gray-700">
                      {cls.name} - {cls.section}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="border-t pt-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments (Optional)
            </label>
            <div className="space-y-3">
              {formData.attachments.map((attachment, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="File name"
                    value={attachment.name}
                    onChange={(e) => handleAttachmentChange(idx, "name", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={attachment.url}
                    onChange={(e) => handleAttachmentChange(idx, "url", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAttachment}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-400 hover:text-yellow-600 transition-all w-full justify-center text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Attachment
              </button>
            </div>
          </div>

          {/* Notification & Status */}
          <div className="border-t pt-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <select
                  name="notificationType"
                  value={formData.notificationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="all">All (Email, SMS, In-App)</option>
                  <option value="email">Email Only</option>
                  <option value="sms">SMS Only</option>
                  <option value="in-app">In-App Only</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="notify"
                checked={formData.notify}
                onChange={handleInputChange}
                className="w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-400"
              />
              <span className="text-sm font-medium text-gray-700">
                Send notification to target audience
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingEvent(null);
        }}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingEvent(null);
              }}
            >
              Cancel
            </Button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Event?</h3>
          <p className="text-gray-500 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600">
              {deletingEvent?.title}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-400">
            This action cannot be undone. All event details, announcements, and attachments will be permanently removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}