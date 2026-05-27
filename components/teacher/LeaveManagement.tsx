"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/Table";
import Badge from "@/components/common/Badge";
import { showToast } from "@/lib/toast";
import { Calendar, FileText, CheckCircle2, Clock, Plus, Info } from "lucide-react";

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [quotas, setQuotas] = useState({ sick: 10, casual: 5, emergency: 3 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "holidays">("history");

  const [formData, setFormData] = useState({
    leaveType: "sick",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, settingsRes, holidaysRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/settings"),
        fetch("/api/events?type=holiday") // using existing events API for holidays
      ]);

      const leavesData = await leavesRes.json();
      const settingsData = await settingsRes.json();
      const holidaysData = await holidaysRes.json();

      if (leavesData.success) setLeaves(leavesData.leaves);
      if (settingsData.success && settingsData.settings?.leaveQuotas) {
        setQuotas(settingsData.settings.leaveQuotas);
      }
      if (holidaysData.success) setHolidays(holidaysData.events || []);
    } catch (error) {
      showToast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitLeave = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      showToast.error("Please fill in all required fields");
      return;
    }
    
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showToast.error("End date cannot be before start date");
      return;
    }

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showToast.success("Leave request submitted successfully");
        setModalOpen(false);
        setFormData({ leaveType: "sick", startDate: "", endDate: "", reason: "", attachment: "" });
        fetchData();
      } else {
        showToast.error(data.error || "Failed to submit leave request");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;

    try {
      const res = await fetch(`/api/leaves?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Leave request cancelled");
        fetchData();
      } else {
        showToast.error(data.error || "Failed to cancel leave");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const usedSick = leaves.filter(l => l.leaveType === "sick" && l.status === "approved").length;
  const usedCasual = leaves.filter(l => l.leaveType === "casual" && l.status === "approved").length;

  const columns = [
    {
      key: "leaveType",
      label: "Leave Type",
      render: (value: any) => <span className="capitalize font-medium">{String(value).replace("-", " ")}</span>,
    },
    {
      key: "startDate",
      label: "Duration",
      render: (_: any, row: any) => (
        <span className="text-sm">
          {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
        </span>
      ),
    },
    { key: "reason", label: "Reason", render: (value: any) => <span className="text-sm text-gray-600 truncate max-w-[200px] block">{String(value)}</span> },
    {
      key: "status",
      label: "Status",
      render: (value: any) => {
        const status = String(value);
        let color: "success" | "warning" | "error" | "default" = "default";
        if (status === "approved") color = "success";
        if (status === "pending") color = "warning";
        if (status === "rejected") color = "error";
        return <Badge variant={color} size="sm">{status.toUpperCase()}</Badge>;
      },
    },
    {
      key: "adminRemarks",
      label: "Remarks",
      render: (value: any) => <span className="text-xs text-gray-500 italic">{value ? String(value) : "-"}</span>,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your leave requests and view holidays.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Apply Leave
        </Button>
      </div>

      {/* Quota Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Sick Leaves (Used/Total)</p>
            <p className="text-2xl font-bold text-gray-800">{usedSick} <span className="text-lg text-gray-400">/ {quotas.sick}</span></p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
            <Info className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Casual Leaves (Used/Total)</p>
            <p className="text-2xl font-bold text-gray-800">{usedCasual} <span className="text-lg text-gray-400">/ {quotas.casual}</span></p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-800">{leaves.filter(l => l.status === "pending").length}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "history" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            My Leave History
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "holidays" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Holiday Calendar
          </button>
        </div>

        <div className="p-0">
          {activeTab === "history" ? (
            <Table
              columns={columns}
              data={leaves}
              loading={loading}
              actions={(row) => row.status === "pending" && (
                <button
                  onClick={() => handleCancelLeave(row._id)}
                  className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                >
                  Cancel
                </button>
              )}
            />
          ) : (
            <div className="p-6">
              {holidays.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming holidays scheduled.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {holidays.map((holiday, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="w-12 h-12 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs font-bold uppercase">{holiday.startDate ? new Date(holiday.startDate).toLocaleString('default', { month: 'short' }) : "-"}</span>
                        <span className="text-lg font-bold leading-none">{holiday.startDate ? new Date(holiday.startDate).getDate() || "-" : "-"}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{holiday.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{holiday.description || "School Holiday"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="half-day">Half Day</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date *" type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} fullWidth />
            <Input label="End Date *" type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} fullWidth />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-24"
              placeholder="Please provide a brief reason..."
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLeave}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
