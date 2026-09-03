"use client";

import ManagerHeader from "@/components/manager/ManagerHeader";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { BarChart3, TrendingUp, Clock, FileText } from "lucide-react";

export default function ReportsAnalyticsPage() {
  const stats = [
    {
      title: "Open cases",
      value: "5",
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Completed (YTD)",
      value: "422",
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: "On-time clearance",
      value: "90%",
      description: "Directorate average",
      icon: <Clock className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Avg stage duration",
      value: "63 h",
      icon: <FileText className="w-6 h-6 text-orange-600" />,
    },
  ];

  const executorData = [
    {
      name: "Meron Tadesse",
      casesClosed: 38,
      onTime: 94,
      avgDays: 11.2,
      openLoad: 9,
    },
    {
      name: "Rahel Mekonnen",
      casesClosed: 31,
      onTime: 88,
      avgDays: 12.8,
      openLoad: 11,
    },
    {
      name: "Yonas Girma",
      casesClosed: 27,
      onTime: 81,
      avgDays: 14.6,
      openLoad: 8,
    },
    {
      name: "Hanna Wolde",
      casesClosed: 44,
      onTime: 96,
      avgDays: 3.1,
      openLoad: 6,
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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  ANALYTICS
                </p>
                <h1 className="text-4xl font-bold text-slate-900">
                  Reports & analytics
                </h1>
                <p className="text-slate-600 text-sm mt-2">
                  Throughput, stage duration, risk channel distribution and executor performance across the import directorate.
                </p>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200/80 text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all">
                Export report
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    {stat.icon}
                  </div>
                  <p className="text-4xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  {stat.description && (
                    <p className="text-xs text-slate-600 mt-2">
                      {stat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Case Throughput Chart */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">
                  Case throughput
                </h2>
                <p className="text-xs text-slate-600 mb-4">
                  Cases opened by modality vs. cases completed
                </p>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-slate-500 text-sm">Line chart placeholder</p>
                    <p className="text-xs text-slate-400 mt-1">Multimodal, Unimodal, Completed</p>
                  </div>
                </div>
              </div>

              {/* Risk Channel Mix Chart */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">
                  Risk channel mix
                </h2>
                <p className="text-xs text-slate-600 mb-4">
                  Share of cases by inspection channel
                </p>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full border-8 border-slate-300 flex items-center justify-center text-slate-400">
                      <span className="text-sm">Donut Chart</span>
                    </div>
                    <div className="flex justify-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>Blue
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>Green
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>Yellow
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span>Red
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Duration by Stage */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm mb-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">
                Average duration by stage
              </h2>
              <p className="text-xs text-slate-600 mb-6">
                Hours spent per workflow stage, last 90 days
              </p>
              <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-slate-500 text-sm">Bar chart placeholder</p>
                  <p className="text-xs text-slate-400 mt-1">Pre-shipment, Transit, Amendment, Drop-Risk, Delivery Order, Warehouse, Inspection, Assessment, Exit, Transport, Clearance</p>
                </div>
              </div>
            </div>

            {/* Executor Performance */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">
                Executor performance
              </h2>
              <p className="text-xs text-slate-600 mb-6">
                Closed volume, punctuality and current load
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Executor
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Cases Closed
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        On Time
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Avg Days
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Open Load
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {executorData.map((executor, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {executor.name}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {executor.casesClosed}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{
                                  width: `${executor.onTime}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-slate-700 font-medium">
                              {executor.onTime}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {executor.avgDays}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {executor.openLoad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
