"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { showToast } from "@/lib/toast";

interface FeeHead {
    _id: string;
    name: string;
    type: "recurring" | "one-time" | "optional" | "transport";
    defaultAmount: number;
    description?: string;
    active: boolean;
}

export default function FeeHeadManagement() {
    const [heads, setHeads] = useState<FeeHead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingHead, setEditingHead] = useState<FeeHead | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        type: "recurring",
        defaultAmount: 0,
        description: "",
    });

    useEffect(() => {
        fetchHeads();
    }, []);

    const fetchHeads = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/fees/heads");
            const data = await res.json();
            if (data.success) {
                setHeads(data.heads);
            } else {
                showToast.error(data.error || "Failed to fetch fee heads");
            }
        } catch (error) {
            console.error(error);
            showToast.error("Failed to fetch fee heads");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (head?: FeeHead) => {
        if (head) {
            setEditingHead(head);
            setFormData({
                name: head.name,
                type: head.type,
                defaultAmount: head.defaultAmount,
                description: head.description || "",
            });
        } else {
            setEditingHead(null);
            setFormData({
                name: "",
                type: "recurring",
                defaultAmount: 0,
                description: "",
            });
        }
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to deactivate this fee head?")) return;
        try {
            const res = await fetch(`/api/fees/heads/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast.success("Fee head deactivated");
                fetchHeads();
            } else {
                showToast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            showToast.error("Failed to delete");
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            showToast.error("Name is required");
            return;
        }

        try {
            const url = editingHead ? `/api/fees/heads/${editingHead._id}` : "/api/fees/heads";
            const method = editingHead ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success(editingHead ? "Updated successfully" : "Created successfully");
                setShowModal(false);
                fetchHeads();
            } else {
                showToast.error(data.error || "Operation failed");
            }
        } catch (error) {
            console.error(error);
            showToast.error("Operation failed");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Fee Heads Master</h2>
                    <p className="text-sm text-gray-500">Manage standard fee categories</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Fee Head
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Default Amount</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                        ) : heads.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No fee heads found. Create one.</td></tr>
                        ) : (
                            heads.map((head) => (
                                <tr key={head._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-800">{head.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{head.type}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">₹{head.defaultAmount}</td>
                                    <td className="px-6 py-4">
                                        {head.active ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(head)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(head._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingHead ? "Edit Fee Head" : "Add Fee Head"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Tuition Fee"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="recurring">Recurring (Monthly/Term)</option>
                            <option value="one-time">One-Time (Admission)</option>
                            <option value="transport">Transport</option>
                            <option value="optional">Optional</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Amount (₹)</label>
                        <input
                            type="number"
                            value={formData.defaultAmount}
                            onChange={(e) => setFormData({ ...formData, defaultAmount: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingHead ? "Update" : "Create"}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
