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
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  Receipt,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  Search,
} from "lucide-react";

interface FeeHead {
  title: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly" | "one-time";
  dueDateDay: number;
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface FeeStructure {
  _id: string;
  name: string;
  classId?: string;
  heads: FeeHead[];
  finePerDay: number;
  description?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown; // Added index signature
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export default function FeeStructureManagement() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [assigningStructure, setAssigningStructure] = useState<FeeStructure | null>(null);

  const [assignData, setAssignData] = useState({
    classId: "",
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    heads: [] as FeeHead[],
    finePerDay: 0,
    description: "",
    active: true,
  });

  useEffect(() => {
    fetchFeeStructures();
    fetchClasses();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fees");
      const data = await res.json();
      setFeeStructures(data.items || []);
    } catch (error) {
      showToast.error("Failed to fetch fee structures");
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
      // Parse numeric inputs as numbers so Zod validation passes
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddFeeHead = () => {
    setFormData((prev) => ({
      ...prev,
      heads: [...prev.heads, { title: "", amount: 0, frequency: "monthly", dueDateDay: 1 }],
    }));
  };

  const handleFeeHeadChange = (index: number, field: keyof FeeHead, value: string | number) => {
    const updatedHeads = [...formData.heads];
    updatedHeads[index] = { ...updatedHeads[index], [field]: value };
    setFormData((prev) => ({ ...prev, heads: updatedHeads }));
  };

  const handleRemoveFeeHead = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      heads: prev.heads.filter((_, i) => i !== index),
    }));
  };

  const handleSaveStructure = async () => {
    if (!formData.name || formData.heads.length === 0) {
      showToast.error("Name and at least one fee head are required");
      return;
    }

    // Check for duplicate heads
    const titles = formData.heads.map((h) => h.title);
    const hasDuplicates = titles.some((t, i) => titles.indexOf(t) !== i);
    if (hasDuplicates) {
      showToast.error("Duplicate fee heads are not allowed in the same structure");
      return;
    }

    try {
      const method = editingStructure ? "PUT" : "POST";
      const url = editingStructure ? `/api/fees/${editingStructure._id}` : "/api/fees";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to save fee structure");
        return;
      }

      showToast.success(`Fee structure ${editingStructure ? "updated" : "created"} successfully`);
      setModalOpen(false);
      setEditingStructure(null);
      setFormData({ name: "", classId: "", heads: [], finePerDay: 0, description: "", active: true });
      fetchFeeStructures();
    } catch (error) {
      showToast.error("Failed to save fee structure");
    }
  };

  const handleEditStructure = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      classId: structure.classId || "",
      heads: structure.heads,
      finePerDay: structure.finePerDay,
      description: structure.description || "",
      active: structure.active,
    });
    setModalOpen(true);
  };

  const handleDeleteStructure = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee structure?")) return;
    try {
      const res = await fetch(`/api/fees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Fee structure deleted successfully");
        fetchFeeStructures();
      }
    } catch (error) {
      showToast.error("Failed to delete fee structure");
    }
  };

  const filteredStructures = feeStructures.filter(
    (structure) =>
      structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStructures = feeStructures.length;
  const activeStructures = feeStructures.filter((s) => s.active).length;
  const totalFeeHeads = feeStructures.reduce((sum, s) => sum + s.heads.length, 0);

  const getFrequencyBadge = (frequency: string) => {
    const colors: { [key: string]: "success" | "info" | "warning" | "danger" } = {
      monthly: "info",
      quarterly: "success",
      yearly: "warning",
      "one-time": "danger",
    };
    return colors[frequency] || "info";
  };

  const columns: Column[] = [
    {
      key: "name",
      label: "Structure Name",
      render: (value: unknown, row: Record<string, unknown>) => {
        const structure = row as FeeStructure;
        return (
          <div>
            <div className="font-semibold text-gray-800">{String(value)}</div>
            {structure.description && (
              <div className="text-xs text-gray-500 mt-0.5">{structure.description}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "classId",
      label: "Class",
      render: (value: unknown) => {
        const classId = String(value);
        const cls = classes.find((c) => c._id === classId);
        return cls ? `${cls.name} - ${cls.section}` : <span className="text-gray-400">All Classes</span>;
      },
    },
    {
      key: "heads",
      label: "Fee Heads",
      render: (value: unknown) => {
        const heads = value as FeeHead[];
        return (
          <div className="flex flex-wrap gap-1">
            {heads.map((head, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {head.title}: ₹{head.amount}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "finePerDay",
      label: "Late Fine",
      render: (value: unknown) => `₹${Number(value)}/day`,
    },
    {
      key: "active",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={value ? "success" : "danger"} size="sm">
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Fee Structures" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Fee Structure Management</h1>
            <p className="text-gray-600 mt-1">Define and manage fee structures for different classes</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(feeStructures, "fee-structures.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium mb-2">Total Structures</p>
              <p className="text-4xl font-bold text-emerald-600">{totalStructures}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Receipt className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Active Structures</p>
              <p className="text-4xl font-bold text-green-600">{activeStructures}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Total Fee Heads</p>
              <p className="text-4xl font-bold text-blue-600">{totalFeeHeads}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Fee Structures</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredStructures.length} {filteredStructures.length === 1 ? "structure" : "structures"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStructure(null);
              setFormData({ name: "", classId: "", heads: [], finePerDay: 0, description: "", active: true });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Structure
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredStructures}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAssigningStructure(row as FeeStructure);
                  setAssignData({
                    classId: (row as FeeStructure).classId || "",
                    month: new Date().getMonth().toString(),
                    year: new Date().getFullYear().toString(),
                    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
                  });
                  setAssignModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-all text-sm font-medium"
              >
                <Calendar className="w-3.5 h-3.5" />
                Assign
              </button>
              <button
                onClick={() => handleEditStructure(row as FeeStructure)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteStructure((row as FeeStructure)._id)}
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
          setEditingStructure(null);
        }}
        title={editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingStructure(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStructure} variant="primary">
              {editingStructure ? "Update" : "Create"} Structure
            </Button>
          </>
        }
      >
        <div className="space-y-5 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center">
              {editingStructure ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
            </h2>
          </div>

          <Input
            label="Structure Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., KG1 - 2025, Nursery Fee Structure"
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class (Optional)</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - Section {cls.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add description for this fee structure..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Fee Heads Section */}
          <div className="border-t pt-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Fee Heads *
            </label>
            <div className="space-y-3">
              {formData.heads.map((head, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveFeeHead(idx)}
                    className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Fee Name (e.g. Tuition Fee) *"
                      value={head.title}
                      onChange={(e) => handleFeeHeadChange(idx, "title", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Amount *"
                      value={head.amount || ""}
                      onChange={(e) => handleFeeHeadChange(idx, "amount", parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={head.frequency}
                      onChange={(e) => handleFeeHeadChange(idx, "frequency", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm appearance-none bg-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one-time">One-time</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Due Date (Day of Month)"
                      value={head.dueDateDay || ""}
                      onChange={(e) => handleFeeHeadChange(idx, "dueDateDay", parseInt(e.target.value) || 1)}
                      min="1"
                      max="31"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFeeHead}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-all w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Fee Head
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Late Fine (per day)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  name="finePerDay"
                  value={formData.finePerDay || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-400"
                />
                <span className="text-sm font-medium text-gray-700">Active Structure</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Assign Structure Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Fee Structure"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!assignData.classId) {
                showToast.error("Please select a class");
                return;
              }
              if (!confirm(`Generate fees for all students in this class?`)) return;
              try {
                const res = await fetch("/api/fees/assign", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ structureId: assigningStructure?._id, ...assignData }),
                });
                const data = await res.json();
                if (data.success) {
                  showToast.success(data.message);
                  setAssignModalOpen(false);
                } else {
                  showToast.error(data.error || "Failed to assign fees");
                }
              } catch {
                showToast.error("Failed to assign fees");
              }
            }}>Generate Fees</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-sm">
            Generating fee transactions for: <strong>{assigningStructure?.name}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
            <select
              value={assignData.classId}
              onChange={(e) => setAssignData({ ...assignData, classId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white"
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">For Month</label>
              <select
                value={assignData.month}
                onChange={(e) => setAssignData({ ...assignData, month: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={assignData.year}
                onChange={(e) => setAssignData({ ...assignData, year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={assignData.dueDate}
              onChange={(e) => setAssignData({ ...assignData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}