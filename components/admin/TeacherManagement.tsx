"use client";
import React, { useState, useEffect, useRef } from "react";
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
  GraduationCap,
  UserCheck,
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  X,
  School,
  ChevronDown,
  Calendar,
  Clock,
  Grid3x3,
  List,
  DoorOpen,
} from "lucide-react";

interface ClassAssignment {
  classId: string;
  section?: string;
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subjects?: string[];
  classes?: ClassAssignment[];
  qualifications?: string[];
  [key: string]: unknown; // Added index signature
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState<Teacher | null>(null);
  const [scheduleViewRange, setScheduleViewRange] = useState<"Today" | "Weekly">("Today");
  const [teacherTimetables, setTeacherTimetables] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);


  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    subjects: string[];
    classes: ClassAssignment[];
    qualifications: string[];
  }>({
    name: "",
    email: "",
    password: "",
    phone: "",
    subjects: [],
    classes: [],
    qualifications: [],
  });

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
    fetchGlobalSubjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    };
    if (isSubjectDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSubjectDropdownOpen]);

  const fetchGlobalSubjects = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings && data.settings.subjects) {
        setGlobalSubjects(data.settings.subjects);
      }
    } catch (error) {
      console.error("Failed to fetch global subjects:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teachers?limit=500");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      showToast.error("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes?limit=100");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, ""],
    }));
  };

  const handleSubjectChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s, i) => (i === index ? value : s)),
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleAddQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, ""],
    }));
  };

  const handleQualificationChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((q, i) => (i === index ? value : q)),
    }));
  };

  const handleRemoveQualification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleAddClass = () => {
    setFormData((prev) => ({
      ...prev,
      classes: [...prev.classes, { classId: "", section: "" }],
    }));
  };

  const handleClassChange = (index: number, field: string, value: string) => {
    const updatedClasses = [...formData.classes];
    updatedClasses[index] = { ...updatedClasses[index], [field]: value };
    setFormData((prev) => ({ ...prev, classes: updatedClasses }));
  };

  const handleRemoveClass = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index),
    }));
  };

  const handleAddTeacher = async () => {
    if (!formData.name || !formData.email) {
      showToast.error("Name and email are required");
      return;
    }

    if (!editingTeacher && !formData.password) {
      showToast.error("Password is required for new teacher");
      return;
    }

    try {
      setSaving(true);

      const cleanedClasses = formData.classes
        .filter(c => c.classId && c.classId.trim() !== "")
        .map(c => ({ classId: c.classId, section: c.section || "" }));

      const cleanedSubjects = formData.subjects.filter(s => s.trim() !== "");
      const cleanedQualifications = formData.qualifications.filter(q => q.trim() !== "");

      if (editingTeacher) {
        const currentData = {
          name: editingTeacher.name,
          email: editingTeacher.email,
          phone: editingTeacher.phone || "",
          subjects: editingTeacher.subjects || [],
          classes: (editingTeacher.classes || []).map((c: any) => ({
            classId: typeof c.classId === "object" ? c.classId._id : c.classId,
            section: c.section || ""
          })),
          qualifications: editingTeacher.qualifications || [],
        };

        const hasChanged =
          formData.name.trim() !== currentData.name.trim() ||
          formData.email.trim() !== currentData.email.trim() ||
          formData.phone.trim() !== currentData.phone.trim() ||
          formData.password !== "" ||
          JSON.stringify([...cleanedSubjects].sort()) !== JSON.stringify([...currentData.subjects].sort()) ||
          JSON.stringify([...cleanedQualifications].sort()) !== JSON.stringify([...currentData.qualifications].sort()) ||
          JSON.stringify(cleanedClasses) !== JSON.stringify(currentData.classes);

        if (!hasChanged) {
          showToast.info("No changes detected");
          setModalOpen(false);
          setEditingTeacher(null);
          setSaving(false);
          return;
        }
      }

      const method = editingTeacher ? "PUT" : "POST";
      const url = editingTeacher ? `/api/teachers/${editingTeacher._id}` : "/api/teachers";

      const sanitizedData = { 
        ...formData, 
        classes: cleanedClasses,
        subjects: cleanedSubjects,
        qualifications: cleanedQualifications
      };

      // Remove password if it's empty string for editing
      if (editingTeacher && !sanitizedData.password) {
        delete (sanitizedData as any).password;
      }

      console.log(`[TeacherManagement] ${method} to ${url}`, sanitizedData);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (res.ok) {
        showToast.success(`Teacher ${editingTeacher ? "updated" : "added"} successfully`);
        setModalOpen(false);
        setEditingTeacher(null);
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          subjects: [],
          classes: [],
          qualifications: [],
        });
        fetchTeachers();
      } else {
        const errorData = await res.json();
        console.error("[TeacherManagement] Error response:", errorData);
        showToast.error(errorData.error || "Failed to save teacher");
      }
    } catch (error) {
      console.error("[TeacherManagement] Fetch error:", error);
      showToast.error("Failed to save teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: "",
      phone: teacher.phone || "",
      subjects: teacher.subjects || [],
      classes: (teacher.classes || []).map((c: any) => ({
        classId: typeof c.classId === "object" ? c.classId._id : c.classId,
        section: c.section || "",
      })),
      qualifications: teacher.qualifications || [],
    });
    setModalOpen(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setDeletingTeacher(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${deletingTeacher._id}`, { method: "DELETE" });
      if (res.ok) {
        showToast.success("Teacher deleted successfully");
        setShowDeleteModal(false);
        setDeletingTeacher(null);
        fetchTeachers();
      } else {
        const errorData = await res.json();
        showToast.error(errorData.error || "Failed to delete teacher");
      }
    } catch (error) {
      showToast.error("An unexpected error occurred");
    }
  };

  const handleRowDoubleClick = async (row: Record<string, unknown>) => {
    const teacher = row as Teacher;
    setSelectedTeacherForSchedule(teacher);
    setScheduleModalOpen(true);
    setScheduleLoading(true);
    setScheduleViewRange("Today");
    try {
      const res = await fetch(`/api/timetable?teacherId=${teacher._id}`);
      const data = await res.json();
      setTeacherTimetables(data.timetable || data.data || []);
    } catch (error) {
      console.error("Failed to fetch teacher schedule", error);
      showToast.error("Failed to fetch teacher schedule");
    } finally {
      setScheduleLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      (teacher.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      !selectedClass ||
      (teacher.classes || []).some((cls) => {
        const classId = typeof cls.classId === "object" ? (cls.classId as any)._id : cls.classId;
        return classId === selectedClass;
      });

    return matchesSearch && matchesClass;
  });


  const teachersWithSubjects = teachers.filter(
    (t) => t.subjects && t.subjects.length > 0
  ).length;
  const teachersWithClasses = teachers.filter(
    (t) => t.classes && t.classes.length > 0
  ).length;

  const columns: Column[] = [
    {
      key: "name",
      label: "Name",
      render: (value: unknown) => String(value),
    },
    {
      key: "email",
      label: "Email",
      render: (value: unknown) => String(value),
    },
    {
      key: "phone",
      label: "Phone",
      render: (value: unknown) => String(value) || "-",
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (value: unknown) => {
        const subjects = value as string[];
        return (
          <div className="flex gap-1 flex-wrap">
            {(subjects || []).map((subject, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {subject}
              </Badge>
            ))}
            {(!subjects || subjects.length === 0) && (
              <span className="text-gray-400 text-sm">No subjects</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Teachers" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Teacher Management</h1>
            <p className="text-gray-600 mt-1">Manage all teaching staff members</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(teachers, "teachers.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Total Teachers</p>
              <p className="text-4xl font-bold text-purple-600">{teachers.length}</p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">With Subjects</p>
              <p className="text-4xl font-bold text-green-600">{teachersWithSubjects}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-2">With Classes</p>
              <p className="text-4xl font-bold text-orange-600">{teachersWithClasses}</p>
            </div>
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Teachers</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredTeachers.length} {filteredTeachers.length === 1 ? "teacher" : "teachers"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setFormData({
                name: "",
                email: "",
                password: "",
                phone: "",
                subjects: [],
                classes: [],
                qualifications: [],
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm min-w-[180px]"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} — {cls.section}
                </option>
              ))}
            </select>
            {selectedClass && (
              <button
                onClick={() => setSelectedClass("")}
                className="px-3 py-2.5 text-xs text-gray-500 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>



        {/* Table */}
        <div className="max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar">
          <Table
            columns={columns}
            data={filteredTeachers}
            loading={loading}
            onRowDoubleClick={handleRowDoubleClick}
            actions={(row) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditTeacher(row as Teacher)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTeacher(row as Teacher)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          />
        </div>

      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTeacher(null);
        }}
        title={editingTeacher ? "Edit Teacher" : "Add New Teacher"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingTeacher(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleAddTeacher} variant="primary" loading={saving}>
              {editingTeacher ? "Update" : "Add"} Teacher
            </Button>
          </>
        }
      >
        <div className="space-y-5 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
              {editingTeacher ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
            </h2>
          </div>

          <Input
            label="Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter full name"
            fullWidth
          />

          <Input
            label="Email *"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter email address"
            fullWidth
          />

          <Input
            label={editingTeacher ? "Password (leave blank to keep current)" : "Password *"}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter password (min 6 characters)"
            fullWidth
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            fullWidth
          />

          {/* Subjects Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Subjects</label>
            <div className="relative" ref={subjectDropdownRef}>
              <div 
                className="min-h-[46px] w-full px-3 py-2 bg-white border border-gray-300 rounded-lg flex flex-wrap gap-2 items-center cursor-pointer focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-transparent transition-all"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              >
                {formData.subjects.length > 0 ? (
                  formData.subjects.map((subject, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== subject) }));
                        }}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors text-purple-500 hover:text-purple-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm px-1">Select subjects...</span>
                )}
                <div className="ml-auto pl-2 text-gray-400">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isSubjectDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                  {globalSubjects.length > 0 ? (
                    <div className="p-1">
                      {globalSubjects.map((gs, i) => {
                        const isSelected = formData.subjects.includes(gs);
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              if (isSelected) {
                                setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== gs) }));
                              } else {
                                setFormData(prev => ({ ...prev, subjects: [...prev.subjects, gs] }));
                              }
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                              isSelected ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="text-sm font-medium">{gs}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No global subjects defined. Go to Settings to add subjects.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Qualifications Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Qualifications</label>
            <div className="space-y-2">
              {formData.qualifications.map((qualification, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => handleQualificationChange(idx, e.target.value)}
                    placeholder="Enter qualification"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => handleRemoveQualification(idx)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddQualification}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Qualification
              </button>
            </div>
          </div>

          {/* Classes Assignment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <School className="w-4 h-4" />
              Assign Classes
            </label>
            <div className="space-y-2">
              {formData.classes.map((classItem, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={classItem.classId}
                    onChange={(e) => handleClassChange(idx, "classId", e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - Section {cls.section}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveClass(idx)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddClass}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Assign Class
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTeacher(null);
        }}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingTeacher(null);
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Teacher?</h3>
          <p className="text-gray-500 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600">
              {deletingTeacher?.name}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-400">
            This action cannot be undone. All teacher records, assigned classes, and activity history will be permanently removed.
          </p>
        </div>
      </Modal>

      {/* Teacher Schedule Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={selectedTeacherForSchedule ? `${selectedTeacherForSchedule.name}'s Schedule` : "Teacher Schedule"}
        size="xl"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button onClick={() => setScheduleModalOpen(false)} variant="secondary">
              Close
            </Button>
            <a href={`/dashboard/timetable?view=teacher&teacherId=${selectedTeacherForSchedule?._id}`}>
              <Button variant="primary">
                Edit Schedule
              </Button>
            </a>
          </div>
        }
      >
        <div className="mt-4">
          <div className="flex justify-center mb-6">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setScheduleViewRange("Today")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  scheduleViewRange === "Today" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-4 h-4" />
                Today
              </button>
              <button
                onClick={() => setScheduleViewRange("Weekly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  scheduleViewRange === "Weekly" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Weekly
              </button>
            </div>
          </div>

          {scheduleLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-500">Loading schedule...</p>
            </div>
          ) : (
            <div className="min-h-[300px]">
              {scheduleViewRange === "Today" ? (
                <div>
                  {(() => {
                    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    const todaysClasses = teacherTimetables
                      .filter(t => t.day === currentDay)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    if (todaysClasses.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                          <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No Classes Today</h3>
                          <p className="text-sm text-gray-500">This teacher has a free day today ({currentDay}).</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">{currentDay}'s Classes</h3>
                        <div className="space-y-3">
                          {todaysClasses.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                              <div className="flex-shrink-0 w-24 text-center">
                                <div className="text-lg font-bold text-gray-900">{entry.startTime}</div>
                                <div className="text-xs font-medium text-gray-500">{entry.endTime}</div>
                              </div>
                              <div className="w-px h-12 bg-gray-200 hidden sm:block" />
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">{entry.subject}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    <School className="w-4 h-4 text-gray-400" />
                                    <span>{entry.classId?.name} - {entry.classId?.section}</span>
                                  </div>
                                  {entry.roomNumber && (
                                    <div className="flex items-center gap-1.5">
                                      <DoorOpen className="w-4 h-4 text-gray-400" />
                                      <span>Rm {entry.roomNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-6 gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => {
                      const dayClasses = teacherTimetables
                        .filter(t => t.day === day)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                      
                      return (
                        <div key={day} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="bg-purple-100 text-purple-800 text-xs font-bold text-center py-1.5 border-b border-purple-200">
                            {day.substring(0, 3)}
                          </div>
                          <div className="p-1.5 space-y-1.5 min-h-[100px]">
                            {dayClasses.length === 0 ? (
                              <div className="text-[10px] text-gray-400 text-center py-4">Free</div>
                            ) : (
                              dayClasses.map((entry, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded p-1.5 text-xs shadow-sm">
                                  <div className="font-semibold text-gray-900 truncate" title={entry.subject}>{entry.subject}</div>
                                  <div className="text-[10px] text-gray-500 font-medium my-0.5">{entry.startTime}-{entry.endTime}</div>
                                  <div className="text-[10px] text-purple-600 font-semibold truncate bg-purple-50 rounded px-1 py-0.5 inline-block w-full">
                                    {entry.classId?.name}-{entry.classId?.section}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}