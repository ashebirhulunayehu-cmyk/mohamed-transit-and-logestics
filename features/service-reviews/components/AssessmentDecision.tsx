"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useServiceReviewStore } from "../serviceReview.store";

export function AssessmentDecision({ shipmentId }: { shipmentId?: number }) {
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const reviewCase = useServiceReviewStore((state) => state.reviewCase);
  const loading = useServiceReviewStore((state) => state.loading);
  const error = useServiceReviewStore((state) => state.error);

  const submitReview = async (isApproved: boolean) => {
    if (!shipmentId) {
      setFeedback("This case does not have a backend shipment ID.");
      return;
    }

    setFeedback(null);
    try {
      const result = await reviewCase({
        shipmentId,
        isApproved,
        reviewNotes: note.trim() || null,
      });
      setFeedback(
        `${result.trackingNumber || `Service ${shipmentId}`} ${isApproved ? "approved" : "returned for review"}.`
      );
    } catch {
      setFeedback(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Assessment decision</h3>
        <p className="mt-1 text-xs text-slate-500">Recorded against the case audit trail</p>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Valuation basis, documentary findings or reason for return."
        className="h-24 w-full resize-none rounded border border-slate-200 p-3 text-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={loading || !shipmentId} onClick={() => void submitReview(true)} className="flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">
          <CheckCircle2 className="w-4 h-4" />
          Approve stage
        </button>
        <button disabled={loading || !shipmentId} onClick={() => void submitReview(false)} className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <RotateCcw className="w-4 h-4" />
          Return to executor
        </button>
        <button disabled={loading || !shipmentId} onClick={() => void submitReview(false)} className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>
      {loading && <p role="status" className="text-xs text-slate-500">Submitting review...</p>}
      {feedback && <p role="status" className="text-xs text-emerald-700">{feedback}</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}