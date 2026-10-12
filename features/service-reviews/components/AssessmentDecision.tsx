"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useServiceReviewStore } from "../serviceReview.store";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import { useAuditStore } from "@/features/audit-logs/audit-logs-store";

export function AssessmentDecision({ shipmentId }: { shipmentId?: number }) {
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  const reviewCase = useServiceReviewStore((state) => state.reviewCase);
  const loading = useServiceReviewStore((state) => state.loading);
  const error = useServiceReviewStore((state) => state.error);
  const fetchDashboard = useAssessorStore((state) => state.fetchDashboard);
  const fetchLogs = useAuditStore((state) => state.fetchLogs);

  const submitReview = async (isApproved: boolean) => {
    if (!shipmentId) {
      setFeedback("This case does not have a backend shipment ID.");
      setFeedbackError(true);
      return;
    }
    if (!isApproved && !note.trim()) {
      setFeedback("A review note is required when rejecting a shipment.");
      setFeedbackError(true);
      return;
    }

    setFeedback(null);
    setFeedbackError(false);
    try {
      const result = await reviewCase({
        shipmentId,
        isApproved,
        reviewNotes: note.trim() || null,
      });
      setFeedback(
        `${result.trackingNumber || `Service ${shipmentId}`} ${isApproved ? "approved" : "rejected"}.`
      );
      setNote("");
      await Promise.all([fetchDashboard(), fetchLogs()]);
    } catch {
      setFeedback(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Assessment decision</h3>
        <p className="mt-1 text-xs text-slate-500">Review notes are recorded with this shipment decision.</p>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Documentary findings, approval basis, or required reason for rejection."
        className="h-24 w-full resize-none rounded border border-slate-200 p-3 text-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={loading || !shipmentId} onClick={() => void submitReview(true)} className="flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">
          <CheckCircle2 className="w-4 h-4" />
          Approve shipment
        </button>
        <button disabled={loading || !shipmentId} onClick={() => void submitReview(false)} className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <XCircle className="w-4 h-4" />
          Reject shipment
        </button>
      </div>
      {loading && <p role="status" className="text-xs text-slate-500">Submitting review...</p>}
      {feedback && <p role={feedbackError ? "alert" : "status"} className={feedbackError ? "text-xs text-red-700" : "text-xs text-emerald-700"}>{feedback}</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <p className="text-xs text-slate-500">A review note is required to reject a shipment.</p>
    </div>
  );
}