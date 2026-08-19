"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { mockServiceCases } from "@/features/service-reviews/serviceReview.data";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { StageEvidence } from "@/features/service-reviews/components/StageEvidence";
import { AssessmentDecision } from "@/features/service-reviews/components/AssessmentDecision";

export default function SingleServiceCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const currentCase = mockServiceCases.find((c) => c.id === caseId) || mockServiceCases[0];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Service Reviews
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {currentCase.title} — {currentCase.containerCount}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {currentCase.id} · {currentCase.route}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                {currentCase.statusTag}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100/70 text-amber-900 border border-amber-200/60">
                <ShieldAlert className="w-3 h-3 text-amber-700" />
                {currentCase.channel}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm border-b border-slate-100 pb-6">
          <div>
            <span className="text-slate-400 text-xs block">Importer</span>
            <span className="font-semibold text-slate-800">{currentCase.importer}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Mode</span>
            <span className="font-medium text-slate-800">{currentCase.mode}</span>
          </div>

          <div>
            <span className="text-slate-400 text-xs block">Commodity</span>
            <span className="text-slate-800 font-medium">{currentCase.commodity}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">HS code</span>
            <span className="font-mono text-slate-800 font-semibold">
              {currentCase.hsCode}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-xs block">Declared value</span>
            <span className="text-slate-800 font-semibold">{currentCase.declaredValue}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Incoterm</span>
            <span className="text-slate-800 font-medium">{currentCase.incoterm}</span>
          </div>

          <div>
            <span className="text-slate-400 text-xs block">Bill of lading</span>
            <span className="font-mono text-slate-800 font-medium">
              {currentCase.billOfLading}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Case executor</span>
            <span className="text-slate-800 font-medium">{currentCase.caseExecutor}</span>
          </div>
        </div>

        <StageEvidence
          files={currentCase.evidenceFiles}
          currentStage={currentCase.currentStage}
        />

        <AssessmentDecision />
      </div>
    </div>
  );
}