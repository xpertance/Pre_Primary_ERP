"use client";
import React, { useState, useEffect } from "react";
import { Search, Eye, IndianRupee, AlertCircle, CheckCircle2, Clock, Filter, X, User, Phone, Mail, Calendar, MapPin } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import { showToast } from "@/lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

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
    updatedAt: string;
}

interface Class {
    _id: string;
    name: string;
    section: string;
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


export default function StudentFeeManagement() {

    const [students, setStudents] = useState<StudentFeeData[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    const [selectedStudent, setSelectedStudent] = useState<StudentFeeData | null>(null);
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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentData),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success("Payment recorded successfully");
                setShowPaymentModal(false);
                fetchStudentFees(); // Refresh data
                // Update selected student data locally to reflect changes immediately in modal
                if (selectedStudent) {
                    const updatedTransactions = selectedStudent.transactions.map((t) =>
                        t._id === selectedTransactionId
                            ? { ...t, ...data.transaction }
                            : t
                    );
                    setSelectedStudent({ ...selectedStudent, transactions: updatedTransactions });
                }
            } else {
                showToast.error(data.error || "Failed to record payment");
            }
        } catch (error) {
            console.error("Payment error:", error);
            showToast.error("Failed to record payment");
        }
    };

    const handleCreateTransaction = async () => {
        if (!selectedStudent) return;

        try {
            const res = await fetch("/api/fees/transactions/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: selectedStudent.student._id,
                    items: [{ head: transactionData.head, amount: Number(transactionData.amount) }],
                    dueDate: transactionData.dueDate,
                    note: transactionData.note,
                }),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success("Fee transaction created successfully");
                setShowTransactionModal(false);
                fetchStudentFees(); // Refresh data
                // Refresh modal data
                if (selectedStudent) {
                    const newTransaction = data.transaction;
                    setSelectedStudent({
                        ...selectedStudent,
                        transactions: [newTransaction, ...selectedStudent.transactions]
                    });
                }
            } else {
                showToast.error(data.error || "Failed to create transaction");
            }
        } catch (error) {
            console.error("Create transaction error:", error);
            showToast.error("Failed to create transaction");
        }
    };

    const handleDownloadReceipt = (transaction: FeeTransaction, student: Student) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(41, 128, 185);
        doc.text("Kidz Zone Pre Primary School", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Fee Receipt", 105, 30, { align: "center" });

        doc.setDrawColor(200);
        doc.line(10, 35, 200, 35);

        // Student Details
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Receipt Date: ${new Date().toLocaleDateString()}`, 150, 45);
        doc.text(`Receipt No: ${transaction._id.substring(0, 8).toUpperCase()}`, 150, 50);

        doc.text(`Student Name: ${student.firstName} ${student.lastName || ""}`, 15, 45);
        doc.text(`Admission No: ${student.admissionNo}`, 15, 50);
        doc.text(`Class: ${student.classId?.name || ""} ${student.classId?.section || ""}`, 15, 55);

        // Payment Details Table
        const tableData = transaction.items.map(item => [item.head, formatCurrency(item.amount)]);

        // Add totals
        tableData.push(["", ""]);
        tableData.push(["Total Amount", formatCurrency(transaction.items.reduce((sum, item) => sum + item.amount, 0))]);
        tableData.push(["Fine", formatCurrency(transaction.fineAmount)]);
        tableData.push(["Total Paid", formatCurrency(transaction.amountPaid)]);
        tableData.push(["Balance Due", formatCurrency(transaction.amountDue - transaction.amountPaid)]);

        autoTable(doc, {
            startY: 65,
            head: [["Fee Head", "Amount"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 60, halign: 'right' }
            }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text("Authorized Signatory", 150, finalY);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("This is a computer generated receipt.", 105, finalY + 20, { align: "center" });

        doc.save(`Receipt_${student.firstName}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    useEffect(() => {
        fetchClasses();
        fetchStudentFees();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/classes");
            const data = await res.json();
            if (data.success) {
                setClasses(data.classes || []);
            }
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        }
    };

    const fetchStudentFees = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/fees/student-summary");
            const data = await res.json();
            if (data.success) {
                setStudents(data.students || []);
            } else {
                showToast.error(data.error || "Failed to fetch student fees");
            }
        } catch (error) {
            showToast.error("Failed to fetch student fees");
        } finally {
            setLoading(false);
        }
    };

    const router = useRouter();

    const handleViewDetails = (studentData: StudentFeeData) => {
        router.push(`/dashboard/fees/${studentData.student._id}`);
    };

    const filteredStudents = students.filter((studentData) => {
        const student = studentData.student;
        const fullName = `${student.firstName} ${student.lastName || ""}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchTerm.toLowerCase()) ||
            student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass =
            selectedClass === "all" ||
            student.classId?._id === selectedClass;

        const matchesStatus =
            selectedStatus === "all" ||
            studentData.status === selectedStatus;

        return matchesSearch && matchesClass && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const variants: { [key: string]: "success" | "warning" | "danger" } = {
            paid: "success",
            partial: "warning",
            due: "danger",
        };
        return variants[status] || "info";
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalStats = {
        totalStudents: students.length,
        totalDue: students.reduce((sum, s) => sum + s.totalDue, 0),
        totalPaid: students.reduce((sum, s) => sum + s.totalPaid, 0),
        totalPending: students.reduce((sum, s) => sum + s.totalPending, 0),
        paidCount: students.filter((s) => s.status === "paid").length,
        partialCount: students.filter((s) => s.status === "partial").length,
        dueCount: students.filter((s) => s.status === "due").length,
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Student Fee Management</h1>
                <p className="text-gray-600 mt-1">Track and manage student fee payments</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-700 text-sm font-medium mb-2">Total Students</p>
                            <p className="text-4xl font-bold text-blue-600">{totalStats.totalStudents}</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-700 text-sm font-medium mb-2">Total Collected</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalPaid)}</p>
                        </div>
                        <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-700 text-sm font-medium mb-2">Total Pending</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalStats.totalPending)}</p>
                        </div>
                        <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-700 text-sm font-medium mb-2">Payment Status</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{totalStats.paidCount} Paid</span>
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{totalStats.partialCount} Partial</span>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{totalStats.dueCount} Due</span>
                            </div>
                        </div>
                        <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
                            <IndianRupee className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name, admission no, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                    </div>

                    {/* Class Filter */}
                    <div className="relative">
                        <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All Classes</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name} - Section {cls.section}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="due">Due</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Fee</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pending</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex items-center justify-center">
                                            <Clock className="w-6 h-6 animate-spin mr-2" />
                                            Loading student fees...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No students found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((studentData) => {
                                    const student = studentData.student;
                                    return (
                                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {student.firstName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800">
                                                            {student.firstName} {student.lastName || ""}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{student.admissionNo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-800">
                                                    {student.classId?.name || "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Section {student.classId?.section || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">
                                                    {formatCurrency(studentData.totalDue)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-green-600">
                                                    {formatCurrency(studentData.totalPaid)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`font-semibold ${studentData.totalPending < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {studentData.totalPending < 0
                                                        ? <span title="Overpaid — excess payment recorded">₹0 ✓</span>
                                                        : formatCurrency(studentData.totalPending)
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getStatusBadge(studentData.status)} size="sm">
                                                    {studentData.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleViewDetails(studentData)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
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
        </div >
    );
}
