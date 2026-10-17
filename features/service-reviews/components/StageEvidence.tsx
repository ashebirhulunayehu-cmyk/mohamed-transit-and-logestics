"use client";

import React, { useState } from "react";
import { EvidenceFile } from "../serviceReview.types";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";

interface StageEvidenceProps {
  files: EvidenceFile[];
  serviceId?: number | null;
  loading?: boolean;
  error?: string | null;
}

export function StageEvidence({
  files,
  serviceId,
  loading = false,
  error = null,
}: StageEvidenceProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const getResponseBlob = (response: unknown): Blob | null => {
    if (response instanceof Blob) return response;
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      response.data instanceof Blob
    ) {
      return response.data;
    }
    return null;
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleDownload = async (file: EvidenceFile) => {
    if (file.source === "Stage" && (!serviceId || !file.serviceStageId || !file.stageDocumentId)) return;
    if (file.source !== "Stage" && !file.documentId) return;
    setDownloadingId(file.id);
    setDownloadError(null);

    try {
      const response: unknown = file.source === "Stage"
        ? await AssessorEndpoints.downloadStageDocument(
            serviceId!,
            file.serviceStageId!,
            file.stageDocumentId!,
          )
        : await AssessorEndpoints.downloadDocument(file.documentId!);
      const blob = getResponseBlob(response);
      if (!blob) throw new Error("The document endpoint did not return a file.");
      saveBlob(blob, file.name);
    } catch (error: unknown) {
      setDownloadError(error instanceof Error ? error.message : String(error));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    const documentIds = files.flatMap((file) =>
      file.source === "Service" && file.documentId ? [file.documentId] : [],
    );
    const stageFiles = files.filter((file) =>
      file.source === "Stage" && file.stageDocumentId && file.serviceStageId,
    );
    if (!documentIds.length && !stageFiles.length) return;

    setDownloadingAll(true);
    setDownloadError(null);
    try {
      if (documentIds.length) {
        const response: unknown = await AssessorEndpoints.downloadDocuments(documentIds);
        const blob = getResponseBlob(response);
        if (!blob) throw new Error("The service-document endpoint did not return a file.");
        saveBlob(blob, "service-documents.zip");
      }
      if (stageFiles.length) {
        if (!serviceId) throw new Error("A valid service ID is required to download stage documents.");
        const stageIds = new Set(stageFiles.map((file) => file.serviceStageId));
        for (const stageId of stageIds) {
          const documentIdsForStage = stageFiles.flatMap((file) =>
            file.serviceStageId === stageId && file.stageDocumentId
              ? [file.stageDocumentId]
              : [],
          );
          const response: unknown = await AssessorEndpoints.downloadStageDocuments(
            serviceId,
            stageId!,
            documentIdsForStage,
          );
          const blob = getResponseBlob(response);
          if (!blob) throw new Error("The stage-document endpoint did not return a file.");
          saveBlob(blob, "stage-documents.zip");
        }
      }
    } catch (error: unknown) {
      setDownloadError(error instanceof Error ? error.message : String(error));
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-3 border-b border-slate-100 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Stage evidence</h3>
          <p className="mt-1 text-xs text-slate-500">
            Customer, service, and stage documents associated with this shipment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadAll()}
          disabled={
            downloadingAll ||
            downloadingId !== null ||
            files.length === 0 ||
            !files.some((file) =>
              (file.source === "Service" && file.documentId) ||
              (file.source === "Stage" && file.stageDocumentId && file.serviceStageId),
            )
          }
          className="inline-flex shrink-0 items-center gap-2 rounded border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {downloadingAll
            ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            : <Download aria-hidden="true" className="h-3.5 w-3.5" />}
          Download all
        </button>
      </div>

      <div className="space-y-2">
        {downloadError && (
          <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            Could not download document: {downloadError}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            Could not load service documents: {error}
          </p>
        )}
        {loading && files.length === 0 ? (
          <p role="status" className="rounded border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
            Loading service documents...
          </p>
        ) : files.length === 0 ? (
          <p className="rounded border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
            No documents are attached to this service.
          </p>
        ) : files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50/60 p-3.5"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">{file.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {file.type} · {file.source} document · {file.isRequired ? "Required" : "Not marked required"} · {file.isExpired ? "Expired" : file.isVerified ? "Verified" : "Unverified"}
              </p>
              {file.description && <p className="mt-1 text-[11px] text-slate-500">{file.description}</p>}
              {(file.mimeType || file.size) && (
                <p className="mt-1 text-[11px] text-slate-400">
                  {file.mimeType ? `MIME: ${file.mimeType}` : ""}
                  {file.mimeType && file.size ? " · " : ""}
                  {file.size ? `Size: ${file.size} bytes` : ""}
                </p>
              )}
              {file.submittedAt && <p className="mt-1 text-[11px] text-slate-400">Submitted: {new Date(file.submittedAt).toLocaleString()}</p>}
              {file.expiryDate && <p className="mt-1 text-[11px] text-slate-400">Expires: {new Date(file.expiryDate).toLocaleDateString()}</p>}
              {file.verificationNotes && <p className="mt-1 text-[11px] text-slate-600">Verification note: {file.verificationNotes}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <FileText aria-hidden="true" className="w-4 h-4 text-slate-400" />
              {file.source !== "Customer" && <button
                type="button"
                onClick={() => void handleDownload(file)}
                disabled={
                  file.source === "Stage"
                    ? !file.stageDocumentId || !file.serviceStageId || !serviceId || downloadingId !== null || downloadingAll
                    : !file.documentId || downloadingId !== null || downloadingAll
                }
                title={
                  file.source === "Stage"
                    ? file.stageDocumentId ? `Download ${file.name}` : "Document ID unavailable"
                    : file.documentId ? `Download ${file.name}` : "Document ID unavailable"
                }
                aria-label={`Download ${file.name}`}
                className="rounded p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {downloadingId === file.id
                  ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  : <Download aria-hidden="true" className="h-4 w-4" />}
              </button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}