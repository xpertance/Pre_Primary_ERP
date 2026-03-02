// lib/auth.ts
import jwt from "jsonwebtoken";

export type JwtPayload = {
  id: string;
  role: "admin" | "teacher" | "parent" | string;
  iat?: number;
  exp?: number;
};

const SECRET = process.env.JWT_SECRET!;
if (!SECRET) throw new Error("JWT_SECRET not defined");

export function verifyToken(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
