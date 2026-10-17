"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, Download, FileText, History, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { CaseExecutorEndpoints } from "@/modules/case-Executer/case-executor.endpoint";

type ActivityRecord = {
  id: string;
  action: string;
  description: string;
  category: "service" | "document";
  reference: string;
  serviceId: string;
  timestamp: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getValue = (value: Record<string, unknown>, ...keys: string[]): unknown => {
  const key = Object.keys(value).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? value[key] : undefined;
};

const getText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const unwrapRows = (response: unknown): unknown[] => {
  let value = response;
  for (let depth = 0; depth < 5 && isRecord(value); depth += 1) {
    const nested = getValue(value, "data", "response", "payload", "items", "results");
    if (nested === undefined || nested === value) break;
    value = nested;
  }
  return Array.isArray(value) ? value : [];
};

const normalizeActivity = (value: unknown): ActivityRecord | null => {
  if (!isRecord(value)) return null;
  const id = getText(getValue(value, "id"));
  const action = getText(getValue(value, "action"));
  const timestamp = getText(getValue(value, "timestamp", "createdAt", "createAt"));
  const date = new Date(timestamp);
  if (!id || !action || !timestamp || Number.isNaN(date.getTime())) return null;

  const category = getText(getValue(value, "category")).toLowerCase();
  return {
    id: `${category || "service"}-${id}-${action}`,
    action,
    description: getText(getValue(value, "description")),
    category: category === "document" ? "document" : "service",
    reference: getText(getValue(value, "reference")),
    serviceId: getText(getValue(value, "serviceId")),
    timestamp,
  };
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const csvCell = (value: string): string => `"${value.replaceAll('"', '""')}"`;

export default function CaseExecutorActivityPage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      const response = await CaseExecutorEndpoints.getMyActivity();
      setActivities(unwrapRows(response).flatMap((item) => {
        const activity = normalizeActivity(item);
        return activity ? [activity] : [];
      }));
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error && requestError.message.trim()
          ? requestError.message
          : "Unable to load your recorded activity.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivities = useCallback(() => {
    setLoading(true);
    setError("");
    void fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchActivities(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchActivities]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activities;
    return activities.filter((activity) =>
      [activity.action, activity.description, activity.reference, activity.category]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [activities, search]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Action", "Description", "Category", "Service reference"],
      ...filteredActivities.map((activity) => [
        formatDate(activity.timestamp),
        activity.action,
        activity.description,
        activity.category,
        activity.reference,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "case-executor-activity.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
              <History className="h-4 w-4" />
              Case Executor
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My activity log</h1>
            <p className="mt-1 text-sm text-slate-500">
              A record of actions you have taken on services assigned to you.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadActivities()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredActivities.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Activity timeline</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? "Loading recorded activity…" : `${filteredActivities.length} recorded ${filteredActivities.length === 1 ? "action" : "actions"}`}
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search activity"
                aria-label="Search activity"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {error ? (
            <div className="m-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Activity could not be loaded</p>
                <p className="mt-1 break-words">{error}</p>
              </div>
              <button type="button" onClick={() => void loadActivities()} className="font-medium underline underline-offset-2">
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin text-blue-700" />
              Loading activity…
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <History className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-3 font-medium text-slate-900">
                {search ? "No matching activity" : "No recorded activity yet"}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Actions will appear here when they are recorded for services assigned to your account."}
              </p>
            </div>
          ) : (
            <ol className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => (
                <li key={activity.id} className="flex gap-4 px-5 py-5 sm:px-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    {activity.category === "document" ? <FileText className="h-4 w-4" /> : "ME"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                      <p className="font-medium text-slate-900">{activity.action}</p>
                      <time className="shrink-0 text-xs text-slate-500" dateTime={activity.timestamp}>
                        {formatDate(activity.timestamp)}
                      </time>
                    </div>
                    {activity.description && (
                      <p className="mt-1 break-words text-sm leading-6 text-slate-600">{activity.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                        {activity.category}
                      </span>
                      {activity.reference && (
                        activity.serviceId ? (
                          <Link
                            href={`/${lang}/admin/case-Executer/services?search=${encodeURIComponent(activity.reference)}`}
                            className="text-xs font-medium text-blue-700 hover:text-blue-900"
                          >
                            {activity.reference}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">{activity.reference}</span>
                        )
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
