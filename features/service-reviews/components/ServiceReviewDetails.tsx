"use client";

import React, { useEffect } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { StageEvidence } from "./StageEvidence";
import { AssessmentDecision } from "./AssessmentDecision";
import { ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { EvidenceFile } from "../serviceReview.types";

const EMPTY_EVIDENCE_FILES: EvidenceFile[] = [];

export function ServiceReviewDetails() {
  const selectedCase = useServiceReviewStore((state) => state.getSelectedCase());
  const fetchServiceDocuments = useServiceReviewStore((state) => state.fetchServiceDocuments);
  const documentsLoading = useServiceReviewStore((state) => state.documentsLoading);
  const documentsError = useServiceReviewStore((state) => state.documentsError);
  const serviceDocuments = useServiceReviewStore((state) =>
    selectedCase?.shipmentId
      ? state.serviceDocuments[String(selectedCase.shipmentId)] ?? selectedCase.evidenceFiles
      : selectedCase?.evidenceFiles ?? EMPTY_EVIDENCE_FILES,
  );
  const { lang = "en" } = useParams<{ lang: string }>();

  useEffect(() => {
    const serviceId = selectedCase?.shipmentId;
    if (!serviceId) return;

    const timeoutId = window.setTimeout(() => {
      void fetchServiceDocuments(serviceId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchServiceDocuments, selectedCase?.shipmentId]);

  if (!selectedCase) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        Select a case to view details
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Top Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {selectedCase.title} — {selectedCase.containerCount}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {selectedCase.id} · {selectedCase.route}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              {selectedCase.statusTag}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100/70 text-amber-900 border border-amber-200/60">
              <ShieldAlert className="w-3 h-3 text-amber-700" />
              {selectedCase.channel}
            </span>
          </div>
        </div>

        <Link
          href={`/${lang}/admin/assessor/service-reviews/${selectedCase.id}`}
          className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Open case
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm border-b border-slate-100 pb-6">
        <div>
          <span className="text-slate-400 text-xs block">Importer</span>
          <span className="font-semibold text-slate-800">{selectedCase.importer}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">Mode</span>
          <span className="font-medium text-slate-800">{selectedCase.mode}</span>
        </div>

        <div>
          <span className="text-slate-400 text-xs block">Commodity</span>
          <span className="text-slate-800 font-medium">{selectedCase.commodity}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">HS code</span>
          <span className="font-mono text-slate-800 font-semibold">{selectedCase.hsCode}</span>
        </div>

        <div>
          <span className="text-slate-400 text-xs block">Declared value</span>
          <span className="text-slate-800 font-semibold">{selectedCase.declaredValue}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">Incoterm</span>
          <span className="text-slate-800 font-medium">{selectedCase.incoterm}</span>
        </div>

        <div>
          <span className="text-slate-400 text-xs block">Bill of lading</span>
          <span className="font-mono text-slate-800 font-medium">
            {selectedCase.billOfLading}
          </span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">Case executor</span>
          <span className="text-slate-800 font-medium">{selectedCase.caseExecutor}</span>
        </div>

        <div>
          <span className="text-slate-400 text-xs block">Current stage</span>
          <span className="text-slate-800 font-medium">{selectedCase.currentStage}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">SLA</span>
          <span className="text-slate-800 font-medium">{selectedCase.sla}</span>
        </div>
      </div>

      {/* Evidence Section */}
      <StageEvidence
        files={serviceDocuments}
        currentStage={selectedCase.currentStage}
        loading={documentsLoading}
        error={documentsError}
      />

      {/* Assessment Decision Section */}
      <AssessmentDecision shipmentId={selectedCase.shipmentId} />
    </div>
  );
}