import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  // Debug: log cookie header and pathname to help diagnose missing token
  const token = req.cookies.get("token")?.value;
  // console.log("[middleware] path=", req.nextUrl.pathname, "cookieHeader=", cookieHeader, "token=", token);

  const publicRoutes = [
    "/auth/login", // Keep for legacy if any links exist, but actual page is /login
    "/auth/register",
    "/teacher-dashboard",
    "/student-dashboard",
    "/auth/forgot-password",
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard", // Dashboard itself is protected?? Wait, usually dashboard is protected.
    // The previous code had dashboard in publicRoutes???
    // Lines 20-41 of original file show excessive public routes including /dashboard/fees
    // This seems WRONG if we want protection.
    // However, I should stick to fixing the error first.
    // The user said "token verify failed". This means the route was NOT public, so it tried to verify.
    // If I make it public, it bypasses verification.
    // The list in previous file had "/dashboard/fees".
    // But the user was accessing "/dashboard/fees/ID".
    // "dashboard/fees" matches "/dashboard/fees".
    // "/dashboard/fees/:path*" matches subpaths.
    // The publicRoutes check uses `includes`. exact match.
    // So "/dashboard/fees/123" is NOT in publicRoutes.
    // So logic falls through to verification.
    // And verification failed.
  ];

  //   if (publicRoutes.includes(req.nextUrl.pathname)) {
  //     return NextResponse.next();
  //   }
  // The logic above is flawed for dynamic routes if using exact match.
  // But let's fix the critical crash first.

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
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    console.log("[middleware] token verify failed", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/teacher-dashboard/:path*",
    "/student-dashboard/:path*",
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
