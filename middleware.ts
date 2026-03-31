import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Only truly public (unauthenticated) routes
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];

  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!token) {
    // console.log("[middleware] no token - redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Role-based path enforcement: redirect to the correct dashboard if role doesn't match
    const pathname = req.nextUrl.pathname;
    const roleDashboardMap: Record<string, string> = {
      admin: "/dashboard",
      teacher: "/teacher-dashboard",
      parent: "/parent-dashboard",
      student: "/student-dashboard",
    };
    const correctBase = roleDashboardMap[role];

    if (correctBase) {
      const wrongBases = Object.values(roleDashboardMap).filter((b) => b !== correctBase);
      const isOnWrongDashboard = wrongBases.some((base) => pathname === base || pathname.startsWith(base + "/"));
      if (isOnWrongDashboard) {
        return NextResponse.redirect(new URL(correctBase, req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.log("[middleware] token verify failed", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/teacher-dashboard",
    "/teacher-dashboard/:path*",
    "/student-dashboard",
    "/student-dashboard/:path*",
    "/parent-dashboard",
    "/parent-dashboard/:path*",
    "/students/:path*",
    "/teachers/:path*",
    "/attendance/:path*",
    "/fees/:path*",
    "/timetable/:path*",
    "/exams/:path*",
    "/notifications/:path*",
    "/events/:path*",
    "/transport/:path*",
    "/meal-plan/:path*",
    "/gallery/:path*",
    "/parent-portal/:path*",
    "/settings/:path*",
  ],
};
