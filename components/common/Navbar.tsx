"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Search,
  LogOut,
  User,
  ChevronDown,
  Menu
} from "lucide-react";

export default function Navbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Check if search should be visible (only on admin dashboard)
  const isAdminDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/");

  // Only show search on the main dashboard screens, not inside specific modules
  const showSearch = pathname === "/dashboard" || pathname === "/teacher-dashboard" || pathname === "/student-dashboard" || pathname === "/parent-dashboard";

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    if (showSearchResults || dropdownOpen || notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSearchResults, dropdownOpen, notificationOpen]);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Fetch students
      const studentsRes = await fetch(`/api/students?q=${encodeURIComponent(value)}&limit=3`);
      const studentsData = studentsRes.ok ? await studentsRes.json() : { data: [] };

      // Fetch teachers
      const teachersRes = await fetch(`/api/teachers?q=${encodeURIComponent(value)}&limit=3`);
      const teachersData = teachersRes.ok ? await teachersRes.json() : { data: [] };

      // Fetch classes
      const classesRes = await fetch(`/api/classes?q=${encodeURIComponent(value)}&limit=3`);
      const classesData = classesRes.ok ? await classesRes.json() : { data: [] };

      const combined = [
        ...(studentsData.data || []).map((student: any) => ({
          ...student,
          type: "student",
          displayName: `${student.firstName} ${student.lastName || ""}`,
        })),
        ...(teachersData.data || []).map((teacher: any) => ({
          ...teacher,
          type: "teacher",
          displayName: teacher.name,
        })),
        ...(classesData.classes || classesData.data || []).map((cls: any) => ({
          ...cls,
          type: "class",
          displayName: `${cls.name} - ${cls.section}`,
        })),
      ];

      setSearchResults(combined);
      setShowSearchResults(combined.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result: any) => {
    setSearchTerm("");
    setShowSearchResults(false);
    setSearchResults([]);

    const basePath = pathname?.startsWith("/teacher-dashboard")
      ? "/teacher-dashboard"
      : pathname?.startsWith("/student-dashboard")
        ? "/student-dashboard"
        : pathname?.startsWith("/parent-dashboard")
          ? "/parent-dashboard"
          : "/dashboard";

    if (result.type === "student") {
      router.push(`${basePath}/students/${result._id}`);
    } else if (result.type === "teacher") {
      router.push(`${basePath}/teachers/${result._id}`);
    } else if (result.type === "class") {
      router.push(`${basePath}/classes/${result._id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-3.5 flex justify-between items-center">
        {/* Left Section - Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {showSearch && (
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchTerm && setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {/* Students Section */}
                  {searchResults.some((r) => r.type === "student") && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600">
                        Students
                      </div>
                      {searchResults
                        .filter((r) => r.type === "student")
                        .map((result) => (
                          <button
                            key={result._id}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800">{result.displayName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {result.admissionNo && `Admission: ${result.admissionNo}`}
                            </p>
                          </button>
                        ))}
                    </>
                  )}

                  {/* Teachers Section */}
                  {searchResults.some((r) => r.type === "teacher") && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600">
                        Teachers
                      </div>
                      {searchResults
                        .filter((r) => r.type === "teacher")
                        .map((result) => (
                          <button
                            key={result._id}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800">{result.displayName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{result.email}</p>
                          </button>
                        ))}
                    </>
                  )}

                  {/* Classes Section */}
                  {searchResults.some((r) => r.type === "class") && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600">
                        Classes
                      </div>
                      {searchResults
                        .filter((r) => r.type === "class")
                        .map((result) => (
                          <button
                            key={result._id}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800">{result.displayName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Room: {result.roomNumber || "N/A"}
                            </p>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNotificationOpen(!notificationOpen);
              }}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                  <p className="text-xs text-gray-600 mt-0.5">You have 3 unread notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-800">New student enrollment</p>
                    <p className="text-xs text-gray-600 mt-1">Sarah Johnson enrolled in Class A</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-800">Fee payment received</p>
                    <p className="text-xs text-gray-600 mt-1">Payment of $500 received from John Doe</p>
                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-xs font-medium text-gray-800">Event reminder</p>
                    <p className="text-xs text-gray-600 mt-1">Annual Day celebration tomorrow</p>
                    <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                  </div>
                </div>
                <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex justify-center">
                  <Link
                    href="/dashboard/notifications"
                    className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    onClick={() => setNotificationOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>



          {/* Divider */}
          <div className="w-px h-8 bg-gray-200"></div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-all group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm border-2 border-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || "Role"}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user?.name || "User"}</p>
                      <p className="text-xs text-gray-600">{user?.email || "user@example.com"}</p>
                    </div>
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-white rounded-md">
                    <span className="text-xs font-medium text-orange-600 capitalize">{user?.role || "Role"}</span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">My Profile</span>
                  </Link>


                </div>

                {/* Logout */}
                <div className="border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}