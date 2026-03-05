"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/common/Card";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Badge from "@/components/common/Badge";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  School,
  FileText,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAdmissions: number;
  pendingAdmissions: number;
  totalAttendance: number;
  totalFees: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAdmissions: 0,
    pendingAdmissions: 0,
    totalAttendance: 0,
    totalFees: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];

        const [students, teachers, classes, feeSummary, attendance, admissionsList] = await Promise.all([
          fetch("/api/students?limit=500").then((r) => r.json()),
          fetch("/api/teachers").then((r) => r.json()),
          fetch("/api/classes").then((r) => r.json()),
          fetch("/api/fees/summary").then((r) => r.json()),
          fetch(`/api/attendance?startDate=${startOfMonth}&endDate=${today}&limit=1`).then((r) => r.json()),
          fetch("/api/admission/list").then((r) => r.json()),
        ]);

        // Calculate new student admissions (joined in current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const newAdmissions = students?.students?.filter((s: any) => {
          if (!s.admissionDate && !s.createdAt) return false;
          const date = new Date(s.admissionDate || s.createdAt);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length || 0;

        // Pending applications awaiting approval
        const allAdmissionsArr = admissionsList?.admissions || [];
        const pendingCount = allAdmissionsArr.filter((a: any) => a.status === 'submitted' || a.status === 'pending').length;

        setStats({
          totalStudents: students?.students?.length ?? students?.total ?? 0,
          totalTeachers: teachers?.teachers?.length ?? teachers?.data?.length ?? 0,
          totalClasses: classes?.classes?.length ?? 0,
          totalAdmissions: allAdmissionsArr.length, // Display total active applications
          pendingAdmissions: pendingCount, // Real dynamic value
          totalAttendance: attendance?.pagination?.total ?? 0,
          totalFees: feeSummary?.totalCollected ?? 0, // Real revenue
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dashboardItems = [
    {
      title: "Students",
      icon: Users,
      count: stats.totalStudents,
      bgColor: "bg-pink-50",
      iconBg: "bg-pink-500",
      textColor: "text-pink-700",
      href: "/students",
      description: "Total enrolled students",
    },
    {
      title: "Teachers",
      icon: GraduationCap,
      count: stats.totalTeachers,
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
      textColor: "text-purple-700",
      href: "/teachers",
      description: "Teaching staff members",
    },
    {
      title: "Classes",
      icon: School,
      count: stats.totalClasses,
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-500",
      textColor: "text-orange-700",
      href: "/classes",
      description: "Total classes",
    },
    {
      title: "Admissions",
      icon: FileText,
      count: stats.totalAdmissions,
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      textColor: "text-green-700",
      href: "/admission",
      description: `${stats.pendingAdmissions} pending review`,
    },
    {
      title: "Attendance",
      icon: ClipboardCheck,
      count: stats.totalAttendance,
      bgColor: "bg-cyan-50",
      iconBg: "bg-cyan-500",
      textColor: "text-cyan-700",
      href: "/attendance",
      description: "Records this month",
    },
    {
      title: "Fees",
      icon: DollarSign,
      count: `₹${stats.totalFees.toLocaleString()}`,
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-500",
      textColor: "text-emerald-700",
      href: "/fees",
      description: "Revenue this year",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome to Pre-Primary ERP System</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium" suppressHydrationWarning>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`${item.bgColor} border border-gray-200 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`${item.iconBg} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-gray-700 font-semibold">{item.title}</p>
                    </div>
                    <p className={`text-4xl font-bold ${item.textColor} mb-2`}>
                      {loading ? (
                        <span className="inline-block w-16 h-10 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        item.count
                      )}
                    </p>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                  <TrendingUp className={`w-5 h-5 ${item.textColor} opacity-50`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pending Admissions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Pending Admissions</h2>
          </div>

          <div className="space-y-3">
            {stats.pendingAdmissions > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-amber-600">{stats.pendingAdmissions}</p>
                  <p className="text-gray-600 text-sm">applications</p>
                </div>
                <p className="text-gray-600 text-sm">Awaiting your review and approval</p>
                <Link href="/admission">
                  <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-medium transition-all">
                    Review Applications
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">All applications reviewed</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          </div>

          <div className="space-y-2">
            <Link
              href="/dashboard/students"
              className="flex items-center gap-3 px-4 py-3 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg text-pink-700 font-medium transition-all group"
            >
              <Users className="w-5 h-5" />
              <span className="flex-1">Add New Student</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/dashboard/teachers"
              className="flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-medium transition-all group"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="flex-1">Add New Teacher</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/dashboard/classes"
              className="flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-orange-700 font-medium transition-all group"
            >
              <School className="w-5 h-5" />
              <span className="flex-1">Create New Class</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/dashboard/attendance"
              className="flex items-center gap-3 px-4 py-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-cyan-700 font-medium transition-all group"
            >
              <ClipboardCheck className="w-5 h-5" />
              <span className="flex-1">Mark Attendance</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-600 text-sm mb-1">System Version</p>
            <p className="font-semibold text-gray-800">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Last Updated</p>
            <p className="font-semibold text-gray-800" suppressHydrationWarning>{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Database Status</p>
            <Badge variant="success">Connected</Badge>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">System Status</p>
            <Badge variant="success">Operational</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}