"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/Table";
import Badge from "@/components/common/Badge";
import { showToast } from "@/lib/toast";
import { Users, FileText, CheckCircle2, Clock, Check, X, Settings } from "lucide-react";

export default function AdminLeaveManagement() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [quotas, setQuotas] = useState({ sick: 10, casual: 5, emergency: 3 });
  const [loading, setLoading] = useState(true);
  
  const [actionModal, setActionModal] = useState<{ open: boolean; type: "approve" | "reject"; leave: any }>({ open: false, type: "approve", leave: null });
  const [adminRemarks, setAdminRemarks] = useState("");
  
  const [substituteModal, setSubstituteModal] = useState<{ open: boolean; leave: any }>({ open: false, leave: null });
  const [subFormData, setSubFormData] = useState({ classId: "", subject: "", substituteTeacherId: "", date: "", startTime: "09:00", endTime: "10:00" });

  const [settingsModal, setSettingsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, teachersRes, classesRes, settingsRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/teachers"),
        fetch("/api/classes"),
        fetch("/api/settings")
      ]);

      const leavesData = await leavesRes.json();
      const teachersData = await teachersRes.json();
      const classesData = await classesRes.json();
      const settingsData = await settingsRes.json();

      if (leavesData.success) setLeaves(leavesData.leaves);
      if (teachersData.success) setTeachers(teachersData.teachers || teachersData.data || []);
      if (classesData.success) setClasses(classesData.classes || classesData.data || []);
      if (settingsData.success && settingsData.settings?.leaveQuotas) {
        setQuotas(settingsData.settings.leaveQuotas);
      }
    } catch (error) {
      showToast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!actionModal.leave) return;
    try {
      const res = await fetch("/api/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionModal.leave._id,
          status: actionModal.type === "approve" ? "approved" : "rejected",
          adminRemarks
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast.success(`Leave ${actionModal.type}d successfully`);
        setActionModal({ open: false, type: "approve", leave: null });
        setAdminRemarks("");
        fetchData();
      } else {
        showToast.error(data.error || "Failed to update leave status");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const handleAssignSubstitute = async () => {
    if (!substituteModal.leave) return;
    try {
      const res = await fetch("/api/substitutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subFormData,
          leaveId: substituteModal.leave._id,
          originalTeacherId: substituteModal.leave.teacherId._id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast.success("Substitute assigned successfully");
        setSubstituteModal({ open: false, leave: null });
      } else {
        showToast.error(data.error || "Failed to assign substitute");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const handleUpdateQuotas = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveQuotas: quotas }),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success("Leave quotas updated successfully");
        setSettingsModal(false);
      }
    } catch (error) {
      showToast.error("Failed to update quotas");
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === "pending").length;
  const approvedLeaves = leaves.filter(l => l.status === "approved").length;
  const today = new Date();
  today.setHours(0,0,0,0);
  const onLeaveToday = leaves.filter(l => 
    l.status === "approved" && 
    new Date(l.startDate) <= today && 
    new Date(l.endDate) >= today
  ).length;

  const columns = [
    {
      key: "teacherId",
      label: "Teacher",
      render: (value: any) => <div className="font-medium text-gray-800">{value?.name || "Unknown"}</div>,
    },
    {
      key: "leaveType",
      label: "Leave Type",
      render: (value: any) => <span className="capitalize text-sm">{String(value).replace("-", " ")}</span>,
    },
    {
      key: "startDate",
      label: "Duration",
      render: (_: any, row: any) => (
        <span className="text-sm">
          {new Date(row.startDate).toLocaleDateString()} to {new Date(row.endDate).toLocaleDateString()}
        </span>
      ),
    },
    { key: "reason", label: "Reason", render: (value: any) => <span className="text-sm text-gray-600 truncate max-w-[200px] block" title={value}>{String(value)}</span> },
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
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leave Approvals & Substitutes</h1>
          <p className="text-gray-600 mt-1">Manage teacher leaves and assign substitute classes.</p>
        </div>
        <Button onClick={() => setSettingsModal(true)} variant="secondary" className="flex items-center gap-2">
          <Settings className="w-4 h-4" /> Global Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-indigo-700 font-medium mb-1">On Leave Today</p>
              <p className="text-3xl font-bold text-indigo-800">{onLeaveToday}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-yellow-700 font-medium mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-800">{pendingLeaves}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-700 font-medium mb-1">Total Approved</p>
              <p className="text-3xl font-bold text-green-800">{approvedLeaves}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Requests</h2>
        <Table
          columns={columns}
          data={leaves}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              {row.status === "pending" && (
                <>
                  <button onClick={() => setActionModal({ open: true, type: "approve", leave: row })} className="p-1.5 text-green-600 bg-green-50 rounded hover:bg-green-100" title="Approve">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActionModal({ open: true, type: "reject", leave: row })} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100" title="Reject">
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {row.status === "approved" && (
                <button 
                  onClick={() => {
                    setSubFormData({ ...subFormData, date: new Date(row.startDate).toISOString().split('T')[0] });
                    setSubstituteModal({ open: true, leave: row });
                  }} 
                  className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                >
                  Assign Substitute
                </button>
              )}
            </div>
          )}
        />
      </div>

      {/* Action Modal (Approve/Reject) */}
      <Modal isOpen={actionModal.open} onClose={() => setActionModal({ ...actionModal, open: false })} title={`${actionModal.type === "approve" ? "Approve" : "Reject"} Leave Request`}>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to <strong>{actionModal.type}</strong> the leave request for {actionModal.leave?.teacherId?.name}?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Remarks (Optional)</label>
            <textarea
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-20"
              placeholder="Add any comments here..."
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setActionModal({ ...actionModal, open: false })}>Cancel</Button>
            <Button onClick={handleUpdateStatus} className={actionModal.type === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}>
              Confirm {actionModal.type === "approve" ? "Approval" : "Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Substitute Modal */}
      <Modal isOpen={substituteModal.open} onClose={() => setSubstituteModal({ open: false, leave: null })} title="Assign Substitute Teacher">
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Assigning substitute for <strong>{substituteModal.leave?.teacherId?.name}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={subFormData.date} onChange={(e) => setSubFormData({...subFormData, date: e.target.value})} fullWidth />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                value={subFormData.classId}
                onChange={(e) => setSubFormData({...subFormData, classId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-sm"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time *" type="time" value={subFormData.startTime} onChange={(e) => setSubFormData({...subFormData, startTime: e.target.value})} fullWidth />
            <Input label="End Time *" type="time" value={subFormData.endTime} onChange={(e) => setSubFormData({...subFormData, endTime: e.target.value})} fullWidth />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subject *" placeholder="e.g. Mathematics" value={subFormData.subject} onChange={(e) => setSubFormData({...subFormData, subject: e.target.value})} fullWidth />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Substitute Teacher *</label>
              <select
                value={subFormData.substituteTeacherId}
                onChange={(e) => setSubFormData({...subFormData, substituteTeacherId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-sm"
              >
                <option value="">Select Teacher</option>
                {teachers.filter(t => t._id !== substituteModal.leave?.teacherId?._id).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSubstituteModal({ open: false, leave: null })}>Cancel</Button>
            <Button onClick={handleAssignSubstitute}>Assign Substitute</Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="Global Leave Settings">
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600 mb-4">Set the total annual leave limits for all teachers.</p>
          <div className="grid gap-4">
            <Input 
              label="Total Sick Leaves" 
              type="number" 
              value={quotas.sick} 
              onChange={(e) => setQuotas({...quotas, sick: parseInt(e.target.value) || 0})} 
              fullWidth 
            />
            <Input 
              label="Total Casual Leaves" 
              type="number" 
              value={quotas.casual} 
              onChange={(e) => setQuotas({...quotas, casual: parseInt(e.target.value) || 0})} 
              fullWidth 
            />
            <Input 
              label="Total Emergency Leaves" 
              type="number" 
              value={quotas.emergency} 
              onChange={(e) => setQuotas({...quotas, emergency: parseInt(e.target.value) || 0})} 
              fullWidth 
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSettingsModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateQuotas}>Save Settings</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
