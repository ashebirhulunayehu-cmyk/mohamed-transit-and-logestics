"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, Upload, X } from "lucide-react";
import { DocumentStatusBadge } from "@/features/documents/components/DocumentStatusBadge";
import { UploadSection } from "@/features/documents/components/UploadSection";
import { useDocumentStore } from "@/features/documents/document.store";
import type { DocumentRecord } from "@/features/documents/document.types";
import { ManagerEndpoints } from "@/modules/manager/manager.endpoint";
import type { ManagerServiceQuery } from "@/modules/manager/manager.type";

type ApiRecord = Record<string, unknown>;

interface ServicePage {
  rows: ApiRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readValue = (record: ApiRecord, ...names: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readNumber = (value: unknown, fallback: number): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
};

const unwrapServicePage = (value: unknown, requestedPage: number): ServicePage => {
  let current = value;
  for (let depth = 0; depth < 8; depth += 1) {
    if (Array.isArray(current)) {
      const rows = current.filter(isRecord);
      return {
        rows,
        page: requestedPage,
        pageSize: rows.length || 1,
        totalCount: rows.length,
        totalPages: rows.length ? 1 : 0,
      };
    }
    if (!isRecord(current)) break;

    const listKey = Object.keys(current).find((key) =>
      ["items", "services", "records", "serviceList", "serviceRecords", "rows"].includes(key.toLowerCase()),
    );
    if (listKey && Array.isArray(current[listKey])) {
      const rows = (current[listKey] as unknown[]).filter(isRecord);
      const page = readNumber(readValue(current, "page", "currentPage"), requestedPage) || requestedPage;
      const pageSize = readNumber(readValue(current, "pageSize", "limit"), rows.length || 1) || rows.length || 1;
      const totalCount = readNumber(readValue(current, "totalCount", "totalItems", "count"), rows.length);
      const totalPages = readNumber(
        readValue(current, "totalPages", "pageCount"),
        Math.ceil(totalCount / pageSize),
      );
      return { rows, page, pageSize, totalCount, totalPages };
    }

    const data = readValue(current, "data");
    if (Array.isArray(data)) {
      const rows = data.filter(isRecord);
      const pageSize = readNumber(readValue(current, "pageSize", "limit"), rows.length || 1) || rows.length || 1;
      const totalCount = readNumber(readValue(current, "totalCount", "totalItems", "count"), rows.length);
      return {
        rows,
        page: readNumber(readValue(current, "page", "currentPage"), requestedPage) || requestedPage,
        pageSize,
        totalCount,
        totalPages: readNumber(
          readValue(current, "totalPages", "pageCount"),
          Math.ceil(totalCount / pageSize),
        ),
      };
    }

    const nested = readValue(current, "response", "payload", "data", "result");
    if (nested === undefined || nested === current) break;
    current = nested;
  }

  throw new Error("The services response did not contain a service list.");
};

const getServiceIds = (services: ApiRecord[]): string[] =>
  [...new Set(services.flatMap((service) => {
    const id = readValue(service, "id", "serviceId");
    if (typeof id !== "number" && typeof id !== "string") return [];
    const normalized = String(id).trim();
    return normalized ? [normalized] : [];
  }))];

const formatUploadedAt = (value: string): string => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ManagerDocumentsPage() {
  const documents = useDocumentStore((state) => state.documents);
  const fetchDocumentsForServices = useDocumentStore((state) => state.fetchDocumentsForServices);
  const downloadFile = useDocumentStore((state) => state.downloadFile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    const serviceIds: string[] = [];
    let page = 1;
    let totalPages = 1;
    const pageSize = 100;

    while (page <= totalPages) {
      const query: ManagerServiceQuery = { page, pageSize };
      const response: unknown = await ManagerEndpoints.getAllServices(query);
      const servicePage = unwrapServicePage(response, page);
      serviceIds.push(...getServiceIds(servicePage.rows));
      totalPages = servicePage.totalPages;
      if (servicePage.rows.length === 0 || servicePage.page < page) break;
      page += 1;
    }

    await fetchDocumentsForServices([...new Set(serviceIds)]);
    const documentError = useDocumentStore.getState().error;
    if (documentError) throw new Error(documentError);
  }, [fetchDocumentsForServices]);

  useEffect(() => {
    let active = true;
    void loadDocuments()
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load documents.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadDocuments]);

  const refreshDocuments = async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      await loadDocuments();
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const types = useMemo(
    () => [...new Set(documents.map((document) => document.type).filter(Boolean))].sort(),
    [documents],
  );

  const handleDownload = async (row: DocumentRecord) => {
    setDownloadingId(row.id);
    setActionError(null);
    try {
      const response = await downloadFile(row.id);
      const blob = response instanceof Blob
        ? response
        : isRecord(response) && response.data instanceof Blob
          ? response.data
          : null;
      if (!blob) throw new Error("The document endpoint did not return a file.");

      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = row.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError: unknown) {
      setActionError(downloadError instanceof Error ? downloadError.message : "Unable to download this document.");
    } finally {
      setDownloadingId(null);
    }
  };

  const total = documents.length;
  const verified = documents.filter((document) => document.status === "Verified").length;
  const flagged = documents.filter((document) => document.status === "Flagged").length;
  const rejected = documents.filter((document) => document.status === "Rejected").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Document centre
          </span>
          <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every file attached to a service, with its verification status.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>{total} documents</span>
            <span>{verified} verified</span>
            <span>{flagged} flagged</span>
            <span>{rejected} rejected</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void refreshDocuments()}
            disabled={loading}
            aria-label="Refresh documents"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-950"
          >
            <Upload className="size-4" aria-hidden="true" />
            Upload document
          </button>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="sr-only">All documents</h2>

        {error && (
          <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void refreshDocuments()} className="mt-2 font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        )}
        {actionError && (
          <p className="mx-4 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {actionError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service / stage</th>
                <th className="px-4 py-3">Uploaded by</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500" role="status">
                    Loading documents…
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No documents found.
                  </td>
                </tr>
              ) : documents.map((document) => (
                <tr key={document.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-800" title={document.name}>
                        {document.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{document.type}</td>
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-sky-700">{document.serviceId}</span>
                    <span className="block text-[11px] text-slate-400">{document.serviceStage}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{document.uploadedBy}</td>
                  <td className="px-4 py-3.5 text-slate-500">{formatUploadedAt(document.uploadedAt)}</td>
                  <td className="px-4 py-3.5"><DocumentStatusBadge status={document.status} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDownload(document)}
                      disabled={downloadingId !== null}
                      title="Download document"
                      aria-label={`Download ${document.name}`}
                      className="inline-flex rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                      <Download className={`size-4 ${downloadingId === document.id ? "animate-pulse" : ""}`} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
          <span>Showing {total} documents</span>
          {types.length > 0 && <span>{types.length} document types</span>}
        </footer>
      </section>

      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setUploadOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="manager-document-upload-title"
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl bg-white p-3 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-4"
          >
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              aria-label="Close upload dialog"
              className="absolute top-5 right-5 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="size-4" />
            </button>
            <div id="manager-document-upload-title" className="sr-only">Upload document</div>
            <UploadSection
              contextLabel="Manager upload"
              onUploaded={() => {
                setUploadOpen(false);
                void refreshDocuments();
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}
