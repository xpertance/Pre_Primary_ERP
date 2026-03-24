"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Lock, BookOpen, Users, GraduationCap, Baby, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState("admin");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const slides = [
    {
      title: "Smart Attendance Tracking",
      description: "Real-time attendance monitoring for students and staff. Parents get instant notifications about their child's presence.",
      illustration: "👶📱"
    },
    {
      title: "Parent Communication Hub",
      description: "Stay connected with parents through announcements, daily reports, and photo sharing of classroom activities.",
      illustration: "👨‍👩‍👧💬"
    },
    {
      title: "Child Development Reports",
      description: "Track developmental milestones, activities, and progress with comprehensive reporting for parents and teachers.",
      illustration: "📊🎨"
    },
    {
      title: "Simple Fee Management",
      description: "Automated fee collection, payment reminders, and receipt generation. Parents can pay online anytime.",
      illustration: "💳✨"
    }
  ];

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, role }),
      });
      // If the server returned non-JSON (like an HTML error page), attempting
      // to call res.json() will throw a SyntaxError (Unexpected token '<').
      // Check content-type first and handle gracefully.
      const contentType = res.headers.get("content-type") || "";
      let data: any = null;

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Login response is not JSON:", text);
        setError(
          `Server error: received non-JSON response (status ${res.status}). See server logs.`
        );
        setLoading(false);
        return;
      }

      try {
        data = await res.json();
      } catch (err) {
        const text = await res.text();
        console.error("Failed to parse JSON login response:", err, text);
        setError("Failed to parse server response");
        setLoading(false);
        return;
      }

      console.log("Login response data:", data);
      if (!data.success) {
        setError(data.error || "Invalid login details");
        setLoading(false);
        return;
      }

      if (login) {
        login(data.user || data);
      }

      // Get role from response or use selected role
      const userRole = data.user?.role || role;

      const rolePathMap: Record<string, string> = {
        admin: "/dashboard",
        teacher: "/teacher-dashboard",
        parent: "/parent-dashboard",
        student: "/student-dashboard",
      };

      const redirectTo = rolePathMap[userRole] || "/dashboard";
      console.log("Redirecting to:", redirectTo);

      try {
        await router.push(redirectTo);
      } finally {
        setLoading(false);
      }

    } catch (err: unknown) {
      console.error(err);
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const roleIcons = {
    admin: <GraduationCap className="w-4 h-4" />,
    teacher: <BookOpen className="w-4 h-4" />,
    parent: <Users className="w-4 h-4" />,
    student: <Baby className="w-4 h-4" />
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo and Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-xl flex items-center justify-center">
                <Baby className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pre-Primary <span className="text-primary">ERP</span></h1>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
            <p className="text-gray-600">Use your credentials to access your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {roleIcons[role as keyof typeof roleIcons]}
                </div>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary-dark text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <a href="/#contact" className="text-primary hover:text-primary-dark font-medium transition-colors">
                Contact Company
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Illustration & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-secondary-light rounded-full opacity-50"></div>
        <div className="absolute bottom-20 left-10 w-16 h-16 bg-accent rounded-full opacity-50"></div>
        <div className="absolute top-1/2 left-10 w-12 h-12 bg-primary-light rounded-full opacity-50"></div>

        <div className="max-w-lg text-center relative z-10">
          {/* Illustration */}
          <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
            <div className="text-9xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
              {slides[currentSlide].illustration}
            </div>
          </div>

          {/* Content */}
          <h3 className="text-3xl font-bold text-gray-800 mb-4">
            {slides[currentSlide].title}
          </h3>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            {slides[currentSlide].description}
          </p>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                  ? 'bg-primary w-8'
                  : 'bg-primary-light hover:bg-primary'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}