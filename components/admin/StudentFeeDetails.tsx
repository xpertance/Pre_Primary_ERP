"use client";
import React, { useState, useEffect } from "react";
import {
    User, Phone, Mail, Calendar, MapPin,
    DollarSign, AlertCircle, ArrowLeft,
    Download, Plus, CreditCard, Edit2, Trash2, UserCheck
} from "lucide-react";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Modal from "@/components/common/Modal";
import { showToast } from "@/lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

// Reuse interfaces
interface PaymentFormData {
    amountPaid: number;
    paymentMethod: string;
    paymentDate: string;
    note: string;
    fineAdjustment: number;
}

interface TransactionFormData {
    amount: number;
    head: string;
    dueDate: string;
    note: string;
}

interface Student {
    _id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    admissionNo?: string;
    classId?: {
        _id: string;
        name: string;
        section: string;
        teachers?: Array<{
            _id: string;
            name: string;
            email?: string;
            phone?: string;
        }>;
    };
    dob?: string;
    gender?: string;
    parents?: Array<{
        name: string;
        phone?: string;
        email?: string;
        relation?: string;
    }>;
    medical?: {
        allergies?: string[];
        notes?: string;
    };
    photo?: string;
}

interface FeeTransaction {
    _id: string;
    studentId: string;
    amountDue: number;
    amountPaid: number;
    fineAmount: number;
    status: "due" | "partial" | "paid";
    items: Array<{
        head: string;
        amount: number;
    }>;
    createdAt: string;
    dueDate?: string;
    note?: string;
    updatedAt: string;
}

interface StudentFeeData {
    student: Student;
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    totalFine: number;
    transactions: FeeTransaction[];
    status: "paid" | "partial" | "due";
}

export default function StudentFeeDetails({ studentId }: { studentId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<StudentFeeData | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    const [paymentData, setPaymentData] = useState<PaymentFormData>({
        amountPaid: 0,
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().split("T")[0],
        note: "",
        fineAdjustment: 0,
    });

    const [transactionData, setTransactionData] = useState<TransactionFormData>({
        amount: 0,
        head: "",
        dueDate: new Date().toISOString().split("T")[0],
        note: "",
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editTransactionData, setEditTransactionData] = useState<TransactionFormData>({
        amount: 0,
        head: "",
        dueDate: new Date().toISOString().split("T")[0],
        note: "",
    });
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

    useEffect(() => {
        fetchStudentDetails();
    }, [studentId]);

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            // We can reuse the summary endpoint but filter on client or ideally create a specific endpoint
            // For now, reusing the student-summary loop might be inefficient but works.
            // Better: update the endpoint to accept ?studentId or create a new one.
            // Let's assume we can fetch all and find, OR user the existing endpoint structure.
            // Actually, the previous code fetched ALL students. Let's do that for now to be safe, 
            // but in production we should optimize.

            const res = await fetch("/api/fees/student-summary");
            const data = await res.json();

            if (data.success) {
                const found = data.students.find((s: StudentFeeData) => s.student._id === studentId);
                if (found) {
                    setStudentData(found);
                } else {
                    showToast.error("Student not found");
                }
            } else {
                showToast.error(data.error || "Failed to fetch student details");
            }
        } catch (error) {
            console.error("Error fetching student details:", error);
            showToast.error("Failed to fetch student details");
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const variants: { [key: string]: "success" | "warning" | "danger" } = {
            paid: "success",
            partial: "warning",
            due: "danger",
        };
        return variants[status] || "info";
    };

    const handleOpenPaymentModal = (transactionId: string, amountDue: number, amountPaid: number) => {
        setSelectedTransactionId(transactionId);
        setPaymentData({
            ...paymentData,
            amountPaid: amountDue - amountPaid,
            fineAdjustment: 0,
            note: "",
        });
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async () => {
        if (!selectedTransactionId) return;

        try {
            const res = await fetch(`/api/fees/transactions/${selectedTransactionId}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success("Payment recorded successfully");
                setShowPaymentModal(false);
                fetchStudentDetails(); // Refresh Page Data
            } else {
                showToast.error(data.error || "Failed to record payment");
            }
        } catch (error) {
            console.error("Payment error:", error);
            showToast.error("Failed to record payment");
        }
    };

    const handleCreateTransaction = async () => {
        if (!studentData) return;

        try {
            const res = await fetch("/api/fees/transactions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: studentData.student._id,
                    items: [{ head: transactionData.head, amount: Number(transactionData.amount) }],
                    dueDate: transactionData.dueDate,
                    note: transactionData.note,
                }),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success("Fee transaction created successfully");
                setShowTransactionModal(false);
                fetchStudentDetails(); // Refresh Page Data
            } else {
                showToast.error(data.error || "Failed to create transaction");
            }
        } catch (error) {
            console.error("Create transaction error:", error);
            showToast.error("Failed to create transaction");
        }
    };

    const handleDeleteTransaction = async (transactionId: string, amountPaid: number) => {
        if (amountPaid > 0) {
            showToast.error("Cannot delete a transaction that has payments. Delete payments first.");
            return;
        }

        if (!confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/fees/transactions/${transactionId}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (data.success) {
                showToast.success("Transaction deleted successfully");
                fetchStudentDetails();
            } else {
                showToast.error(data.error || "Failed to delete transaction");
            }
        } catch (error) {
            console.error("Delete transaction error:", error);
            showToast.error("Failed to delete transaction");
        }
    };

    const handleOpenEditModal = (transaction: FeeTransaction) => {
        setEditingTransactionId(transaction._id);
        setEditTransactionData({
            amount: transaction.amountDue,
            head: transaction.items.map(i => i.head).join(", "),
            dueDate: transaction.dueDate
                ? new Date(transaction.dueDate).toISOString().split("T")[0]
                : new Date(transaction.createdAt).toISOString().split("T")[0],
            note: transaction.note || "",
        });
        setShowEditModal(true);
    };

    const handleUpdateTransaction = async () => {
        if (!editingTransactionId) return;

        try {
            const res = await fetch(`/api/fees/transactions/${editingTransactionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    note: editTransactionData.note,
                    dueDate: editTransactionData.dueDate,
                    // We are NOT sending items/amount implementation yet as per plan to keep it simple
                    // Backend supports it but frontend usage is complex for multi-head items.
                }),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success("Transaction updated successfully");
                setShowEditModal(false);
                fetchStudentDetails();
            } else {
                showToast.error(data.error || "Failed to update transaction");
            }
        } catch (error) {
            console.error("Update transaction error:", error);
            showToast.error("Failed to update transaction");
        }
    };

    const handleDownloadReceipt = (transaction: FeeTransaction) => {
        if (!studentData) return;
        const student = studentData.student;
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
        const margin = 14;
        const contentWidth = pageWidth - margin * 2; // 182mm

        // jsPDF built-in fonts (Helvetica etc.) do NOT support the ₹ Unicode character.
        // Using a plain ASCII formatter instead to avoid garbled output.
        const pdfCurrency = (amount: number) =>
            "Rs. " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);

        // ── Background watermark area (subtle) ──
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 297, "F");

        // ── Header Band ──
        doc.setFillColor(37, 99, 235); // blue-600
        doc.rect(0, 0, pageWidth, 38, "F");

        // School name
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("Pre-Primary ERP", margin, 14);

        // Receipt label on the right
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(186, 214, 255);
        doc.text("FEE RECEIPT", pageWidth - margin, 14, { align: "right" });

        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("School Management System", margin, 22);

        // Receipt number + date on right
        const receiptNo = `REC-${transaction._id.substring(0, 8).toUpperCase()}`;
        doc.setFontSize(9);
        doc.setTextColor(186, 214, 255);
        doc.text(`Receipt No: ${receiptNo}`, pageWidth - margin, 22, { align: "right" });
        doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageWidth - margin, 30, { align: "right" });

        // ── Student Info Section ──
        const infoY = 48;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, infoY - 4, contentWidth, 36, 3, 3, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, infoY - 4, contentWidth, 36, 3, 3, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("STUDENT", margin + 4, infoY + 2);

        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(`${student.firstName} ${student.lastName || ""}`, margin + 4, infoY + 12);

        // Mini pills row
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const admText = `Adm No: ${student.admissionNo || "N/A"}`;
        const classText = student.classId ? `Class: ${student.classId.name} - ${student.classId.section}` : "";
        const txDateText = `Transaction: ${new Date(transaction.createdAt).toLocaleDateString("en-IN")}`;
        const dueDateText = transaction.dueDate ? `Due: ${new Date(transaction.dueDate).toLocaleDateString("en-IN")}` : "";

        doc.text(admText, margin + 4, infoY + 22);
        if (classText) doc.text(classText, margin + 58, infoY + 22);
        doc.text(txDateText, margin + 4, infoY + 29);
        if (dueDateText) doc.text(dueDateText, margin + 58, infoY + 29);

        // Payment status badge (top right of the info card)
        const statusColors: Record<string, [number, number, number]> = {
            paid: [22, 163, 74],   // green-600
            partial: [217, 119, 6],   // amber-600
            due: [220, 38, 38],  // red-600
        };
        const [sr, sg, sb] = statusColors[transaction.status] || [100, 116, 139];
        doc.setFillColor(sr, sg, sb);
        const statusLabel = transaction.status.toUpperCase();
        const badgeW = 28;
        doc.roundedRect(pageWidth - margin - badgeW, infoY - 1, badgeW, 10, 2, 2, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(statusLabel, pageWidth - margin - badgeW / 2, infoY + 5.5, { align: "center" });

        // ── Fee Items Table ──
        const tableY = infoY + 40;
        const tableBody = transaction.items.map(item => [
            item.head,
            pdfCurrency(item.amount),
        ]);

        autoTable(doc, {
            startY: tableY,
            head: [["Fee Head / Description", "Amount (Rs.)"]],
            body: tableBody,
            theme: "striped",
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 9,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                textColor: [15, 23, 42],
                lineColor: [226, 232, 240],
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 9,
            },
            alternateRowStyles: {
                fillColor: [241, 245, 249],
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.70 },
                1: { cellWidth: contentWidth * 0.30, halign: "right" },
            },
        });

        // ── Summary Box ──
        const summaryY = (doc as any).lastAutoTable.finalY + 6;
        const summaryBoxW = 80;
        const summaryBoxX = pageWidth - margin - summaryBoxW;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(summaryBoxX, summaryY, summaryBoxW, 52, 3, 3, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(summaryBoxX, summaryY, summaryBoxW, 52, 3, 3, "S");

        const summaryRows: [string, string, boolean][] = [
            ["Subtotal", pdfCurrency(transaction.items.reduce((s, i) => s + i.amount, 0)), false],
            ["Fine / Penalty", pdfCurrency(transaction.fineAmount), false],
            ["Total Due", pdfCurrency(transaction.amountDue), false],
            ["Amount Paid", pdfCurrency(transaction.amountPaid), true],
            ["Balance", pdfCurrency(transaction.amountDue - transaction.amountPaid), false],
        ];

        doc.setFont("helvetica", "normal");
        summaryRows.forEach(([label, value, highlight], i) => {
            const rowY = summaryY + 8 + i * 9;
            if (highlight) {
                doc.setFillColor(240, 253, 244); // green tint
                doc.rect(summaryBoxX + 1, rowY - 5, summaryBoxW - 2, 9, "F");
            }
            doc.setFontSize(8.5);
            doc.setTextColor(highlight ? 22 : 71, highlight ? 163 : 85, highlight ? 74 : 105);
            doc.setFont("helvetica", highlight ? "bold" : "normal");
            doc.text(label, summaryBoxX + 4, rowY);
            doc.text(value, summaryBoxX + summaryBoxW - 4, rowY, { align: "right" });
        });

        // Divider line above Balance
        const divY = summaryY + 8 + 3 * 9 - 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(summaryBoxX + 3, divY, summaryBoxX + summaryBoxW - 3, divY);

        // ── Note block (if any) ──
        const noteY = summaryY + 6;
        const noteText = (transaction as any).note;
        if (noteText) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 116, 139);
            doc.text(`Note: ${noteText}`, margin, noteY, { maxWidth: summaryBoxX - margin - 6 });
        }

        // ── Signature line ──
        const sigY = summaryY + 62;
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.4);
        doc.line(pageWidth - margin - 55, sigY, pageWidth - margin, sigY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Authorized Signatory", pageWidth - margin - 27.5, sigY + 5, { align: "center" });

        // ── Footer strip ──
        const footerY = 280;
        doc.setFillColor(37, 99, 235);
        doc.setFillColor(241, 245, 249);
        doc.rect(0, footerY, pageWidth, 17, "F");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("This is a computer-generated receipt and does not require a physical signature.", pageWidth / 2, footerY + 6, { align: "center" });
        doc.text(`Generated on ${new Date().toLocaleString("en-IN")}   |   ${receiptNo}`, pageWidth / 2, footerY + 12, { align: "center" });

        // ── Save ──
        doc.save(`Fee_Receipt_${student.firstName}_${receiptNo}.pdf`);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-700">Student not found</h3>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const { student } = studentData;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Student Fee Details</h1>
                    <p className="text-gray-500 text-sm">View fees, payments, and history</p>
                </div>
            </div>

            {/* ── Profile Banner ── */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-sm mb-6 overflow-hidden">
                {/* Name + badges row inside the gradient */}
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-tight">
                            {student.firstName} {student.lastName || ""}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {student.classId && (
                                <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
                                    {student.classId.name} — Sec {student.classId.section}
                                </span>
                            )}
                            {student.admissionNo && (
                                <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full border border-white/30">
                                    Adm #{student.admissionNo}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Info pills — readable on right with contrast background */}
                    <div className="flex flex-wrap gap-2">
                        {student.dob && (
                            <div className="flex items-center gap-1.5 bg-black/25 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                <Calendar className="w-3.5 h-3.5 text-white" />
                                <span>{new Date(student.dob).toLocaleDateString()}</span>
                            </div>
                        )}
                        {student.gender && (
                            <div className="flex items-center gap-1.5 bg-black/25 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                <User className="w-3.5 h-3.5 text-white" />
                                <span className="capitalize">{student.gender}</span>
                            </div>
                        )}
                        {student.email && (
                            <div className="flex items-center gap-1.5 bg-black/25 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                <Mail className="w-3.5 h-3.5 text-white" />
                                <span className="truncate max-w-[200px]" title={student.email}>{student.email}</span>
                            </div>
                        )}
                        {/* Class Teacher Display */}
                        {student.classId?.teachers && student.classId.teachers.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                                <UserCheck className="w-3.5 h-3.5 text-white" />
                                <span>Class Teacher: {student.classId.teachers.map(t => t.name).join(", ")}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Fee Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
                    <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Total Fees Due</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(studentData.totalDue)}</h3>
                    <p className="text-blue-200 text-xs mt-2">Across all transactions</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-md">
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide mb-1">Total Paid</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(studentData.totalPaid)}</h3>
                    <p className="text-emerald-200 text-xs mt-2">
                        {studentData.totalDue > 0 ? Math.round((studentData.totalPaid / studentData.totalDue) * 100) : 0}% of total
                    </p>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-md">
                    <p className="text-rose-100 text-xs font-medium uppercase tracking-wide mb-1">Total Pending</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(studentData.totalPending)}</h3>
                    <p className="text-rose-200 text-xs mt-2">Remaining balance</p>
                </div>
            </div>

            {/* ── Parents & Medical Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Parents */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-500" />
                        </span>
                        Parent Details
                    </h3>
                    {student.parents && student.parents.length > 0 ? (
                        <div className="space-y-3">
                            {student.parents.map((parent, idx) => (
                                <div key={idx} className="flex justify-between items-start bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{parent.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{parent.relation}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                        {parent.phone && <p className="text-gray-600 font-medium">{parent.phone}</p>}
                                        {parent.email && <p className="text-gray-400 mt-0.5">{parent.email}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No parent details available</p>
                    )}
                </div>

                {/* Medical */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        </span>
                        Medical Info
                    </h3>
                    {student.medical ? (
                        <div className="space-y-3">
                            {student.medical.allergies && student.medical.allergies.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Allergies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {student.medical.allergies.map((allergy, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
                                                {allergy}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {student.medical.notes ? (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 font-medium">Notes</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100">{student.medical.notes}</p>
                                </div>
                            ) : !student.medical.allergies?.length && (
                                <p className="text-gray-400 text-sm">No medical information on record</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No medical information</p>
                    )}
                </div>
            </div>

            {/* Transactions Section */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
                        <p className="text-gray-500 text-sm">Manage fee transactions and payments</p>
                    </div>
                    <Button onClick={() => setShowTransactionModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Transaction
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    {studentData.transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No transactions found. Create one to get started.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fee Heads</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amount Due</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Paid</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Pending</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {studentData.transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                            <div className="text-xs text-gray-400 mt-1">
                                                Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : new Date(t.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {t.items.map((item, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 border border-gray-200">
                                                        {item.head}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-800">
                                            {formatCurrency(t.amountDue)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-green-600 font-medium">
                                            {formatCurrency(t.amountPaid)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-600 font-medium">
                                            {formatCurrency(t.amountDue - t.amountPaid)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={getStatusBadge(t.status)} size="sm">
                                                {t.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {t.status !== 'paid' && (
                                                    <button
                                                        onClick={() => handleOpenPaymentModal(t._id, t.amountDue, t.amountPaid)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Record Payment"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadReceipt(t)}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Download Receipt"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEditModal(t)}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Edit Transaction"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                {t.amountPaid === 0 && (
                                                    <button
                                                        onClick={() => handleDeleteTransaction(t._id, t.amountPaid)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Record Fee Payment"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Paid
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={paymentData.amountPaid}
                                onChange={(e) => setPaymentData({ ...paymentData, amountPaid: Number(e.target.value) })}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                        </label>
                        <select
                            value={paymentData.paymentMethod}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                            <option value="cash">Cash</option>
                            <option value="online">Online Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="card">Card</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Date
                        </label>
                        <input
                            type="date"
                            value={paymentData.paymentDate}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={paymentData.note}
                            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            rows={3}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPaymentModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRecordPayment}>
                            Record Payment
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Create Transaction Modal */}
            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                title="Create Fee Transaction"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fee Head
                        </label>
                        <input
                            type="text"
                            value={transactionData.head}
                            onChange={(e) => setTransactionData({ ...transactionData, head: e.target.value })}
                            placeholder="e.g. Tuition Fee, Transport Fee"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={transactionData.amount}
                                onChange={(e) => setTransactionData({ ...transactionData, amount: Number(e.target.value) })}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={transactionData.dueDate}
                            onChange={(e) => setTransactionData({ ...transactionData, dueDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={transactionData.note}
                            onChange={(e) => setTransactionData({ ...transactionData, note: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            rows={3}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setShowTransactionModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTransaction}>
                            Create Transaction
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Edit Transaction Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Transaction"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100">
                        Note: You can currently only edit the Note and Due Date.
                        To change the amount, please delete and recreate the transaction (if no payments made).
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fee Heads/Items (Read Only)
                        </label>
                        <input
                            type="text"
                            value={editTransactionData.head}
                            disabled
                            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Due (Read Only)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={editTransactionData.amount}
                                disabled
                                className="w-full pl-8 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={editTransactionData.dueDate}
                            onChange={(e) => setEditTransactionData({ ...editTransactionData, dueDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={editTransactionData.note}
                            onChange={(e) => setEditTransactionData({ ...editTransactionData, note: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            rows={3}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateTransaction}>
                            Update Transaction
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
