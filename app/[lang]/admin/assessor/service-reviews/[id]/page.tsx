"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useServiceReviewStore } from "@/features/service-reviews/serviceReview.store";
import { StageEvidence } from "@/features/service-reviews/components/StageEvidence";
import { AssessmentDecision } from "@/features/service-reviews/components/AssessmentDecision";

export default function SingleServiceCasePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const caseId = params.id;
  const currentCase = useServiceReviewStore((state) =>
    state.cases.find((serviceCase) => serviceCase.id === caseId),
  );
  const fetchCases = useServiceReviewStore((state) => state.fetchCases);
  const fetchServiceDocuments = useServiceReviewStore((state) => state.fetchServiceDocuments);
  const serviceDocuments = useServiceReviewStore((state) =>
    currentCase?.shipmentId
      ? state.serviceDocuments[String(currentCase.shipmentId)]
      : undefined,
  );
  const documentsLoading = useServiceReviewStore((state) => state.documentsLoading);
  const documentsError = useServiceReviewStore((state) => state.documentsError);
  const loading = useServiceReviewStore((state) => state.loading);
  const error = useServiceReviewStore((state) => state.error);

  useEffect(() => {
    if (!currentCase) void fetchCases();
  }, [caseId, currentCase, fetchCases]);

  useEffect(() => {
    if (currentCase?.shipmentId) void fetchServiceDocuments(currentCase.shipmentId);
  }, [currentCase?.shipmentId, fetchServiceDocuments]);

  if (!currentCase) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to reviews
        </button>
        <p role={error ? "alert" : "status"} className={error ? "text-sm text-red-700" : "text-sm text-slate-500"}>
          {error || (loading ? "Loading service case..." : "Service case not found.")}
        </p>
      </div>
    );
  }

  const documents = [
    ...currentCase.evidenceFiles.filter((file) => file.source === "Customer"),
    ...(serviceDocuments ??
      currentCase.evidenceFiles.filter((file) => file.source === "Service")),
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to reviews
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-slate-500">
              Shipment #{currentCase.shipmentId} · {currentCase.trackingNumber}
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{currentCase.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{currentCase.importer} · {currentCase.status}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">{currentCase.mode}</span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">{currentCase.assignedHub}</span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">{currentCase.channel}</span>
          </div>
        </div>
      </header>

      <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-900">Importer / customer</h2>
          <dl className="space-y-2 text-sm">
            <Data label="Business name" value={currentCase.businessName} />
            <Data label="TIN" value={currentCase.tinNumber} />
            <Data label="Customer approval" value={currentCase.customerIsVerified === null ? "Not recorded" : currentCase.customerIsVerified ? "Verified" : "Not verified"} />
            <Data label="Business license" value={currentCase.businessLicense} />
            <Data label="Import license" value={currentCase.importLicense} />
            <Data label="Import license expiry" value={currentCase.importLicenseExpiry} />
            <Data label="Address" value={currentCase.businessAddress} />
            <Data label="Contact" value={currentCase.contactPerson} />
            <Data label="Email" value={currentCase.contactEmail} />
            <Data label="Phone" value={currentCase.contactPhone} />
          </dl>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-900">Shipment / consignment</h2>
          <dl className="space-y-2 text-sm">
            <Data label="Description" value={currentCase.title} />
            <Data label="Registered" value={currentCase.registeredDate} />
            <Data label="Origin" value={currentCase.origin} />
            <Data label="Destination" value={currentCase.destination} />
            <Data label="Route category" value={currentCase.routeCategory} />
            <Data label="Country of origin" value={currentCase.countryOfOrigin} />
            <Data label="Recorded declared value" value={currentCase.declaredValue} />
            <Data label="Tax category" value={currentCase.taxCategory} />
            <Data label="Risk level" value={currentCase.riskLevel} />
            <Data label="Case executor" value={currentCase.caseExecutor} />
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Declared value is the value recorded in the system, not an independently verified customs valuation.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Recorded shipment stages</h2>
        {currentCase.stages.length ? (
          <ul className="space-y-2">
            {currentCase.stages.map((stage, index) => (
              <li key={`${stage}-${index}`} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">{stage}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No shipment stages were returned by the API.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <StageEvidence
          files={documents}
          loading={documentsLoading}
          error={documentsError}
        />
        <AssessmentDecision
          key={currentCase.shipmentId}
          shipmentId={currentCase.shipmentId}
          serviceStatus={currentCase.status}
        />
      </section>
    </main>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value || "Not recorded"}</dd>
    </div>
  );
}
