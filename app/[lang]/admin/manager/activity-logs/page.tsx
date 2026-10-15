"use client";

import { useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useManagerStore } from "@/modules/manager/manager.store";
import type { NotificationItem } from "@/features/notifications/notification.types";

const getCategoryMark = (category: string) =>
  category
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;

const safeCsvValue = (value: string) =>
  /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;

const exportActivity = (notifications: NotificationItem[]) => {
  const rows = [
    ["Activity", "Details", "Category", "Reference", "Time", "Read status"],
    ...notifications.map((notification) => [
      notification.title,
      notification.description,
      notification.category,
      notification.referenceId,
      notification.time === "Just now" ? "" : notification.time,
      notification.isRead ? "Read" : "Unread",
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => escapeCsv(safeCsvValue(value))).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "manager-activity.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const formatTime = (value: string) => {
  if (!value || value === "Just now") return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function ManagerActivityLogsPage() {
  const notifications = useManagerStore((state) => state.notifications);
  const loading = useManagerStore((state) => state.notificationsLoading);
  const error = useManagerStore((state) => state.notificationsError);
  const fetchNotifications = useManagerStore((state) => state.fetchNotifications);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const orderedActivity = [...notifications].sort((first, second) => {
    const firstTime = Date.parse(first.time);
    const secondTime = Date.parse(second.time);
    if (!Number.isFinite(firstTime)) return Number.isFinite(secondTime) ? 1 : 0;
    if (!Number.isFinite(secondTime)) return -1;
    return secondTime - firstTime;
  });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Activity</p>
          <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Activity logs</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Recent updates available to your Manager account.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            disabled={loading}
            aria-label="Refresh activity logs"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => exportActivity(orderedActivity)}
            disabled={orderedActivity.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export activity
          </button>
        </div>
      </header>

      <section
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        aria-label="Manager activity"
      >
        {loading && notifications.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500" role="status">
            Loading activity…
          </p>
        ) : error ? (
          <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="mt-2 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : orderedActivity.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            No activity updates were returned by the Manager service.
          </p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {orderedActivity.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <div
                  aria-label={`Category: ${item.category}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700"
                >
                  {getCategoryMark(item.category)}
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_100px_150px] sm:items-center sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {item.title}
                      {item.referenceId ? ` ${item.referenceId}` : ""}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    )}
                  </div>
                  <div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {item.category}
                    </span>
                  </div>
                  <time className="text-xs text-slate-400 sm:text-right" dateTime={item.time === "Just now" ? undefined : item.time}>
                    {formatTime(item.time)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
