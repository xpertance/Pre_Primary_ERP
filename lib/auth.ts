// lib/auth.ts
import jwt from "jsonwebtoken";

export type JwtPayload = {
  id: string;
  role: "admin" | "teacher" | "parent" | string;
  iat?: number;
  exp?: number;
};

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Avoid crashing during Next.js build step
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn("JWT_SECRET not defined");
    }
    return "fallback_secret_for_build";
  }
  return secret;
};

export function verifyToken(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
