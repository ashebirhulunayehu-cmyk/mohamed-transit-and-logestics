"use client";

import React from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { FileText, AlertTriangle, CircleAlert } from "lucide-react";

export function ServiceReviewStats() {
  const stats = useServiceReviewStore((state) => state.stats);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Awaiting Review */}
      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Awaiting review</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.awaitingReview}</p>
        </div>
        <FileText className="w-5 h-5 text-slate-400" />
      </div>

      {/* Red Channel */}
      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-rose-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Red channel</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.redChannel}</p>
        </div>
        <AlertTriangle className="w-5 h-5 text-slate-400" />
      </div>

      {/* Documents available */}
      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-sky-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Cases with documents</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.withDocuments}</p>
        </div>
        <FileText className="w-5 h-5 text-slate-400" />
      </div>

      {/* Unverified documents */}
      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-rose-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Unverified documents</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.unverifiedDocuments}</p>
        </div>
        <CircleAlert className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
}