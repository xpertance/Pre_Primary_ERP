"use client";
import { useState, useEffect } from "react";
import { Bell, Globe, BookOpen, User, Clock, CheckCircle2, AlertCircle, Info, Megaphone } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "global" | "class" | "student" | "homework" | "exam" | "fee" | string;
  createdAt: string;
  classId?: { name?: string; section?: string } | string;
  studentId?: { firstName?: string; lastName?: string } | string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  global:   { label: "School-Wide",  icon: Globe,         color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  class:    { label: "Class",        icon: BookOpen,      color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  student:  { label: "Personal",     icon: User,          color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  homework: { label: "Homework",     icon: CheckCircle2,  color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  exam:     { label: "Exam",         icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  fee:      { label: "Fee",          icon: Info,          color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
};

function formatTimeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AnnouncementsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/parent/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.notifications || []);
        } else {
          setError(data.error || "Failed to load updates");
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const filterTypes = [
    { key: "all", label: "All" },
    { key: "global", label: "School-Wide" },
    { key: "class", label: "Class" },
    { key: "homework", label: "Homework" },
    { key: "exam", label: "Exams" },
    { key: "fee", label: "Fees" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/parent-dashboard" },
          { label: "School Updates" },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">School Updates</h1>
            <p className="text-sm text-gray-500">Announcements, homework, exams & more</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{notifications.length} updates</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterTypes.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No updates yet</h3>
          <p className="text-sm text-gray-500">
            {filter === "all"
              ? "School announcements and updates will appear here."
              : `No "${filter}" updates at this time.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.global;
            const Icon = cfg.icon;
            return (
              <div
                key={notif._id}
                className={`bg-white rounded-xl border ${cfg.bg} p-5 transition-all hover:shadow-md`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm leading-snug">
                        {notif.title}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">{notif.message}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
