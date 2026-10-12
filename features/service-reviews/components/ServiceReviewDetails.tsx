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

  return (
    <div className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 pb-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">{selectedCase.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Shipment #{selectedCase.shipmentId} · {selectedCase.trackingNumber}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {selectedCase.status}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <ShieldAlert className="h-3 w-3" />
              {selectedCase.channel}
            </span>
          </div>
        </div>
        <Link
          href={`/${lang}/admin/assessor/service-reviews/${selectedCase.id}`}
          className="flex shrink-0 items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Open case
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Importer / customer</h3>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Detail label="Business name" value={selectedCase.businessName} />
          <Detail label="TIN" value={selectedCase.tinNumber} />
          <Detail label="Business type" value={selectedCase.businessType} />
          <Detail label="Customer approval" value={
            selectedCase.customerIsVerified === null
              ? "Not recorded"
              : selectedCase.customerIsVerified ? "Verified" : "Not verified"
          } />
          <Detail label="Business license" value={selectedCase.businessLicense} />
          <Detail label="Import license" value={selectedCase.importLicense} />
          <Detail label="Import license expiry" value={selectedCase.importLicenseExpiry} />
          <Detail label="Business address" value={selectedCase.businessAddress} />
          <Detail label="Contact person" value={selectedCase.contactPerson} />
          <Detail label="Email" value={selectedCase.contactEmail} />
          <Detail label="Phone" value={selectedCase.contactPhone} />
        </div>
      </section>

      <section className="border-t border-slate-100 pt-5">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Shipment / consignment</h3>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Detail label="Description" value={selectedCase.title} />
          <Detail label="Transport mode" value={selectedCase.mode} />
          <Detail label="Assigned hub" value={selectedCase.assignedHub} />
          <Detail label="Route category" value={selectedCase.routeCategory} />
          <Detail label="Origin" value={selectedCase.origin} />
          <Detail label="Destination" value={selectedCase.destination} />
          <Detail label="Country of origin" value={selectedCase.countryOfOrigin} />
          <Detail label="Registered" value={selectedCase.registeredDate} />
          <Detail label="Recorded declared value" value={selectedCase.declaredValue} />
          <Detail label="Tax category" value={selectedCase.taxCategory} />
          <Detail label="Risk level" value={selectedCase.riskLevel} />
          <Detail label="Case executor" value={selectedCase.caseExecutor} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Declared value is the value recorded in the system; it is not an independently verified customs valuation.
        </p>
      </section>

      <section className="border-t border-slate-100 pt-5">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Recorded shipment stages</h3>
        {selectedCase.stages.length ? (
          <ul className="space-y-2">
            {selectedCase.stages.map((stage, index) => (
              <li key={`${stage}-${index}`} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {stage}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">No shipment stages were returned by the API.</p>
        )}
      </section>

      <StageEvidence
        files={evidenceFiles}
        loading={documentsLoading}
        error={documentsError}
      />
      <AssessmentDecision shipmentId={selectedCase.shipmentId} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="break-words font-medium text-slate-800">{displayValue(value)}</span>
    </div>
  );
}
