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
  FileText,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  School,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface ScheduleItem {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  instructions?: string;
}

interface Exam {
  _id: string;
  name: string;
  description?: string;
  classId: Class;
  subjects: string[];
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  passingMarks: number;
  examType: "unit-test" | "mid-term" | "final" | "pre-board" | "board";
  schedule: ScheduleItem[];
  status: "scheduled" | "ongoing" | "completed";
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown; // Added index signature
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

const EXAM_TYPES = [
  { value: "unit-test", label: "Unit Test" },
  { value: "mid-term", label: "Mid-Term" },
  { value: "final", label: "Final Exam" },
  { value: "pre-board", label: "Pre-Board" },
  { value: "board", label: "Board Exam" },
];

export default function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    classId: string;
    subjects: string[];
    startDate: string;
    endDate: string;
    totalMarks: number;
    passingMarks: number;
    examType: "unit-test" | "mid-term" | "final" | "pre-board" | "board";
    schedule: ScheduleItem[];
    status: "scheduled" | "ongoing" | "completed";
    isPublished: boolean;
  }>({
    name: "",
    description: "",
    classId: "",
    subjects: [],
    startDate: "",
    endDate: "",
    totalMarks: 100,
    passingMarks: 35,
    examType: "unit-test",
    schedule: [],
    status: "scheduled",
    isPublished: false,
  });

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      const data = await res.json();
      setExams(data.exams || []);
    } catch (error) {
      showToast.error("Failed to fetch exams");
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
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubject = (subject: string) => {
    if (subject.trim() && !formData.subjects.includes(subject.trim())) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subject.trim()],
      }));
    }
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleAddScheduleItem = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          subject: "",
          date: formData.startDate,
          startTime: "09:00",
          endTime: "11:00",
          roomNumber: "",
          instructions: "",
        },
      ],
    }));
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setFormData((prev) => ({ ...prev, schedule: updatedSchedule }));
  };

  const handleRemoveScheduleItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleSaveExam = async () => {
    if (!formData.name || !formData.classId || !formData.startDate) {
      showToast.error("Name, class, and start date are required");
      return;
    }

    try {
      const method = editingExam ? "PUT" : "POST";
      const url = "/api/exams";

      const payload = editingExam ? { id: editingExam._id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to save exam");
        return;
      }

      showToast.success(`Exam ${editingExam ? "updated" : "created"} successfully`);
      setModalOpen(false);
      setEditingExam(null);
      resetForm();
      fetchExams();
    } catch (error) {
      showToast.error("Failed to save exam");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      classId: "",
      subjects: [],
      startDate: "",
      endDate: "",
      totalMarks: 100,
      passingMarks: 35,
      examType: "unit-test",
      schedule: [],
      status: "scheduled",
      isPublished: false,
    });
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || "",
      classId: exam.classId._id,
      subjects: exam.subjects,
      startDate: new Date(exam.startDate).toISOString().split("T")[0],
      endDate: new Date(exam.endDate).toISOString().split("T")[0],
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      examType: exam.examType,
      schedule: exam.schedule.map((s) => ({
        ...s,
        date: new Date(s.date).toISOString().split("T")[0],
      })),
      status: exam.status,
      isPublished: exam.isPublished,
    });
    setModalOpen(true);
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Exam deleted successfully");
        fetchExams();
      }
    } catch (error) {
      showToast.error("Failed to delete exam");
    }
  };

  const filteredExams = exams.filter(
    (exam) =>
      (exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!statusFilter || exam.status === statusFilter)
  );

  const totalExams = exams.length;
  const scheduledExams = exams.filter((e) => e.status === "scheduled").length;
  const ongoingExams = exams.filter((e) => e.status === "ongoing").length;
  const completedExams = exams.filter((e) => e.status === "completed").length;

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: "success" | "warning" | "info" } = {
      scheduled: "info",
      ongoing: "warning",
      completed: "success",
    };
    return colors[status] || "info";
  };

  const getExamTypeLabel = (type: string) => {
    return EXAM_TYPES.find((t) => t.value === type)?.label || type;
  };

  const columns: Column[] = [
    {
      key: "name",
      label: "Exam Name",
      render: (value: unknown, row: Record<string, unknown>) => {
        const exam = row as Exam;
        return (
          <div>
            <div className="font-semibold text-gray-800">{String(value)}</div>
            {exam.description && (
              <div className="text-xs text-gray-500 mt-0.5">{exam.description}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "classId",
      label: "Class",
      render: (value: unknown) => {
        const classData = value as Class;
        return `${classData.name} - ${classData.section}`;
      },
    },
    {
      key: "examType",
      label: "Type",
      render: (value: unknown) => (
        <Badge variant="primary" size="sm">
          {getExamTypeLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Date",
      render: (value: unknown, row: Record<string, unknown>) => {
        const exam = row as Exam;
        const startDate = value as Date;
        return (
          <div className="text-sm">
            <div>{new Date(startDate).toLocaleDateString()}</div>
            {exam.endDate &&
              new Date(exam.endDate).getTime() !== new Date(startDate).getTime() && (
                <div className="text-xs text-gray-500">
                  to {new Date(exam.endDate).toLocaleDateString()}
                </div>
              )}
          </div>
        );
      },
    },
    {
      key: "totalMarks",
      label: "Marks",
      render: (value: unknown, row: Record<string, unknown>) => {
        const exam = row as Exam;
        return `${value} (Pass: ${exam.passingMarks})`;
      },
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
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Exams" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Exam Management</h1>
            <p className="text-gray-600 mt-1">Schedule and manage examinations</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(exams, "exams.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Total Exams</p>
              <p className="text-4xl font-bold text-blue-600">{totalExams}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-700 text-sm font-medium mb-2">Scheduled</p>
              <p className="text-4xl font-bold text-cyan-600">{scheduledExams}</p>
            </div>
            <div className="w-14 h-14 bg-cyan-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium mb-2">Ongoing</p>
              <p className="text-4xl font-bold text-amber-600">{ongoingExams}</p>
            </div>
            <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Completed</p>
              <p className="text-4xl font-bold text-green-600">{completedExams}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Exams</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredExams.length} {filteredExams.length === 1 ? "exam" : "exams"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingExam(null);
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-white"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredExams}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleEditExam(row as Exam)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteExam((row as Exam)._id)}
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
          setEditingExam(null);
        }}
        title={editingExam ? "Edit Exam" : "Create Exam"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingExam(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveExam} variant="primary">
              {editingExam ? "Update" : "Create"} Exam
            </Button>
          </>
        }
      >
        <div className="space-y-0 mt-2 max-h-[72vh] overflow-y-auto pr-1 custom-scrollbar">

          {/* ── Basic Information ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <Input
                label="Exam Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Mid-Term 2025, Final Exam"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add a description..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-white text-sm"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - Section {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Type</label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-white text-sm"
                  >
                    {EXAM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  label="Total Marks"
                  name="totalMarks"
                  type="number"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  fullWidth
                />
                <Input
                  label="Passing Marks"
                  name="passingMarks"
                  type="number"
                  value={formData.passingMarks}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* ── Subjects ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Subjects
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="subjectInput"
                  type="text"
                  placeholder="Type subject name..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubject((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("subjectInput") as HTMLInputElement;
                    if (input) {
                      handleAddSubject(input.value);
                      input.value = "";
                      input.focus();
                    }
                  }}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {formData.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(index)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No subjects added yet.</p>
              )}
            </div>
          </div>

          {/* ── Exam Schedule ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Exam Schedule
              <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">(Optional)</span>
            </h3>
            <div className="space-y-3">
              {formData.schedule.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduleItem(idx)}
                    className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-semibold text-gray-500 mb-3">Schedule Item {idx + 1}</p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g., Mathematics"
                        value={item.subject}
                        onChange={(e) => handleScheduleChange(idx, "subject", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleScheduleChange(idx, "date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => handleScheduleChange(idx, "startTime", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => handleScheduleChange(idx, "endTime", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                      <input
                        type="text"
                        placeholder="e.g., Room 101"
                        value={item.roomNumber}
                        onChange={(e) => handleScheduleChange(idx, "roomNumber", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g., Bring calculator, No mobile phones"
                      value={item.instructions}
                      onChange={(e) => handleScheduleChange(idx, "instructions", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddScheduleItem}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Schedule Item
              </button>
            </div>
          </div>

          {/* ── Status & Publishing ── */}
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Status & Publishing
            </h3>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-white text-sm"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pb-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${formData.isPublished ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${formData.isPublished ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}>
                    Publish Results
                  </label>
                  <p className="text-xs text-gray-400">Visible to students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}