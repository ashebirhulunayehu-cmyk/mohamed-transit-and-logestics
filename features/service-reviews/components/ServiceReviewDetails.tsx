"use client";

import React, { useEffect } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { StageEvidence } from "./StageEvidence";
import { AssessmentDecision } from "./AssessmentDecision";
import { ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const displayValue = (value: string) => value || "Not recorded";

export function ServiceReviewDetails() {
  const selectedCase = useServiceReviewStore((state) => state.getSelectedCase());
  const fetchServiceDocuments = useServiceReviewStore((state) => state.fetchServiceDocuments);
  const documentsLoading = useServiceReviewStore((state) => state.documentsLoading);
  const documentsError = useServiceReviewStore((state) => state.documentsError);
  const fetchedDocuments = useServiceReviewStore((state) =>
    selectedCase?.shipmentId
      ? state.serviceDocuments[String(selectedCase.shipmentId)]
      : undefined,
  );
  const { lang = "en" } = useParams<{ lang: string }>();

  useEffect(() => {
    const shipmentId = selectedCase?.shipmentId;
    if (!shipmentId) return;
    const timeoutId = window.setTimeout(() => void fetchServiceDocuments(shipmentId), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchServiceDocuments, selectedCase?.shipmentId]);

  if (!selectedCase) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Select a case to view details
      </div>
    );
  }

  const customerDocuments = selectedCase.evidenceFiles.filter(
    (file) => file.source === "Customer",
  );
  const serviceDocuments =
    fetchedDocuments ??
    selectedCase.evidenceFiles.filter((file) => file.source === "Service");
  const evidenceFiles = [...customerDocuments, ...serviceDocuments];
  const statusClass = selectedCase.status.toLowerCase().includes("block")
    ? "border-rose-200 bg-rose-50 text-rose-800"
    : selectedCase.status.toLowerCase().includes("customer action") ||
        selectedCase.status.toLowerCase().includes("attention")
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : selectedCase.status.toLowerCase().includes("approv") ||
          selectedCase.status.toLowerCase().includes("complete")
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-blue-200 bg-blue-50 text-blue-800";
  const channelClass =
    selectedCase.channel === "Red channel"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : selectedCase.channel === "Yellow channel"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : selectedCase.channel === "Green channel"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : selectedCase.channel === "Blue channel"
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 pb-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">{selectedCase.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {selectedCase.trackingNumber} · {selectedCase.route}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
              {selectedCase.status}
            </span>
            <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-xs font-medium ${channelClass}`}>
              <ShieldAlert className="h-3 w-3" />
              {selectedCase.channel}
            </span>
          </div>
        </div>
        <Link
          href={`/${lang}/admin/assessor/services/${selectedCase.shipmentId}`}
          className="flex shrink-0 items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Open case
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <section aria-label="Service review summary">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Detail label="Importer" value={selectedCase.importer} />
          <Detail label="Mode" value={selectedCase.mode} />
          <Detail label="Commodity" value={selectedCase.commodity} />
          <Detail label="HS code" value={selectedCase.hsCode} />
          <Detail label="Declared value" value={selectedCase.declaredValue} />
          <Detail label="Incoterm" value={selectedCase.incoterm} />
          <Detail label="Bill of lading" value={selectedCase.billOfLading} />
          <Detail label="Case executor" value={selectedCase.caseExecutor} />
          <Detail label="Current stage" value={selectedCase.currentStage} />
          <Detail label="SLA" value={selectedCase.sla} />
        </dl>
      </section>

      <StageEvidence
        files={evidenceFiles}
        loading={documentsLoading}
        error={documentsError}
      />
      <AssessmentDecision
        key={selectedCase.shipmentId}
        shipmentId={selectedCase.shipmentId}
        serviceStatus={selectedCase.status}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-slate-800">{displayValue(value)}</dd>
    </div>
  );
}
