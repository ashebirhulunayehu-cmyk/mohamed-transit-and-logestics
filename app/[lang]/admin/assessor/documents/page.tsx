"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DocumentStats } from "@/features/documents/components/DocumentStats";
import { DocumentFilters } from "@/features/documents/components/DocumentFilters";
import { DocumentTable } from "@/features/documents/components/DocumentTable";
import { UploadSection } from "@/features/documents/components/UploadSection";
import { useDocumentStore } from "@/features/documents/document.store";

export default function DocumentsPage() {
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const error = useDocumentStore((state) => state.error);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase block">
            DOCUMENT CENTRE
          </span>
          <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every file attached to a case, with its verification state and full audit history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="self-start rounded-lg bg-sky-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-950 sm:self-auto"
        >
          Upload document
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      <DocumentStats />
      <DocumentFilters />
      <DocumentTable />

      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsUploadOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessor-document-upload-title"
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl bg-white p-3 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-4"
          >
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              aria-label="Close upload dialog"
              className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
            <div id="assessor-document-upload-title" className="sr-only">
              Upload document
            </div>
            <UploadSection />
          </section>
        </div>
      )}
    </div>
  );
}