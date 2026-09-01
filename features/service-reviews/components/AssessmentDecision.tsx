"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

export function AssessmentDecision() {
  const [note, setNote] = useState("");

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
        <button className="flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900">
          <CheckCircle2 className="w-4 h-4" />
          Approve stage
        </button>
        <button className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <RotateCcw className="w-4 h-4" />
          Return to executor
        </button>
        <button className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}