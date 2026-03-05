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
  Bus,
  MapPin,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  Users,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  User,
} from "lucide-react";

interface Stop {
  stopName: string;
  location: string;
  pickupTime: string;
  dropTime: string;
  sequence: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Driver {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

interface TransportRoute {
  _id: string;
  routeName: string;
  routeCode?: string;
  description?: string;
  driverId?: Driver;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleType: "bus" | "van" | "auto";
  capacity?: number;
  stops: Stop[];
  students: Student[];
  status: "active" | "inactive" | "maintenance";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown; // Added index signature
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

const VEHICLE_TYPES = [
  { value: "bus", label: "Bus" },
  { value: "van", label: "Van" },
  { value: "auto", label: "Auto" },
];

export default function TransportManagement() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);

  const [formData, setFormData] = useState<{
    routeName: string;
    routeCode: string;
    description: string;
    driverId: string;
    driverName: string;
    driverPhone: string;
    vehicleNumber: string;
    vehicleType: "bus" | "van" | "auto";
    capacity: number;
    stops: Stop[];
    students: string[];
    status: "active" | "inactive" | "maintenance";
    isActive: boolean;
  }>({
    routeName: "",
    routeCode: "",
    description: "",
    driverId: "",
    driverName: "",
    driverPhone: "",
    vehicleNumber: "",
    vehicleType: "bus",
    capacity: 0,
    stops: [],
    students: [],
    status: "active",
    isActive: true,
  });

  useEffect(() => {
    fetchRoutes();
    fetchStudents();
  }, [statusFilter]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/transport?status=${statusFilter}`);
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (error) {
      showToast.error("Failed to fetch routes");
    } finally {
      setLoading(false);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Phone-only handler: strips non-digits, caps at 10 characters
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, driverPhone: digits }));
  };


  const handleAddStop = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          stopName: "",
          location: "",
          pickupTime: "07:30",
          dropTime: "15:30",
          sequence: prev.stops.length + 1,
          coordinates: { lat: 0, lng: 0 },
        },
      ],
    }));
  };

  const handleStopChange = (index: number, field: keyof Stop, value: any) => {
    const updatedStops = [...formData.stops];
    if (field === "coordinates") {
      updatedStops[index] = { ...updatedStops[index], coordinates: value };
    } else {
      updatedStops[index] = { ...updatedStops[index], [field]: value };
    }
    setFormData((prev) => ({ ...prev, stops: updatedStops }));
  };

  const handleRemoveStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops
        .filter((_, i) => i !== index)
        .map((stop, idx) => ({
          ...stop,
          sequence: idx + 1,
        })),
    }));
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter((id) => id !== studentId)
        : [...prev.students, studentId],
    }));
  };

  const handleSaveRoute = async () => {
    if (!formData.routeName) {
      showToast.error("Route name is required");
      return;
    }

    try {
      const method = editingRoute ? "PUT" : "POST";
      const url = "/api/transport";

      const payload = editingRoute ? { id: editingRoute._id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.error || "Failed to save route");
        return;
      }

      showToast.success(`Route ${editingRoute ? "updated" : "created"} successfully`);
      setModalOpen(false);
      setEditingRoute(null);
      resetForm();
      fetchRoutes();
    } catch (error) {
      showToast.error("Failed to save route");
    }
  };

  const resetForm = () => {
    setFormData({
      routeName: "",
      routeCode: "",
      description: "",
      driverId: "",
      driverName: "",
      driverPhone: "",
      vehicleNumber: "",
      vehicleType: "bus",
      capacity: 0,
      stops: [],
      students: [],
      status: "active",
      isActive: true,
    });
  };

  const handleEditRoute = (route: TransportRoute) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      routeCode: route.routeCode || "",
      description: route.description || "",
      driverId: route.driverId?._id || "",
      driverName: route.driverName || "",
      driverPhone: route.driverPhone || "",
      vehicleNumber: route.vehicleNumber || "",
      vehicleType: route.vehicleType,
      capacity: route.capacity || 0,
      stops: route.stops,
      students: route.students.map((s) => s._id),
      status: route.status,
      isActive: route.isActive,
    });
    setModalOpen(true);
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    try {
      const res = await fetch(`/api/transport?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Route deleted successfully");
        fetchRoutes();
      }
    } catch (error) {
      showToast.error("Failed to delete route");
    }
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.routeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.status === "active").length;
  const totalStudents = routes.reduce((sum, r) => sum + r.students.length, 0);
  const totalCapacity = routes.reduce((sum, r) => sum + (r.capacity || 0), 0);

  const getStatusColor = (
    status: string
  ): "success" | "danger" | "warning" => {
    const colors: { [key: string]: "success" | "danger" | "warning" } = {
      active: "success",
      inactive: "danger",
      maintenance: "warning",
    };
    return colors[status] || "info";
  };

  const getVehicleIcon = (type: string) => {
    return <Bus className="w-4 h-4" />;
  };

  const columns: Column[] = [
    {
      key: "routeName",
      label: "Route",
      render: (value: unknown, row: Record<string, unknown>) => {
        const route = row as TransportRoute;
        return (
          <div>
            <div className="font-semibold text-gray-800">{String(value)}</div>
            {route.routeCode && (
              <div className="text-xs text-gray-500 mt-0.5">Code: {route.routeCode}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "vehicleType",
      label: "Vehicle",
      render: (value: unknown, row: Record<string, unknown>) => {
        const route = row as TransportRoute;
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              {getVehicleIcon(String(value))}
              <span className="capitalize font-medium">{String(value)}</span>
            </div>
            {route.vehicleNumber && (
              <div className="text-xs text-gray-500 mt-0.5">{route.vehicleNumber}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "driverName",
      label: "Driver",
      render: (value: unknown, row: Record<string, unknown>) => {
        const route = row as TransportRoute;
        return (
          <div className="text-sm">
            {value ? (
              <>
                <div className="font-medium text-gray-800">{String(value)}</div>
                {route.driverPhone && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {route.driverPhone}
                  </div>
                )}
              </>
            ) : (
              <span className="text-gray-400">Not assigned</span>
            )}
          </div>
        );
      },
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (value: unknown, row: Record<string, unknown>) => {
        const route = row as TransportRoute;
        return (
          <div className="text-sm">
            <span className="font-medium">{route.students.length}</span> / {Number(value) || 0}
          </div>
        );
      },
    },
    {
      key: "stops",
      label: "Stops",
      render: (value: unknown) => {
        const stops = value as Stop[];
        return (
          <Badge variant="primary" size="sm">
            {stops.length} stops
          </Badge>
        );
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
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transport" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transport Management</h1>
            <p className="text-gray-600 mt-1">Manage transport routes, vehicles, and student assignments</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV(routes, "transport-routes.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Total Routes</p>
              <p className="text-4xl font-bold text-blue-600">{totalRoutes}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <Bus className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Active Routes</p>
              <p className="text-4xl font-bold text-green-600">{activeRoutes}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Students</p>
              <p className="text-4xl font-bold text-purple-600">{totalStudents}</p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-2">Total Capacity</p>
              <p className="text-4xl font-bold text-orange-600">{totalCapacity}</p>
            </div>
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <Navigation className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Routes</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredRoutes.length} {filteredRoutes.length === 1 ? "route" : "routes"} found
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRoute(null);
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Route
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by route name, code, or vehicle number..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredRoutes}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleEditRoute(row as TransportRoute)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteRoute((row as TransportRoute)._id)}
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
          setEditingRoute(null);
        }}
        title={editingRoute ? "Edit Route" : "Create Route"}
        size="lg"
        footer={
          <>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingRoute(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRoute} variant="primary">
              {editingRoute ? "Update" : "Create"} Route
            </Button>
          </>
        }
      >
        <div className="space-y-0 mt-2 max-h-[72vh] overflow-y-auto pr-1 custom-scrollbar">

          {/* ── Basic Information ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bus className="w-4 h-4" />
              Route Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Route Name *"
                  name="routeName"
                  value={formData.routeName}
                  onChange={handleInputChange}
                  placeholder="e.g., Route A, North Route"
                  fullWidth
                />
                <Input
                  label="Route Code"
                  name="routeCode"
                  value={formData.routeCode}
                  onChange={handleInputChange}
                  placeholder="e.g., RT-001"
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the route trajectory..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* ── Vehicle Information ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Vehicle Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-white text-sm"
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Vehicle Number"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., MH-12-AB-1234"
                  fullWidth
                />
                <Input
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="30"
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* ── Driver Information ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Driver Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Driver Name"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  placeholder="Enter driver name"
                  fullWidth
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Driver Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="driverPhone"
                      value={formData.driverPhone}
                      onChange={handlePhoneChange}
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all pr-14 text-sm font-medium"
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums ${formData.driverPhone.length === 10 ? "text-green-500" : "text-gray-400"}`}>
                      {formData.driverPhone.length}/10
                    </span>
                  </div>
                  {formData.driverPhone.length > 0 && formData.driverPhone.length < 10 && (
                    <p className="text-[10px] text-amber-500 mt-1 font-medium">10 digits required</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Route Stops ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Route Stops
            </h3>
            <div className="space-y-4">
              {formData.stops.map((stop, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group"
                >
                  <div className="absolute -left-2 top-4 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                    {stop.sequence}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(idx)}
                    className="absolute top-3 right-3 p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="ml-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Stop Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Central Park"
                          value={stop.stopName}
                          onChange={(e) => handleStopChange(idx, "stopName", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Location</label>
                        <input
                          type="text"
                          placeholder="Street/Area"
                          value={stop.location}
                          onChange={(e) => handleStopChange(idx, "location", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pickup Time
                        </label>
                        <input
                          type="time"
                          value={stop.pickupTime}
                          onChange={(e) => handleStopChange(idx, "pickupTime", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Drop Time
                        </label>
                        <input
                          type="time"
                          value={stop.dropTime}
                          onChange={(e) => handleStopChange(idx, "dropTime", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddStop}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Stop Point
              </button>
            </div>
          </div>

          {/* ── Student Assignment ── */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assigned Students
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {formData.students.length} selected
              </span>
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                {students.length > 0 ? (
                  students.map((student) => (
                    <label
                      key={student._id}
                      className={`flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors ${formData.students.includes(student._id) ? "bg-blue-50/50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.students.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-400 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {student.firstName} {student.lastName}
                        </div>
                        {student.admissionNo && (
                          <div className="text-[10px] font-bold text-gray-400 uppercase">
                            ID: {student.admissionNo}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm italic">
                    No students found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Status & Activation ── */}
          <div className="p-5 pb-8">
            <div className="grid grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Service Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-white text-sm font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${formData.isActive ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${formData.isActive ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}>
                    Route Active
                  </label>
                  <p className="text-[10px] text-gray-400 font-medium">Toggle visibility in student profiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}