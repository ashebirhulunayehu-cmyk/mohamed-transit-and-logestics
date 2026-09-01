"use client";

import { ReactNode } from "react";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import ManagerHeader from "@/components/manager/ManagerHeader";
import { useManagerStore } from "@/store/managerStore";

interface ManagerLayoutProps {
  children: ReactNode;
}

export default function ManagerLayout({
  children,
}: ManagerLayoutProps) {
  const { sidebarCollapsed } = useManagerStore();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[270px]"
        }`}
      >
        {/* Header */}
        <ManagerHeader />

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
