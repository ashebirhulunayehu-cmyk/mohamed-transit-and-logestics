"use client";

import React from "react";
import type { AssessmentLog } from "../assessmentLog.types";
import { CheckCircle2, AlertOctagon, Send, AlertTriangle, RotateCcw } from "lucide-react";

interface AssessmentLogItemProps {
  log: AssessmentLog;
}

export function AssessmentLogItem({ log }: AssessmentLogItemProps) {
  const getBadgeDetails = () => {
    switch (log.status) {
      case "Issued assessment":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        };
      case "Blocked stage":
      case "Returned KYC":
        return {
          icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
          bg: "bg-rose-50",
          border: "border-rose-200",
        };
      case "Requested revision":
        return {
          icon: <RotateCcw className="w-4 h-4 text-amber-600" />,
          bg: "bg-amber-50",
          border: "border-amber-200",
        };
      case "Submitted for approval":
      default:
        return {
          icon: <Send className="w-4 h-4 text-sky-600" />,
          bg: "bg-sky-50",
          border: "border-sky-200",
        };
    }
  };

  const badge = getBadgeDetails();

  return (
    <div className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-3.5">
      <div className={`p-2 rounded-xl border ${badge.bg} ${badge.border} shrink-0 mt-0.5`}>
        {badge.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-bold text-slate-900">{log.status}</span>
          <span className="text-slate-400">—</span>
          <span className="font-semibold text-sky-700 hover:underline cursor-pointer">
            {log.metadata || 'N/A'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
          <span>{log.details}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 font-medium">{log.timestamp}</span>
        </p>
      </div>
    </div>
  );
}