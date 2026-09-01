"use client";

import { useSearchParams } from "next/navigation";
import AssessorDashboardPage from "./components/assessor";
import ManagerDashboard from "./components/manager";

const DashboardPage = () => {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "assessor";

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen">
      {role === "manager" ? (
        <ManagerDashboard />
      ) : (
        <AssessorDashboardPage />
      )}
    </div>
  );
};

export default DashboardPage;
