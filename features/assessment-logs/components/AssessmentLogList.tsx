"use client";

import React from "react";
import { useAssessmentLogStore } from "../assessmentLog.store";
import { AssessmentLogItem } from "./AssessmentLogItem";
import { FileSearch } from "lucide-react";

export function AssessmentLogList() {
  const logs = useAssessmentLogStore((state) => state.getFilteredLogs());

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileSearch className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No assessment logs found</h3>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
      {logs.map((log) => (
        <AssessmentLogItem key={log.id} log={log} />
      ))}
    </div>
  );
}