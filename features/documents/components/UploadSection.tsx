"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { useDocumentStore } from "../document.store";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function UploadSection() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadDocument = useDocumentStore((state) => state.uploadDocument);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [serviceStageId, setServiceStageId] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");

  const handleFileSelection = (file: File | null) => {
    setError(null);
    setSuccess(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Please upload a file under 25 MB.");
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelection(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!serviceId.trim() || !serviceStageId.trim() || !documentType.trim()) {
      setError("Enter the service ID, service stage ID, and document type before uploading.");
      return;
    }

    const serviceIdValue = Number(serviceId);
    const serviceStageIdValue = Number(serviceStageId);
    if (
      !Number.isSafeInteger(serviceIdValue) || serviceIdValue <= 0 ||
      !Number.isSafeInteger(serviceStageIdValue) || serviceStageIdValue <= 0
    ) {
      setError("Service ID and service stage ID must be positive whole numbers.");
      return;
    }

    const formData = new FormData();
    formData.append("File", selectedFile, selectedFile.name);
    formData.append("ServiceId", String(serviceIdValue));
    formData.append("ServiceStageId", String(serviceStageIdValue));
    formData.append("DocumentType", documentType.trim());
    formData.append("Description", description.trim());

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      await uploadDocument(formData);
      setSuccess(`${selectedFile.name} was uploaded successfully.`);
      if (inputRef.current) inputRef.current.value = "";
      setSelectedFile(null);
    } catch (uploadError: unknown) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : typeof uploadError === "string" && uploadError.trim()
            ? uploadError
            : "Document upload failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 pr-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Assessor upload
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Upload supporting document</h3>
        </div>
        <div className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
          Max 25 MB
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-sky-500 hover:bg-sky-50/40 lg:min-h-0">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Select document</h4>
              <p className="mt-1 text-xs text-slate-500">
                PDF, JPG, PNG, XLSX and CSV files are supported.
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              {uploading ? "Uploading..." : "Browse files"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Service ID
            <input
              required
              type="number"
              min="1"
              step="1"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter the service ID"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Service stage ID
            <input
              required
              type="number"
              min="1"
              step="1"
              value={serviceStageId}
              onChange={(event) => setServiceStageId(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter the service stage ID"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Document type
            <input
              required
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter the document type"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Supporting document for review"
            />
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Selected file:</span> {selectedFile.name}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="sticky bottom-0 mt-4 flex justify-end border-t border-slate-100 bg-white pt-3">
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={!selectedFile || uploading}
          className="rounded-lg bg-sky-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload document"}
        </button>
      </div>
    </div>
  );
}