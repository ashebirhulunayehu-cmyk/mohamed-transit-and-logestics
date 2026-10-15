"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  Ellipsis,
  Eye,
  FileText,
  Flag,
  LoaderCircle,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useDocumentStore } from "../document.store";
import type { DocumentRecord } from "../document.types";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

type ReviewAction = "flag" | "reject";

const getBlob = (response: unknown): Blob | null => {
  if (response instanceof Blob) return response;
  if (typeof response === "object" && response !== null && "data" in response) {
    const data = response.data;
    return data instanceof Blob ? data : null;
  }
  return null;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message.trim()
    ? error.message
    : typeof error === "string" && error.trim()
      ? error
      : fallback;

const formatUploadedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const startDownload = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export function DocumentTable() {
  const {
    getFilteredDocuments,
    verifyDocumentById,
    downloadFile,
    loading,
  } = useDocumentStore();
  const filteredData = getFilteredDocuments();
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [workingAction, setWorkingAction] = useState<"verify" | ReviewAction | null>(null);

  useEffect(() => {
    const documentId = selectedDocument?.id;
    if (!documentId) return;
    let active = true;
    let objectUrl: string | null = null;
    void downloadFile(documentId)
      .then((response) => {
        const blob = getBlob(response);
        if (!blob) throw new Error("The document endpoint did not return a previewable file.");
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setPreviewUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch((error: unknown) => {
        if (active) setActionError(getErrorMessage(error, "Could not load document preview."));
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [downloadFile, selectedDocument?.id]);

  const closePreview = () => {
    setSelectedDocument(null);
    setPreviewUrl(null);
    setActionError(null);
    setActionFeedback(null);
    setReviewAction(null);
    setReviewNote("");
  };

  const openPreview = (documentRecord: DocumentRecord) => {
    setPreviewUrl(null);
    setPreviewLoading(true);
    setActionError(null);
    setActionFeedback(null);
    setReviewAction(null);
    setReviewNote("");
    setSelectedDocument(documentRecord);
  };

  const handleDownload = async () => {
    if (!selectedDocument) return;
    setActionError(null);
    try {
      if (previewUrl) {
        startDownload(previewUrl, selectedDocument.name);
      } else {
        const response = await downloadFile(selectedDocument.id);
        const blob = getBlob(response);
        if (!blob) throw new Error("The document endpoint did not return a downloadable file.");
        const objectUrl = URL.createObjectURL(blob);
        startDownload(objectUrl, selectedDocument.name);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "Document download failed."));
    }
  };

  const handleVerify = async () => {
    if (!selectedDocument) return;
    setWorkingAction("verify");
    setActionError(null);
    setActionFeedback(null);
    try {
      await verifyDocumentById({
        documentId: selectedDocument.id,
        isVerified: true,
        verificationNotes: "Verified from the assessor document centre.",
      });
      setSelectedDocument((document) =>
        document ? { ...document, status: "Verified", verificationNotes: "Verified from the assessor document centre." } : document,
      );
      setActionFeedback("Document verification was submitted.");
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "Document verification failed."));
    } finally {
      setWorkingAction(null);
    }
  };

  const handleReviewAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDocument || !reviewAction) return;
    const note = reviewNote.trim();
    if (!note) {
      setActionError(`Enter a reason to ${reviewAction === "flag" ? "flag" : "reject"} this document.`);
      return;
    }

    setWorkingAction(reviewAction);
    setActionError(null);
    setActionFeedback(null);
    try {
      const statusNote = `${reviewAction === "flag" ? "Flagged" : "Rejected"}: ${note}`;
      await verifyDocumentById({
        documentId: selectedDocument.id,
        isVerified: false,
        verificationNotes: statusNote,
      });
      setSelectedDocument((document) =>
        document
          ? {
              ...document,
              status: reviewAction === "flag" ? "Flagged" : "Rejected",
              verificationNotes: statusNote,
            }
          : document,
      );
      setActionFeedback(`Document ${reviewAction === "flag" ? "flagged for review" : "rejected"}.`);
      setReviewAction(null);
      setReviewNote("");
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, `Unable to ${reviewAction} document.`));
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">DOCUMENT</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3">SERVICE / STAGE</th>
                <th className="px-4 py-3">UPLOADED BY</th>
                <th className="px-4 py-3">UPLOADED</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading documents...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No documents found.
                  </td>
                </tr>
              ) : filteredData.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => openPreview(row)}
                      className="flex max-w-[280px] items-center gap-2.5 text-left font-semibold text-slate-800 hover:text-sky-700"
                    >
                      <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <FileText aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="truncate">{row.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{row.type}</td>
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-sky-700">
                      {row.serviceTrackingNumber || row.serviceId}
                    </span>
                    <span className="block text-[11px] text-slate-400">{row.serviceStage}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{row.uploadedBy}</td>
                  <td className="px-4 py-3.5 text-slate-500">{formatUploadedAt(row.uploadedAt)}</td>
                  <td className="px-4 py-3.5"><DocumentStatusBadge status={row.status} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => openPreview(row)}
                        className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title={`Preview ${row.name}`}
                        aria-label={`Preview ${row.name}`}
                      >
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openPreview(row)}
                        className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title={`More actions for ${row.name}`}
                        aria-label={`More actions for ${row.name}`}
                      >
                        <Ellipsis aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
          <span>Showing {filteredData.length} documents</span>
          <span className="font-medium text-slate-700">Page 1 of 1</span>
        </div>
      </div>

      {selectedDocument && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <h2 id="document-preview-title" className="truncate text-sm font-bold text-slate-900">
                  {selectedDocument.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedDocument.type} · {selectedDocument.uploadedAt}
                  {selectedDocument.uploadedBy !== "Unavailable" ? ` · uploaded by ${selectedDocument.uploadedBy}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close document preview"
                className="shrink-0 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative min-h-[300px] bg-slate-100 lg:min-h-0">
                {previewLoading ? (
                  <div role="status" className="flex h-full min-h-[300px] items-center justify-center gap-2 text-sm text-slate-500">
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                    Loading document preview...
                  </div>
                ) : previewUrl ? (
                  <iframe
                    title={`Preview of ${selectedDocument.name}`}
                    src={previewUrl}
                    className="h-[55vh] min-h-[300px] w-full border-0 lg:h-full"
                  />
                ) : (
                  <div className="flex h-full min-h-[300px] items-center justify-center p-6 text-center text-sm text-slate-500">
                    Preview is unavailable. You can still try downloading the document.
                  </div>
                )}
              </div>

              <aside className="max-h-[42vh] space-y-5 overflow-y-auto border-t border-slate-200 bg-white p-4 lg:max-h-none lg:border-l lg:border-t-0">
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Verification</h3>
                  <div className="mt-3"><DocumentStatusBadge status={selectedDocument.status} /></div>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Document ID</dt>
                      <dd className="mt-0.5 break-all font-medium text-slate-800">{selectedDocument.id}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Checksum</dt>
                      <dd className="mt-0.5 break-all font-medium text-slate-800">{selectedDocument.checksum || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Access</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">{selectedDocument.accessRestriction || "Not recorded"}</dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void handleDownload()}
                    disabled={previewLoading || workingAction !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleVerify()}
                    disabled={workingAction !== null || selectedDocument.status === "Verified"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded bg-sky-800 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {workingAction === "verify"
                      ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                      : <ShieldCheck aria-hidden="true" className="h-4 w-4" />}
                    Verify document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewAction("flag");
                      setReviewNote("");
                      setActionError(null);
                    }}
                    disabled={workingAction !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <Flag aria-hidden="true" className="h-4 w-4" /> Flag for review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewAction("reject");
                      setReviewNote("");
                      setActionError(null);
                    }}
                    disabled={workingAction !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <XCircle aria-hidden="true" className="h-4 w-4" /> Reject
                  </button>
                </section>

                {reviewAction && (
                  <form onSubmit={(event) => void handleReviewAction(event)} className="space-y-2 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-700">
                      Reason to {reviewAction === "flag" ? "flag" : "reject"}
                      <textarea
                        required
                        maxLength={2000}
                        rows={3}
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        className="mt-1 w-full rounded border border-slate-200 p-2 text-xs font-normal text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewAction(null)}
                        disabled={workingAction !== null}
                        className="rounded border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={workingAction !== null || !reviewNote.trim()}
                        className="rounded bg-sky-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-900 disabled:opacity-50"
                      >
                        {workingAction === reviewAction ? "Saving..." : "Confirm"}
                      </button>
                    </div>
                  </form>
                )}

                {(actionError || actionFeedback) && (
                  <p
                    role={actionError ? "alert" : "status"}
                    className={`border-t border-slate-100 pt-3 text-xs ${actionError ? "text-rose-700" : "text-emerald-700"}`}
                  >
                    {actionError || actionFeedback}
                  </p>
                )}

                <section className="border-t border-slate-100 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">History</h3>
                  <ul className="mt-3 space-y-2 text-[11px] text-slate-600">
                    <li>
                      Uploaded · {selectedDocument.uploadedAt}
                      {selectedDocument.uploadedBy !== "Unavailable" ? ` · ${selectedDocument.uploadedBy}` : ""}
                    </li>
                    {selectedDocument.virusScanStatus && <li>Virus scan · {selectedDocument.virusScanStatus}</li>}
                    {selectedDocument.history?.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}
                    {selectedDocument.verificationNotes && <li>Verification note · {selectedDocument.verificationNotes}</li>}
                    {!selectedDocument.history?.length && !selectedDocument.virusScanStatus && !selectedDocument.verificationNotes && (
                      <li className="text-slate-400">No additional audit history was returned.</li>
                    )}
                  </ul>
                </section>
              </aside>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
