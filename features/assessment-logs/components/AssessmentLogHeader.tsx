"use client";

import React from "react";

export function AssessmentLogHeader() {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
        AUDIT
      </span>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment logs</h1>
      <p className="text-sm text-slate-500">
        Every approval, rejection and revision you have recorded.
      </p>
    </div>
  );
}