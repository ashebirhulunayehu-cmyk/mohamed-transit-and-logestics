"use client";

import React, { useEffect } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { AlertTriangle, CheckCircle2, FileText, Send } from "lucide-react";
import { useAssessorStore } from "@/modules/assessor/assessor.store";

export function ServiceReviewStats() {
  const stats = useServiceReviewStore((state) => state.stats);
  const casesLoaded = useServiceReviewStore((state) => state.casesLoaded);
  const casesLoading = useServiceReviewStore((state) => state.loading);
  const casesError = useServiceReviewStore((state) => state.error);
  const completedReviewsToday = useAssessorStore(
    (state) => state.dashboardData?.completedReviewsToday ?? null,
  );
  const dashboardError = useAssessorStore((state) => state.dashboardError);
  const dashboardLoading = useAssessorStore((state) => state.dashboardLoading);
  const fetchDashboard = useAssessorStore((state) => state.fetchDashboard);
  const queueCount = (value: number) =>
    casesError ? "Unavailable" : !casesLoaded || casesLoading ? "…" : value;

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Awaiting review</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{queueCount(stats.awaitingReview)}</p>
        </div>
        <FileText aria-hidden="true" className="h-5 w-5 text-slate-400" />
      </div>

      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-rose-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Red channel</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{queueCount(stats.redChannel)}</p>
          <p className="mt-1 max-w-44 text-[11px] text-slate-500">
            Physical inspection and valuation review
          </p>
        </div>
        <AlertTriangle aria-hidden="true" className="h-5 w-5 text-slate-400" />
      </div>

      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-sky-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Submitted for review</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{queueCount(stats.submittedForReview)}</p>
        </div>
        <Send aria-hidden="true" className="h-5 w-5 text-slate-400" />
      </div>

      <div className="flex items-start justify-between rounded-xl border border-slate-200/80 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-500">Signed off today</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {dashboardError
              ? "Unavailable"
              : dashboardLoading && completedReviewsToday === null
                ? "…"
                : completedReviewsToday ?? "—"}
          </p>
          {dashboardError && (
            <p role="alert" className="mt-1 max-w-44 text-[11px] text-rose-700">
              Could not load dashboard count: {dashboardError}
            </p>
          )}
        </div>
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-slate-400" />
      </div>
    </div>
  );
}