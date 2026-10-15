"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  Hand,
  Layers,
  LoaderCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useManagerStore } from "@/modules/manager/manager.store";
import type { ManagerServiceDetail } from "@/modules/manager/manager.type";
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
    1: { label: "Blue channel", className: "border-sky-200 bg-sky-50 text-sky-700" },
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
  if (!Number.isFinite(timestamp) || timestamp <= 0 || now === null) return "Recently updated";

  const elapsedMinutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

const reportMonth = (year: number, month: number): string =>
  new Date(year, month - 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });

const readSafeText = (value: unknown, keys: string[]): string => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if ((typeof candidate === "string" || typeof candidate === "number") && String(candidate).trim()) {
      return String(candidate);
    }
  }
  return "";
};

const personName = (person: ManagerServiceDetail["importer"]): string =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") || person?.username || "Not assigned";

const statusBadgeClass = (status: string): string => {
  if (status === "Completed" || status === "Delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "In progress" || status === "Approved") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "Rejected" || status === "Blocked") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Requires customer action") return "border-purple-200 bg-purple-50 text-purple-700";
  if (status === "Needs review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "Blocked") return <Ban className="h-3 w-3" />;
  if (status === "Requires customer action") return <Hand className="h-3 w-3" />;
  if (status === "Needs review") return <Eye className="h-3 w-3" />;
  if (status === "In progress") return <LoaderCircle className="h-3 w-3" />;
  if (status === "Completed" || status === "Delivered") return <CheckCircle2 className="h-3 w-3" />;
  return <Clock3 className="h-3 w-3" />;
};

interface ManagerDashboardProps {
  isManagerRoute?: boolean;
}

export default function ManagerDashboard({ isManagerRoute = false }: ManagerDashboardProps) {
  const {
    dashboardData,
    fetchDashboard,
    loading,
    error,
    reportsAnalytics,
    reportsLoading,
    reportsError,
    fetchReportsAnalytics,
    notifications,
    notificationsLoading,
    notificationsError,
    fetchNotifications,
    selectedService,
    fetchServiceById,
    serviceDetailLoading,
    serviceDetailError,
  } = useManagerStore();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    void fetchDashboard();
    if (isManagerRoute) void fetchReportsAnalytics();
    if (isManagerRoute) void fetchNotifications();
  }, [fetchDashboard, fetchReportsAnalytics, fetchNotifications, isManagerRoute]);

  useEffect(() => {
    if (!detailsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [detailsOpen]);

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
      title: "Total services",
      value: dashboardData?.totalServices ?? "—",
      description: "all registered services",
      icon: <Layers className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Pending services",
      value: dashboardData?.pendingServices ?? "—",
      description: "",
      icon: <Clock3 className="h-4 w-4 text-amber-600" />,
      accent: "border-l-amber-500",
    },
    {
      title: "In progress",
      value: dashboardData?.inProgressServices ?? "—",
      description: "",
      icon: <LoaderCircle className="h-4 w-4 text-blue-600" />,
      accent: "border-l-blue-500",
    },
    {
      title: "Completed services",
      value: dashboardData?.completedServices ?? "—",
      description: "",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      accent: "border-l-emerald-600",
    },
    {
      title: "Open cases",
      value: dashboardData?.openCases ?? "—",
      description: "",
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
      description: "",
      icon: <Clock3 className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Cleared this month",
      value: dashboardData?.clearedThisMonth ?? "—",
      description: "",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      accent: "border-l-emerald-600",
    },
    {
      title: "Total customers",
      value: dashboardData?.totalCustomers ?? "—",
      description: "",
      icon: <Users className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Verified customers",
      value: dashboardData?.verifiedCustomers ?? "—",
      description: "",
      icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
      accent: "border-l-emerald-600",
    },
    {
      title: "Total staff",
      value: dashboardData?.totalStaff ?? "—",
      description: "",
      icon: <Users className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Active staff",
      value: dashboardData?.activeStaff ?? "—",
      description: "",
      icon: <ShieldCheck className="h-4 w-4 text-blue-600" />,
      accent: "border-l-blue-500",
    },
  ];
  const latestMonthlyStats =
    dashboardData?.monthlyServiceStats[dashboardData.monthlyServiceStats.length - 1];

  const managerStats = [
    {
      title: "Open cases",
      value: dashboardData?.openCases ?? "—",
      description: "",
      icon: <Layers className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Needs attention",
      value: dashboardData?.needsAttention ?? "—",
      description: "",
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      accent: "border-l-amber-500",
    },
    {
      title: "Due within 48h",
      value: dashboardData?.dueWithin48Hours ?? "—",
      description: "",
      icon: <Clock3 className="h-4 w-4 text-slate-500" />,
      accent: "border-l-slate-300",
    },
    {
      title: "Cleared this month",
      value: dashboardData?.clearedThisMonth ?? "—",
      description: "",
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

  const queueItems = (dashboardData?.recentServices ?? [])
    .map((service) => {
      const lastUpdatedAt = Date.parse(service.lastUpdateDate ?? service.registeredDate ?? "");
      const serviceId = service.serviceNumber || (service.id === undefined ? "" : String(service.id));
      const status = service.isBlocked
        ? "Blocked"
        : service.requiresCustomerAction
          ? "Requires customer action"
          : serviceStatus(service.status);
      const channel = riskChannel(service.riskLevel);
      const riskPriority = channel
        ? { "Red channel": 4, "Yellow channel": 3, "Green channel": 2, "Blue channel": 1 }[channel.label] ?? 0
        : 0;

      return {
        recordId: service.id,
        id: serviceId,
        title: String(service.itemDescription ?? ""),
        importer: String(service.importerName ?? "Importer unavailable"),
        route: String(
          [service.origin, service.destination]
            .filter((value) => typeof value === "string" && value.trim())
            .join(" → ") ||
          [service.countryOfOrigin, service.routeCategory]
            .filter((value) => value !== null && value !== undefined && value !== "")
            .join(" • ") ||
          "No route details available"
        ),
        status,
        channel,
        riskPriority,
        attentionPriority: service.isBlocked || service.requiresCustomerAction ? 1 : 0,
        lastUpdatedAt: Number.isFinite(lastUpdatedAt) ? lastUpdatedAt : 0,
        updated: timeAgo(service.lastUpdateDate ?? service.registeredDate, currentTime),
      };
    })
    .filter((item) =>
      item.recordId !== undefined
      && item.id
      && !["Draft", "Completed", "Delivered", "Rejected", "Cancelled"].includes(item.status),
    )
    .sort((a, b) =>
      b.attentionPriority - a.attentionPriority
      || b.riskPriority - a.riskPriority
      || a.lastUpdatedAt - b.lastUpdatedAt,
    )
    .slice(0, 5);

  const loadServiceDetails = async (id: number | string | undefined) => {
    if (id === undefined) return;
    setDetailsOpen(true);
    await fetchServiceById(id);
  };

  const reportSummary = reportsAnalytics
    ? [
        { label: "Open cases", value: reportsAnalytics.openCases },
        { label: "Completed year to date", value: reportsAnalytics.completedYearToDate },
        {
          label: "On-time clearance",
          value: reportsAnalytics.onTimeClearanceRate === null
            ? "Unavailable"
            : `${reportsAnalytics.onTimeClearanceRate}%`,
        },
        {
          label: "Average stage duration",
          value: reportsAnalytics.averageStageDurationHours === null
            ? "Unavailable"
            : `${reportsAnalytics.averageStageDurationHours} h`,
        },
      ]
    : [];
  const maxRiskCount = Math.max(
    1,
    ...(reportsAnalytics?.riskChannels.map((row) => row.count) ?? []),
  );

  const dashboardStats = isManagerRoute ? managerStats : stats;

  return (
    <main
      className={`min-h-screen bg-[#f7f8fa] ${
        isManagerRoute
          ? "-mx-4 -mt-4 p-4 sm:-mx-6 sm:-mt-6 sm:p-6 lg:-mx-8 lg:-mt-8 lg:p-8"
          : "px-4 py-5 sm:px-6 lg:px-8"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        {/* Header Banner */}
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
                Operations across every importer, corridor and case.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {isManagerRoute && (
                <button
                  type="button"
                  onClick={() => {
                    void fetchDashboard();
                    void fetchNotifications();
                  }}
                  disabled={loading || notificationsLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${loading || notificationsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              )}
              <Link
                href={`/${lang}/admin/manager/services`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Open case register
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load manager dashboard: {error}
          </p>
        )}
        {loading && !dashboardData && (
          <p role="status" className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Loading manager dashboard...
          </p>
        )}

        <section className={`order-1 grid gap-3 sm:grid-cols-2 ${isManagerRoute ? "xl:grid-cols-4" : "lg:grid-cols-4 xl:grid-cols-6"}`}>
          {dashboardStats.map((stat) => (
            <div
              key={stat.title}
              className={`group min-w-0 rounded-md border border-l-2 border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md ${stat.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-600">{stat.title}</p>
                {stat.icon}
              </div>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
              {stat.description && (
                <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
              )}
            </div>
          ))}
        </section>

        {!isManagerRoute && latestMonthlyStats && (
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Monthly service summary</h2>
              <p className="text-xs text-slate-500">
                {latestMonthlyStats.month ?? "—"}/{latestMonthlyStats.year ?? "—"}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Total services</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {latestMonthlyStats.totalServices ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Completed services</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {latestMonthlyStats.completedServices ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Completion rate</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {latestMonthlyStats.completionRate === undefined
                    ? "—"
                    : `${latestMonthlyStats.completionRate}%`}
                </p>
              </div>
            </div>
          </section>
        )}

        {isManagerRoute && (
          <section className="order-3 space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Reports analytics</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">Operations performance</h2>
                <p className="mt-1 text-sm text-slate-500">Live insights from manager reports.</p>
              </div>
              <button
                type="button"
                onClick={() => void fetchReportsAnalytics()}
                disabled={reportsLoading}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reportsLoading ? "animate-spin" : ""}`} />
                Refresh analytics
              </button>
            </div>

            {reportsError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Unable to load manager reports: {reportsError}
              </p>
            )}
            {reportsLoading && !reportsAnalytics && (
              <p role="status" className="rounded-md bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                Loading reports analytics...
              </p>
            )}

            {reportsAnalytics && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {reportSummary.map(({ label, value }) => (
                    <div key={label} className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                        {typeof value === "number" ? value.toLocaleString() : value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-md border border-slate-200">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <h3 className="text-sm font-semibold text-slate-800">Monthly throughput</h3>
                    </div>
                    {reportsAnalytics.monthlyThroughput.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[440px] text-left text-xs">
                          <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Month</th>
                              <th className="px-3 py-2 text-right font-semibold">Multimodal</th>
                              <th className="px-3 py-2 text-right font-semibold">Unimodal</th>
                              <th className="px-3 py-2 text-right font-semibold">Completed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportsAnalytics.monthlyThroughput.map((row) => (
                              <tr key={`${row.year}-${row.month}`}>
                                <th scope="row" className="px-3 py-2 font-medium text-slate-700">
                                  {reportMonth(row.year, row.month)}
                                </th>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.multimodal}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.unimodal}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.completed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="px-3 py-5 text-center text-xs text-slate-500">No monthly throughput data is available.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-md border border-slate-200 p-3">
                      <h3 className="text-sm font-semibold text-slate-800">Risk channels</h3>
                      {reportsAnalytics.riskChannels.length ? (
                        <div className="mt-3 space-y-2.5">
                          {reportsAnalytics.riskChannels.map((row) => (
                            <div key={row.channel}>
                              <div className="mb-1 flex justify-between gap-3 text-xs">
                                <span className="text-slate-600">{row.channel}</span>
                                <span className="font-semibold tabular-nums text-slate-800">{row.count}</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-blue-600"
                                  style={{ width: `${Math.min(100, (row.count / maxRiskCount) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No risk channel counts are available.</p>
                      )}
                    </div>

                    <div className="rounded-md border border-slate-200 p-3">
                      <h3 className="text-sm font-semibold text-slate-800">Average duration by stage</h3>
                      {reportsAnalytics.stageDurations.length ? (
                        <ul className="mt-2 divide-y divide-slate-100">
                          {reportsAnalytics.stageDurations.map((row) => (
                            <li key={row.stage} className="flex justify-between gap-3 py-2 text-xs">
                              <span className="text-slate-600">{row.stage.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>
                              <span className="font-semibold tabular-nums text-slate-800">{row.averageHours} h</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No stage duration data is available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <h3 className="text-sm font-semibold text-slate-800">Executor performance</h3>
                  </div>
                  {reportsAnalytics.executorPerformance.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-xs">
                        <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Executor</th>
                            <th className="px-3 py-2 text-right font-semibold">Closed</th>
                            <th className="px-3 py-2 text-right font-semibold">Avg cycle days</th>
                            <th className="px-3 py-2 text-right font-semibold">Open load</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportsAnalytics.executorPerformance.map((row) => (
                            <tr key={row.executorId}>
                              <th scope="row" className="px-3 py-2 font-medium text-slate-700">{row.executorName}</th>
                              <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.casesClosed}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.averageCycleDays ?? "—"}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.openLoad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-3 py-5 text-center text-xs text-slate-500">No executor performance data is available.</p>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* Priority Queue and Activity */}
        <section className="order-2 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Priority queue</h2>
                <p className="mt-1 text-xs text-slate-500">Sorted by risk channel and time in stage</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {queueItems.length ? (
                queueItems.map((item, index) => (
                  <article
                    key={`${item.id}-${index}`}
                    className={`px-4 py-3 transition-colors hover:bg-slate-50/70 ${
                      item.status === "Needs review" ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-blue-700">{item.id}</span>
                        <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(item.status)}`}>
                          <StatusIcon status={item.status} />
                          {item.status}
                        </span>
                        {item.channel ? (
                          <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium ${item.channel.className}`}>
                            <Shield className="h-3 w-3" />
                            {item.channel.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <Shield className="h-3 w-3" />
                            Unassigned channel
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">Updated {item.updated}</span>
                        <button
                          type="button"
                          onClick={() => void loadServiceDetails(item.recordId)}
                          disabled={item.recordId === undefined || serviceDetailLoading}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          View details
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-2 text-sm font-medium leading-5 text-slate-900">{item.title || "Description unavailable"}</h3>
                    <p className="mt-1 text-xs leading-4 text-slate-500">
                      {item.importer} <span className="text-slate-300">·</span> {item.route}
                    </p>
                  </article>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No recent services returned by the API.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Latest activity</h2>
                {isManagerRoute && (
                  <Link
                    href={`/${lang}/admin/manager/notifications`}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View all
                  </Link>
                )}
              </div>
            </div>

            {isManagerRoute && notificationsError && (
              <p role="alert" className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Unable to load notifications: {notificationsError}
              </p>
            )}

            <div className="divide-y divide-slate-100">
              {notifications.length ? (
              notifications.slice(0, 6).map((item) => (
                  <div
                  key={item.id}
                    className="px-3 py-3"
                  >
                    <p className="text-xs font-semibold leading-4 text-slate-900">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      {item.category} <span className="text-slate-300">·</span> {item.time}
                    {item.referenceId && <> <span className="text-slate-300">·</span> {item.referenceId}</>}
                  </p>
                </div>
              ))
              ) : (
              <p className="px-4 py-8 text-center text-xs text-slate-500">
                {notificationsLoading ? "Loading notifications..." : "No notifications returned by the API."}
              </p>
              )}
            </div>
          </div>
        </section>

        {!isManagerRoute && (
          <>
            {/* Case Workflow & Risk Monitoring Sections */}
            <section className="order-4 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
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

            <div className="order-5">
              <DashboardOverview />
            </div>

            <section className="order-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-400 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <span>All operational activity is logged and auditable.</span>
              </div>

              <span>MOT Import Services · Operations Directorate</span>
            </section>
          </>
        )}
      </div>
      {detailsOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="manager-service-details-title"
            className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service details</p>
                <h2 id="manager-service-details-title" className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedService?.trackingNumber ?? "Loading service..."}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label="Close service details"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-5 p-5">
              {serviceDetailLoading && (
                <p role="status" className="py-8 text-center text-sm text-slate-500">
                  Loading service details...
                </p>
              )}
              {serviceDetailError && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {serviceDetailError}
                </p>
              )}
              {selectedService && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Shipment overview</h3>
                    <p className="mt-1 text-sm text-slate-600">{selectedService.description || "No description available."}</p>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Importer", personName(selectedService.importer)],
                        ["Status", serviceStatus(selectedService.status)],
                        ["Origin", selectedService.countryOfOrigin || selectedService.origin || "—"],
                        ["Destination", selectedService.destination || selectedService.routeCategory || "—"],
                        ["Declared value", selectedService.declaredValue ?? "—"],
                        ["Tax category", selectedService.taxCategory || "—"],
                        ["Service mode", selectedService.mode ?? selectedService.serviceType ?? "—"],
                        ["Risk channel", riskChannel(selectedService.riskLevel)?.label ?? "Unassigned"],
                        ["Created", selectedService.createAt ? new Date(selectedService.createAt).toLocaleString() : "—"],
                        ["Assigned case executor", personName(selectedService.assignedCaseExecutor)],
                        ["Assigned assessor", personName(selectedService.assignedAssessor)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                          <dd className="mt-1 break-words text-sm text-slate-800">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Service stages ({selectedService.stages.length})
                    </h3>
                    {selectedService.stages.length ? (
                      <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                        {selectedService.stages.map((stage, index) => {
                          const name = readSafeText(stage, ["stageName", "name", "title"]) || `Stage ${index + 1}`;
                          const status = readSafeText(stage, ["status", "stageStatus", "currentStatus"]);
                          const updated = readSafeText(stage, ["completedAt", "updatedAt", "createdAt"]);
                          return (
                            <li key={`${name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                              <span className="font-medium text-slate-700">{name}</span>
                              <span className="text-slate-500">
                                {[status, updated ? new Date(updated).toLocaleDateString() : ""].filter(Boolean).join(" · ") || "Status unavailable"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">No workflow stages are available.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Documents ({selectedService.documents.length})
                    </h3>
                    {selectedService.documents.length ? (
                      <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                        {selectedService.documents.map((document, index) => {
                          const fileName =
                            document.originalFileName ||
                            document.fileName ||
                            `Document ${index + 1}`;
                          return (
                            <li key={`${fileName}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                              <span className="break-all font-medium text-slate-700">{fileName}</span>
                              <span className="text-slate-500">
                                {document.isVerified ? "Verified" : "Pending verification"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">No documents are attached.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Messages ({selectedService.messages.length})
                    </h3>
                    {selectedService.messages.length ? (
                      <ul className="mt-2 space-y-2">
                        {selectedService.messages.map((message) => (
                          <li key={message.id} className="rounded-md border border-slate-200 px-3 py-2">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">{message.subject || "Service message"}</p>
                              <p className="text-[11px] text-slate-500">
                                {message.createdDate ? new Date(message.createdDate).toLocaleString() : ""}
                              </p>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-600">{message.content}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">No messages are available.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}