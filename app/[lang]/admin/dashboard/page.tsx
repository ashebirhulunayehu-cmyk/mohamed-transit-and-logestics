"use client";

import { redirect, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import AssessorDashboardPage from "./components/assessor";
import ManagerDashboard from "./components/manager";
import CaseExecutorDashboardPage from "../case-Executer/page";
import DataEncoderDashboard from "@/components/data-encoder/DataEncoderDashboard";

const normalizeRole = (value: unknown): string => {
  if (!value) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = normalizeRole(item);
      if (result) return result;
    }
    return "";
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase().replace(/[^a-z]/g, "");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return normalizeRole(
      record.role ??
        record.roleName ??
        record.name ??
        record.userType ??
        record.accountType ??
        record.userRoles ??
        record.roles
    );
  }

  return "";
};

const DashboardPage = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authUser = useAuthStore((state) => state.user);
  const requestedRole = searchParams.get("role") ?? "";
  const authRecord = authUser as Record<string, unknown> | null;

  const derivedRole = normalizeRole(
    requestedRole ||
      authRecord?.roleName ||
      authRecord?.role ||
      authRecord?.roles ||
      authRecord?.userRoles ||
      "assessor"
  );

  const role = derivedRole || "assessor";

  const renderDashboard = () => {
    if (role === "manager" || role === "admin" || role === "superadmin") {
      return <ManagerDashboard />;
    }

    if (role === "caseexecutor" || role === "caseexecuter") {
      return <CaseExecutorDashboardPage />;
    }

    if (role === "dataencoder" || role === "dataencoderoperator") {
      const locale = pathname.split("/").filter(Boolean)[0] || "en";
      redirect(`/${locale}/admin/data-encoder/dashboard`);
    }

    return <AssessorDashboardPage />;
  };

  return <div className="min-h-screen">{renderDashboard()}</div>;
};

export default DashboardPage;
