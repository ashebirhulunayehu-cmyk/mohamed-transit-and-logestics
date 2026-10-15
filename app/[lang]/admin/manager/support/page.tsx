"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ManagerEndpoints } from "@/modules/manager/manager.endpoint";

interface SupportRequest {
  id: string;
  subject: string;
  reference: string;
  description: string;
  customerName: string;
  status: string;
  priority: string;
  createdAt: string;
}

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readValue = (record: ApiRecord, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => name.toLowerCase() === candidate.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (record: ApiRecord, ...keys: string[]): string => {
  const value = readValue(record, ...keys);
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
};

const unwrapRequests = (value: unknown): ApiRecord[] => {
  let candidate = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(candidate)) {
      if (!candidate.every(isRecord)) {
        throw new Error("The support requests response contains invalid records.");
      }
      return candidate;
    }
    if (!isRecord(candidate)) break;

    const next = readValue(candidate, "data", "response", "payload", "result", "items", "records", "supportRequests");
    if (next === undefined || next === candidate) break;
    candidate = next;
  }

  if (candidate === null || candidate === undefined) return [];
  throw new Error("The support requests response did not contain a list.");
};

const normalizeRequest = (record: ApiRecord, index: number): SupportRequest => {
  const customer = readValue(record, "customer", "importer", "user");
  const customerRecord = isRecord(customer) ? customer : {};
  const firstName = readText(customerRecord, "firstName");
  const lastName = readText(customerRecord, "lastName");
  const name = readText(record, "customerName", "importerName", "businessName", "raisedByName")
    || readText(customerRecord, "businessName", "fullName", "name", "displayName")
    || [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: readText(record, "id", "supportRequestId", "requestId", "ticketId") || `request-${index}`,
    subject: readText(record, "subject", "title"),
    reference: readText(record, "serviceNumber", "trackingNumber", "serviceReference", "reference", "serviceId"),
    description: readText(record, "description", "details", "message"),
    customerName: name,
    status: readText(record, "status", "requestStatus"),
    priority: readText(record, "priority", "priorityLevel"),
    createdAt: readText(record, "createdAt", "createdDate", "createdOn", "submittedAt", "raisedAt"),
  };
};

const formatCreatedAt = (value: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "raised just now";
  if (seconds < 3600) return `raised ${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `raised ${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `raised ${Math.floor(seconds / 86400)}d ago`;
  return `raised ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`;
};

const getLoadErrorMessage = (error: unknown): string => {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "";

  if (/\b404\b|not found/i.test(message)) {
    return "The backend does not currently provide a Manager support-request listing endpoint (GET /SupportRequests). Requests cannot be shown until that API route is added.";
  }

  return message || "Unable to load support requests.";
};

export default function ManagerSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const response: unknown = await ManagerEndpoints.getSupportRequests();
    return unwrapRequests(response).map(normalizeRequest);
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await fetchRequests());
    } catch (loadError: unknown) {
      setError(getLoadErrorMessage(loadError));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  useEffect(() => {
    let active = true;

    void fetchRequests()
      .then((loadedRequests) => {
        if (active) setRequests(loadedRequests);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(getLoadErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchRequests]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Support</p>
          <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Support requests</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Support requests submitted by importers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          aria-label="Refresh support requests"
          className="inline-flex size-9 items-center justify-center self-start rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-900">Requests</h2>
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadRequests()} className="mt-2 font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : loading && requests.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500" role="status">
            Loading support requests…
          </p>
        ) : requests.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            No support requests found.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((request) => (
              <li key={request.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {request.subject || "Support request"}
                      {request.reference ? ` — ${request.reference}` : ""}
                    </p>
                    {request.description && (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{request.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {request.customerName && <span>{request.customerName}</span>}
                    {request.customerName && request.createdAt && <span aria-hidden="true">·</span>}
                    {request.createdAt && <span>{formatCreatedAt(request.createdAt)}</span>}
                    {request.priority && (
                      <>
                        {(request.customerName || request.createdAt) && <span aria-hidden="true">·</span>}
                        <span className="font-medium text-slate-600">{request.priority} priority</span>
                      </>
                    )}
                    {request.status && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                        {request.status}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
