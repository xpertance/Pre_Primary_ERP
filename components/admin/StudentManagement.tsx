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
import { useRouter } from "next/navigation";
import { exportToCSV, exportStudentsToCSV } from "@/utils/exportData";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  AlertCircle,
  X,
  Eye,
} from "lucide-react";

interface Parent {
  name: string;
  phone: string;
  email: string;
  relation: string;
}

interface MedicalInfo {
  allergies: string[];
  notes: string;
}

interface PickupInfo {
  pickupPerson: string;
  pickupPhone: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  admissionNo?: string;
  admissionDate?: Date;
  classId?: string;
  section?: string;
  dob?: Date;
  gender?: string;
  parents?: Parent[];
  medical?: MedicalInfo;
  pickupInfo?: PickupInfo;
  [key: string]: unknown; // Added index signature
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export default function StudentManagement() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // --- Fee assignment at enrollment ---
  interface FeeStructureForClass {
    _id: string;
    name: string;
    heads: { title: string; amount: number; frequency: string }[];
  }
  const [classStructures, setClassStructures] = useState<FeeStructureForClass[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [selectedHeads, setSelectedHeads] = useState<Record<string, boolean>>({});
  const [feeMonth, setFeeMonth] = useState(new Date().getMonth().toString());
  const [feeYear, setFeeYear] = useState(new Date().getFullYear().toString());
  const [feeDueDate, setFeeDueDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]
  );
  const [loadingStructures, setLoadingStructures] = useState(false);
  // ------------------------------------

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dob: string;
    gender: string;
    classId: string;
    section: string;
    admissionNo: string;
    admissionDate: string;
    parents: Parent[];
    medical: MedicalInfo;
    pickupInfo: PickupInfo;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    classId: "",
    section: "",
    admissionNo: "",
    admissionDate: "",
    parents: [{ name: "", phone: "", email: "", relation: "" }],
    medical: {
      allergies: [],
      notes: "",
    },
    pickupInfo: {
      pickupPerson: "",
      pickupPhone: "",
    },
  });

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students?limit=500");
      const data = await res.json();
      console.log("Fetched students:", data);
      setStudents(data.students || []);
    } catch {
      showToast.error("Failed to fetch students");
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

  const handleParentChange = (index: number, field: string, value: string) => {
    const updatedParents = [...formData.parents];
    updatedParents[index] = { ...updatedParents[index], [field]: value };
    setFormData((prev) => ({ ...prev, parents: updatedParents }));
  };

  const handleAddParent = () => {
    setFormData((prev) => ({
      ...prev,
      parents: [...prev.parents, { name: "", phone: "", email: "", relation: "" }],
    }));
  };

  const handleRemoveParent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      parents: prev.parents.filter((_, i) => i !== index),
    }));
  };

  const handleAddAllergy = (allergy: string) => {
    if (allergy.trim()) {
      setFormData((prev) => ({
        ...prev,
        medical: {
          ...prev.medical,
          allergies: [...prev.medical.allergies, allergy.trim()],
        },
      }));
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medical: {
        ...prev.medical,
        allergies: prev.medical.allergies.filter((_, i) => i !== index),
      },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // When class changes, fetch available fee structures
    if (name === "classId" && value) {
      fetchStructuresForClass(value);
    } else if (name === "classId" && !value) {
      setClassStructures([]);
      setSelectedStructureId("");
      setSelectedHeads({});
    }
  };

  const fetchStructuresForClass = async (classId: string) => {
    setLoadingStructures(true);
    try {
      const res = await fetch("/api/fees");
      const data = await res.json();
      // Filter structures matching selected class (or structures with no class = school-wide)
      const all: FeeStructureForClass[] = data.items || [];
      const filtered = all.filter(
        (s: any) => !s.classId || s.classId === classId || s.classId?._id === classId
      );
      setClassStructures(filtered);
      setSelectedStructureId("");
      setSelectedHeads({});
    } catch {
      console.error("Failed to load fee structures");
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleStructureSelect = (structureId: string) => {
    setSelectedStructureId(structureId);
    const structure = classStructures.find((s) => s._id === structureId);
    if (structure) {
      // Default: all heads selected
      const allSelected: Record<string, boolean> = {};
      structure.heads.forEach((h) => { allSelected[h.title] = true; });
      setSelectedHeads(allSelected);
    } else {
      setSelectedHeads({});
    }
  };

  const handleAddStudent = async () => {
    if (!formData.firstName) {
      showToast.error("First name is required");
      return;
    }

    if (!editingStudent && !formData.email) {
      showToast.error("Email is required for new student");
      return;
    }

    if (!editingStudent && !formData.password) {
      showToast.error("Password is required for new student");
      return;
    }

    // Validation: Fee Structure is now MANDATORY for new students
    if (!editingStudent && !selectedStructureId && classStructures.length > 0) {
      showToast.error("Please assign a Fee Structure to proceed");
      return;
    }

    try {
      const method = editingStudent ? "PUT" : "POST";
      const url = editingStudent ? `/api/students/${editingStudent._id}` : "/api/students";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedData = await res.json();
        const studentId = editingStudent ? editingStudent._id : savedData.student?._id || savedData._id;

        // --- Assign selected fee heads if this is a new student and a structure was chosen ---
        if (!editingStudent && selectedStructureId && studentId) {
          const structure = classStructures.find((s) => s._id === selectedStructureId);
          if (structure) {
            const items = structure.heads
              .filter((h) => selectedHeads[h.title])
              .map((h) => ({ head: h.title, amount: h.amount }));
            const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

            if (items.length > 0 && totalAmount > 0) {
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              await fetch("/api/fees/transactions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId,
                  items,
                  amountDue: totalAmount,
                  dueDate: feeDueDate,
                  note: `${structure.name} - ${monthNames[parseInt(feeMonth)]} ${feeYear}`,
                }),
              });
            }
          }
        }

        showToast.success(`Student ${editingStudent ? "updated" : "added"} successfully`);
        setModalOpen(false);
        setEditingStudent(null);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          dob: "",
          gender: "",
          classId: "",
          section: "",
          admissionNo: "",
          admissionDate: "",
          parents: [{ name: "", phone: "", email: "", relation: "" }],
          medical: { allergies: [], notes: "" },
          pickupInfo: { pickupPerson: "", pickupPhone: "" },
        });
        setClassStructures([]);
        setSelectedStructureId("");
        setSelectedHeads({});
        fetchStudents();
      } else {
        showToast.error("Failed to save student");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName || "",
      email: student.email || "",
      password: "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
      gender: student.gender || "",
      classId: student.classId || "",
      section: student.section || "",
      admissionNo: student.admissionNo || "",
      admissionDate: student.admissionDate
        ? new Date(student.admissionDate).toISOString().split("T")[0]
        : "",
      parents: student.parents?.length
        ? student.parents
        : [{ name: "", phone: "", email: "", relation: "" }],
      medical: {
        allergies: student.medical?.allergies || [],
        notes: student.medical?.notes || "",
      },
      pickupInfo: {
        pickupPerson: student.pickupInfo?.pickupPerson || "",
        pickupPhone: student.pickupInfo?.pickupPhone || "",
      },
    });
    setModalOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast.success("Student deleted successfully");
        fetchStudents();
      }
    } catch {
      showToast.error("Failed to delete student");
    }
  };

  const filteredStudents = students?.filter((student) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      student.firstName.toLowerCase().includes(term) ||
      student.lastName?.toLowerCase().includes(term) ||
      student.admissionNo?.toLowerCase().includes(term);

    const matchesClass = !selectedClass || (() => {
      // classId can be a plain string id OR a populated object { _id, name, section }
      const cId = typeof student.classId === "object"
        ? (student.classId as any)?._id
        : student.classId;
      return cId === selectedClass;
    })();

    return matchesSearch && matchesClass;
  });

  const columns: Column[] = [
    {
      key: "admissionNo",
      label: "Admission No.",
      render: (value: unknown) => String(value) || "-",
    },
    {
      key: "firstName",
      label: "First Name",
      render: (value: unknown) => String(value),
    },
    {
      key: "lastName",
      label: "Last Name",
      render: (value: unknown) => String(value) || "-",
    },
    {
      key: "gender",
      label: "Gender",
      render: (value: unknown) => (
        <Badge
          variant={
            String(value) === "male" ? "info" : String(value) === "female" ? "danger" : "warning"
          }
        >
          {String(value) || "N/A"}
        </Badge>
      ),
    },
    {
      key: "section",
      label: "Section",
      render: (value: unknown) => String(value) || "-",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Students" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
            <p className="text-gray-600 mt-1">Manage all students in the system</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportStudentsToCSV(students, "students.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Total Students</p>
              <p className="text-4xl font-bold text-pink-600">{students.length}</p>
            </div>
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Enrolled</p>
              <p className="text-4xl font-bold text-green-600">
                {students.filter((s) => s.classId).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium mb-2">Not Assigned</p>
              <p className="text-4xl font-bold text-amber-600">
                {students.filter((s) => !s.classId).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center">
              <UserX className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Students</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                dob: "",
                gender: "",
                classId: "",
                section: "",
                admissionNo: "",
                admissionDate: "",
                parents: [{ name: "", phone: "", email: "", relation: "" }],
                medical: {
                  allergies: [],
                  notes: "",
                },
                pickupInfo: {
                  pickupPerson: "",
                  pickupPhone: "",
                },
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
          </div>
          {/* Class filter dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm min-w-[180px]"
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
                className="px-3 py-2.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={filteredStudents}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/dashboard/fees/${(row as Student)._id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-all text-sm font-medium"
                title="View Fee Details"
              >
                <Eye className="w-3.5 h-3.5" />
                Details
              </button>
              <button
                onClick={() => handleEditStudent(row as Student)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteStudent((row as Student)._id)}
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
          setEditingStudent(null);
        }}
        title={editingStudent ? "Edit Student" : "Add New Student"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingStudent(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleAddStudent} variant="primary">
              {editingStudent ? "Update" : "Add"} Student
            </Button>
          </>
        }
      >
        <div className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
              {editingStudent ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingStudent ? "Edit Student" : "Add New Student"}
            </h2>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  fullWidth
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  fullWidth
                />
                <Input
                  label={editingStudent ? "Password (leave blank to keep current)" : "Password *"}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password (min 6 characters)"
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Admission Number"
                  name="admissionNo"
                  value={formData.admissionNo}
                  onChange={handleInputChange}
                  placeholder="e.g., STD001"
                  fullWidth
                />
                <Input
                  label="Admission Date"
                  name="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "male", label: "Male", emoji: "👦" },
                    { value: "female", label: "Female", emoji: "👧" },
                    { value: "other", label: "Other", emoji: "👤" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, gender: option.value }))}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${formData.gender === option.value
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
                        }`}
                    >
                      <span className="text-lg">{option.emoji}</span>
                      <span className="font-medium text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} - Section {cls.section}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Structure Assignment (only for new students) */}
              {!editingStudent && formData.classId && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <span className="text-base">💰</span>
                    Assign Fee Structure at Enrollment <span className="text-red-500">*</span>
                  </h4>

                  {loadingStructures ? (
                    <p className="text-sm text-gray-500">Loading fee structures...</p>
                  ) : classStructures.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No fee structures found for this class. You can assign fees later.</p>
                  ) : (
                    <>
                      {/* Structure selector */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Select Fee Structure</label>
                        <select
                          value={selectedStructureId}
                          onChange={(e) => handleStructureSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 bg-white"
                        >
                          <option value="">-- Pick a structure --</option>
                          {classStructures.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Fee head checkboxes */}
                      {selectedStructureId && (
                        <>
                          <p className="text-xs text-gray-500 mb-2">Select which fee heads to apply:</p>
                          <div className="space-y-2 mb-3">
                            {classStructures.find((s) => s._id === selectedStructureId)?.heads.map((head) => (
                              <label
                                key={head.title}
                                className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-emerald-400 transition-all"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedHeads[head.title]}
                                    onChange={(e) =>
                                      setSelectedHeads((prev) => ({ ...prev, [head.title]: e.target.checked }))
                                    }
                                    className="w-4 h-4 text-emerald-600 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700">{head.title}</span>
                                  <span className="text-xs text-gray-400 capitalize">({head.frequency})</span>
                                </div>
                                <span className="text-sm font-semibold text-emerald-700">₹{head.amount.toLocaleString()}</span>
                              </label>
                            ))}
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-center p-2.5 bg-emerald-100 rounded-lg mb-3">
                            <span className="text-sm font-semibold text-emerald-800">Total Due</span>
                            <span className="text-sm font-bold text-emerald-900">
                              ₹{classStructures
                                .find((s) => s._id === selectedStructureId)
                                ?.heads.filter((h) => selectedHeads[h.title])
                                .reduce((sum, h) => sum + h.amount, 0)
                                .toLocaleString() || 0}
                            </span>
                          </div>

                          {/* Month/Year/DueDate */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Month</label>
                              <select
                                value={feeMonth}
                                onChange={(e) => setFeeMonth(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-400 bg-white"
                              >
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                  <option key={i} value={i}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Year</label>
                              <input
                                type="number"
                                value={feeYear}
                                onChange={(e) => setFeeYear(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                              <input
                                type="date"
                                value={feeDueDate}
                                onChange={(e) => setFeeDueDate(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-400"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parent/Guardian Information
            </h3>
            <div className="space-y-3">
              {formData?.parents?.map((parent, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative"
                >
                  {formData.parents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParent(index)}
                      className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Parent Name *"
                      value={parent.name}
                      onChange={(e) => handleParentChange(index, "name", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Relation (e.g., Father, Mother)"
                      value={parent.relation}
                      onChange={(e) => handleParentChange(index, "relation", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={parent.phone}
                      onChange={(e) => handleParentChange(index, "phone", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={parent.email}
                      onChange={(e) => handleParentChange(index, "email", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddParent}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-all w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Another Parent/Guardian
              </button>
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Medical Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type allergy and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAllergy(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData?.medical?.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(index)}
                        className="hover:bg-red-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Notes
                </label>
                <textarea
                  value={formData?.medical?.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      medical: { ...prev.medical, notes: e.target.value },
                    }))
                  }
                  placeholder="Any medical conditions, medications, or special care instructions..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pickup Information */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Pickup Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Authorized Pickup Person"
                value={formData?.pickupInfo?.pickupPerson}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickupInfo: { ...prev.pickupInfo, pickupPerson: e.target.value },
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              />
              <input
                type="tel"
                placeholder="Pickup Person Phone"
                value={formData?.pickupInfo?.pickupPhone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickupInfo: { ...prev.pickupInfo, pickupPhone: e.target.value },
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}