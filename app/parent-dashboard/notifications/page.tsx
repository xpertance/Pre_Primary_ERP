"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/parent-dashboard/announcements");
  }, [router]);
  return null;
}
