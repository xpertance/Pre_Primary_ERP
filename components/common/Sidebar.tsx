"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PERMISSIONS } from "@/utils/permissions";
import { useState, ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  DollarSign,
  Calendar,
  FileText,
  Bell,
  PartyPopper,
  Bus,
  House,
  // UtensilsCrossed, // Meal Plan (hidden)
  Image,
  Settings,
  Baby,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Clock,
} from "lucide-react";

interface User {
  name?: string;
  role?: string;
}

interface MenuItem {
  name: string;
  path: string;
  module: string;
  icon: ComponentType<{ className?: string }>;
  color: "orange" | "pink" | "rose" | "purple" | "amber" | "green" | "fuchsia" | "indigo" | "red" | "yellow" | "cyan" | "violet" | "slate";
}

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Keep sidebar visible on all dashboard routes so it stays present
  // across admin modules (but still allow mobile toggle via `isOpen`).
  // use isOpen prop to control visibility on mobile
  // lg:translate-x-0 class ensures it's always visible on desktop
  const visible = isOpen;

  const getDashboardPath = () => {
    switch (user?.role) {
      case "teacher": return "/teacher-dashboard";
      case "student": return "/student-dashboard";
      case "parent": return "/parent-dashboard";
      default: return "/dashboard";
    }
  };

  const basePath = getDashboardPath();

  const menuList: MenuItem[] = [
    {
      name: "Dashboard",
      path: basePath,
      module: "dashboard",
      icon: LayoutDashboard,
      color: "orange",
    },
    {
      name: "Classes",
      path: `${basePath}/classes`,
      module: "classes",
      icon: House,
      color: "pink",
    },
    {
      name: "Students",
      path: `${basePath}/students`,
      module: "students",
      icon: Users,
      color: "rose",
    },
    {
      name: "Teachers",
      path: `${basePath}/teachers`,
      module: "teachers",
      icon: GraduationCap,
      color: "purple",
    },
    {
      name: "Attendance",
      path: `${basePath}/attendance`,
      module: "attendance",
      icon: ClipboardCheck,
      color: "amber",
    },
    {
      name: "Fees",
      path: `${basePath}/fees`,
      module: "fees",
      icon: DollarSign,
      color: "green",
    },
    {
      name: "Timetable",
      path: `${basePath}/timetable`,
      module: "timetable",
      icon: Calendar,
      color: "fuchsia",
    },
    {
      name: "Exams",
      path: `${basePath}/exams`,
      module: "exams",
      icon: FileText,
      color: "indigo",
    },
    /* Previously Notifications. Kept as comment so original implementation remains available */
    /*
    {
      name: "Notifications",
      path: `${basePath}/notifications`,
      module: "notifications",
      icon: Bell,
      color: "red",
    },
    */
    /* Log Activity hidden for small school client 
    {
      name: "Log Activity",
      path: `${basePath}/log-activity`,
      module: "log-activity",
      icon: Clock,
      color: "red",
    },
    */
    {
      name: "Events",
      path: `${basePath}/events`,
      module: "events",
      icon: PartyPopper,
      color: "yellow",
    },
    {
      name: "Transport",
      path: `${basePath}/transport/routes`,
      module: "transport",
      icon: Bus,
      color: "cyan",
    },
    /* Meal Plan hidden — not needed for this school
    {
      name: "Meal Plan",
      path: `${basePath}/meal-plan`,
      module: "meal-plan",
      icon: UtensilsCrossed,
      color: "orange",
    },
    */
    {
      name: "Gallery",
      path: `${basePath}/gallery`,
      module: "gallery",
      icon: Image,
      color: "violet",
    },
    {
      name: "Settings",
      path: `${basePath}/settings`,
      module: "settings",
      icon: Settings,
      color: "slate",
    },
  ];

  const getColorClasses = (
    color: "orange" | "pink" | "rose" | "purple" | "amber" | "green" | "fuchsia" | "indigo" | "red" | "yellow" | "cyan" | "violet" | "slate",
    isActive: boolean
  ): string => {
    const colors: Record<string, string> = {
      orange: isActive ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600",
      pink: isActive ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-600",
      rose: isActive ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-600",
      purple: isActive ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600",
      amber: isActive ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600",
      green: isActive ? "bg-green-500 text-white" : "bg-green-50 text-green-600",
      fuchsia: isActive ? "bg-fuchsia-500 text-white" : "bg-fuchsia-50 text-fuchsia-600",
      indigo: isActive ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-600",
      red: isActive ? "bg-red-500 text-white" : "bg-red-50 text-red-600",
      yellow: isActive ? "bg-yellow-500 text-white" : "bg-yellow-50 text-yellow-600",
      cyan: isActive ? "bg-cyan-500 text-white" : "bg-cyan-50 text-cyan-600",
      violet: isActive ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-600",
      slate: isActive ? "bg-slate-500 text-white" : "bg-slate-50 text-slate-600",
    };
    return colors[color] || colors.orange;
  };

  const filteredMenu = menuList.filter((m) =>
    user?.role ? PERMISSIONS[user.role]?.includes(m.module) : false
  );

  return (
    <aside
      className={`
    fixed lg:static z-50
    h-screen bg-white border-r border-gray-200
    flex flex-col
    transition-transform duration-300
    ${visible ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
    ${isCollapsed ? "w-20" : "w-64"}
  `}
    >


      {/* Header */}
      <div
        className={`border-b border-gray-200 flex items-center ${isCollapsed ? "justify-center py-5" : "justify-between px-5 py-5"
          }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-xl flex items-center justify-center shadow-sm">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800">Pre-Primary ERP</h1>
              <p className="text-xs text-gray-500">School Management</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-xl flex items-center justify-center shadow-sm">
            <Baby className="w-6 h-6 text-white" />
          </div>
        )}
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>

      </div>

      {/* User Info */}
      {user && !isCollapsed && (
        <div className="px-4 py-4 bg-gradient-to-r from-orange-50 via-pink-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm border-2 border-white">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-gray-600 capitalize truncate">
                {user.role || "Role"}
              </p>
            </div>
          </div>
        </div>
      )}

      {user && isCollapsed && (
        <div className="py-4 flex justify-center bg-gradient-to-r from-orange-50 via-pink-50 to-orange-50">
          <div className="w-10 h-10 bg-gradient-to-br from-accent via-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm border-2 border-white">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <ul className={isCollapsed ? "space-y-2 py-4" : "space-y-1 px-3 py-4"}>
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = item.module === "dashboard"
              ? pathname === item.path
              : pathname === item.path || pathname?.startsWith(item.path + "/");

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`
              group relative flex items-center transition-all duration-150
              ${isCollapsed
                      ? "justify-center py-3"
                      : "px-3 py-2.5 rounded-lg"
                    }
              ${isActive
                      ? "bg-gradient-to-r from-orange-50 to-pink-50 shadow-sm"
                      : "hover:bg-gray-50"
                    }
            `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div
                    className={`
                flex items-center justify-center rounded-lg
                ${isCollapsed ? "w-10 h-10" : "w-9 h-9 mr-3"}
                ${getColorClasses(item.color, isActive)}
              `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {!isCollapsed && (
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>




      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="py-3 border-t border-gray-200">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex justify-center py-2 hover:bg-gray-50 transition-colors group"
            title="Expand sidebar"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <PanelLeft className="w-5 h-5 text-gray-600" />
            </div>
          </button>
        </div>
      )}

      {/* Logout Button */}
      <div className={`border-t border-gray-200 ${isCollapsed ? "py-3" : "py-3 px-3"}`}>
        <button
          onClick={async () => {
            try {
              await logout();
              router.push("/login");
            } catch (err) {
              console.error("Logout failed", err);
            }
          }}
          className={`
            w-full flex items-center text-gray-700 hover:bg-red-50 transition-all group rounded-lg
            ${isCollapsed ? "justify-center py-3" : "px-3 py-2.5"}
          `}
          title={isCollapsed ? "Logout" : undefined}
        >
          <div
            className={`
            flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors
            ${isCollapsed ? "w-10 h-10" : "w-9 h-9 mr-3"}
          `}
          >
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium group-hover:text-red-600">Logout</span>
          )}

          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Logout
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
        </button>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center font-medium">
            © 2026 Pre-Primary ERP
          </p>
        </div>
      )}
    </aside>
  );
}