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
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const queryView = searchParams?.get("view");
  const queryTeacherId = searchParams?.get("teacherId");

  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<any[]>([]);
  const [activeSubstitutes, setActiveSubstitutes] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar");
  const [viewBy, setViewBy] = useState<"class" | "teacher">(queryView === "teacher" ? "teacher" : "class");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>(queryTeacherId || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Timetable | null>(null);

  const [formData, setFormData] = useState({
    classId: "",
    days: ["Monday"],
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
    fetchGlobalSubjects();
  }, []);

  const fetchGlobalSubjects = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings && data.settings.subjects) {
        setGlobalSubjects(data.settings.subjects);
      }
    } catch (e) {
      console.error("Failed to fetch global subjects:", e);
    }
  };

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timetable");
      const data = await res.json();
      console.log("[TimetableManagement] Fetched timetables:", data);
      if (data.success || data.timetable) {
        setTimetables(data.timetable || data.data || []);
        if (data.activeLeaves) setActiveLeaves(data.activeLeaves);
        if (data.activeSubstitutes) setActiveSubstitutes(data.activeSubstitutes);
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
      const teachersData = data.teachers || data.data || [];
      setTeachers(teachersData);
      if (teachersData.length > 0 && !selectedTeacher && !queryTeacherId) {
        setSelectedTeacher(teachersData[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEntry = async () => {
    if (!formData.classId || !formData.subject || !formData.teacherId || formData.days.length === 0) {
      showToast.error("Class, subject, teacher, and at least one day are required");
      return;
    }

    try {
      if (editingEntry) {
        const res = await fetch(`/api/timetable/${editingEntry._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, day: formData.days[0] }),
        });
        const data = await res.json();
        if (!data.success) {
          showToast.error(data.error || "Failed to update timetable entry");
          return;
        }
        showToast.success("Timetable entry updated successfully");
      } else {
        const entries = formData.days.map(day => ({
          classId: formData.classId,
          day,
          subject: formData.subject,
          teacherId: formData.teacherId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          roomNumber: formData.roomNumber
        }));

        const res = await fetch("/api/timetable/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries })
        });
        const data = await res.json();
        
        if (!data.success) {
          showToast.error(data.error || "Failed to save timetable entries");
          return;
        }
        if (data.conflicts && data.conflicts.length > 0) {
          showToast.error(`Saved ${data.count} entries. Skipped ${data.conflicts.length} overlaps (see notifications)`);
        } else {
          showToast.success("Timetable entries created successfully");
        }
      }

      setModalOpen(false);
      setEditingEntry(null);
      setFormData({
        classId: "",
        days: ["Monday"],
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
      days: [entry.day],
      subject: entry.subject,
      teacherId: typeof entry.teacherId === "string" ? entry.teacherId : (entry.teacherId as any)?._id || "",
      startTime: entry.startTime,
      endTime: entry.endTime,
      roomNumber: entry.roomNumber || "",
    });
    setModalOpen(true);
  };

  const handleDuplicateEntry = (entry: Timetable) => {
    setEditingEntry(null);
    setFormData({
      classId: typeof entry.classId === "string" ? entry.classId : (entry.classId as any)?._id || "",
      days: [entry.day],
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

  const filteredTimetables = viewBy === "class" && selectedClass
    ? timetables.filter((t) =>
      typeof (t.classId as any) === "string"
        ? (t.classId as any) === selectedClass
        : (t.classId as any)?._id === selectedClass
    )
    : viewBy === "teacher" && selectedTeacher
    ? timetables.filter((t) =>
      typeof (t.teacherId as any) === "string"
        ? (t.teacherId as any) === selectedTeacher
        : (t.teacherId as any)?._id === selectedTeacher
    )
    : timetables;

  const totalEntries = timetables.length;
  const uniqueSubjects = new Set(timetables.map((t) => t.subject)).size;
  const teacherIds = timetables
    .map((t) => (typeof (t.teacherId as any) === "string" ? (t.teacherId as any) : (t.teacherId as any)?._id))
    .filter(Boolean);
  const uniqueTeachers = new Set(teacherIds).size;

  const getEntriesForDayAndFilter = (day: string) => {
    return timetables
      .filter((t) => {
        if (t.day !== day) return false;
        if (viewBy === "class") {
          return typeof (t.classId as any) === "string" ? (t.classId as any) === selectedClass : (t.classId as any)?._id === selectedClass;
        } else {
          return typeof (t.teacherId as any) === "string" ? (t.teacherId as any) === selectedTeacher : (t.teacherId as any)?._id === selectedTeacher;
        }
      })
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
        const teacher = value as any;
        return (teacher && (teacher.name || (teacher.firstName ? `${teacher.firstName} ${teacher.lastName || ''}` : ''))) || "-";
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
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewBy("class")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewBy === "class" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Class View
                  </button>
                  <button
                    onClick={() => setViewBy("teacher")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewBy === "teacher" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Teacher View
                  </button>
                </div>
                {viewBy === "class" ? (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none bg-white min-w-[200px]"
                  >
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - Section {cls.section}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none bg-white min-w-[200px]"
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                classId: viewBy === "class" && selectedClass ? selectedClass : "",
                days: ["Monday"],
                subject: "",
                teacherId: viewBy === "teacher" && selectedTeacher ? selectedTeacher : "",
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
        {viewMode === "calendar" && (viewBy === "class" ? selectedClass : selectedTeacher) && (
          <div className="grid grid-cols-6 gap-2">
            {DAYS.map((day) => {
              const entries = getEntriesForDayAndFilter(day);
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
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded shadow-sm flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border border-gray-200">
                                  <button
                                    onClick={() => handleDuplicateEntry(entry)}
                                    className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                                    title="Duplicate Entry"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleEditEntry(entry)}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Edit Entry"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEntry(entry._id)}
                                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Time */}
                              <div className={`flex items-center gap-1 text-[10px] font-semibold ${color.text} mb-0.5`}>
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{entry.startTime}–{entry.endTime}</span>
                              </div>

                              {/* Teacher or Class */}
                              <div className="flex flex-col gap-1 text-[10px] text-gray-500 mt-0.5">
                                <div className="flex items-center gap-1">
                                  {viewBy === "class" ? (
                                    <>
                                      <GraduationCap className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{teacherName}</span>
                                    </>
                                  ) : (
                                    <>
                                      <School className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">
                                        {(() => {
                                          const c = entry.classId as any;
                                          if (!c || typeof c === "string") return "—";
                                          return `${c.name} - ${c.section}`;
                                        })()}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {(() => {
                                  const tId = typeof entry.teacherId === "string" ? entry.teacherId : (entry.teacherId as any)?._id;
                                  
                                  const isDateInLeave = (dayName: string, leave: any) => {
                                    const daysMap: Record<string, number> = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
                                    const now = new Date();
                                    const currentDay = now.getDay();
                                    const targetDay = daysMap[dayName];
                                    if (targetDay === undefined) return false;
                                    const diff = targetDay - currentDay;
                                    const targetDate = new Date(now);
                                    targetDate.setDate(now.getDate() + diff);
                                    targetDate.setHours(0, 0, 0, 0);
                                    
                                    const start = new Date(leave.startDate);
                                    start.setHours(0, 0, 0, 0);
                                    const end = new Date(leave.endDate);
                                    end.setHours(23, 59, 59, 999);
                                    return targetDate >= start && targetDate <= end;
                                  };

                                  const isOnLeave = activeLeaves.some(l => l.teacherId === tId && isDateInLeave(entry.day, l));
                                  const substitute = activeSubstitutes.find(s => s.originalTeacherId === tId && s.subject === entry.subject);
                                  
                                  if (isOnLeave) {
                                    return (
                                      <div className="flex flex-col gap-1 mt-0.5">
                                        <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1 py-0.5 rounded w-fit uppercase tracking-wider">On Leave</span>
                                        {substitute && (
                                          <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                                            <Users className="w-2.5 h-2.5" /> Sub: {substitute.substituteTeacherId?.name || "Assigned"}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editingEntry ? "Day *" : "Days (Select multiple) *"}
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const isSelected = formData.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (editingEntry) {
                        setFormData((prev) => ({ ...prev, days: [day] }));
                      } else {
                        setFormData((prev) => {
                          if (prev.days.includes(day)) {
                            return { ...prev, days: prev.days.filter((d) => d !== day) };
                          } else {
                            return { ...prev, days: [...prev.days, day] };
                          }
                        });
                      }
                    }}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50"
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="">Select a subject</option>
              {globalSubjects.map((sub, idx) => (
                <option key={idx} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

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