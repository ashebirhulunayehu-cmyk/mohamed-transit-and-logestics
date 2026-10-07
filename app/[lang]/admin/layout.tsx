"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AssessorSidebar from "@/components/assessor/AssessorSidebar";
import AssessorHeader from "@/components/assessor/AssessorHeader";
import { useAssessorStore } from "@/store/assessorStore";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useAssessorStore();

  if (
    pathname.includes("/admin/manager") ||
    pathname.includes("/admin/data-encoder")
  ) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AssessorSidebar />

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[270px]"
        }`}
      >
        {/* Header */}
        <AssessorHeader />

        {/* Page */}
        <main className="pt-[76px]">
          <div className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
