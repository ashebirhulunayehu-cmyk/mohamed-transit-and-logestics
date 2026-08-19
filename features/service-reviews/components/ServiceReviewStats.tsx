"use client";

import React from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export function ServiceReviewStats() {
  const stats = useServiceReviewStore((state) => state.stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Awaiting Review */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-500">Awaiting review</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.awaitingReview}</p>
        </div>
        <FileText className="w-5 h-5 text-slate-400" />
      </div>

      {/* Red Channel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-500">Red channel</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.redChannel}</p>
          <p className="text-xs text-slate-400 mt-1">physical inspection</p>
        </div>
        <AlertTriangle className="w-5 h-5 text-slate-400" />
      </div>

      {/* Submitted for review */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-sky-500 shadow-sm flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-500">Submitted for review</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.submittedForReview}</p>
        </div>
        <FileText className="w-5 h-5 text-slate-400" />
      </div>

      {/* Signed Off */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-500">Signed off</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.signedOff}</p>
        </div>
        <CheckCircle2 className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
}