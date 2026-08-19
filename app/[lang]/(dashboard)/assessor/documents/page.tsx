"use client";

import React from "react";
import { DocumentStats } from "@/features/documents/components/DocumentStats";
import { DocumentFilters } from "@/features/documents/components/DocumentFilters";
import { DocumentTable } from "@/features/documents/components/DocumentTable";
import { UploadSection } from "@/features/documents/components/UploadSection";

export default function DocumentsPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 text-slate-800 font-sans">
      {/* Top Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase block">
            DOCUMENT CENTRE
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every file attached to a case, with its verification state and full audit history.
          </p>
        </div>
        <button className="px-4 py-2 bg-sky-900 hover:bg-sky-950 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors self-start sm:self-auto">
          Upload document
        </button>
      </div>

      {/* Stats Counter Cards */}
      <DocumentStats />

      {/* Search & Filters Toolbar */}
      <DocumentFilters />

      {/* Document Data Table */}
      <DocumentTable />

      {/* Bottom Drag & Drop Upload Section */}
      <UploadSection />
    </div>
  );
}