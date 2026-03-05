"use client";
import React, { useState, useEffect } from "react";
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

interface Admission {
  _id: string;
  admissionNo?: string;
  childFirstName: string;
  childLastName?: string;
  dob?: Date;
  gender?: string;
  status: "submitted" | "pending" | "approved" | "rejected" | "enrolled";
  appliedByParentId?: string;
  admissionFeePaid: boolean;
  createdAt?: Date;
  [key: string]: unknown;
}

export default function AdmissionManagement() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admission/list");
      const data = await res.json();
      setAdmissions(data.admissions || []);
    } catch (error) {
      showToast.error("Failed to fetch admissions");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const endpoint =
        newStatus === "approved"
          ? `/api/admission/approve`
          : newStatus === "rejected"
            ? `/api/admission/reject`
            : null;
      if (!endpoint) return;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionId: id }),
      });
      if (res.ok) {
        showToast.success(`Admission ${newStatus}`);
        fetchAdmissions();
      }
    } catch (error) {
      showToast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: "success" | "warning" | "danger" | "info" | "gray" } = {
      submitted: "info",
      pending: "warning",
      approved: "success",
      rejected: "danger",
      enrolled: "success",
    };
    return colors[status] || "gray";
  };

  const filteredAdmissions = admissions.filter(
    (admission) =>
      (admission.childFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!statusFilter || admission.status === statusFilter)
  );

  const columns = [
    { key: "admissionNo", label: "Admission No." },
    { key: "childFirstName", label: "Child Name" },
    {
      key: "gender",
      label: "Gender",
      render: (value: unknown) => String(value || "-"),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown, row: Record<string, unknown>) => (
        <Badge variant={getStatusColor(String(value))} size="sm">
          {String(value).toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "admissionFeePaid",
      label: "Fee Paid",
      render: (value: unknown, row: Record<string, unknown>) => (
        <Badge variant={value ? "success" : "danger"} size="sm">
          {value ? "Yes" : "No"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admissions" }]} />
      <div className="mt-8 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admission Management</h1>
        <p className="text-gray-600 mt-2">Review and process admission applications</p>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card padding="md" shadow="sm">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600">{admissions.length}</div>
            <div className="text-gray-600 text-sm mt-1">Total Applications</div>
          </div>
        </Card>
        <Card padding="md" shadow="sm">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-600">
              {admissions.filter((a) => a.status === "submitted").length}
            </div>
            <div className="text-gray-600 text-sm mt-1">Submitted</div>
          </div>
        </Card>
        <Card padding="md" shadow="sm">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-600">
              {admissions.filter((a) => a.status === "pending").length}
            </div>
            <div className="text-gray-600 text-sm mt-1">Pending</div>
          </div>
        </Card>
        <Card padding="md" shadow="sm">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {admissions.filter((a) => a.status === "approved").length}
            </div>
            <div className="text-gray-600 text-sm mt-1">Approved</div>
          </div>
        </Card>
        <Card padding="md" shadow="sm">
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600">
              {admissions.filter((a) => a.status === "rejected").length}
            </div>
            <div className="text-gray-600 text-sm mt-1">Rejected</div>
          </div>
        </Card>
      </div>
      <Card className="mt-6" shadow="md">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name or application no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon="🔍"
              fullWidth
            />
            <Select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="enrolled">Enrolled</option>
            </Select>
          </div>
        </div>
        <div className="max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar">
          <Table
            columns={columns}
            data={filteredAdmissions}
            loading={loading}
            onRowClick={(row) => {
              setEditingAdmission(row as Admission);
              setModalOpen(true);
            }}
            actions={(row) => (
              <div className="flex gap-1">
                {(row as Admission).status === "submitted" && (
                  <>
                    <button
                      onClick={() => handleStatusChange((row as Admission)._id, "approved")}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange((row as Admission)._id, "rejected")}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setEditingAdmission(row as Admission);
                    setModalOpen(true);
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  View
                </button>
              </div>
            )}
          />
        </div>

      </Card>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAdmission(null);
        }}
        title="Application Details"
        size="lg"
      >
        {editingAdmission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">First Name</p>
                <p className="text-lg font-semibold">{editingAdmission.childFirstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Name</p>
                <p className="text-lg font-semibold">{editingAdmission.childLastName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="text-lg font-semibold">{editingAdmission.gender || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="text-lg font-semibold">
                  {editingAdmission.dob
                    ? new Date(editingAdmission.dob).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={getStatusColor(editingAdmission.status)}>
                {editingAdmission.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}