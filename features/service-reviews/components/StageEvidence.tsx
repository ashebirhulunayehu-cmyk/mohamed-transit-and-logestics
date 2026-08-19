"use client";

import React from "react";
import { EvidenceFile } from "../serviceReview.types";
import { FileText } from "lucide-react";

interface StageEvidenceProps {
  files: EvidenceFile[];
  currentStage: string;
}

export function StageEvidence({ files, currentStage }: StageEvidenceProps) {
  return (
    <div className="space-y-3 border-b border-slate-100 pb-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Stage evidence</h3>
        <p className="text-xs text-slate-400">Documents attached to {currentStage}</p>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-800">{file.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{file.type}</p>
            </div>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
        ))}
      </div>
    </div>
  );
}