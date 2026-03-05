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
  School,
  Users,
  GraduationCap,
  DoorOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
} from "lucide-react";

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName?: string;
}

interface Class {
  _id: string;
  name: string;
  section: string;
  teachers?: Teacher[];
  students?: Student[];
  roomNumber?: string;
  [key: string]: unknown;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    section: "A",
    roomNumber: "",
    teachers: [] as string[],
    students: [] as string[],
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      showToast.error("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClass = async () => {
    if (!formData.name) {
      showToast.error("Class name is required");
      return;
    }

    try {
      setSaving(true);
      const method = editingClass ? "PUT" : "POST";
      const url = editingClass ? `/api/classes/${editingClass._id}` : "/api/classes";

      console.log(`[ClassManagement] ${method} to ${url}`, formData);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast.success(`Class ${editingClass ? "updated" : "added"} successfully`);
        setModalOpen(false);
        setEditingClass(null);
        setFormData({ name: "", section: "A", roomNumber: "", teachers: [], students: [] });
        fetchClasses();
      } else {
        const errorData = await res.json();
        console.error("[ClassManagement] Error response:", errorData);
        showToast.error(errorData.error || "Failed to save class");
      }
    } catch (error) {
      console.error("[ClassManagement] Fetch error:", error);
      showToast.error("Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      section: cls.section,
      roomNumber: cls.roomNumber || "",
      teachers: cls.teachers?.map((t) => t._id) || [],
      students: cls.students?.map((s) => s._id) || [],
    });
    setModalOpen(true);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast.success("Class deleted successfully");
        fetchClasses();
      }
    } catch (error) {
      showToast.error("Failed to delete class");
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  const totalTeachers = classes.reduce((sum, cls) => sum + (cls.teachers?.length || 0), 0);
  const totalRooms = classes.filter((cls) => cls.roomNumber).length;

  const columns: Column[] = [
    {
      key: "name",
      label: "Class Name",
      render: (value: unknown) => (
        <span className="font-semibold text-gray-800">{String(value)}</span>
      ),
    },
    {
      key: "section",
      label: "Section",
      render: (value: unknown) => (
        <Badge variant="info" size="sm">
          Section {String(value)}
        </Badge>
      ),
    },
    {
      key: "roomNumber",
      label: "Room Number",
      render: (value: unknown) =>
        value ? String(value) : <span className="text-gray-400 text-sm">-</span>,
    },
    {
      key: "teachers",
      label: "Teachers",
      render: (value: unknown) => {
        const teachers = value as Teacher[];
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-700">{teachers?.length || 0}</span>
            </div>
            {teachers && teachers.length > 0 && (
              <div
                className="text-xs text-gray-500 truncate max-w-[150px]"
                title={teachers.map((t) => t.name).join(", ")}
              >
                {teachers.map((t) => t.name).join(", ")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "students",
      label: "Students",
      render: (value: unknown) => {
        const students = value as Student[];
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-pink-600" />
              <span className="font-medium text-gray-700">{students?.length || 0}</span>
            </div>
            {students && students.length > 0 && (
              <div className="text-xs text-gray-500">{students.length} enrolled</div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Classes" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Class Management</h1>
            <p className="text-gray-600 mt-1">Manage all classes and sections</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(classes, "classes.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Classes */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-2">Total Classes</p>
              <p className="text-4xl font-bold text-orange-600">{classes.length}</p>
            </div>
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <School className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Total Students</p>
              <p className="text-4xl font-bold text-pink-600">{totalStudents}</p>
            </div>
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Total Teachers</p>
              <p className="text-4xl font-bold text-purple-600">{totalTeachers}</p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Assigned Rooms */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Assigned Rooms</p>
              <p className="text-4xl font-bold text-blue-600">{totalRooms}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <DoorOpen className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Classes</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredClasses.length} {filteredClasses.length === 1 ? "class" : "classes"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingClass(null);
              setFormData({ name: "", section: "A", roomNumber: "", teachers: [], students: [] });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by class name, section, or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={filteredClasses}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleEditClass(row as Class)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteClass((row as Class)._id)}
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
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? "Edit Class" : "Add New Class"}
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingClass(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleAddClass} variant="primary" loading={saving}>
              {editingClass ? "Update" : "Add"} Class
            </Button>
          </>
        }
      >
        <div className="space-y-5 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
              {editingClass ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingClass ? "Edit Class" : "Add New Class"}
            </h2>
          </div>

          <Input
            label="Class Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Nursery, KG1, KG2"
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
            <div className="grid grid-cols-4 gap-3">
              {["A", "B", "C", "D"].map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, section }))}
                  className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${formData.section === section
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
            <div className="relative">
              <DoorOpen className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                placeholder="e.g., 101, 102, A-Wing"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Assign Teachers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Assign Teachers
            </label>
            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
              {teachers.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">No teachers available</div>
              ) : (
                teachers.map((teacher) => (
                  <label
                    key={teacher._id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.teachers.includes(teacher._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            teachers: [...prev.teachers, teacher._id],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            teachers: prev.teachers.filter((id) => id !== teacher._id),
                          }));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-400"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{teacher.name}</div>
                      <div className="text-xs text-gray-500">{teacher.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {formData.teachers.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {formData.teachers.length} teacher{formData.teachers.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          {/* Assign Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Assign Students
            </label>
            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
              {students.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">No students available</div>
              ) : (
                students.map((student) => (
                  <label
                    key={student._id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.students.includes(student._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            students: [...prev.students, student._id],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            students: prev.students.filter((id) => id !== student._id),
                          }));
                        }
                      }}
                      className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-400"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {student.firstName} {student.lastName || ""}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {formData.students.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {formData.students.length} student{formData.students.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}