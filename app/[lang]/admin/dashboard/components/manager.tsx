"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, Layers, ShieldCheck } from "lucide-react";
import { useManagerStore } from "@/modules/manager/manager.store";
import DashboardOverview from "./dashboard-overview";

const numberOrZero = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const serviceStatus = (value: unknown): string => {
  const status = Number(value);
  const labels: Record<number, string> = {
    1: "Draft",
    2: "Pending",
    3: "Needs review",
    4: "Approved",
    5: "In progress",
    6: "Completed",
    7: "Rejected",
    8: "Cancelled",
    9: "Delivered",
  };
  if (labels[status]) return labels[status];

  const statusNames: Record<string, string> = {
    draft: "Draft",
    submitted: "Pending",
    pending: "Pending",
    underreview: "Needs review",
    needsreview: "Needs review",
    approved: "Approved",
    inprogress: "In progress",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    delivered: "Delivered",
  };
  const normalizedStatus = typeof value === "string" ? value.toLowerCase().replace(/[\s_-]/g, "") : "";

  return statusNames[normalizedStatus] ?? (typeof value === "string" && value.trim() ? value : "Status unavailable");
};

const riskChannel = (value: unknown): { label: string; className: string } | null => {
  const risk = Number(value);
  const channels: Record<number, { label: string; className: string }> = {
    1: { label: "Blue channel", className: "border-blue-200 bg-blue-50 text-blue-700" },
    2: { label: "Green channel", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    3: { label: "Yellow channel", className: "border-amber-200 bg-amber-50 text-amber-700" },
    4: { label: "Red channel", className: "border-red-200 bg-red-50 text-red-700" },
  };
  if (channels[risk]) return channels[risk];

  const riskNames: Record<string, number> = { blue: 1, green: 2, yellow: 3, red: 4 };
  const normalizedRisk = typeof value === "string" ? value.trim().toLowerCase() : "";

  return channels[riskNames[normalizedRisk]] ?? null;
};

const timeAgo = (value: unknown, now: number | null): string => {
  if (typeof value !== "string" || !value) return "Recently updated";

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || now === null) return "Recently updated";

  const elapsedMinutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

const statusBadgeClass = (status: string): string => {
  if (status === "Completed" || status === "Delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "In progress" || status === "Approved") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "Rejected") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Cancelled" || status === "Draft") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

interface ManagerDashboardProps {
  isManagerRoute?: boolean;
}

export default function ManagerDashboard({ isManagerRoute = false }: ManagerDashboardProps) {
  const { dashboardData, fetchDashboard } = useManagerStore();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();

    const intervalId = window.setInterval(updateCurrentTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const totalServices = numberOrZero(dashboardData?.totalServices);
  const pendingServices = numberOrZero(dashboardData?.pendingServices);
  const inProgressServices = numberOrZero(dashboardData?.inProgressServices);
  const completedServices = numberOrZero(dashboardData?.completedServices);
  const activeStaff = numberOrZero(dashboardData?.activeStaff);

  const completionPercentage = totalServices ? Math.round((completedServices / totalServices) * 100) : 0;

  const stats = [
    {
      title: "Open cases",
      value: dashboardData?.openCases ?? "—",
      description: dashboardData?.openCases === undefined ? "live count unavailable" : "submitted, reviewed, approved, and in progress",
      icon: <Layers className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Needs attention",
      value: dashboardData?.needsAttention ?? "—",
      description: dashboardData?.needsAttention === undefined ? "live count unavailable" : "risk or stage review",
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      accent: "border-l-amber-500",
    },
    {
      title: "Due within 48h",
      value: dashboardData?.dueWithin48Hours ?? "—",
      description: dashboardData?.dueWithin48Hours == null ? "due dates unavailable" : "open cases approaching deadline",
      icon: <Clock3 className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Cleared this month",
      value: dashboardData?.clearedThisMonth ?? "—",
      description: dashboardData?.clearedThisMonth === undefined ? "live count unavailable" : "completed this month",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      accent: "border-l-emerald-600",
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
    channel: { label: string; className: string } | null;
    riskPriority: number;
    lastUpdatedAt: number;
    updated: string;
  }> = (dashboardData?.recentServices ?? [])
    .map((service, index) => {
      const lastUpdatedAt = Date.parse(service.lastUpdateDate ?? service.registeredDate ?? "");

      return {
        id: String(service.serviceNumber || service.id || `SVC-${index + 1}`),
        title: String(service.itemDescription ?? `Service ${service.id ?? index + 1}`),
        importer: String(service.importerName ?? service.countryOfOrigin ?? "Import service"),
        route: String(
          [service.countryOfOrigin, service.routeCategory].filter((value) => value !== null && value !== undefined && value !== "").join(" • ") || "No route details available"
        ),
        status: serviceStatus(service.status),
        channel: riskChannel(service.riskLevel),
        riskPriority: numberOrZero(service.riskLevel),
        lastUpdatedAt: Number.isFinite(lastUpdatedAt) ? lastUpdatedAt : 0,
        updated: timeAgo(service.lastUpdateDate ?? service.registeredDate, currentTime),
      };
    })
    .sort((a, b) => b.riskPriority - a.riskPriority || a.lastUpdatedAt - b.lastUpdatedAt);

  const activityItems = (dashboardData?.recentServices ?? []).slice(0, 6).map((service, index) => {
    const serviceId = String(service.serviceNumber || service.id || `SVC-${index + 1}`);
    const description = String(service.itemDescription ?? "Service details unavailable");
    const importer = String(service.importerName ?? "Importer unavailable");

    return {
      id: serviceId,
      title: `${serviceStatus(service.status)} — ${serviceId}`,
      description: `${description} · ${importer}`,
      time: timeAgo(service.lastUpdateDate, currentTime),
    };
  });

  return (
    <main
      className={`min-h-screen bg-[#f7f8fa] ${
        isManagerRoute
          ? "-mx-4 -mt-4 p-4 sm:-mx-6 sm:-mt-6 sm:p-6 lg:-mx-8 lg:-mt-8 lg:p-8"
          : "px-4 py-5 sm:px-6 lg:px-8"
      }`}
    >
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section
          className={`border-b border-slate-200 pb-5 pt-1 sm:pb-6 ${
            isManagerRoute
              ? "-mx-4 -mt-4 bg-white px-4 pt-6 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8"
              : "px-1"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Import Directorate
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Directorate overview
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Operations across importers, services, and cases.
              </p>
            </div>

            <Link
              href={`/${lang}/admin/manager/cases`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Open case register
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`group min-w-0 rounded-md border border-l-2 border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md ${stat.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-600">{stat.title}</p>
                {stat.icon}
              </div>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Priority queue</h2>
                  <p className="mt-1 text-xs text-slate-500">Sorted by risk channel and last update</p>
                </div>

                <span className="text-xs text-slate-500">{queueItems.length} services</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {queueItems.length ? queueItems.map((item, index) => (
                <article key={`${item.id}-${index}`} className="px-4 py-3 transition-colors hover:bg-slate-50/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-blue-700">{item.id}</span>
                      <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                      {item.channel && (
                        <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-medium ${item.channel.className}`}>
                          {item.channel.label}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">Updated {item.updated}</span>
                  </div>

                  <h3 className="mt-2 text-sm font-medium text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.importer} <span className="text-slate-300">·</span> {item.route}
                  </p>
                </article>
              )) : (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No recent services returned by the API.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Latest activity</h2>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {activityItems.length ? activityItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="px-4 py-3">
                  <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">{item.time}</p>
                </div>
              )) : (
                <p className="px-4 py-8 text-center text-xs text-slate-500">
                  No recent activity returned by the API.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Case workflow</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">Operational progress</h2>
                <p className="mt-1 text-sm text-slate-500">Live service workload from the manager dashboard.</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">Live data</span>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Completion rate</span>
                <span className="font-semibold text-slate-950">{completionPercentage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900 transition-[width]" style={{ width: `${completionPercentage}%` }} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {workflowMetrics.map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Risk monitoring</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">Portfolio health</h2>
                <p className="mt-1 text-sm text-slate-500">Current service balance across the queue.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-slate-500" />
            </div>

            <div className="mt-5 space-y-4">
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