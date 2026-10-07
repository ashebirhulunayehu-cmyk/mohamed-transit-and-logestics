"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { ManagerEndpoints } from "@/modules/manager/manager.endpoint";
import { useManagerStore } from "@/modules/manager/manager.store";

type RecordValue = Record<string, unknown>;

interface ReportService {
  id: string;
  status: string;
  risk: string;
  executorId: string | null;
  executorName: string | null;
}

interface ExecutorWorkload {
  id: string;
  name: string;
  closed: number;
  open: number;
}

const asRecord = (value: unknown): RecordValue | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as RecordValue
    : null;

const readField = (record: RecordValue, ...fieldNames: string[]): unknown => {
  for (const name of fieldNames) {
    const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    if (key !== undefined) return record[key];
  }
  return undefined;
};

const readId = (value: unknown): string | null =>
  typeof value === "string" || typeof value === "number" ? String(value) : null;

const readName = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = asRecord(value);
  if (!record) return null;
  const name = [record.firstName, record.lastName]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .join(" ")
    .trim();
  if (name) return name;
  return typeof record.username === "string" && record.username.trim()
    ? record.username.trim()
    : null;
};

const unwrapRows = (value: unknown, depth = 0): unknown[] => {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record || depth >= 6) return [];

  for (const key of ["data", "payload", "response", "result", "items", "services", "staff", "users"]) {
    const nested = readField(record, key);
    if (nested !== undefined && nested !== value) {
      const rows = unwrapRows(nested, depth + 1);
      if (rows.length || Array.isArray(nested)) return rows;
    }
  }
  return [];
};

const normalizeStatus = (value: unknown): string => {
  const status = String(value ?? "").trim().toLowerCase();
  if (status.includes("complete") || status === "4") return "Completed";
  if (status.includes("block") || status === "5") return "Blocked";
  if (status.includes("review") || status === "3") return "Needs review";
  if (status.includes("progress") || status === "2") return "In progress";
  if (status.includes("action")) return "Customer action";
  if (status.includes("pending") || status === "1") return "Pending";
  return status ? "Other" : "Unknown";
};

const normalizeRisk = (value: unknown): string => {
  const risk = String(value ?? "").trim().toLowerCase();
  if (risk.includes("red") || risk === "3") return "Red";
  if (risk.includes("yellow") || risk === "2") return "Yellow";
  if (risk.includes("green") || risk === "1") return "Green";
  if (risk.includes("blue") || risk === "0") return "Blue";
  return "Unspecified";
};

const normalizeService = (value: unknown, index: number): ReportService | null => {
  const record = asRecord(value);
  if (!record) return null;

  const executor = readField(record, "assignedCaseExecutor", "caseExecutor", "executor");
  const executorId = readId(readField(record, "assignedCaseExecutorId", "caseExecutorId", "executorId"))
    ?? readId(readField(asRecord(executor) ?? {}, "id", "userId"));

  return {
    id: readId(readField(record, "id", "serviceId", "trackingNumber", "serviceNumber")) ?? String(index + 1),
    status: normalizeStatus(readField(record, "status", "serviceStatus", "currentStatus")),
    risk: normalizeRisk(readField(record, "riskLevel", "riskChannel", "inspectionChannel", "channel")),
    executorId,
    executorName: readName(executor)
      ?? readName(readField(record, "executorName", "assignedExecutorName")),
  };
};

const formatMonth = (year?: number, month?: number): string => {
  if (!year || !month || month < 1 || month > 12) return "Period unavailable";
  return new Date(year, month - 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

const formatCount = (value: number): string => value.toLocaleString();

function LineChart({
  rows,
}: {
  rows: { label: string; total: number; completed: number }[];
}) {
  if (!rows.length) {
    return <EmptyChart message="Monthly throughput data is not available." />;
  }

  const width = Math.max(480, rows.length * 92);
  const height = 250;
  const left = 42;
  const right = width - 18;
  const top = 18;
  const bottom = 205;
  const max = Math.max(1, ...rows.flatMap((row) => [row.total, row.completed]));
  const x = (index: number) =>
    rows.length === 1 ? (left + right) / 2 : left + ((right - left) * index) / (rows.length - 1);
  const y = (value: number) => bottom - ((bottom - top) * value) / max;
  const points = (key: "total" | "completed") =>
    rows.map((row, index) => `${x(index)},${y(row[key])}`).join(" ");

  return (
    <div className="overflow-x-auto px-4 py-5">
      <svg role="img" aria-label="Monthly service and completed case throughput" viewBox={`0 0 ${width} ${height}`} className="h-[250px] min-w-full">
        {[0, 1, 2, 3, 4].map((tick) => {
          const tickY = top + ((bottom - top) * tick) / 4;
          const label = Math.round(max * (4 - tick) / 4);
          return (
            <g key={tick}>
              <line x1={left} y1={tickY} x2={right} y2={tickY} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={left - 8} y={tickY + 4} textAnchor="end" fontSize="10" fill="#64748b">{label}</text>
            </g>
          );
        })}
        <polyline points={points("total")} fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points("completed")} fill="none" stroke="#166534" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {rows.map((row, index) => (
          <g key={`${row.label}-${index}`}>
            <circle cx={x(index)} cy={y(row.total)} r="3.5" fill="#1d4ed8" />
            <circle cx={x(index)} cy={y(row.completed)} r="3.5" fill="#166534" />
            <text x={x(index)} y={bottom + 24} textAnchor="middle" fontSize="10" fill="#64748b">{row.label}</text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex justify-center gap-5 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-700" />Services</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-800" />Completed</span>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function ManagerReportsPage() {
  const dashboardData = useManagerStore((state) => state.dashboardData);
  const dashboardLoading = useManagerStore((state) => state.loading);
  const dashboardError = useManagerStore((state) => state.error);
  const fetchDashboard = useManagerStore((state) => state.fetchDashboard);
  const [services, setServices] = useState<ReportService[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    await fetchDashboard();

    const results = await Promise.allSettled([
      ManagerEndpoints.getAllServices(),
      ManagerEndpoints.getAllStaff(),
    ]);
    const [serviceResult, staffResult] = results;
    const errors: string[] = [];

    if (serviceResult.status === "fulfilled") {
      setServices(
        unwrapRows(serviceResult.value)
          .map(normalizeService)
          .filter((service): service is ReportService => service !== null),
      );
    } else {
      setServices([]);
      errors.push("Service breakdown could not be loaded.");
    }

    if (staffResult.status === "fulfilled") {
      setStaff(
        unwrapRows(staffResult.value)
          .map((value, index) => {
            const record = asRecord(value);
            if (!record) return null;
            const id = readId(readField(record, "id", "userId")) ?? `staff-${index}`;
            return { id, name: readName(record) ?? "Unnamed staff member" };
          })
          .filter((member): member is { id: string; name: string } => member !== null),
      );
    } else {
      setStaff([]);
      errors.push("Staff workload could not be loaded.");
    }

    setReportError(errors.length ? errors.join(" ") : null);
    setReportLoading(false);
  }, [fetchDashboard]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const serviceStats = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach((service) => counts.set(service.status, (counts.get(service.status) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [services]);

  const riskStats = useMemo(() => {
    const order = ["Blue", "Green", "Yellow", "Red", "Unspecified"];
    const counts = new Map(order.map((risk) => [risk, 0]));
    services.forEach((service) => counts.set(service.risk, (counts.get(service.risk) ?? 0) + 1));
    return order.map((risk) => ({ risk, count: counts.get(risk) ?? 0 })).filter((item) => item.count > 0);
  }, [services]);

  const executorWorkload = useMemo<ExecutorWorkload[]>(() => {
    const workloads = new Map<string, ExecutorWorkload>();
    staff.forEach((member) => workloads.set(member.id, { ...member, closed: 0, open: 0 }));
    services.forEach((service) => {
      if (!service.executorId && !service.executorName) return;
      const id = service.executorId ?? service.executorName ?? "unknown";
      const workload = workloads.get(id) ?? {
        id,
        name: service.executorName ?? "Assigned executor",
        closed: 0,
        open: 0,
      };
      if (service.status === "Completed") workload.closed += 1;
      else workload.open += 1;
      workloads.set(id, workload);
    });
    return [...workloads.values()]
      .filter((workload) => workload.closed + workload.open > 0)
      .sort((a, b) => b.closed + b.open - (a.closed + a.open));
  }, [services, staff]);

  const totalServices = dashboardData?.totalServices ?? null;
  const completedServices = dashboardData?.completedServices ?? null;
  const completionRate = totalServices && completedServices !== null
    ? Math.round((completedServices / totalServices) * 100)
    : null;
  const throughput = (dashboardData?.monthlyServiceStats ?? []).map((stat, index) => ({
    label: formatMonth(stat.year, stat.month) === "Period unavailable" ? `Period ${index + 1}` : formatMonth(stat.year, stat.month),
    total: Number(stat.totalServices ?? 0),
    completed: Number(stat.completedServices ?? 0),
  }));

  const exportReport = () => {
    const rows: (string | number)[][] = [
      ["Manager report", new Date().toLocaleString()],
      ["Metric", "Value"],
      ["Total services", totalServices ?? "Unavailable"],
      ["Completed services", completedServices ?? "Unavailable"],
      ["Completion rate (%)", completionRate ?? "Unavailable"],
      ["Status", "Count"],
      ...serviceStats.map(([status, count]) => [status, count]),
      ["Risk channel", "Count"],
      ...riskStats.map(({ risk, count }) => [risk, count]),
      ["Executor", "Closed", "Open"],
      ...executorWorkload.map(({ name, closed, open }) => [name, closed, open]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "manager-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const totals = [
    { label: "Total services", value: totalServices, icon: Activity, tone: "blue" },
    { label: "Completed", value: completedServices, icon: CheckCircle2, tone: "emerald" },
    { label: "Completion rate", value: completionRate === null ? null : `${completionRate}%`, icon: BarChart3, tone: "cyan" },
    { label: "Open services", value: dashboardData ? dashboardData.pendingServices + dashboardData.inProgressServices : null, icon: Clock3, tone: "amber" },
  ];
  const riskColors: Record<string, string> = {
    Blue: "#2563eb",
    Green: "#166534",
    Yellow: "#a16207",
    Red: "#b91c1c",
    Unspecified: "#94a3b8",
  };
  const riskTotal = riskStats.reduce((sum, item) => sum + item.count, 0);
  let gradientCursor = 0;
  const riskGradient = riskStats.map(({ risk, count }) => {
    const start = riskTotal ? (gradientCursor / riskTotal) * 100 : 0;
    gradientCursor += count;
    const end = riskTotal ? (gradientCursor / riskTotal) * 100 : 0;
    return `${riskColors[risk]} ${start}% ${end}%`;
  }).join(", ");

  return (
    <main className="mx-auto max-w-[1500px] space-y-5 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Manager / Analytics</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Reports &amp; Analytics</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Live service throughput, risk distribution, workload and operational status from manager endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export report
          </button>
          <button
            type="button"
            onClick={() => void loadReport()}
            disabled={reportLoading || dashboardLoading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${reportLoading || dashboardLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {(dashboardError || reportError) && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{[dashboardError, reportError].filter(Boolean).join(" ")}</p>
        </div>
      )}

      <section aria-label="Service performance summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {totals.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-lg border border-slate-200 border-l-2 bg-white p-4 shadow-sm" style={{
            borderLeftColor: tone === "emerald" ? "#166534" : tone === "amber" ? "#a16207" : tone === "cyan" ? "#0891b2" : "#2563eb",
          }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950">
              {(dashboardLoading && !dashboardData) || (reportLoading && value === null)
                ? "…"
                : value === null ? "—" : typeof value === "number" ? formatCount(value) : value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Case throughput</h2>
            <p className="mt-0.5 text-xs text-slate-500">Monthly services and completed services from the manager dashboard.</p>
          </div>
          <LineChart rows={throughput} />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Risk channel mix</h2>
            <p className="mt-0.5 text-xs text-slate-500">Distribution across services returned by the manager service endpoint.</p>
          </div>
          {reportLoading ? (
            <EmptyChart message="Loading service risk data…" />
          ) : riskTotal === 0 ? (
            <EmptyChart message="Risk channel data is not available." />
          ) : (
            <div className="flex flex-col items-center gap-5 px-4 py-5">
              <div
                role="img"
                aria-label={`Risk mix across ${riskTotal} services`}
                className="relative h-44 w-44 rounded-full"
                style={{ background: `conic-gradient(${riskGradient})` }}
              >
                <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-semibold text-slate-900">{formatCount(riskTotal)}</span>
                  <span className="text-xs text-slate-500">services</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
                {riskStats.map(({ risk, count }) => (
                  <span key={risk} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: riskColors[risk] }} />
                    {risk} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Service status distribution</h2>
            <p className="mt-0.5 text-xs text-slate-500">Current statuses from the manager service list endpoint.</p>
          </div>
          {reportLoading ? (
            <EmptyChart message="Loading service status data…" />
          ) : serviceStats.length === 0 ? (
            <EmptyChart message="Service status data is not available." />
          ) : (
            <div className="space-y-4 px-5 py-5">
              {serviceStats.map(([status, count]) => {
                const serviceCount = services.length;
                const percent = serviceCount ? (count / serviceCount) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex justify-between gap-4 text-sm">
                      <span className="text-slate-700">{status}</span>
                      <span className="tabular-nums text-slate-500">{count} <span className="text-slate-400">({Math.round(percent)}%)</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-700" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Executor workload</h2>
            <p className="mt-0.5 text-xs text-slate-500">Assigned service volume; on-time rates and stage durations are not supplied by these endpoints.</p>
          </div>
          {reportLoading ? (
            <EmptyChart message="Loading executor workload…" />
          ) : executorWorkload.length === 0 ? (
            <EmptyChart message="No assigned executor workload is available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Executor</th>
                    <th className="px-3 py-3 text-right">Closed</th>
                    <th className="px-3 py-3 text-right">Open load</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executorWorkload.map((workload) => (
                    <tr key={workload.id}>
                      <th scope="row" className="px-4 py-3 font-medium text-slate-800">{workload.name}</th>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600">{workload.closed}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600">{workload.open}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{workload.closed + workload.open}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Monthly service performance</h2>
          <p className="mt-0.5 text-xs text-slate-500">Period totals and completion rates from the manager dashboard endpoint.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Services</th>
                <th className="px-4 py-3 text-right">Completed</th>
                <th className="px-4 py-3 text-right">Completion rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(dashboardData?.monthlyServiceStats ?? []).map((stat, index) => {
                const total = Number(stat.totalServices ?? 0);
                const completed = Number(stat.completedServices ?? 0);
                const suppliedRate = Number(stat.completionRate);
                const rate = Number.isFinite(suppliedRate)
                  ? suppliedRate
                  : total > 0 ? (completed / total) * 100 : 0;
                return (
                  <tr key={`${stat.year ?? "period"}-${stat.month ?? index}`}>
                    <th scope="row" className="px-4 py-3 font-medium text-slate-800">{formatMonth(stat.year, stat.month)}</th>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCount(total)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCount(completed)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{`${Math.round(rate)}%`}</td>
                  </tr>
                );
              })}
              {!dashboardLoading && !dashboardError && (dashboardData?.monthlyServiceStats.length ?? 0) === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">No monthly report data is available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldAlert className="h-4 w-4" />
        <span>All figures are sourced from live manager APIs. Stage durations and punctuality require dedicated backend metrics.</span>
      </p>
    </main>
  );
}
