"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { StageEvidence } from "./StageEvidence";
import { AssessmentDecision } from "./AssessmentDecision";
import { ArrowRight, LoaderCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readField = (record: ApiRecord | null | undefined, ...keys: string[]): unknown => {
  if (!record) return undefined;
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const readApiRecord = (value: unknown): ApiRecord | null => {
  let current = value;
  for (let depth = 0; depth < 8; depth += 1) {
    if (!isRecord(current)) return null;
    const wrapper = Object.entries(current).find(([key, entry]) =>
      ["data", "payload", "response", "result", "resultData", "service"]
        .includes(key.toLowerCase()) && isRecord(entry),
    );
    if (!wrapper) return current;
    current = wrapper[1];
  }
  return null;
};

const stageNames: Record<number, string> = {
  1: "Prepayment invoice",
  2: "Transit permission",
  3: "Amendment",
  4: "Drop risk",
  5: "Delivery order",
  6: "Warehouse status",
  7: "Inspection",
  8: "Assessment and tax payment",
  9: "Emergency",
  10: "Exit and storage payment",
  11: "Transportation",
  12: "Local permission",
  13: "Arrival",
  14: "Clearance",
};

const stageStatus = (value: unknown): string => {
  const numeric = Number(value);
  const statuses: Record<number, string> = {
    1: "Not started",
    2: "Pending",
    3: "In progress",
    4: "Completed",
    5: "Blocked",
    6: "Needs review",
  };
  return Number.isInteger(numeric) ? statuses[numeric] ?? readText(value) : readText(value);
};

const getCurrentStage = (detail: ApiRecord | null): string => {
  const stages = readField(detail, "stages");
  if (!Array.isArray(stages)) return "";
  const records = stages.filter(isRecord);
  const activeStage = records.find((stage) =>
    readField(stage, "isBlocked") === true ||
    readField(stage, "requiresCustomerAction") === true ||
    ["in progress", "pending", "blocked", "needs review"].includes(
      stageStatus(readField(stage, "status", "stageStatus")).toLowerCase(),
    ),
  );
  if (!activeStage) return "";
  const value = readField(activeStage, "stageName", "name", "title", "stage");
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numeric) ? stageNames[numeric] ?? readText(value) : readText(value);
};

const valueFrom = (
  primary: ApiRecord | null,
  keys: string[],
  fallback: string,
): string => {
  const primaryText = readText(readField(primary, ...keys));
  return primaryText || fallback;
};

export function ServiceReviewDetails() {
  const selectedCase = useServiceReviewStore((state) => state.getSelectedCase());
  const fetchServiceDocuments = useServiceReviewStore((state) => state.fetchServiceDocuments);
  const documentsLoading = useServiceReviewStore((state) => state.documentsLoading);
  const documentsError = useServiceReviewStore((state) => state.documentsError);
  const [detailState, setDetailState] = useState<{
    shipmentId: number;
    record: ApiRecord | null;
    error: string | null;
  } | null>(null);
  const fetchedDocuments = useServiceReviewStore((state) =>
    selectedCase?.shipmentId
      ? state.serviceDocuments[String(selectedCase.shipmentId)]
      : undefined,
  );
  const { lang = "en" } = useParams<{ lang: string }>();
  const currentDetailState = detailState?.shipmentId === selectedCase?.shipmentId
    ? detailState
    : null;
  const detailRecord = currentDetailState?.record ?? null;
  const detailLoading = Boolean(selectedCase && !currentDetailState);
  const detailError = currentDetailState?.error ?? null;

  useEffect(() => {
    const shipmentId = selectedCase?.shipmentId;
    if (!shipmentId) return;
    const timeoutId = window.setTimeout(() => void fetchServiceDocuments(shipmentId), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchServiceDocuments, selectedCase?.shipmentId]);

  useEffect(() => {
    const shipmentId = selectedCase?.shipmentId;
    if (!shipmentId) return;

    let active = true;
    void AssessorEndpoints.getServiceDetails(shipmentId)
      .then((response) => {
        const record = readApiRecord(response);
        if (!record) throw new Error("The service detail endpoint returned no service record.");
        if (active) setDetailState({ shipmentId, record, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setDetailState({
            shipmentId,
            record: null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })

    return () => {
      active = false;
    };
  }, [selectedCase?.shipmentId]);

  const detailValues = useMemo(() => {
    if (!selectedCase) return null;
    const customerValue = readField(detailRecord, "customer");
    const customer = isRecord(customerValue) ? customerValue : null;
    const executorValue = readField(detailRecord, "assignedCaseExecutor", "caseExecutor");
    const executor = isRecord(executorValue) ? executorValue : null;
    const executorName = [
      readText(readField(executor, "firstName")),
      readText(readField(executor, "lastName")),
    ].filter(Boolean).join(" ");
    const stage = getCurrentStage(detailRecord);
    const declaredValue = readField(detailRecord, "declaredValue");

    return {
      importer: valueFrom(customer, ["businessName"], selectedCase.importer),
      mode: selectedCase.mode,
      commodity: valueFrom(detailRecord, ["commodity", "description", "goodsDescription"], selectedCase.commodity),
      hsCode: valueFrom(detailRecord, ["hsCode", "harmonizedSystemCode"], selectedCase.hsCode),
      declaredValue: declaredValue === null || declaredValue === undefined
        ? selectedCase.declaredValue
        : String(declaredValue),
      incoterm: valueFrom(detailRecord, ["incoterm", "incoterms"], selectedCase.incoterm),
      billOfLading: valueFrom(detailRecord, ["billOfLading", "billOfLadingNumber", "blNumber"], selectedCase.billOfLading),
      caseExecutor: executorName || selectedCase.caseExecutor,
      currentStage: stage || selectedCase.currentStage,
      routeCategory: valueFrom(detailRecord, ["routeCategory"], selectedCase.routeCategory),
      assignedHub: selectedCase.assignedHub,
      countryOfOrigin: valueFrom(detailRecord, ["countryOfOrigin"], selectedCase.countryOfOrigin),
      taxCategory: valueFrom(detailRecord, ["taxCategory"], selectedCase.taxCategory),
      tinNumber: valueFrom(customer, ["tinNumber", "tin"], selectedCase.tinNumber),
      contactEmail: valueFrom(customer, ["contactEmail"], selectedCase.contactEmail),
      contactPhone: valueFrom(customer, ["contactPhone"], selectedCase.contactPhone),
      importerAddress: valueFrom(customer, ["businessAddress"], selectedCase.businessAddress),
    };
  }, [detailRecord, selectedCase]);

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
  const importerContact = [
    detailValues?.contactPhone ?? selectedCase.contactPhone,
    detailValues?.contactEmail ?? selectedCase.contactEmail,
  ].filter((value) => value && value !== "Not recorded").join(" · ") || "Not recorded";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
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

        {detailLoading && (
          <p role="status" className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
            <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            Loading database service details…
          </p>
        )}
        {detailError && (
          <p role="alert" className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Additional service details could not be loaded: {detailError}. Showing the information returned by the live service register.
          </p>
        )}
      </section>

      <section aria-label="Service review summary" className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Detail label="Importer" value={detailValues?.importer ?? selectedCase.importer} />
          <Detail label="Mode" value={detailValues?.mode ?? selectedCase.mode} />
          <Detail label="Commodity" value={detailValues?.commodity ?? selectedCase.commodity} />
          <Detail label="HS code" value={detailValues?.hsCode ?? selectedCase.hsCode} />
          <Detail label="Declared value" value={detailValues?.declaredValue ?? selectedCase.declaredValue} />
          <Detail label="Incoterm" value={detailValues?.incoterm ?? selectedCase.incoterm} />
          <Detail label="Bill of lading" value={detailValues?.billOfLading ?? selectedCase.billOfLading} />
          <Detail label="Case executor" value={detailValues?.caseExecutor ?? selectedCase.caseExecutor} />
          <Detail label="Current stage" value={detailValues?.currentStage ?? selectedCase.currentStage} />
          <Detail label="SLA" value={selectedCase.sla} />
          <Detail label="Country of origin" value={detailValues?.countryOfOrigin ?? selectedCase.countryOfOrigin} />
          <Detail label="Route category" value={detailValues?.routeCategory ?? selectedCase.routeCategory} />
          <Detail label="Assigned hub" value={detailValues?.assignedHub ?? selectedCase.assignedHub} />
          <Detail label="Tax category" value={detailValues?.taxCategory ?? selectedCase.taxCategory} />
          <Detail label="Importer TIN" value={detailValues?.tinNumber ?? selectedCase.tinNumber} />
          <Detail label="Importer contact" value={importerContact} />
          <Detail label="Business address" value={detailValues?.importerAddress ?? selectedCase.businessAddress} />
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <StageEvidence
          files={evidenceFiles}
          loading={documentsLoading}
          error={documentsError}
        />
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <AssessmentDecision
          key={selectedCase.shipmentId}
          shipmentId={selectedCase.shipmentId}
          serviceStatus={selectedCase.shipmentStatus}
        />
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-slate-800">{value || "Not recorded"}</dd>
    </div>
  );
}
