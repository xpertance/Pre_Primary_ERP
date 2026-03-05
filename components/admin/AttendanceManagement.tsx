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
  ClipboardCheck,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  Search,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Save,
  Users,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

interface Student {
  _id: string;
  firstName: string;
  lastName?: string;
  admissionNo?: string;
  classId?: string | { _id: string; name: string; section: string };
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface Attendance {
  _id: string;
  studentId: Student | string;
  classId?: Class | string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  [key: string]: unknown;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export default function AttendanceManagement() {
  const [viewMode, setViewMode] = useState<"mark" | "history">("mark");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);

  // Mark Mode Data
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [studentStatus, setStudentStatus] = useState<Record<string, "present" | "absent" | "late" | "excused">>({});
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [loadingRegister, setLoadingRegister] = useState(false);

  // History Mode Data
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    rate: 0,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchOverallStats();
  }, [attendanceDate]);

  // When Class or Date changes in Mark Mode, load the register
  useEffect(() => {
    if (viewMode === "mark" && selectedClass) {
      loadClassRegister();
    }
  }, [selectedClass, attendanceDate, viewMode]);

  // When moving to History mode, load history
  useEffect(() => {
    if (viewMode === "history") {
      fetchHistory();
    }
  }, [viewMode, selectedClass, attendanceDate]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
      if (data.classes?.length > 0 && !selectedClass) {
        setSelectedClass(data.classes[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch classes");
    }
  };

  const fetchOverallStats = async () => {
    try {
      setLoadingStats(true);
      // Fetch stats for the selected date only
      const res = await fetch(`/api/attendance?startDate=${attendanceDate}&endDate=${attendanceDate}`);
      const data = await res.json();
      const all: Attendance[] = data.data || [];

      const p = all.filter(a => a.status === "present").length;
      const a = all.filter(a => a.status === "absent").length;
      const l = all.filter(a => a.status === "late").length;
      const e = all.filter(a => a.status === "excused").length;
      const total = all.length; // This is total marked, not total students.

      // If we want total students, we'd need to know total students count.
      // But for now, let's show stats based on what's marked for this day.

      setStats({
        present: p,
        absent: a,
        late: l,
        excused: e,
        rate: total > 0 ? Math.round((p / total) * 100) : 0
      });
    } catch {
      // silent fail
    } finally {
      setLoadingStats(false);
    }
  };

  const loadClassRegister = async () => {
    setLoadingRegister(true);
    try {
      // 1. Fetch Students of this class
      // We assume /api/students accepts classId filter or we fetch all and filter.
      // Optimised: /api/students?classId=... but our API currently fetches all or we filter client side.
      // Let's fetch all 500 (cached likely) and filter client side for now, or assume API support.
      // Actually, let's fetch all (since we fixed the limit) and filter.
      const resStudents = await fetch("/api/students?limit=500");
      const dataStudents = await resStudents.json();
      const allStudents: Student[] = dataStudents.students || [];

      // Filter by selectedClass (handling object or string classId)
      const filtered = allStudents.filter(s => {
        const cId = typeof s.classId === "object" ? (s.classId as any)?._id : s.classId;
        return cId === selectedClass;
      });

      setClassStudents(filtered);

      // 2. Fetch Attendance for this class & date
      const resAtt = await fetch(`/api/attendance?classId=${selectedClass}&startDate=${attendanceDate}&endDate=${attendanceDate}&limit=500`);
      const dataAtt = await resAtt.json();
      const existingRecords: Attendance[] = dataAtt.data || [];

      // 3. Merge Status
      const statusMap: Record<string, "present" | "absent" | "late" | "excused"> = {};
      const notesMap: Record<string, string> = {};

      filtered.forEach(student => {
        const record = existingRecords.find(r => {
          const rId = typeof r.studentId === "object" ? (r.studentId as any)._id : r.studentId;
          return rId === student._id;
        });

        if (record) {
          statusMap[student._id] = record.status;
          if (record.notes) notesMap[student._id] = record.notes;
        } else {
          // Default to present for new marking
          statusMap[student._id] = "present";
        }
      });

      setStudentStatus(statusMap);
      setStudentNotes(notesMap);

    } catch (error) {
      showToast.error("Failed to load class register");
    } finally {
      setLoadingRegister(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      let url = "/api/attendance?limit=100";
      if (selectedClass) url += `&classId=${selectedClass}`;
      if (attendanceDate) {
        // If user wants to see history for specific date
        url += `&startDate=${attendanceDate}&endDate=${attendanceDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setAttendances(data.data || []);
    } catch {
      showToast.error("Failed to fetch history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleStatus = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setStudentStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: "present" | "absent") => {
    const newStatus: Record<string, "present" | "absent" | "late" | "excused"> = {};
    classStudents.forEach(s => {
      newStatus[s._id] = status;
    });
    setStudentStatus(newStatus);
  };

  const saveAttendance = async () => {
    if (!selectedClass) return;

    // Prepare bulk payload
    const records = classStudents.map(student => ({
      studentId: student._id,
      status: studentStatus[student._id],
      notes: studentNotes[student._id]
    }));

    try {
      const res = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date: attendanceDate,
          records
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast.success("Attendance saved successfully");
        fetchOverallStats(); // Refresh stats
      } else {
        showToast.error(data.error || "Failed to save");
      }
    } catch {
      showToast.error("Error saving attendance");
    }
  };

  // Stats for the current register view being edited
  const currentRegisterStats = {
    present: Object.values(studentStatus).filter(s => s === "present").length,
    absent: Object.values(studentStatus).filter(s => s === "absent").length,
    late: Object.values(studentStatus).filter(s => s === "late").length,
    excused: Object.values(studentStatus).filter(s => s === "excused").length,
    total: classStudents.length
  };

  const columns: Column[] = [
    {
      key: "studentId",
      label: "Student",
      render: (value: unknown) => {
        const s = value as Student;
        return (
          <div>
            <div className="font-medium text-gray-800">{s.firstName} {s.lastName}</div>
            <div className="text-xs text-gray-500">{s.admissionNo}</div>
          </div>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      render: (v) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge variant={
          v === "present" ? "success" :
            v === "absent" ? "danger" :
              v === "late" ? "warning" : "info"
        }>
          {String(v).toUpperCase()}
        </Badge>
      )
    },
    {
      key: "classId",
      label: "Class",
      render: (v) => {
        const c = v as Class;
        return c ? `${c.name} - ${c.section}` : "-";
      }
    }
  ];

  const filteredHistory = attendances.filter(a => {
    const student = a.studentId as any;
    const name = `${student.firstName} ${student.lastName}`.toLowerCase();
    const adm = (student.admissionNo || "").toLowerCase();
    const query = historySearch.toLowerCase();
    return name.includes(query) || adm.includes(query);
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Scrollable outer wrapper */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 flex flex-col gap-0">
          <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Attendance" }]} />

          {/* Header */}
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Attendance Register</h1>
            <p className="text-gray-500 mt-1 text-lg">Manage daily attendance and view history</p>
          </div>

          {/* Overall Stats Cards */}
          {/* Overall Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Present Today</p>
                <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-900">{stats.present}</p>
            </div>

            <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <p className="text-pink-700 text-xs font-bold uppercase tracking-wider">Absent Today</p>
                <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <UserX className="w-5 h-5 text-pink-600" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-pink-900">{stats.absent}</p>
            </div>

            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <p className="text-amber-700 text-xs font-bold uppercase tracking-wider">Late Arrival</p>
                <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-900">{stats.late}</p>
            </div>

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <p className="text-blue-700 text-xs font-bold uppercase tracking-wider">Attendance Rate</p>
                <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-blue-900">{stats.rate}%</p>
            </div>
          </div>

          {/* Main Action Area - flex col to allow inner scrolling */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col" style={{ minHeight: '480px' }}>

            {/* Toolbar */}
            <div className="px-5 pt-4 pb-4 border-b border-gray-100 bg-white sticky top-[64px] z-20 shadow-sm">

              {/* Row 1: Tabs + Actions */}
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                {/* View Mode Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("mark")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${viewMode === "mark" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Mark Register
                  </button>
                  <button
                    onClick={() => setViewMode("history")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${viewMode === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    View History
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {viewMode === "mark" && (
                    <>
                      <button
                        onClick={() => markAll("present")}
                        className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 rounded-xl hover:bg-green-100 border border-green-200 whitespace-nowrap transition-colors"
                      >
                        Mark All Present
                      </button>
                      <button
                        onClick={saveAttendance}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-red-600 transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </>
                  )}
                  {viewMode === "history" && (
                    <button onClick={() => exportToCSV(attendances, "attendance.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors text-sm font-medium">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Class Selector + Date Selector */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Class Selector */}
                <div className="relative flex-1 min-w-[160px] max-w-[260px]">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full appearance-none pl-4 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-medium text-gray-700 text-sm"
                  >
                    <option value="" disabled>Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Date Selector */}
                <div className="relative group">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-medium text-gray-700 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Content Area - fills remaining space and scrolls */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 bg-gray-50/30" style={{ minHeight: '200px' }}>
              {viewMode === "mark" ? (
                <>
                  {!selectedClass ? (
                    <div className="text-center py-32 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">Select a class to mark attendance</p>
                      <p className="text-sm text-gray-400 mt-1">Choose from the dropdown above</p>
                    </div>
                  ) : loadingRegister ? (
                    <div className="text-center py-32">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-500 font-medium">Loading class register...</p>
                    </div>
                  ) : classStudents.length === 0 ? (
                    <div className="text-center py-32 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                      <p>No students found in this class</p>
                    </div>
                  ) : (
                    <>
                      {/* Register Stats Bar */}
                      <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                          <span className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                            Class Summary
                          </span>
                          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                            {currentRegisterStats.total} Students Total
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
                          <div className="flex flex-col items-center justify-center gap-1 py-4 px-3 bg-green-50/50">
                            <span className="text-2xl font-extrabold text-green-700">{currentRegisterStats.present}</span>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Present</span>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-1 py-4 px-3 bg-red-50/50">
                            <span className="text-2xl font-extrabold text-red-700">{currentRegisterStats.absent}</span>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Absent</span>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-1 py-4 px-3 bg-amber-50/50">
                            <span className="text-2xl font-extrabold text-amber-700">{currentRegisterStats.late}</span>
                            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Late</span>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-1 py-4 px-3 bg-blue-50/50">
                            <span className="text-2xl font-extrabold text-blue-700">{currentRegisterStats.excused}</span>
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Excused</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Register Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {classStudents.map((student, index) => {
                          const status = studentStatus[student._id] || "present";
                          const statusConfig: Record<string, { bg: string; lightBg: string; border: string; text: string; label: string }> = {
                            present: { bg: "bg-green-500", lightBg: "bg-green-50", border: "border-green-400", text: "text-green-700", label: "Present" },
                            absent: { bg: "bg-red-500", lightBg: "bg-red-50", border: "border-red-400", text: "text-red-700", label: "Absent" },
                            late: { bg: "bg-amber-500", lightBg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", label: "Late" },
                            excused: { bg: "bg-blue-500", lightBg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", label: "Excused" },
                          };
                          const current = statusConfig[status] || statusConfig.present;
                          const avatarColors = [
                            "from-orange-400 to-red-400",
                            "from-purple-400 to-indigo-400",
                            "from-teal-400 to-green-400",
                            "from-pink-400 to-rose-400",
                            "from-blue-400 to-cyan-400",
                            "from-amber-400 to-orange-400",
                          ];
                          const avatarColor = avatarColors[index % avatarColors.length];
                          const buttons: { key: "present" | "absent" | "late" | "excused"; icon: React.ReactNode; shortLabel: string; color: string; activeColor: string }[] = [
                            { key: "present", icon: <CheckCircle2 className="w-4 h-4" />, shortLabel: "P", color: "text-green-600 hover:bg-green-50 hover:border-green-400", activeColor: "bg-green-500 text-white border-green-500 shadow-md" },
                            { key: "absent", icon: <XCircle className="w-4 h-4" />, shortLabel: "A", color: "text-red-500   hover:bg-red-50   hover:border-red-400", activeColor: "bg-red-500   text-white border-red-500   shadow-md" },
                            { key: "late", icon: <Clock className="w-4 h-4" />, shortLabel: "L", color: "text-amber-600 hover:bg-amber-50 hover:border-amber-400", activeColor: "bg-amber-500 text-white border-amber-500 shadow-md" },
                            { key: "excused", icon: <ShieldCheck className="w-4 h-4" />, shortLabel: "E", color: "text-blue-600  hover:bg-blue-50  hover:border-blue-400", activeColor: "bg-blue-500  text-white border-blue-500  shadow-md" },
                          ];
                          return (
                            <div key={student._id} className={`relative bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-lg ${current.border}`}>
                              {/* Top accent bar */}
                              <div className={`h-2 w-full ${current.bg}`} />
                              <div className="p-4">
                                {/* Student info */}
                                <div className="flex items-center gap-3 mb-4">
                                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xl font-extrabold shadow-sm`}>
                                    {student.firstName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                                      {student.firstName} {student.lastName || ""}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Reg No: <span className="text-gray-700 font-semibold">{student.admissionNo || "N/A"}</span>
                                    </p>
                                  </div>
                                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${current.lightBg} ${current.text} border ${current.border}`}>
                                    {current.label}
                                  </span>
                                </div>
                                {/* Toggle Buttons */}
                                <div className="grid grid-cols-4 gap-2">
                                  {buttons.map(btn => (
                                    <button
                                      key={btn.key}
                                      onClick={() => toggleStatus(student._id, btn.key)}
                                      title={btn.key.charAt(0).toUpperCase() + btn.key.slice(1)}
                                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-bold transition-all duration-200 active:scale-95 ${status === btn.key ? btn.activeColor : `bg-gray-50 border-gray-200 ${btn.color}`}`}
                                    >
                                      {btn.icon}
                                      <span className="text-[10px] leading-none">{btn.shortLabel}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : (
                // History View
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                    <div className="relative flex-1 w-full">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by student name or admission number..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-medium text-gray-700"
                      />
                    </div>
                    <div className="text-sm text-gray-500 font-medium px-4 py-2 bg-white border border-gray-200 rounded-xl">
                      {filteredHistory.length} records found
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-1">
                    <div className="overflow-x-auto">
                      <Table
                        columns={columns}
                        data={filteredHistory}
                        loading={loadingHistory}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
