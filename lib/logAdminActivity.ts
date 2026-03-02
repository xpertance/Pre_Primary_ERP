import LogActivity from "@/models/LogActivity";
import { connectDB } from "@/lib/db";

interface LogParams {
  actorId?: string;
  actorEmail?: string; // Optional - will try to fetch if not provided
  actorRole: string;
  action: string; // "create:student", "update:teacher", "delete:class", etc.
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Log an admin action (create, update, delete) to the database
 */
export async function logAdminActivity(params: LogParams) {
  try {
    let email = params.actorEmail;

    // If email not provided, try to fetch it from User model
    if (!email && params.actorId) {
      try {
        await connectDB();
        const { default: User } = await import("@/models/User").catch(() => ({ default: null }));
        if (User) {
          const user = await User.findById(params.actorId).select("email").lean() as { email?: string } | null;
          email = user?.email || "unknown";
        }
      } catch {
        // Silently fail - use "unknown" for email
        email = "unknown";
      }
    }

    const entry = new LogActivity({
      actorId: params.actorId,
      actorEmail: email || "unknown",
      actorRole: params.actorRole,
      action: params.action,
      result: "success",
      message: params.message,
      metadata: params.metadata || {},
    });
    await entry.save();
    return entry;
  } catch (error) {
    console.error("[logAdminActivity] Error:", error);
    // Don't throw — silently fail so admin operations aren't blocked
  }
}
