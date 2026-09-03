"use client";

import ManagerHeader from "@/components/manager/ManagerHeader";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { PriorityQueue } from "@/components/manager/PriorityQueue";
import { LatestActivity } from "@/components/manager/LatestActivity";
import { Database, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export default function ManagerDashboard() {
  const stats = [
    {
      title: "Open cases",
      value: "5",
      description: "risk or review",
      icon: <Database className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Needs attention",
      value: "4",
      description: "risk or review",
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
    },
    {
      title: "Due within 48h",
      value: "3",
      description: "pending approval",
      icon: <Clock className="w-6 h-6 text-orange-600" />,
    },
    {
      title: "Cleared this month",
      value: "1",
      description: "completed",
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
    },
  ];

  const queueItems = [
    {
      id: "SVC-2026-0417",
      title: "Bulk fertiliser consignment — 4 × 40ft",
      description: "Horizon Agro Import PLC · Jebel Ali, UAE → Djibouti → Modjo Dry Port",
      tags: [
        { label: "Requires customer action", color: "red" as const },
        { label: "Yellow channel", color: "yellow" as const },
      ],
      updatedTime: "Updated 18h ago",
    },
    {
      id: "SVC-2026-0392",
      title: "Hot-rolled steel coils — 12 × 40ft",
      description: "Nile Steel & Metals Trading · Mundra, India → Djibouti → Kality Terminal",
      tags: [
        { label: "Blocked", color: "red" as const },
        { label: "Red channel", color: "red" as const },
      ],
      updatedTime: "Updated 2d ago",
    },
    {
      id: "SVC-2026-0448",
      title: "Cold-chain pharmaceutical airfreight",
      description: "Abyssinia Pharmaceuticals Import · Brussels, Belgium → Bole International Airport Cargo Terminal",
      tags: [
        { label: "In progress", color: "blue" as const },
        { label: "Green channel", color: "green" as const },
      ],
      updatedTime: "Updated 2h ago",
    },
    {
      id: "SVC-2026-0431",
      title: "Circular knitting machinery — 3 × 40ft OT",
      description: "Blue Nile Textile Sourcing · Shanghai, China → Djibouti → Modjo Dry Port",
      tags: [
        { label: "Needs review", color: "orange" as const },
        { label: "Yellow channel", color: "yellow" as const },
      ],
      updatedTime: "Updated 17h ago",
    },
    {
      id: "SVC-2026-0460",
      title: "Excavator & attachments — local permission",
      description: "Rift Valley Machinery Import · Nagoya, Japan → Djibouti → Adama",
      tags: [
        { label: "Pending", color: "orange" as const },
        { label: "Blue channel", color: "blue" as const },
      ],
      updatedTime: "Updated 1d ago",
    },
  ];

  const activityItems = [
    {
      title: "Duty & tax assessment issued",
      description: "ETB 486,214.00 payable on SVC-2026-0417. Settle before 01 Aug to avoid demurrage.",
      type: "payment" as const,
      timestamp: "48m ago",
    },
    {
      title: "Red channel block on SVC-2026-0392",
      description: "Certificate of origin mismatch. Inspection halted pending corrected mill test certificate.",
      type: "risk" as const,
      timestamp: "1h ago",
    },
    {
      title: "KYC awaiting your review",
      description: "Abyssinia Pharmaceuticals Import submitted 5 KYC documents for verification.",
      type: "approval" as const,
      timestamp: "2h ago",
    },
    {
      title: "Temperature log uploaded",
      description: "Temperature-Log-UID-1-6.csv added to Arrival stage of SVC-2026-0448.",
      type: "document" as const,
      timestamp: "2h ago",
    },
    {
      title: "Assessment submitted for review",
      description: "SVC-2026-0431 moved to Needs review — valuation query raised.",
      type: "service" as const,
      timestamp: "17h ago",
    },
    {
      title: "Inspection completed",
      description: "No discrepancies found on SVC-2026-0417. Seals intact on all four containers.",
      type: "assessment" as const,
      timestamp: "6d ago",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ManagerHeader />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                IMPORT DIRECTORATE
              </p>
              <h1 className="text-4xl font-bold text-slate-900">
                Directorate overview
              </h1>
              <p className="text-slate-600 text-sm mt-2">
                Operations across every importer, corridor and case.
              </p>
            </div>

            {/* Stats Grid - 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {stat.title}
                      </p>
                      <p className="text-5xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        {stat.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Priority Queue and Latest Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Priority Queue */}
              <div className="lg:col-span-2">
                <PriorityQueue items={queueItems} />
              </div>

              {/* Latest Activity */}
              <div>
                <LatestActivity items={activityItems} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}