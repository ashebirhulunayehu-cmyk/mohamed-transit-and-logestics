"use client";

import { useEffect, useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import ManagerHeader from "@/components/manager/ManagerHeader";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { ManagerDashboardStats } from "@/components/manager/ManagerDashboardStats";
import { CaseTable } from "@/components/manager/CaseTable";
import { TeamPerformance } from "@/components/manager/TeamPerformance";
import { RecentActivity } from "@/components/manager/RecentActivity";
import { useManagerStore } from "@/store/managerStore";
import { managerMockCases, managerMockStats, managerTeamMembers, managerRecentActivities } from "@/data/managerMockData";

export default function ManagerDashboard() {
  const {
    sidebarCollapsed,
    selectedCase,
    filters,
    stats,
    setSelectedCase,
    setFilters,
    setStats,
    resetFilters,
  } = useManagerStore();

  const [filteredCases, setFilteredCases] = useState(managerMockCases);

  useEffect(() => {
    // Set initial stats
    setStats(managerMockStats);
  }, [setStats]);

  useEffect(() => {
    // Filter cases based on filters
    let filtered = managerMockCases;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(searchLower) ||
          c.importerName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter((c) => c.assignedTo === filters.assignedTo);
    }

    setFilteredCases(filtered);
  }, [filters]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-[76px]" : "ml-[270px]"
        }`}
      >
        {/* Header */}
        <ManagerHeader />

        {/* Page Content */}
        <main className="mt-[76px] flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                Operations Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage cases, monitor team performance, and track KPIs
              </p>
            </div>

            {/* Stats Cards */}
            <ManagerDashboardStats stats={stats} />

            {/* Team Performance Section */}
            <TeamPerformance teamMembers={managerTeamMembers} />

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <RecentActivity activities={managerRecentActivities} />
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-2.5">
                  <button className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
                    + New Case
                  </button>
                  <button className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-all">
                    Generate Report
                  </button>
                  <button className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-all">
                    Team Schedule
                  </button>
                  <button className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-all">
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  Filters
                </h3>
                <button
                  onClick={() => resetFilters()}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3 py-1.5 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    placeholder="Case or importer..."
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) =>
                      setFilters({ status: e.target.value || undefined })
                    }
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={filters.priority || ""}
                    onChange={(e) =>
                      setFilters({ priority: e.target.value || undefined })
                    }
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                {/* Assigned To Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Assigned To
                  </label>
                  <select
                    value={filters.assignedTo || ""}
                    onChange={(e) =>
                      setFilters({ assignedTo: e.target.value || undefined })
                    }
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">All Team Members</option>
                    <option value="John Okonkwo">John Okonkwo</option>
                    <option value="Sarah Mensah">Sarah Mensah</option>
                    <option value="Ahmed Hassan">Ahmed Hassan</option>
                    <option value="Fatima Ibrahim">Fatima Ibrahim</option>
                    <option value="David Kipchoge">David Kipchoge</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cases Table */}
            <CaseTable
              cases={filteredCases}
              selectedId={selectedCase?.id || null}
              onSelectCase={(id) => {
                const caseData = managerMockCases.find((c) => c.id === id);
                if (caseData) {
                  setSelectedCase(caseData);
                }
              }}
            />

            {/* Case Details Panel */}
            {selectedCase && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Case Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Case Number
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {selectedCase.caseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Importer
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {selectedCase.importerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {selectedCase.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Priority
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {selectedCase.priority}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Assigned To
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {selectedCase.assignedTo}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Due Date
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {selectedCase.dueDate}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
