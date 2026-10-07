"use client";

import { useEffect } from "react";
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Inbox,
  ListTodo,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";

const isRecord = (value: unknown): value is CaseExecutorServiceRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (...values: unknown[]): string => {
  const value = values.find(
    (candidate) => typeof candidate === "string" || typeof candidate === "number",
  );
  return value === undefined ? "" : String(value);
};

const displayValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.length ? `${value.length} items` : "None";
  if (isRecord(value)) {
    return readText(value.name, value.businessName, value.username, value.email) || "Details available";
  }
  return "";
};

const formatLabel = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());

const getListItemText = (value: unknown, keys: string[]): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isRecord(value)) return "";
  return readText(...keys.map((key) => value[key]));
};

export default function CaseExecutorPage() {
  const userId = useAuthStore((state) => state.user?.id);
  const executorId = userId && String(userId) !== "user-1" ? userId : 1;
  const dashboard = useCaseExecutorStore((state) => state.dashboard);
  const dashboardLoading = useCaseExecutorStore((state) => state.dashboardLoading);
  const dashboardError = useCaseExecutorStore((state) => state.dashboardError);
  const assignedService = useCaseExecutorStore((state) => state.assignedService);
  const assignedServiceId = useCaseExecutorStore((state) => state.assignedServiceId);
  const assignedServiceLoading = useCaseExecutorStore((state) => state.assignedServiceLoading);
  const assignedServiceError = useCaseExecutorStore((state) => state.assignedServiceError);
  const fetchDashboard = useCaseExecutorStore((state) => state.fetchDashboard);
  const fetchAssignedServiceById = useCaseExecutorStore((state) => state.fetchAssignedServiceById);
  const loading = assignedServiceId !== executorId || assignedServiceLoading;
  const serviceRecord = assignedServiceId === executorId ? assignedService : null;
  const error = assignedServiceId === executorId ? assignedServiceError : null;

  useEffect(() => {
    void fetchDashboard();
    void fetchAssignedServiceById(executorId);
  }, [executorId, fetchDashboard, fetchAssignedServiceById]);

  const status = readText(serviceRecord?.status, serviceRecord?.serviceStatus, serviceRecord?.currentStatus);
  const stats = [
    { title: "Assigned services", value: dashboardLoading ? "..." : String(dashboard?.assignedServices ?? "—"), description: "Services in your queue", icon: BriefcaseBusiness },
    { title: "Pending services", value: dashboardLoading ? "..." : String(dashboard?.pendingServices ?? "—"), description: "Awaiting action", icon: Clock3 },
    { title: "Completed services", value: dashboardLoading ? "..." : String(dashboard?.completedServices ?? "—"), description: "Successfully completed", icon: CheckCircle2 },
    { title: "Blocked stages", value: dashboardLoading ? "..." : String(dashboard?.blockedStages ?? "—"), description: "Stages needing attention", icon: ShieldAlert },
  ];
  const details = serviceRecord
    ? Object.entries(serviceRecord).filter(([, value]) => value !== null && value !== undefined)
    : [];
  const serviceTitle = readText(
    serviceRecord?.trackingNumber,
    serviceRecord?.serviceNumber,
    serviceRecord?.caseNumber,
    serviceRecord?.title,
    serviceRecord?.id,
  ) || "Assigned service";
  const serviceDescription = readText(serviceRecord?.description, serviceRecord?.itemDescription);

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 text-slate-800">
      <section className="border-b border-slate-200 bg-white px-5 py-5 sm:rounded-xl sm:border sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              <span>Ministry of Transport</span>
              <span className="text-slate-300">/</span>
              <span>Case Execution</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Case Executor Dashboard
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Track your assigned services, active work and completed cases from one workspace.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            {dashboardLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <span className={`h-2.5 w-2.5 rounded-full ${dashboardError ? "bg-rose-500" : "bg-emerald-500"}`} />
            )}
            <span className="text-sm font-medium text-slate-600">
              {dashboardLoading ? "Loading dashboard" : dashboardError ? "Dashboard unavailable" : "Dashboard updated"}
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Service statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, description, icon: Icon }) => (
          <div
            key={title}
            className="border-b border-slate-200 bg-white p-5 sm:rounded-xl sm:border"
          >
            <div className="flex items-start">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-1 break-words text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div id="assigned-service" className="border-b border-slate-200 bg-white p-5 sm:rounded-xl sm:border sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Assigned service</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{serviceRecord ? serviceTitle : "Service details"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {serviceDescription || "Details returned for the signed-in case executor."}
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {loading ? "Loading" : status || (serviceRecord ? "Assigned" : "No data")}
            </span>
          </div>
          {serviceRecord ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {details.map(([key, value]) => (
                <div key={key} className="border border-slate-100 bg-slate-50 p-4 sm:rounded-lg">
                  <p className="text-xs text-slate-500">{formatLabel(key)}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                    {displayValue(value) || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="mt-8 flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading service details...
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
              {error && !error.toLowerCase().includes("no service") ? (
                <AlertCircle className="h-8 w-8 text-rose-500" />
              ) : (
                <Inbox className="h-8 w-8 text-slate-400" />
              )}
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {error?.toLowerCase().includes("no service") ? "No services assigned" : error ? "Could not load service" : "No services assigned"}
              </p>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {error || "Assigned services will appear here when they are available."}
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-slate-200 bg-white p-5 sm:rounded-xl sm:border sm:p-6">
          <section id="todays-tasks" aria-labelledby="today-tasks-title">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <ListTodo className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Work queue</p>
                <h2 id="today-tasks-title" className="mt-1 text-base font-semibold text-slate-950">Today&apos;s tasks</h2>
              </div>
            </div>
            {dashboardLoading ? (
              <p className="mt-5 text-sm text-slate-500">Loading tasks...</p>
            ) : dashboard?.todaysTasks.length ? (
              <ul className="mt-5 space-y-3">
                {dashboard.todaysTasks.map((task, index) => (
                  <li key={index} className="border-b border-slate-100 pb-3 last:border-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {getListItemText(task, ["title", "taskName", "name", "serviceNumber", "trackingNumber"]) || `Task ${index + 1}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getListItemText(task, ["description", "status", "dueTime", "scheduledAt"]) || "Task assigned for today"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                {dashboardError || "No tasks scheduled for today."}
              </p>
            )}

            <div className="my-6 border-t border-slate-200" />

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Bell className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Alerts</p>
                <h2 id="urgent-notifications" className="mt-1 text-base font-semibold text-slate-950">Urgent notifications</h2>
              </div>
            </div>
            {dashboardLoading ? (
              <p className="mt-5 text-sm text-slate-500">Loading notifications...</p>
            ) : dashboard?.urgentNotifications.length ? (
              <ul className="mt-5 space-y-3">
                {dashboard.urgentNotifications.map((notification, index) => (
                  <li key={index} className="border-b border-slate-100 pb-3 last:border-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {getListItemText(notification, ["title", "message", "name", "subject"]) || `Notification ${index + 1}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getListItemText(notification, ["description", "createdAt", "time", "status"]) || "Urgent attention required"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                {dashboardError || "No urgent notifications."}
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}