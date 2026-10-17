"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readValue = (
  record: CaseExecutorServiceRecord | null | undefined,
  ...keys: string[]
): unknown => {
  if (!record) return undefined;
  for (const key of keys) {
    const matchedKey = Object.keys(record).find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    if (matchedKey !== undefined) return record[matchedKey];
  }
  return undefined;
};

const readText = (
  record: CaseExecutorServiceRecord | null | undefined,
  ...keys: string[]
): string => {
  const value = readValue(record, ...keys);
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
};

const readBoolean = (
  record: CaseExecutorServiceRecord,
  ...keys: string[]
): boolean => {
  const value = readValue(record, ...keys);
  return value === true || value === 1 || value === "true";
};

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

const getServiceStatus = (service: CaseExecutorServiceRecord): string => {
  if (readBoolean(service, "isBlocked")) return "Blocked";
  if (readBoolean(service, "requiresCustomerAction")) return "Requires customer action";
  const rawStatus = readValue(service, "status", "serviceStatus", "currentStatus");
  const value = typeof rawStatus === "string" || typeof rawStatus === "number"
    ? String(rawStatus)
    : "";
  return statusLabels[value] ?? (value.replace(/([a-z])([A-Z])/g, "$1 $2") || "Assigned");
};

const getRiskLabel = (service: CaseExecutorServiceRecord): string => {
  const risk = readValue(service, "riskLevel");
  if (typeof risk === "number" || (typeof risk === "string" && /^\d+$/.test(risk))) {
    return ({ "1": "Blue risk", "2": "Green risk", "3": "Yellow risk", "4": "Red risk" } as Record<string, string>)[String(risk)] ?? "";
  }
  return typeof risk === "string" ? `${risk.replace(/([a-z])([A-Z])/g, "$1 $2")} risk` : "";
};

const getStatusClass = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("blocked") || normalized.includes("reject")) {
    return "bg-rose-50 text-rose-700";
  }
  if (normalized.includes("customer action") || normalized.includes("review")) {
    return "bg-amber-50 text-amber-700";
  }
  if (normalized.includes("complete") || normalized.includes("deliver")) {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-blue-50 text-blue-700";
};

const getRiskClass = (label: string): string => {
  if (label.startsWith("Red")) return "bg-rose-50 text-rose-700";
  if (label.startsWith("Yellow")) return "bg-amber-50 text-amber-700";
  if (label.startsWith("Green")) return "bg-emerald-50 text-emerald-700";
  return "bg-sky-50 text-sky-700";
};

const getTimeLabel = (value: unknown): string => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  return new Date(timestamp).toISOString().slice(0, 10);
};

const getFieldLabel = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());

const getFieldValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.length ? `${value.length} items` : "None";
  if (isRecord(value)) {
    const label = value.name ?? value.businessName ?? value.username ?? value.email;
    return typeof label === "string" || typeof label === "number"
      ? String(label)
      : "Details available";
  }
  return "";
};

const getItemText = (value: unknown, ...keys: string[]): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isRecord(value)) return "";
  for (const key of keys) {
    const matchedKey = Object.keys(value).find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    const candidate = matchedKey ? value[matchedKey] : undefined;
    if (typeof candidate === "string" || typeof candidate === "number") {
      const text = String(candidate).trim();
      if (text) return text;
    }
  }
  return "";
};

const sortPriority = (left: CaseExecutorServiceRecord, right: CaseExecutorServiceRecord): number => {
  const score = (service: CaseExecutorServiceRecord): number => {
    if (readBoolean(service, "isBlocked")) return 0;
    if (readBoolean(service, "requiresCustomerAction")) return 1;
    const risk = readValue(service, "riskLevel");
    const riskNumber = typeof risk === "number" ? risk : Number(risk);
    return riskNumber >= 1 && riskNumber <= 4 ? 5 - riskNumber : 5;
  };
  const scoreDifference = score(left) - score(right);
  if (scoreDifference) return scoreDifference;
  const leftUpdated = new Date(
    String(readValue(left, "lastUpdateDate", "updatedAt", "updatedDate") ?? ""),
  ).getTime();
  const rightUpdated = new Date(
    String(readValue(right, "lastUpdateDate", "updatedAt", "updatedDate") ?? ""),
  ).getTime();
  return (Number.isFinite(leftUpdated) ? leftUpdated : 0) -
    (Number.isFinite(rightUpdated) ? rightUpdated : 0);
};

export default function CaseExecutorPage() {
  const { lang } = useParams<{ lang: string }>();
  const dashboard = useCaseExecutorStore((state) => state.dashboard);
  const dashboardLoading = useCaseExecutorStore((state) => state.dashboardLoading);
  const dashboardError = useCaseExecutorStore((state) => state.dashboardError);
  const assignedServices = useCaseExecutorStore((state) => state.assignedServices);
  const assignedServicesLoading = useCaseExecutorStore((state) => state.assignedServicesLoading);
  const assignedServicesError = useCaseExecutorStore((state) => state.assignedServicesError);
  const assignedService = useCaseExecutorStore((state) => state.assignedService);
  const assignedServiceId = useCaseExecutorStore((state) => state.assignedServiceId);
  const assignedServiceLoading = useCaseExecutorStore((state) => state.assignedServiceLoading);
  const assignedServiceError = useCaseExecutorStore((state) => state.assignedServiceError);
  const fetchDashboard = useCaseExecutorStore((state) => state.fetchDashboard);
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);
  const fetchAssignedServiceById = useCaseExecutorStore((state) => state.fetchAssignedServiceById);
  const [selectedServiceId, setSelectedServiceId] = useState<string | number | null>(null);

  useEffect(() => {
    void fetchDashboard();
    void fetchAssignedServices();
  }, [fetchDashboard, fetchAssignedServices]);

  const priorityServices = useMemo(
    () => [...assignedServices].sort(sortPriority),
    [assignedServices],
  );
  const openCases = assignedServices.filter((service) => {
    const status = getServiceStatus(service).toLowerCase();
    return !["completed", "delivered", "rejected", "cancelled"].includes(status);
  }).length;
  const needsAttention = assignedServices.filter(
    (service) =>
      readBoolean(service, "isBlocked") ||
      readBoolean(service, "requiresCustomerAction") ||
      getServiceStatus(service).toLowerCase().includes("review"),
  ).length;
  const stats = [
    {
      title: "Open cases",
      value: dashboardLoading && assignedServicesLoading ? "…" : String(openCases),
      icon: BriefcaseBusiness,
    },
    {
      title: "Needs attention",
      value: dashboardLoading && assignedServicesLoading ? "…" : String(needsAttention),
      icon: ShieldAlert,
    },
    {
      title: "Completed services",
      value: dashboardLoading ? "…" : String(dashboard?.completedServices ?? "—"),
      icon: CheckCircle2,
    },
    {
      title: "Blocked stages",
      value: dashboardLoading ? "…" : String(dashboard?.blockedStages ?? "—"),
      icon: ShieldAlert,
    },
  ];

  const latestActivity = [
    ...(dashboard?.todaysTasks ?? []).map((item) => ({ item, kind: "Task" })),
    ...(dashboard?.urgentNotifications ?? []).map((item) => ({ item, kind: "Notification" })),
  ]
    .map(({ item, kind }) => ({
      item,
      kind,
      title: getItemText(item, "title", "taskName", "name", "subject", "message"),
      description: getItemText(item, "description", "status", "comment", "body"),
      time: getTimeLabel(
        isRecord(item)
          ? item.createdDate ?? item.createdAt ?? item.updatedAt ?? item.scheduledAt
          : undefined,
      ),
      timestamp: isRecord(item)
        ? new Date(String(item.createdDate ?? item.createdAt ?? item.updatedAt ?? item.scheduledAt ?? "")).getTime()
        : 0,
    }))
    .sort((left, right) => right.timestamp - left.timestamp);

  const selectedServiceMatches =
    selectedServiceId !== null && String(assignedServiceId) === String(selectedServiceId);
  const selectedService = selectedServiceMatches ? assignedService : null;
  const selectedServiceLoading = selectedServiceId !== null &&
    (!selectedServiceMatches || assignedServiceLoading);
  const selectedServiceError = selectedServiceMatches ? assignedServiceError : null;
  const selectedServiceDetails = selectedService
    ? Object.entries(selectedService).filter(([, value]) => value !== null && value !== undefined)
    : [];

  const viewService = (service: CaseExecutorServiceRecord) => {
    const id = readValue(service, "id", "serviceId", "shipmentId");
    if (typeof id !== "string" && typeof id !== "number") return;
    setSelectedServiceId(id);
    void fetchAssignedServiceById(id);
  };

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 text-slate-800">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Import Directorate
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">My caseload</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Cases assigned to you, ordered by urgency.
          </p>
        </div>
        <Link
          href={`/${lang}/admin/case-Executer/services`}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Open case register
        </Link>
      </section>

      {(dashboardError || assignedServicesError) && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            {dashboardError && <p>Dashboard data: {dashboardError}</p>}
            {assignedServicesError && <p>Assigned services: {assignedServicesError}</p>}
            <button
              type="button"
              onClick={() => {
                void fetchDashboard();
                void fetchAssignedServices();
              }}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Try again
            </button>
          </div>
        </div>
      )}

      <section aria-label="Case statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon }) => (
          <article key={title} className="border-b border-slate-200 bg-white p-5 sm:rounded-xl sm:border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div id="assigned-service" className="border-b border-slate-200 bg-white p-5 sm:rounded-xl sm:border sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Priority queue</h2>
              <p className="mt-1 text-sm text-slate-500">Sorted by attention flags, risk level, and last update.</p>
            </div>
            {assignedServicesLoading && <LoaderCircle aria-label="Loading cases" className="size-5 animate-spin text-blue-600" />}
          </div>

          {assignedServicesLoading && assignedServices.length === 0 ? (
            <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Loading your assigned cases…
            </div>
          ) : priorityServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {assignedServicesError
                ? <AlertCircle aria-hidden="true" className="size-8 text-rose-500" />
                : <Inbox aria-hidden="true" className="size-8 text-slate-400" />}
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {assignedServicesError ? "Could not load your caseload" : "No cases assigned"}
              </p>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {assignedServicesError || "Cases assigned to your account will appear here."}
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {priorityServices.map((service) => {
                const id = readValue(service, "id", "serviceId", "shipmentId");
                const serviceNumber = readText(service, "serviceNumber", "trackingNumber", "caseNumber") || String(id ?? "");
                const status = getServiceStatus(service);
                const riskLabel = getRiskLabel(service);
                const description = readText(service, "itemDescription", "description", "title");
                const importer = readText(service, "importerName", "customerName", "businessName");
                const origin = readText(service, "origin");
                const destination = readText(service, "destination");
                const route = [origin, destination].filter(Boolean).join(" → ");
                const updated = getTimeLabel(readValue(service, "lastUpdateDate", "updatedAt", "updatedDate"));
                const isSelected = selectedServiceId !== null && String(selectedServiceId) === String(id);

                return (
                  <li key={String(id ?? serviceNumber)} className="py-4 first:pt-1 last:pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">{serviceNumber}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(status)}`}>
                            {status}
                          </span>
                          {riskLabel && (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRiskClass(riskLabel)}`}>
                              {riskLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{description || "Service description not provided"}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {[importer, route].filter(Boolean).join(" · ") || "No additional service details"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                        {updated && <span className="text-xs text-slate-400">Updated on {updated}</span>}
                        <button
                          type="button"
                          disabled={typeof id !== "string" && typeof id !== "number"}
                          aria-expanded={isSelected}
                          onClick={() => viewService(service)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSelected ? "Refresh details" : "View details"}
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        {selectedServiceLoading ? (
                          <p role="status" className="flex items-center gap-2 text-sm text-slate-500">
                            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                            Loading case details…
                          </p>
                        ) : selectedServiceError ? (
                          <p role="alert" className="text-sm text-rose-700">{selectedServiceError}</p>
                        ) : selectedServiceDetails.length ? (
                          <dl className="grid gap-3 sm:grid-cols-2">
                            {selectedServiceDetails.map(([key, value]) => (
                              <div key={key} className="min-w-0">
                                <dt className="text-xs text-slate-500">{getFieldLabel(key)}</dt>
                                <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                                  {getFieldValue(value) || "—"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="text-sm text-slate-500">No additional case details were returned.</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <section className="border-b border-slate-200 bg-white p-5 sm:rounded-xl sm:border sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Bell aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Work and alerts</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">Latest activity</h2>
            </div>
          </div>
          {dashboardLoading && latestActivity.length === 0 ? (
            <p role="status" className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Loading tasks and notifications…
            </p>
          ) : latestActivity.length ? (
            <ul className="mt-5 divide-y divide-slate-100">
              {latestActivity.map(({ item, kind, title, description, time }, index) => {
                const itemId = getItemText(item, "id", "notificationId", "stageId");
                const key = itemId ? `${kind}-${itemId}` : `${kind}-${index}`;
                return (
                  <li
                    key={key}
                    id={
                      kind === "Task" && index === latestActivity.findIndex((activity) => activity.kind === "Task")
                        ? "todays-tasks"
                        : kind === "Notification" && index === latestActivity.findIndex((activity) => activity.kind === "Notification")
                          ? "urgent-notifications"
                          : undefined
                    }
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">{title || (kind === "Task" ? "Assigned stage task" : "Urgent notification")}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${kind === "Notification" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                        {kind}
                      </span>
                    </div>
                    {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
                    {time && <p className="mt-1 text-[11px] text-slate-400">{time}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              {dashboardError || "No tasks or urgent notifications are available."}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
