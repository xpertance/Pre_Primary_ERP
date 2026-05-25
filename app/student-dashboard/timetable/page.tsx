import TimetableManagement from "@/components/admin/TimetableManagement";
import { Suspense } from "react";

export default function DashboardTimetablePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TimetableManagement />
    </Suspense>
  );
}
