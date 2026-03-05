"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Calendar,
  Clock,
  Trophy,
  Star,
  TrendingUp,
  Bell,
  FileText,
  Award,
  Target,
  Smile,
  AlertCircle
} from "lucide-react";

interface StudentStats {
  attendancePercentage: number;
  presentDays: number;
  totalDays: number;
  pendingAssignments: number;
  completedAssignments: number;
  upcomingExams: number;
  averageGrade: string;
}

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: Date;
  status: string;
}

interface Exam {
  _id: string;
  name: string;
  examType: string;
  startDate: Date;
  subjects: string[];
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: Date;
  icon?: string;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [stats, setStats] = useState<StudentStats>({
    attendancePercentage: 0,
    presentDays: 0,
    totalDays: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    upcomingExams: 0,
    averageGrade: "N/A",
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch current student info
      const userRes = await fetch("/api/auth/profile");
      if (!userRes.ok) throw new Error(`userRes failed: ${await userRes.text()}`);
      const userData = await userRes.json();
      setStudentInfo(userData.user);

      if (!userData.user || userData.user.role !== "student") {
        setAlert({ type: "error", message: "Unauthorized access" });
        return;
      }

      const studentId = userData.user.id;

      // Fetch student's attendance
      const attendanceRes = await fetch(`/api/attendance?studentId=${studentId}`);
      const attendanceData = await attendanceRes.json();
      const attendanceRecords = attendanceData.data || [];

      const presentCount = attendanceRecords.filter((a: any) => a.status === "present").length;
      const totalCount = attendanceRecords.length;
      const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      // Fetch student's assignments (mock - replace with actual API)
      const assignmentRes = await fetch(`/api/assignments?studentId=${studentId}`);
      const assignmentData = await assignmentRes.json().catch(() => ({ data: [] }));
      const allAssignments = assignmentData.data || [];
      const pendingAssignments = allAssignments.filter((a: any) => a.status === "pending");
      const completedAssignments = allAssignments.filter((a: any) => a.status === "completed");

      // Fetch student's upcoming exams
      const examRes = await fetch(`/api/exams?studentId=${studentId}`);
      const examData = await examRes.json();
      const allExams = examData.exams || [];
      const upcomingExams = allExams.filter((e: any) =>
        new Date(e.startDate) > new Date() && e.status === "scheduled"
      );

      // Fetch student's grades (mock - replace with actual API)
      const gradesRes = await fetch(`/api/grades?studentId=${studentId}`);
      const gradesData = await gradesRes.json().catch(() => ({ data: [] }));
      const grades = gradesData.data || [];
      const averageGrade = grades.length > 0 ? "A" : "N/A"; // Calculate actual average

      setStats({
        attendancePercentage,
        presentDays: presentCount,
        totalDays: totalCount,
        pendingAssignments: pendingAssignments.length,
        completedAssignments: completedAssignments.length,
        upcomingExams: upcomingExams.length,
        averageGrade,
      });

      setUpcomingAssignments(pendingAssignments.slice(0, 3));
      setUpcomingExams(upcomingExams.slice(0, 3));

      // Mock recent activities
      setRecentActivities([
        {
          type: "assignment",
          message: "Completed Math Assignment",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: "✅",
        },
        {
          type: "exam",
          message: "English Test scheduled",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          icon: "📝",
        },
      ]);

    } catch (error) {
      console.error("Failed to fetch student data:", error);
      setAlert({ type: "error", message: "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = () => {
    if (stats.attendancePercentage >= 90) return "from-green-400 to-green-500";
    if (stats.attendancePercentage >= 75) return "from-yellow-400 to-yellow-500";
    return "from-red-400 to-red-500";
  };

  const getAttendanceEmoji = () => {
    if (stats.attendancePercentage >= 90) return "🌟";
    if (stats.attendancePercentage >= 75) return "👍";
    return "📚";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  const getDaysUntil = (date: Date) => {
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "My Dashboard" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Smile className="w-8 h-8 text-pink-500" />
              {getGreeting()}, {studentInfo?.firstName || "Student"}!
            </h1>
            <p className="text-gray-600 mt-1">Let's make today amazing! 🌈</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric"
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.type as any} closable onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className={`bg-gradient-to-br ${getAttendanceColor()} border-2 border-white shadow-lg rounded-xl p-6`}>
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm font-medium mb-2 opacity-90">My Attendance</p>
              <p className="text-4xl font-bold">{stats.attendancePercentage}%</p>
              <p className="text-xs mt-1 opacity-80">{stats.presentDays} / {stats.totalDays} days</p>
            </div>
            <div className="text-5xl">{getAttendanceEmoji()}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Pending Work</p>
              <p className="text-4xl font-bold text-blue-600">{stats.pendingAssignments}</p>
              <p className="text-xs text-blue-600 mt-1">assignments</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Upcoming Tests</p>
              <p className="text-4xl font-bold text-purple-600">{stats.upcomingExams}</p>
              <p className="text-xs text-purple-600 mt-1">exams scheduled</p>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium mb-2">My Grade</p>
              <p className="text-4xl font-bold text-yellow-600">{stats.averageGrade}</p>
              <p className="text-xs text-yellow-600 mt-1">average</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Assignments */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                My Assignments
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>

            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{assignment.subject}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="warning" size="sm">
                          {getDaysUntil(assignment.dueDate)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">All caught up!</p>
                <p className="text-gray-400 text-sm mt-1">No pending assignments</p>
              </div>
            )}
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Upcoming Tests
              </h2>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All
              </button>
            </div>

            {upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{exam.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exam.subjects.map((subject, idx) => (
                            <Badge key={idx} variant="primary" size="sm">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge variant="info" size="sm">
                          {getDaysUntil(exam.startDate)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(exam.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No upcoming tests</p>
                <p className="text-gray-400 text-sm mt-1">Enjoy your study time!</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all">
                <div className="text-4xl">📚</div>
                <span className="text-sm font-medium text-gray-700">My Classes</span>
              </button>

              <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
                <div className="text-4xl">📝</div>
                <span className="text-sm font-medium text-gray-700">Homework</span>
              </button>

              <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all">
                <div className="text-4xl">⭐</div>
                <span className="text-sm font-medium text-gray-700">My Grades</span>
              </button>

              <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all">
                <div className="text-4xl">📅</div>
                <span className="text-sm font-medium text-gray-700">Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-6 h-6 text-pink-600" />
              <h3 className="font-semibold text-pink-900">My Progress</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-pink-700 font-medium">Attendance</span>
                  <span className="text-pink-900 font-bold">{stats.attendancePercentage}%</span>
                </div>
                <div className="w-full bg-pink-200 rounded-full h-3">
                  <div
                    className="bg-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats.attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-pink-700 font-medium">Assignments Done</span>
                  <span className="text-pink-900 font-bold">
                    {stats.completedAssignments} / {stats.completedAssignments + stats.pendingAssignments}
                  </span>
                </div>
                <div className="w-full bg-pink-200 rounded-full h-3">
                  <div
                    className="bg-pink-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${(stats.completedAssignments / (stats.completedAssignments + stats.pendingAssignments || 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Activity
            </h2>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="text-2xl flex-shrink-0">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
            )}
          </div>

          {/* Motivational Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
            <div className="text-center">
              <div className="text-5xl mb-3">🌟</div>
              <h3 className="font-semibold text-yellow-900 mb-2">Keep Going!</h3>
              <p className="text-sm text-yellow-700">
                You&apos;re doing great! Keep up the awesome work! 💪
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}