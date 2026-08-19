"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

export function AssessmentDecision() {
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Assessment decision</h3>
        <p className="text-xs text-slate-400">Recorded against the case audit trail</p>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Valuation basis, documentary findings or reason for return."
        className="w-full h-24 p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none placeholder:text-slate-400"
      />

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-800 hover:bg-sky-900 text-white rounded-lg text-xs font-semibold transition-colors">
          <CheckCircle2 className="w-4 h-4" />
          Approve stage
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors">
          <RotateCcw className="w-4 h-4" />
          Return to executor
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors">
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}