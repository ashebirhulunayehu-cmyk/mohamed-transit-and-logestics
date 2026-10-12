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
  ShieldCheck,
} from "lucide-react";
import { ManagerEndpoints } from "@/modules/manager/manager.endpoint";
import type { ManagerReportsAnalytics } from "@/modules/manager/manager.type";

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as RecordValue
    : null;

const readNumber = (value: unknown, field: string): number => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`The reporting endpoint returned an invalid ${field}.`);
  }
  return number;
};

const unwrapReport = (value: unknown): unknown => {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    const record = asRecord(current);
    if (!record) return current;
    const key = ["payload", "data", "result", "response"].find(
      (candidate) => record[candidate] !== undefined,
    );
    if (!key) return current;
    current = record[key];
    if (key === "response" && asRecord(current)?.data !== undefined) {
      current = asRecord(current)?.data;
    }
  }
  return current;
};

const parseReport = (value: unknown): ManagerReportsAnalytics => {
  const report = asRecord(unwrapReport(value));
  if (!report) {
    throw new Error("The reporting endpoint returned an invalid response.");
  }

  const readRows = (key: string): RecordValue[] => {
    const value = report[key];
    if (!Array.isArray(value)) {
      throw new Error(`The reporting endpoint did not include ${key}.`);
    }
    return value.map((row) => {
      const record = asRecord(row);
      if (!record) throw new Error(`The reporting endpoint returned an invalid ${key} row.`);
      return record;
    });
  };

  const nullableNumber = (field: string): number | null =>
    report[field] === null || report[field] === undefined
      ? null
      : readNumber(report[field], field);

  return {
    openCases: readNumber(report.openCases, "open cases"),
    completedYearToDate: readNumber(report.completedYearToDate, "year-to-date completions"),
    onTimeClearanceRate: nullableNumber("onTimeClearanceRate"),
    averageStageDurationHours: nullableNumber("averageStageDurationHours"),
    monthlyThroughput: readRows("monthlyThroughput").map((row) => ({
      year: readNumber(row.year, "month year"),
      month: readNumber(row.month, "month"),
      multimodal: readNumber(row.multimodal, "multimodal throughput"),
      unimodal: readNumber(row.unimodal, "unimodal throughput"),
      completed: readNumber(row.completed, "completed throughput"),
    })),
    riskChannels: readRows("riskChannels").map((row) => {
      if (typeof row.channel !== "string") {
        throw new Error("The reporting endpoint returned an invalid risk channel.");
      }
      return { channel: row.channel, count: readNumber(row.count, "risk channel count") };
    }),
    stageDurations: readRows("stageDurations").map((row) => {
      if (typeof row.stage !== "string") {
        throw new Error("The reporting endpoint returned an invalid stage name.");
      }
      return { stage: row.stage, averageHours: readNumber(row.averageHours, "stage duration") };
    }),
    executorPerformance: readRows("executorPerformance").map((row) => {
      if (typeof row.executorName !== "string") {
        throw new Error("The reporting endpoint returned an invalid executor name.");
      }
      return {
        executorId: readNumber(row.executorId, "executor id"),
        executorName: row.executorName,
        casesClosed: readNumber(row.casesClosed, "closed cases"),
        averageCycleDays: row.averageCycleDays === null || row.averageCycleDays === undefined
          ? null
          : readNumber(row.averageCycleDays, "average cycle duration"),
        openLoad: readNumber(row.openLoad, "open workload"),
      };
    }),
  };
};

const formatCount = (value: number): string => value.toLocaleString();

const formatMonth = (year: number, month: number): string =>
  new Date(year, month - 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });

const formatStage = (stage: string): string =>
  stage.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("and", " & ");

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function ThroughputChart({ rows }: { rows: ManagerReportsAnalytics["monthlyThroughput"] }) {
  if (!rows.length) return <EmptyState message="No monthly throughput data is available." />;

  const width = Math.max(500, rows.length * 96);
  const height = 280;
  const left = 48;
  const right = width - 22;
  const top = 20;
  const bottom = 228;
  const max = Math.max(1, ...rows.flatMap((row) => [
    row.multimodal,
    row.unimodal,
    row.completed,
  ]));
  const x = (index: number) =>
    rows.length === 1 ? (left + right) / 2 : left + ((right - left) * index) / (rows.length - 1);
  const y = (value: number) => bottom - ((bottom - top) * value) / max;
  const series = [
    { key: "multimodal" as const, label: "Multimodal", color: "#2563eb" },
    { key: "unimodal" as const, label: "Unimodal", color: "#1d4ed8" },
    { key: "completed" as const, label: "Completed", color: "#166534" },
  ];

  return (
    <div className="overflow-x-auto px-4 py-5">
      <svg
        role="img"
        aria-label="Monthly multimodal, unimodal, and completed case throughput"
        viewBox={`0 0 ${width} ${height}`}
        className="h-[280px] min-w-full"
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const tickY = top + ((bottom - top) * tick) / 4;
          const label = Math.round((max * (4 - tick)) / 4);
          return (
            <g key={tick}>
              <line x1={left} y1={tickY} x2={right} y2={tickY} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={left - 8} y={tickY + 4} textAnchor="end" fontSize="10" fill="#64748b">{label}</text>
            </g>
          );
        })}
        {series.map((item) => (
          <g key={item.key}>
            <polyline
              points={rows.map((row, index) => `${x(index)},${y(row[item.key])}`).join(" ")}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {rows.map((row, index) => (
              <circle
                key={`${item.key}-${row.year}-${row.month}`}
                cx={x(index)}
                cy={y(row[item.key])}
                r="3.5"
                fill={item.color}
              />
            ))}
          </g>
        ))}
        {rows.map((row, index) => (
          <text
            key={`${row.year}-${row.month}`}
            x={x(index)}
            y={bottom + 24}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {formatMonth(row.year, row.month)}
          </text>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-600">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const riskColors: Record<string, string> = {
  Blue: "#2563eb",
  Green: "#166534",
  Yellow: "#a16207",
  Red: "#b91c1c",
};

function RiskMix({ rows }: { rows: ManagerReportsAnalytics["riskChannels"] }) {
  const channels = rows.filter((row) => row.count > 0);
  const total = channels.reduce((sum, row) => sum + row.count, 0);
  if (!total) return <EmptyState message="Risk channel data is not available." />;

  const slices = channels.reduce<{ stops: string[]; count: number }>(
    (result, row) => {
      const start = (result.count / total) * 100;
      const endCount = result.count + row.count;
      const end = (endCount / total) * 100;
      result.stops.push(`${riskColors[row.channel] ?? "#94a3b8"} ${start}% ${end}%`);
      result.count = endCount;
      return result;
    },
    { stops: [], count: 0 },
  ).stops;

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-5 px-4 py-5">
      <div
        role="img"
        aria-label={`Risk channel distribution across ${total} active shipment records`}
        className="relative h-44 w-44 rounded-full"
        style={{ background: `conic-gradient(${slices.join(", ")})` }}
      >
        <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-semibold text-slate-900">{formatCount(total)}</span>
          <span className="text-xs text-slate-500">active</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
        {channels.map((row) => (
          <span key={row.channel} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: riskColors[row.channel] ?? "#94a3b8" }}
            />
            {row.channel} ({formatCount(row.count)})
          </span>
        ))}
      </div>
    </div>
  );
}

function StageDurationChart({ rows }: { rows: ManagerReportsAnalytics["stageDurations"] }) {
  if (!rows.length) return <EmptyState message="No completed stage durations were recorded in the last 90 days." />;

  const width = Math.max(760, rows.length * 80);
  const height = 270;
  const left = 38;
  const right = width - 18;
  const top = 20;
  const bottom = 188;
  const max = Math.max(1, ...rows.map((row) => row.averageHours));
  const slot = (right - left) / rows.length;
  const barWidth = Math.min(48, slot * 0.58);

  return (
    <div className="overflow-x-auto px-4 py-5">
      <svg
        role="img"
        aria-label="Average stage duration in hours for completed stages in the last 90 days"
        viewBox={`0 0 ${width} ${height}`}
        className="h-[270px] min-w-full"
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = top + ((bottom - top) * tick) / 4;
          const value = Math.round((max * (4 - tick)) / 4);
          return (
            <g key={tick}>
              <line x1={left} y1={y} x2={right} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={left - 7} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{value}</text>
            </g>
          );
        })}
        {rows.map((row, index) => {
          const barHeight = ((bottom - top) * row.averageHours) / max;
          const center = left + slot * (index + 0.5);
          return (
            <g key={row.stage}>
              <rect
                x={center - barWidth / 2}
                y={bottom - barHeight}
                width={barWidth}
                height={barHeight}
                rx="2"
                fill="#1d4ed8"
              />
              <text x={center} y={bottom + 20} textAnchor="middle" fontSize="9" fill="#64748b">
                {formatStage(row.stage)}
              </text>
              <text x={center} y={bottom - barHeight - 6} textAnchor="middle" fontSize="9" fill="#334155">
                {row.averageHours}
              </text>
            </g>
          );
        })}
        <text x={left} y={height - 10} fontSize="10" fill="#64748b">Hours</text>
      </svg>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unable to load manager reports.";
}

export default function ManagerReportsPage() {
  const [report, setReport] = useState<ManagerReportsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: unknown = await ManagerEndpoints.getReportsAnalytics();
      setReport(parseReport(response));
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const riskTotal = useMemo(
    () => (report?.riskChannels ?? []).reduce((sum, row) => sum + row.count, 0),
    [report],
  );

  const exportReport = () => {
    if (!report) return;
    const rows: (string | number)[][] = [
      ["Manager report", new Date().toLocaleString()],
      ["Metric", "Value"],
      ["Open cases", report.openCases],
      ["Recorded completions year to date", report.completedYearToDate],
      ["On-time clearance rate", report.onTimeClearanceRate ?? "Unavailable"],
      ["Average stage duration (hours)", report.averageStageDurationHours ?? "Unavailable"],
      ["Monthly throughput"],
      ["Year", "Month", "Multimodal", "Unimodal", "Completions recorded"],
      ...report.monthlyThroughput.map((row) => [
        row.year,
        row.month,
        row.multimodal,
        row.unimodal,
        row.completed,
      ]),
      ["Risk channel", "Shipment records"],
      ...report.riskChannels.map((row) => [row.channel, row.count]),
      ["Stage", "Average hours"],
      ...report.stageDurations.map((row) => [formatStage(row.stage), row.averageHours]),
      ["Executor", "Completed in last 90 days", "Average cycle days", "Open load"],
      ...report.executorPerformance.map((row) => [
        row.executorName,
        row.casesClosed,
        row.averageCycleDays ?? "Unavailable",
        row.openLoad,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "manager-report.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const summary = [
    { label: "Open cases", value: report?.openCases ?? null, icon: Activity, tone: "#2563eb" },
    { label: "Completed (YTD)", value: report?.completedYearToDate ?? null, icon: CheckCircle2, tone: "#166534" },
    {
      label: "On-time clearance",
      value: report?.onTimeClearanceRate === null || report?.onTimeClearanceRate === undefined
        ? null
        : `${report.onTimeClearanceRate}%`,
      icon: ShieldCheck,
      tone: "#2563eb",
    },
    {
      label: "Avg stage duration",
      value: report?.averageStageDurationHours === null || report?.averageStageDurationHours === undefined
        ? null
        : `${report.averageStageDurationHours} h`,
      icon: Clock3,
      tone: "#a16207",
    },
  ];

  return (
    <main className="mx-auto max-w-[1500px] space-y-5 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Manager / Analytics
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Reports &amp; Analytics</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Throughput, stage duration, risk channel distribution and executor workload from live manager reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportReport}
            disabled={!report || loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export report
          </button>
          <button
            type="button"
            onClick={() => void loadReport()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <section aria-label="Service performance summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <article
            key={label}
            className="rounded-lg border border-slate-200 border-l-2 bg-white p-4 shadow-sm"
            style={{ borderLeftColor: tone }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950">
              {loading && !report ? "…" : value === null ? "—" : typeof value === "number" ? formatCount(value) : value}
            </p>
            {(label === "On-time clearance" || label === "Completed (YTD)") && (
              <p className="mt-1 text-xs text-slate-500">
                {label === "On-time clearance"
                  ? "Unavailable: no due-date/SLA field is recorded."
                  : "Recorded completion timestamps; legacy records without one are excluded."}
              </p>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Case throughput</h2>
            <p className="mt-0.5 text-xs text-slate-500">Monthly shipments created by modality and completions recorded during that month.</p>
          </div>
          {loading && !report
            ? <EmptyState message="Loading throughput data…" />
            : <ThroughputChart rows={report?.monthlyThroughput ?? []} />}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Risk channel mix</h2>
            <p className="mt-0.5 text-xs text-slate-500">Share of active shipment records by recorded risk channel.</p>
          </div>
          {loading && !report
            ? <EmptyState message="Loading risk channel data…" />
            : <RiskMix rows={report?.riskChannels ?? []} />}
          {!loading && report && riskTotal === 0 && (
            <p className="px-4 pb-4 text-center text-xs text-slate-500">No risk channel is recorded for active shipment records.</p>
          )}
        </article>
      </section>

      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Average duration by stage</h2>
          <p className="mt-0.5 text-xs text-slate-500">Hours from stage start to completion, for completed stages in the last 90 days.</p>
        </div>
        {loading && !report
          ? <EmptyState message="Loading stage duration data…" />
          : <StageDurationChart rows={report?.stageDurations ?? []} />}
      </article>

      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Executor performance</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Recorded completions and average cycle time in the last 90 days, plus current open load. Historical completed shipments without a recorded completion timestamp are excluded.
          </p>
        </div>
        {loading && !report ? (
          <EmptyState message="Loading executor performance…" />
        ) : !report?.executorPerformance.length ? (
          <EmptyState message="No assigned executor performance data is available." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-white text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Executor</th>
                  <th className="px-4 py-3 text-right">Completed status · updated (90d)</th>
                  <th className="px-4 py-3 text-right">Avg days</th>
                  <th className="px-4 py-3 text-right">Open load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.executorPerformance.map((executor) => (
                  <tr key={executor.executorId}>
                    <th scope="row" className="px-4 py-3 font-medium text-slate-800">{executor.executorName}</th>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCount(executor.casesClosed)}</td>
                    <td
                      className="px-4 py-3 text-right tabular-nums text-slate-600"
                      title="No shipment completion timestamp is stored, so average processing days cannot be calculated reliably."
                    >
                      {executor.averageCycleDays === null ? "—" : executor.averageCycleDays}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCount(executor.openLoad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <BarChart3 className="h-4 w-4" />
        <span>Report values are calculated from manager-authorized shipment and stage records; unavailable data is not estimated.</span>
      </p>
    </main>
  );
}
