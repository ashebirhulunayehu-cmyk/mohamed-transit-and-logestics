
"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, LoaderCircle, RefreshCw, ShieldAlert, ShieldX } from "lucide-react";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";

type RiskChannel = "Yellow channel" | "Red channel";

type ComplianceCase = {
  id: string;
  trackingNumber: string;
  title: string;
  risk: RiskChannel | null;
  status: string;
  note: string;
  requiresCustomerAction: boolean;
  isBlocked: boolean;
  needsReview: boolean;
};

const readValue = (record: CaseExecutorServiceRecord, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const readFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === "true";

const normalizeRisk = (record: CaseExecutorServiceRecord): RiskChannel | null => {
  const value = readValue(record, "riskLevel", "riskChannel");
  if (value === 3 || value === "3") return "Yellow channel";
  if (value === 4 || value === "4") return "Red channel";
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("yellow")) return "Yellow channel";
    if (normalized.includes("red")) return "Red channel";
  }
  return null;
};

const normalizeCase = (record: CaseExecutorServiceRecord): ComplianceCase | null => {
  const id = readText(readValue(record, "id", "shipmentId", "serviceId"));
  const risk = normalizeRisk(record);
  const isBlocked = readFlag(readValue(record, "isBlocked"));
  const requiresCustomerAction = readFlag(readValue(record, "requiresCustomerAction"));
  const needsReview = readFlag(readValue(record, "hasNeedsReview"));
  if (!id || (!risk && !isBlocked && !requiresCustomerAction && !needsReview)) return null;

  const rawStatus = readValue(record, "status", "serviceStatus", "currentStatus");
  const statusLabels: Record<string, string> = {
    "1": "Draft",
    "2": "Submitted",
    "3": "Under review",
    "4": "Approved",
    "5": "In progress",
    "6": "Completed",
    "7": "Rejected",
    "8": "Cancelled",
    "9": "Delivered",
  };
  const statusValue = readText(rawStatus);
  const status = isBlocked
    ? "Blocked"
    : requiresCustomerAction
      ? "Requires customer action"
      : needsReview
        ? "Needs review"
        : statusLabels[statusValue] ?? (statusValue.replace(/([a-z])([A-Z])/g, "$1 $2") || "Status unavailable");

  return {
    id,
    trackingNumber: readText(readValue(record, "serviceNumber", "trackingNumber", "caseNumber")) || id,
    title: readText(readValue(record, "itemDescription", "description", "title")) || "—",
    risk,
    status,
    note: readText(readValue(record, "riskNotes", "blockReason", "assignmentNotes")),
    requiresCustomerAction,
    isBlocked,
    needsReview,
  };
};

const statusStyle = (status: string): string => {
  if (status === "Blocked") return "bg-rose-50 text-rose-700";
  if (status === "Requires customer action" || status === "Needs review") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-700";
};

export default function CaseExecutorRiskCompliancePage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const services = useCaseExecutorStore((state) => state.assignedServices);
  const loading = useCaseExecutorStore((state) => state.assignedServicesLoading);
  const error = useCaseExecutorStore((state) => state.assignedServicesError);
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchAssignedServices(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchAssignedServices]);

  const cases = useMemo(
    () => services
      .map(normalizeCase)
      .filter((item): item is ComplianceCase => item !== null)
      .sort((left, right) => {
        const severity = (item: ComplianceCase) =>
          item.isBlocked ? 0 : item.risk === "Red channel" ? 1 : item.requiresCustomerAction ? 2 : 3;
        return severity(left) - severity(right);
      }),
    [services],
  );

  const riskCount = cases.filter((item) => item.risk === "Yellow channel" || item.risk === "Red channel").length;
  const exceptionsCount = cases.filter((item) =>
    item.isBlocked || item.requiresCustomerAction || item.needsReview,
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Compliance</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Risk &amp; compliance</h1>
          <p className="mt-1 text-sm text-slate-500">Assigned cases on elevated risk channels and cases requiring attention.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAssignedServices()}
          disabled={loading}
          aria-label="Refresh risk and compliance cases"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p>{error}</p>
          <button type="button" onClick={() => void fetchAssignedServices()} className="mt-2 font-semibold hover:underline">Try again</button>
        </div>
      )}

      {!error && !loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Elevated-risk cases</p><p className="mt-1 text-2xl font-bold text-slate-900">{riskCount}</p></div>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-700"><ShieldAlert className="size-5" /></span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Open exceptions</p><p className="mt-1 text-2xl font-bold text-slate-900">{exceptionsCount}</p></div>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-700"><AlertTriangle className="size-5" /></span>
          </div>
        </div>
      )}

      {loading && cases.length === 0 ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          <LoaderCircle className="size-4 animate-spin" /> Loading assigned risk cases…
        </div>
      ) : !error && cases.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldX className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">No open risk cases</h2>
          <p className="mt-1 text-sm text-slate-500">No assigned services currently have elevated risk or an active compliance exception.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((item) => {
            const isRed = item.risk === "Red channel";
            return (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/${lang}/admin/case-Executer/services?search=${encodeURIComponent(item.trackingNumber)}`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {item.trackingNumber}
                    </Link>
                    {item.risk && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isRed ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>
                        {isRed ? <ShieldX className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                        {item.risk}
                      </span>
                    )}
                    {(item.isBlocked || item.requiresCustomerAction || item.needsReview) && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(item.status)}`}>{item.status}</span>
                    )}
                  </div>
                  <Link
                    href={`/${lang}/admin/case-Executer/services?search=${encodeURIComponent(item.trackingNumber)}`}
                    aria-label={`Open assigned service ${item.trackingNumber}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700"
                  >
                    View service <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.note || (item.isBlocked
                    ? "This assigned service has a blocked stage."
                    : item.requiresCustomerAction
                      ? "Customer action is required on an active stage."
                      : item.needsReview
                        ? "An active stage is marked for review."
                        : "Elevated risk channel; review the assigned service details.")}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
