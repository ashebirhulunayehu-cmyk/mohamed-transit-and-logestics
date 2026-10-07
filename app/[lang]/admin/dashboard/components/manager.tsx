"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Database, ShieldCheck, Users } from "lucide-react";
import { useManagerStore } from "@/modules/manager/manager.store";
import DashboardOverview from "./dashboard-overview";

const numberOrZero = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function ManagerDashboard() {
  const { dashboardData, fetchDashboard } = useManagerStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const totalServices = numberOrZero(dashboardData?.totalServices);
  const pendingServices = numberOrZero(dashboardData?.pendingServices);
  const inProgressServices = numberOrZero(dashboardData?.inProgressServices);
  const completedServices = numberOrZero(dashboardData?.completedServices);
  const totalCustomers = numberOrZero(dashboardData?.totalCustomers);
  const verifiedCustomers = numberOrZero(dashboardData?.verifiedCustomers);
  const totalStaff = numberOrZero(dashboardData?.totalStaff);
  const activeStaff = numberOrZero(dashboardData?.activeStaff);

  const completionPercentage = totalServices ? Math.round((completedServices / totalServices) * 100) : 0;

  const stats = [
    {
      title: "Total services",
      value: totalServices,
      description: "all registered services",
      icon: <Database className="w-5 h-5 text-blue-600" />,
    },
    {
      title: "Pending",
      value: pendingServices,
      description: "awaiting action",
      icon: <Clock3 className="w-5 h-5 text-amber-600" />,
    },
    {
      title: "In progress",
      value: inProgressServices,
      description: "currently moving",
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    },
    {
      title: "Completed",
      value: completedServices,
      description: "successfully finished",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
  ];

  const workflowMetrics: Array<[string, number]> = [
    ["Pending services", pendingServices],
    ["In progress", inProgressServices],
    ["Completed", completedServices],
    ["Active staff", activeStaff],
  ];

  const riskRows: Array<{ label: string; count: number; tone: "amber" | "blue" | "emerald" }> = [
    { label: "Pending services", count: pendingServices, tone: "amber" },
    { label: "In progress", count: inProgressServices, tone: "blue" },
    { label: "Completed", count: completedServices, tone: "emerald" },
  ];

  const queueItems: Array<{
    id: string;
    title: string;
    importer: string;
    route: string;
    status: string;
    updated: string;
  }> = (dashboardData?.recentServices ?? []).map((service, index) => ({
    id: String(service.serviceNumber ?? service.id ?? `SVC-${index + 1}`),
    title: String(service.itemDescription ?? `Service ${service.id ?? index + 1}`),
    importer: String(service.importerName ?? service.countryOfOrigin ?? "Import service"),
    route: String(
      [service.countryOfOrigin, service.routeCategory].filter((value) => value !== null && value !== undefined && value !== "").join(" • ") || "No route details available"
    ),
    status: String(service.status === 2 ? "In progress" : service.status === 1 ? "Pending" : "Completed"),
    updated: String(service.lastUpdateDate ? new Date(service.lastUpdateDate).toLocaleDateString() : "Recently updated"),
  }));

  const activityItems: Array<{
    title: string;
    description: string;
    time: string;
    type: "approval" | "service" | "risk" | "assessment";
  }> = [
    {
      title: "Customer verification",
      description: `${verifiedCustomers} of ${totalCustomers} customers are currently verified in the system.`,
      time: "Current snapshot",
      type: "approval",
    },
    {
      title: "Operational staff",
      description: `${activeStaff} of ${totalStaff} staff members are active this cycle.`,
      time: "Live status",
      type: "service",
    },
    {
      title: "Pending services",
      description: `${pendingServices} services still require action from the management team.`,
      time: "Needs attention",
      type: "risk",
    },
    {
      title: "Closed services",
      description: `${completedServices} services are completed in the current reporting window.`,
      time: "Recent result",
      type: "assessment",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <span>Ministry of Transport</span>
                <span className="text-slate-300">/</span>
                <span>Import Operations</span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Manager Dashboard
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor services, customer coverage, staff availability, and operational throughput across the import portfolio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span className="text-sm font-medium text-slate-600">System operational</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Users className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">{activeStaff}/{totalStaff} staff active</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  {stat.icon}
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  +0.0%
                </span>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>

                <div className="mt-1 flex items-end gap-2">
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                </div>

                <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Case workflow</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Operational progress</h2>
                <p className="mt-1 text-sm text-slate-500">Live service workload from the manager dashboard.</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Live data</span>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Completion rate</span>
                <span className="font-semibold text-slate-950">{completionPercentage}%</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900 transition-[width]" style={{ width: `${completionPercentage}%` }} />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {workflowMetrics.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Risk monitoring</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Portfolio health</h2>
                <p className="mt-1 text-sm text-slate-500">Current service balance across the queue.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {riskRows.map(({ label, count, tone }) => {
                const width = tone === "amber" ? "w-[60%]" : tone === "blue" ? "w-[48%]" : "w-[72%]";
                const color = tone === "amber" ? "bg-amber-500" : tone === "blue" ? "bg-blue-500" : "bg-emerald-500";

                return (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{label}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${color} ${width}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <DashboardOverview />

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Service queue</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent services</h2>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-500">{queueItems.length} records</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Importer</th>
                    <th className="px-6 py-3.5">Route</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Updated</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {queueItems.length ? queueItems.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{item.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{item.importer}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{item.route}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Completed" ? "bg-emerald-50 text-emerald-700" : item.status === "In progress" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{item.updated}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        No recent services returned by the API.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Audit trail</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent activity</h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {activityItems.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      {item.type === "assessment" ? <CheckCircle2 className="h-4 w-4" /> : item.type === "risk" ? <AlertTriangle className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                    </div>
                    {index !== activityItems.length - 1 && <div className="mt-1 h-full w-px bg-slate-200" />}
                  </div>

                  <div className="pb-1">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-400 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span>All operational activity is logged and auditable.</span>
          </div>

          <span>MOT Import Services · Operations Directorate</span>
        </section>
      </div>
    </main>
  );
}