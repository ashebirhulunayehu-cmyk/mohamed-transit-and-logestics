"use client";

import { useManagerStore } from "@/store/managerStore";

export default function CasesPage() {
  const { sidebarCollapsed } = useManagerStore();

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Management</h1>
      <p className="text-slate-600">Manage and track all cases in the system.</p>
    </div>
  );
}
