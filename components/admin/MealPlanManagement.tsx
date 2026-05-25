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
  Utensils,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  IndianRupee,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Apple,
  Info,
  Image as ImageIcon,
} from "lucide-react";

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface MealItem {
  name: string;
  quantity: string;
  nutritionInfo?: string;
  allergens: string[];
  imageUrl?: string;
}

interface DaySchedule {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  items: MealItem[];
}

interface SpecialMeal {
  date: string;
  occasion: string;
  items: string[];
}

interface MealPlan {
  _id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  mealType: "breakfast" | "lunch" | "snacks" | "full-day";
  weeklySchedule: DaySchedule[];
  specialMeals: SpecialMeal[];
  classIds: Class[];
  cost?: number;
  vendor?: string;
  vendorContact?: string;
  status: "draft" | "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown; // Added index signature
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snacks", label: "Snacks" },
  { value: "full-day", label: "Full Day" },
];

export default function MealPlanManagement() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    mealType: "breakfast" | "lunch" | "snacks" | "full-day";
    weeklySchedule: DaySchedule[];
    specialMeals: SpecialMeal[];
    classIds: string[];
    cost: number;
    vendor: string;
    vendorContact: string;
    status: "draft" | "active" | "inactive";
  }>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    mealType: "lunch",
    weeklySchedule: [],
    specialMeals: [],
    classIds: [],
    cost: 0,
    vendor: "",
    vendorContact: "",
    status: "draft",
  });

  useEffect(() => {
    fetchPlans();
    fetchClasses();
  }, [statusFilter]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const url = statusFilter === "all" ? "/api/meal-plan" : `/api/meal-plan?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      showToast.error("Failed to fetch meal plans");
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
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
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

  const handleAddDaySchedule = (day: string) => {
    if (formData.weeklySchedule.some((d) => d.day === day)) {
      showToast.error("This day is already added");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: [
        ...prev.weeklySchedule,
        {
          day: day as any,
          items: [],
        },
      ],
    }));
  };

  const handleAddMealItem = (dayIndex: number) => {
    const updatedSchedule = [...formData.weeklySchedule];
    updatedSchedule[dayIndex].items.push({
      name: "",
      quantity: "",
      nutritionInfo: "",
      allergens: [],
      imageUrl: "",
    });
    setFormData((prev) => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleMealItemChange = (
    dayIndex: number,
    itemIndex: number,
    field: keyof MealItem,
    value: any
  ) => {
    const updatedSchedule = [...formData.weeklySchedule];
    updatedSchedule[dayIndex].items[itemIndex] = {
      ...updatedSchedule[dayIndex].items[itemIndex],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleRemoveMealItem = (dayIndex: number, itemIndex: number) => {
    const updatedSchedule = [...formData.weeklySchedule];
    updatedSchedule[dayIndex].items = updatedSchedule[dayIndex].items.filter(
      (_, i) => i !== itemIndex
    );
    setFormData((prev) => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleRemoveDaySchedule = (dayIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.filter((_, i) => i !== dayIndex),
    }));
  };

  const handleAddAllergen = (dayIndex: number, itemIndex: number, allergen: string) => {
    if (allergen.trim()) {
      const updatedSchedule = [...formData.weeklySchedule];
      const currentAllergens = updatedSchedule[dayIndex].items[itemIndex].allergens;
      if (!currentAllergens.includes(allergen.trim())) {
        updatedSchedule[dayIndex].items[itemIndex].allergens = [
          ...currentAllergens,
          allergen.trim(),
        ];
        setFormData((prev) => ({ ...prev, weeklySchedule: updatedSchedule }));
      }
    }
  };

  const handleRemoveAllergen = (dayIndex: number, itemIndex: number, allergenIndex: number) => {
    const updatedSchedule = [...formData.weeklySchedule];
    updatedSchedule[dayIndex].items[itemIndex].allergens = updatedSchedule[
      dayIndex
    ].items[itemIndex].allergens.filter((_, i) => i !== allergenIndex);
    setFormData((prev) => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleSavePlan = async () => {
    if (!formData.name || !formData.startDate) {
      showToast.error("Name and start date are required");
      return;
    }

    try {
      const method = editingPlan ? "PUT" : "POST";
      const url = "/api/meal-plan";

      const payload = editingPlan ? { id: editingPlan._id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to save meal plan");
        return;
      }

      showToast.success(`Meal plan ${editingPlan ? "updated" : "created"} successfully`);
      setModalOpen(false);
      setEditingPlan(null);
      resetForm();
      setStatusFilter("all");
      fetchPlans();
    } catch (error) {
      showToast.error("Failed to save meal plan");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      mealType: "lunch",
      weeklySchedule: [],
      specialMeals: [],
      classIds: [],
      cost: 0,
      vendor: "",
      vendorContact: "",
      status: "draft",
    });
  };

  const handleEditPlan = (plan: MealPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      startDate: new Date(plan.startDate).toISOString().split("T")[0],
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split("T")[0] : "",
      mealType: plan.mealType,
      weeklySchedule: plan.weeklySchedule,
      specialMeals: plan.specialMeals.map((sm) => ({
        ...sm,
        date: new Date(sm.date).toISOString().split("T")[0],
      })),
      classIds: plan.classIds.map((c) => c._id),
      cost: plan.cost || 0,
      vendor: plan.vendor || "",
      vendorContact: plan.vendorContact || "",
      status: plan.status,
    });
    setModalOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal plan?")) return;
    try {
      const res = await fetch(`/api/meal-plan?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Meal plan deleted successfully");
        fetchPlans();
      }
    } catch (error) {
      showToast.error("Failed to delete meal plan");
    }
  };

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.status === "active").length;
  const totalMeals = plans.reduce(
    (sum, p) => sum + p.weeklySchedule.reduce((s, d) => s + d.items.length, 0),
    0
  );

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: "success" | "danger" | "warning" } = {
      active: "success",
      inactive: "danger",
      draft: "warning",
    };
    return colors[status] || "info";
  };

  const columns: Column[] = [
    {
      key: "name",
      label: "Plan Name",
      render: (value: unknown, row: Record<string, unknown>) => {
        const plan = row as MealPlan;
        return (
          <div>
            <div className="font-semibold text-gray-800">{String(value)}</div>
            {plan.description && (
              <div className="text-xs text-gray-500 mt-0.5">{plan.description}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "mealType",
      label: "Meal Type",
      render: (value: unknown) => (
        <Badge variant="primary" size="sm">
          {MEAL_TYPES.find((t) => t.value === String(value))?.label}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Duration",
      render: (value: unknown, row: Record<string, unknown>) => {
        const plan = row as MealPlan;
        const startDate = value as Date;
        return (
          <div className="text-sm">
            <div>{new Date(startDate).toLocaleDateString()}</div>
            {plan.endDate && (
              <div className="text-xs text-gray-500">
                to {new Date(plan.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "weeklySchedule",
      label: "Schedule",
      render: (value: unknown) => {
        const schedule = value as DaySchedule[];
        return (
          <Badge variant="info" size="sm">
            {schedule.length} days
          </Badge>
        );
      },
    },
    {
      key: "cost",
      label: "Cost/Day",
      render: (value: unknown) =>
        value ? `₹${Number(value)}` : <span className="text-gray-400">-</span>,
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
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Meal Plans" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meal Plan Management</h1>
            <p className="text-gray-600 mt-1">Manage weekly meal schedules and nutrition plans</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(plans, "meal-plans.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Total Plans</p>
              <p className="text-4xl font-bold text-green-600">{totalPlans}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <Utensils className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium mb-2">Active Plans</p>
              <p className="text-4xl font-bold text-emerald-600">{activePlans}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-lime-50 to-lime-100 border border-lime-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lime-700 text-sm font-medium mb-2">Total Meals</p>
              <p className="text-4xl font-bold text-lime-600">{totalMeals}</p>
            </div>
            <div className="w-14 h-14 bg-lime-500 rounded-xl flex items-center justify-center">
              <Apple className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Meal Plans</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredPlans.length} {filteredPlans.length === 1 ? "plan" : "plans"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null);
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meal plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all appearance-none bg-white"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredPlans}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleEditPlan(row as MealPlan)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeletePlan((row as MealPlan)._id)}
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
          setEditingPlan(null);
        }}
        title={editingPlan ? "Edit Meal Plan" : "Create Meal Plan"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingPlan(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSavePlan} variant="primary">
              {editingPlan ? "Update" : "Create"} Plan
            </Button>
          </>
        }
      >
        <div className="space-y-5 mt-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
              {editingPlan ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingPlan ? "Edit Meal Plan" : "Create Meal Plan"}
            </h2>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Plan Information
            </h3>
            <div className="space-y-4">
              <Input
                label="Plan Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Weekly Lunch Plan, Monthly Breakfast Menu"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the meal plan..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all resize-none"
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all appearance-none bg-white"
                >
                  {MEAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="border-t pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Weekly Schedule
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDaySchedule(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">+ Add Day</option>
                {DAYS.filter((day) => !formData.weeklySchedule.some((d) => d.day === day)).map(
                  (day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-4">
              {formData.weeklySchedule.map((daySchedule, dayIdx) => (
                <div key={dayIdx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{daySchedule.day}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveDaySchedule(dayIdx)}
                      className="text-red-600 hover:bg-red-100 rounded p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {daySchedule.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex justify-end mb-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveMealItem(dayIdx, itemIdx)}
                            className="text-red-600 hover:bg-red-100 rounded p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Meal name *"
                            value={item.name}
                            onChange={(e) =>
                              handleMealItemChange(dayIdx, itemIdx, "name", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                          />
                          <input
                            type="text"
                            placeholder="Quantity (e.g., 200g)"
                            value={item.quantity}
                            onChange={(e) =>
                              handleMealItemChange(dayIdx, itemIdx, "quantity", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Nutrition info (e.g., Protein: 5g, Carbs: 30g)"
                          value={item.nutritionInfo || ""}
                          onChange={(e) =>
                            handleMealItemChange(dayIdx, itemIdx, "nutritionInfo", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={item.imageUrl || ""}
                          onChange={(e) =>
                            handleMealItemChange(dayIdx, itemIdx, "imageUrl", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
                        />
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Allergens</label>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.allergens.map((allergen, aIdx) => (
                              <span
                                key={aIdx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
                              >
                                {allergen}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllergen(dayIdx, itemIdx, aIdx)}
                                  className="hover:bg-red-200 rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Add allergen (press Enter)"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddAllergen(dayIdx, itemIdx, e.currentTarget.value);
                                e.currentTarget.value = "";
                              }
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddMealItem(dayIdx)}
                      className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-all w-full justify-center text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Meal Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor & Cost */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Vendor & Cost
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Vendor Name"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="Catering company name"
                  fullWidth
                />
                <Input
                  label="Vendor Contact"
                  name="vendorContact"
                  value={formData.vendorContact}
                  onChange={handleInputChange}
                  placeholder="Phone or email"
                  fullWidth
                />
              </div>
              <Input
                label="Cost per Day (₹)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleInputChange}
                placeholder="0"
                fullWidth
              />
            </div>
          </div>

          {/* Classes */}
          <div className="border-t pt-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Applicable Classes ({formData.classIds.length} selected)
            </label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {classes.map((cls) => (
                  <label
                    key={cls._id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.classIds.includes(cls._id)}
                      onChange={() => handleClassToggle(cls._id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-400"
                    />
                    <span className="text-sm text-gray-700">
                      {cls.name} - {cls.section}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}