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
import { showToast } from "@/lib/toast";
import { exportToCSV } from "@/utils/exportData";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  School,
  GraduationCap,
  BookOpen,
  Search,
  DoorOpen,
  Grid3x3,
} from "lucide-react";

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface Timetable {
  _id: string;
  classId: Class;
  day: string;
  subject: string;
  teacherId: Teacher;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown; // Added index signature
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableManagement() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Timetable | null>(null);

  const [formData, setFormData] = useState({
    classId: "",
    day: "Monday",
    subject: "",
    teacherId: "",
    startTime: "09:00",
    endTime: "09:45",
    roomNumber: "",
  });

  useEffect(() => {
    fetchTimetables();
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timetable");
      const data = await res.json();
      console.log("[TimetableManagement] Fetched timetables:", data);
      if (data.success || data.timetable) {
        setTimetables(data.timetable || data.data || []);
      } else {
        console.error("[TimetableManagement] API error:", data.error);
        showToast.error(data.error || "Failed to fetch timetables");
      }
    } catch (error) {
      console.error("[TimetableManagement] Fetch error:", error);
      showToast.error("Failed to fetch timetables");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      const classesData = data.classes || data.data || [];
      setClasses(classesData);
      if (classesData.length > 0 && !selectedClass) {
        setSelectedClass(classesData[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data.teachers || data.data || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEntry = async () => {
    if (!formData.classId || !formData.subject || !formData.teacherId) {
      showToast.error("Class, subject, and teacher are required");
      return;
    }

    try {
      const method = editingEntry ? "PUT" : "POST";
      const url = editingEntry ? `/api/timetable/${editingEntry._id}` : "/api/timetable";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to save timetable entry");
        return;
      }

      showToast.success(`Timetable entry ${editingEntry ? "updated" : "created"} successfully`);
      setModalOpen(false);
      setEditingEntry(null);
      setFormData({
        classId: "",
        day: "Monday",
        subject: "",
        teacherId: "",
        startTime: "09:00",
        endTime: "09:45",
        roomNumber: "",
      });
      fetchTimetables();
    } catch (error) {
      showToast.error("Failed to save timetable entry");
    }
  };

  const handleEditEntry = (entry: Timetable) => {
    setEditingEntry(entry);
    setFormData({
      classId: typeof entry.classId === "string" ? entry.classId : (entry.classId as any)?._id || "",
      day: entry.day,
      subject: entry.subject,
      teacherId: typeof entry.teacherId === "string" ? entry.teacherId : (entry.teacherId as any)?._id || "",
      startTime: entry.startTime,
      endTime: entry.endTime,
      roomNumber: entry.roomNumber || "",
    });
    setModalOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      const data = await res.json();
      console.log("[TimetableManagement] Delete response:", data);
      if (data.success) {
        showToast.success("Timetable entry deleted successfully");
        fetchTimetables();
      } else {
        showToast.error(data.error || "Failed to delete timetable entry");
      }
    } catch (error) {
      console.error("[TimetableManagement] Delete error:", error);
      showToast.error("Failed to delete timetable entry");
    }
  };

  const filteredTimetables = selectedClass
    ? timetables.filter((t) =>
      typeof (t.classId as any) === "string"
        ? (t.classId as any) === selectedClass
        : (t.classId as any)?._id === selectedClass
    )
    : timetables;

  const totalEntries = timetables.length;
  const uniqueSubjects = new Set(timetables.map((t) => t.subject)).size;
  const teacherIds = timetables
    .map((t) => (typeof (t.teacherId as any) === "string" ? (t.teacherId as any) : (t.teacherId as any)?._id))
    .filter(Boolean);
  const uniqueTeachers = new Set(teacherIds).size;

  const getEntriesForDayAndClass = (day: string, classId: string) => {
    return timetables
      .filter((t) =>
        t.day === day &&
        (typeof (t.classId as any) === "string" ? (t.classId as any) === classId : (t.classId as any)?._id === classId)
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // ---- Calendar colour map (computed before render) ----
  const calendarSubjectColors = [
    { bg: "bg-indigo-50", border: "border-indigo-300", accent: "bg-indigo-500", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-800" },
    { bg: "bg-pink-50", border: "border-pink-300", accent: "bg-pink-500", text: "text-pink-700", badge: "bg-pink-100 text-pink-800" },
    { bg: "bg-emerald-50", border: "border-emerald-300", accent: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
    { bg: "bg-amber-50", border: "border-amber-300", accent: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
    { bg: "bg-purple-50", border: "border-purple-300", accent: "bg-purple-500", text: "text-purple-700", badge: "bg-purple-100 text-purple-800" },
    { bg: "bg-cyan-50", border: "border-cyan-300", accent: "bg-cyan-500", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-800" },
    { bg: "bg-rose-50", border: "border-rose-300", accent: "bg-rose-500", text: "text-rose-700", badge: "bg-rose-100 text-rose-800" },
    { bg: "bg-teal-50", border: "border-teal-300", accent: "bg-teal-500", text: "text-teal-700", badge: "bg-teal-100 text-teal-800" },
  ];
  const calendarAllSubjects = Array.from(new Set(timetables.map(t => t.subject)));
  const calendarColorMap: Record<string, typeof calendarSubjectColors[0]> = {};
  calendarAllSubjects.forEach((s, i) => { calendarColorMap[s] = calendarSubjectColors[i % calendarSubjectColors.length]; });

  const columns: Column[] = [
    {
      key: "classId",
      label: "Class",
      render: (value: unknown) => {
        const classInfo = value as Class;
        return `${classInfo.name} - ${classInfo.section}`;
      },
    },
    {
      key: "day",
      label: "Day",
      render: (value: unknown) => String(value),
    },
    {
      key: "subject",
      label: "Subject",
      render: (value: unknown) => (
        <Badge variant="primary" size="sm">{String(value)}</Badge>
      ),
    },
    {
      key: "teacherId",
      label: "Teacher",
      render: (value: unknown) => {
        const teacher = value as any as Teacher | null;
        return (teacher && (teacher.name || (teacher.firstName ? `${(teacher as any).firstName} ${(teacher as any).lastName || ''}` : ''))) || "-";
      },
    },
    {
      key: "startTime",
      label: "Time",
      render: (value: unknown, row: Record<string, unknown>) => {
        const timetable = row as Timetable;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{String(value)} - {timetable.endTime}</span>
          </div>
        );
      },
    },
    {
      key: "roomNumber",
      label: "Room",
      render: (value: unknown) => (value ? String(value) : <span className="text-gray-400">-</span>),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Timetable" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Timetable Management</h1>
            <p className="text-gray-600 mt-1">Manage class schedules and time slots</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV([], "timetables.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-700 text-sm font-medium mb-2">Total Entries</p>
              <p className="text-4xl font-bold text-indigo-600">{totalEntries}</p>
            </div>
            <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Subjects</p>
              <p className="text-4xl font-bold text-purple-600">{uniqueSubjects}</p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Teachers</p>
              <p className="text-4xl font-bold text-pink-600">{uniqueTeachers}</p>
            </div>
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${viewMode === "calendar"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${viewMode === "table"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="text-sm font-medium">List</span>
              </button>
            </div>

            {viewMode === "calendar" && (
              <div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none bg-white"
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} - Section {cls.section}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                classId: "",
                day: "Monday",
                subject: "",
                teacherId: "",
                startTime: "09:00",
                endTime: "09:45",
                roomNumber: "",
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-400 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && selectedClass && (
          <div className="grid grid-cols-6 gap-2">
            {DAYS.map((day) => {
              const entries = getEntriesForDayAndClass(day, selectedClass);
              return (
                <div key={day} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm min-w-0">
                  {/* Day Header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs tracking-wide">{day}</h3>
                    <span className="text-[10px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                      {entries.length}
                    </span>
                  </div>

                  {/* Entries */}
                  <div className="p-2 space-y-2 min-h-[120px]">
                    {entries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Calendar className="w-5 h-5 text-gray-200 mb-1" />
                        <p className="text-[10px] text-gray-400 font-medium">No classes</p>
                      </div>
                    ) : (
                      entries.map((entry) => {
                        const color = calendarColorMap[entry.subject] || calendarSubjectColors[0];
                        const teacherName = (() => {
                          const t = entry.teacherId as any;
                          if (!t || typeof t === "string") return "—";
                          return t.name || (t.firstName ? `${t.firstName} ${t.lastName || ""}`.trim() : "—");
                        })();
                        return (
                          <div
                            key={entry._id}
                            className={`relative rounded-lg border ${color.border} ${color.bg} overflow-hidden group hover:shadow-md transition-all duration-200`}
                          >
                            {/* Left accent bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${color.accent}`} />

                            <div className="pl-2.5 pr-2 py-2">
                              {/* Subject + actions */}
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color.badge} leading-snug truncate max-w-[100px]`}>
                                  {entry.subject}
                                </span>
                                {/* Action buttons on hover */}
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditEntry(entry); }}
                                    className="w-5 h-5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry._id); }}
                                    className="w-5 h-5 rounded bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Time */}
                              <div className={`flex items-center gap-1 text-[10px] font-semibold ${color.text} mb-0.5`}>
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{entry.startTime}–{entry.endTime}</span>
                              </div>

                              {/* Teacher */}
                              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <GraduationCap className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{teacherName}</span>
                              </div>

                              {/* Room */}
                              {entry.roomNumber && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                  <DoorOpen className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span>Rm {entry.roomNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Table View */}
        {viewMode === "table" && (
          <div>
            <Table
              columns={columns}
              data={filteredTimetables}
              loading={loading}
              actions={(row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditEntry(row as Timetable)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEntry((row as Timetable)._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
        }}
        title={editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingEntry(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEntry} variant="primary">
              {editingEntry ? "Update" : "Add"} Entry
            </Button>
          </>
        }
      >
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center">
              {editingEntry ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - Section {cls.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day *</label>
            <div className="grid grid-cols-3 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, day }))}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${formData.day === day
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Subject *"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g., Mathematics, English"
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleInputChange}
              fullWidth
            />
            <Input
              label="End Time *"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleInputChange}
              fullWidth
            />
          </div>

          <Input
            label="Room Number"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleInputChange}
            placeholder="e.g., 101, A-Wing"
            fullWidth
          />
        </div>
      </Modal>
    </div >
  );
}