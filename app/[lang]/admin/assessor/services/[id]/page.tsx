"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Package,
  RefreshCw,
  ShieldAlert,
  Send,
} from "lucide-react";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import { useServiceReviewStore } from "@/features/service-reviews/serviceReview.store";
import { AssessmentDecision } from "@/features/service-reviews/components/AssessmentDecision";
import { StageEvidence } from "@/features/service-reviews/components/StageEvidence";
import type {
  AssessorItem,
  AssessorServiceStage,
  AssessorStageDiscussion,
} from "@/modules/assessor/assessor.type";
import type { EvidenceFile } from "@/features/service-reviews/serviceReview.types";

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

type DetailTab = "stage" | "documents" | "discussion" | "consignment";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readField = (record: Record<string, unknown>, ...keys: string[]): unknown => {
  const match = Object.keys(record).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return match ? record[match] : undefined;
};

const readText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const unwrapObject = (value: unknown): AssessorItem | null => {
  let current = value;
  for (let depth = 0; depth < 8; depth += 1) {
    if (!isRecord(current)) return null;
    const wrapper = Object.entries(current).find(([key, entry]) =>
      ["data", "payload", "response", "result", "resultData", "service", "consignment"]
        .includes(key.toLowerCase()) &&
      isRecord(entry),
    );
    if (wrapper) {
      current = wrapper[1];
      continue;
    }
    return current;
  }
  return null;
};

const unwrapRecords = (value: unknown): AssessorItem[] => {
  let current = value;
  for (let depth = 0; depth < 8; depth += 1) {
    if (Array.isArray(current)) {
      if (!current.every(isRecord)) {
        throw new Error("The assessor services response contains invalid records.");
      }
      return current;
    }
    if (!isRecord(current)) break;
    const list = Object.entries(current).find(([key, entry]) =>
      ["data", "payload", "response", "result", "resultData", "items", "services", "records", "rows"]
        .includes(key.toLowerCase()) &&
      (Array.isArray(entry) || isRecord(entry)),
    );
    if (list) {
      current = list[1];
      continue;
    }
    if (readField(current, "id", "serviceId", "trackingNumber")) return [current];
    break;
  }
  throw new Error("The assessor response did not contain a service list.");
};

const unwrapCollection = (value: unknown, collectionNames: string[]): AssessorItem[] => {
  let current = value;
  for (let depth = 0; depth < 8; depth += 1) {
    if (Array.isArray(current)) {
      return current.filter(isRecord);
    }
    if (!isRecord(current)) return [];
    const collection = Object.entries(current).find(([key, entry]) =>
      collectionNames.some((name) => name.toLowerCase() === key.toLowerCase()) &&
      (Array.isArray(entry) || isRecord(entry)),
    );
    if (collection) {
      current = collection[1];
      continue;
    }
    const wrapper = Object.entries(current).find(([key, entry]) =>
      ["data", "payload", "response", "result", "resultData", "items", "records", "rows"]
        .includes(key.toLowerCase()) &&
      (Array.isArray(entry) || isRecord(entry)),
    );
    if (wrapper) {
      current = wrapper[1];
      continue;
    }
    if (readField(current, "id", "documentId", "activityId")) return [current];
    return [];
  }
  return [];
};

const display = (record: AssessorItem, ...keys: string[]): string => {
  const value = readField(record, ...keys);
  return value === null || value === undefined || value === "" ? "Not recorded" : readText(value) || "Not recorded";
};

const nested = (record: AssessorItem, ...keys: string[]): AssessorItem => {
  const value = readField(record, ...keys);
  return isRecord(value) ? value : {};
};

const statusStyles = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("customer action")) {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }
  if (normalized.includes("block") || normalized.includes("reject")) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (normalized.includes("complete") || normalized.includes("approv") || normalized.includes("deliver")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (normalized.includes("progress") || normalized.includes("review") || normalized.includes("submit")) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
};

const formatStatus = (value: unknown): string => {
  const labels: Record<number, string> = {
    1: "Draft",
    2: "Submitted",
    3: "Under review",
    4: "Approved",
    5: "In progress",
    6: "Completed",
    7: "Rejected",
    8: "Cancelled",
    9: "Delivered",
  };
  const numeric = Number(value);
  return Number.isInteger(numeric) && labels[numeric]
    ? labels[numeric]
    : readText(value) || "Not recorded";
};

const formatChannel = (value: unknown): string => {
  const labels: Record<number, string> = {
    1: "Blue channel",
    2: "Green channel",
    3: "Yellow channel",
    4: "Red channel",
  };
  const numeric = Number(value);
  return Number.isInteger(numeric) && labels[numeric]
    ? labels[numeric]
    : readText(value) || "Not recorded";
};

const formatMode = (value: unknown): string => {
  const labels: Record<number, string> = { 1: "Multimodal", 2: "Unimodal" };
  const numeric = Number(value);
  return Number.isInteger(numeric) && labels[numeric]
    ? labels[numeric]
    : readText(value) || "Not recorded";
};

const formatStageName = (stage: AssessorServiceStage): string => {
  const names: Record<number, string> = {
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
  const numeric = Number(stage.name);
  return Number.isInteger(numeric) ? names[numeric] ?? stage.name : stage.name;
};

const formatStageStatus = (stage: AssessorServiceStage): string => {
  const labels: Record<number, string> = {
    1: "Not started",
    2: "Pending",
    3: "In progress",
    4: "Completed",
    5: "Blocked",
    6: "Needs review",
  };
  const numeric = Number(stage.status);
  return Number.isInteger(numeric)
    ? labels[numeric] ?? stage.status ?? "Not recorded"
    : stage.status || "Not recorded";
};

const isActiveStage = (stage: AssessorServiceStage): boolean => {
  const status = formatStageStatus(stage).toLowerCase();
  return [
    "in progress",
    "under review",
    "needs review",
    "customer action",
    "blocked",
    "attention",
    "active",
  ].some((label) => status.includes(label));
};

const formatDateTime = (value: unknown): string => {
  const text = readText(value);
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime())
    ? text
    : new Intl.DateTimeFormat("en", {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const formatElapsed = (startValue: unknown, endValue: unknown): string => {
  const start = new Date(readText(startValue)).getTime();
  const end = new Date(readText(endValue)).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "";
  const hours = Math.floor((end - start) / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

const getStageRequirements = (
  stage: AssessorServiceStage | null,
  stageFiles: EvidenceFile[],
  allFiles: EvidenceFile[] = stageFiles,
): Array<{ name: string; file?: EvidenceFile }> => {
  if (!stage) return [];
  const rawRequirements = readField(
    stage.details ?? {},
    "requiredDocuments",
    "requiredDocumentTypes",
    "requiredEvidence",
  );
  if (Array.isArray(rawRequirements)) {
    return rawRequirements.flatMap((requirement) => {
      const name = isRecord(requirement)
        ? readText(readField(requirement, "name", "documentName", "documentType", "title"))
        : readText(requirement);
      if (!name) return [];
      const file = [...stageFiles, ...allFiles].find((candidate) =>
        candidate.name.toLowerCase() === name.toLowerCase() ||
        candidate.type.toLowerCase() === name.toLowerCase(),
      );
      return [{ name, file }];
    });
  }
  return stageFiles
    .filter((file) => file.isRequired)
    .map((file) => ({ name: file.name, file }));
};

const channelStyles = (channel: string): string => {
  if (channel.toLowerCase().includes("red")) return "border-rose-200 bg-rose-50 text-rose-800";
  if (channel.toLowerCase().includes("yellow")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (channel.toLowerCase().includes("green")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (channel.toLowerCase().includes("blue")) return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

function ServiceDiscussion({
  serviceId,
  stage,
}: {
  serviceId: number;
  stage: AssessorServiceStage;
}) {
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  const fetchDiscussions = useAssessorStore((state) => state.fetchStageDiscussions);
  const addDiscussion = useAssessorStore((state) => state.addStageDiscussion);
  const discussions = useAssessorStore(
    (state) => state.stageDiscussionsByKey[`${serviceId}:${stage.id}`] ?? [],
  );
  const loading = useAssessorStore((state) => state.stageDiscussionsLoading);
  const error = useAssessorStore((state) => state.stageDiscussionsError);
  const submitting = useAssessorStore((state) => state.stageDiscussionSubmitting);

  useEffect(() => {
    void fetchDiscussions(serviceId, stage.id).catch(() => undefined);
  }, [fetchDiscussions, serviceId, stage.id]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setFeedback(null);
    setFeedbackError(false);
    try {
      await addDiscussion({ serviceId, stageId: stage.id, comment: comment.trim() });
      setComment("");
      setFeedback("Comment posted.");
    } catch (submitError: unknown) {
      setFeedback(submitError instanceof Error ? submitError.message : "Unable to post the comment.");
      setFeedbackError(true);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Stage discussion</h3>
        <p className="mt-1 text-xs text-slate-500">
          Comments for {formatStageName(stage)} on this service.
        </p>
      </div>
      {error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {loading ? (
        <p role="status" className="text-sm text-slate-500">Loading discussion…</p>
      ) : discussions.length === 0 ? (
        <p className="rounded border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          No comments have been returned for this stage.
        </p>
      ) : (
        <ol className="max-h-96 space-y-2 overflow-y-auto">
          {discussions.map((item: AssessorStageDiscussion) => (
            <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">{item.author || "Assessor"}</span>
                {item.createdAt && (
                  <time className="text-[11px] text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.comment}</p>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={(event) => void submit(event)} className="space-y-3 border-t border-slate-100 pt-4">
        <label className="block text-xs font-medium text-slate-700">
          Add a comment
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-1 w-full resize-y rounded border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        {feedback && (
          <p role={feedbackError ? "alert" : "status"} className={`text-xs ${feedbackError ? "text-rose-700" : "text-emerald-700"}`}>
            {feedback}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!comment.trim() || submitting}
            className="inline-flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function AssessorServiceDetailPage({ params }: PageProps) {
  const { lang, id } = use(params);
  const serviceKey = id;
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [service, setService] = useState<AssessorItem | null>(null);
  const [consignment, setConsignment] = useState<AssessorItem | null>(null);
  const [activities, setActivities] = useState<AssessorItem[]>([]);
  const [tab, setTab] = useState<DetailTab>("stage");
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [stagesLoading, setStagesLoading] = useState(false);
  const fetchStages = useAssessorStore((state) => state.fetchServiceStages);
  const stagesByServiceId = useAssessorStore((state) => state.serviceStagesByServiceId);
  const stageDiscussionsByKey = useAssessorStore((state) => state.stageDiscussionsByKey);
  const fetchDocuments = useServiceReviewStore((state) => state.fetchServiceDocuments);
  const serviceDocuments = useServiceReviewStore((state) =>
    serviceId ? state.serviceDocuments[String(serviceId)] : undefined,
  );
  const documentsLoading = useServiceReviewStore((state) => state.documentsLoading);
  const documentsError = useServiceReviewStore((state) => state.documentsError);
  const stages = useMemo(
    () => serviceId ? stagesByServiceId[String(serviceId)] ?? [] : [],
    [serviceId, stagesByServiceId],
  );
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0] ?? null;
  const importer = service ? nested(service, "customer", "importer", "customerProfile") : {};
  const executor = service ? nested(service, "assignedCaseExecutor", "caseExecutor") : {};
  const assessor = service ? nested(service, "assignedAssessor", "assessor") : {};
  const consignor = useMemo(
    () => consignment ?? (service ? nested(service, "consignment", "consignmentDetails") : {}),
    [consignment, service],
  );
  const assignedPeople = [
    { role: "Case executor", person: executor },
    { role: "Assessor", person: assessor },
  ];

  const loadService = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const rawPathId = (serviceKey ?? "").trim();
      let match: AssessorItem | null = null;
      let numericId = Number(rawPathId);

      if (!Number.isSafeInteger(numericId) || numericId <= 0) {
        const activeResponse = await AssessorEndpoints.getActiveServicesForRegister();
        const records = unwrapRecords(activeResponse);
        match = records.find((record) =>
          readText(readField(record, "trackingNumber", "serviceNumber", "referenceNumber")).toLowerCase() === rawPathId.toLowerCase(),
        ) ?? null;
        numericId = Number(match ? readField(match, "id", "serviceId", "shipmentId") : NaN);
      }
      if (!Number.isSafeInteger(numericId) || numericId <= 0) {
        throw new Error(`Service ${rawPathId || "(missing ID)"} was not found in the assessor service register.`);
      }

      const detailResponse = await AssessorEndpoints.getServiceDetails(numericId);
      const detailResponseRecord = unwrapObject(detailResponse);
      if (!detailResponseRecord) throw new Error("The assessor service detail response did not contain a service record.");
      const detail = { ...(match ?? {}), ...detailResponseRecord };
      const consignmentDetail =
        unwrapObject(readField(detail, "consignment", "consignmentDetails")) ?? detail;
      const warnings: string[] = [];
      const activityRecords = unwrapCollection(
        readField(detail, "recentActivity", "activities", "serviceActivities", "auditLogs"),
        ["activities", "items", "records", "rows"],
      );
      setServiceId(numericId);
      setService(detail);
      setConsignment(consignmentDetail);
      setActivities(activityRecords);
      setSelectedStageId(null);
      setPageLoading(false);
      setStagesLoading(true);
      const result = await Promise.allSettled([
        fetchStages(numericId),
        fetchDocuments(numericId),
      ]);
      setStagesLoading(false);
      const failedStages = result[0].status === "rejected" ? result[0].reason : null;
      if (result[0].status === "fulfilled") {
        const activeStage = result[0].value.find(isActiveStage) ?? result[0].value[0];
        setSelectedStageId(activeStage?.id ?? null);
      }
      if (failedStages) {
        warnings.push(
          failedStages instanceof Error
            ? `The service loaded, but its workflow stages could not be loaded: ${failedStages.message}`
            : "The service loaded, but its workflow stages could not be loaded.",
        );
      }
      setPageError(warnings.length ? warnings.join(" ") : null);
    } catch (error: unknown) {
      setPageError(error instanceof Error ? error.message : "Unable to load assessor service details.");
    } finally {
      setPageLoading(false);
    }
  }, [fetchDocuments, fetchStages, serviceKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadService(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadService]);

  const stageIndex = selectedStage ? stages.findIndex((stage) => stage.id === selectedStage.id) : -1;
  const previousStage = stageIndex > 0 ? stages[stageIndex - 1] : null;
  const completedStages = stages.filter((stage) =>
    formatStageStatus(stage).toLowerCase().includes("complete"),
  ).length;
  const completion = stages.length ? Math.round((completedStages / stages.length) * 100) : 0;
  const trackingNumber = service
    ? display(service, "trackingNumber", "serviceNumber", "referenceNumber")
    : "Not recorded";
  const serviceStatus = service
    ? formatStatus(readField(service, "status", "serviceStatus"))
    : "";
  const currentStageStatus = selectedStage ? formatStageStatus(selectedStage) : "";
  const headerStatus = currentStageStatus && currentStageStatus !== "Not recorded"
    ? currentStageStatus
    : serviceStatus;
  const secondaryReference = service
    ? display(service, "clientReference", "referenceNo", "secondaryReference", "serviceReference", "externalReference")
    : "Not recorded";
  const channel = service
    ? formatChannel(readField(service, "riskLevel", "riskChannel", "channel"))
    : "Not recorded";
  const mode = service
    ? formatMode(readField(service, "mode", "transportMode", "serviceType"))
    : "Not recorded";
  const serviceTitle = service
    ? display(service, "description", "title", "goodsDescription")
    : "";
  const origin = service ? display(service, "origin", "originName") : "";
  const destination = service ? display(service, "destination", "destinationName") : "";
  const documents: EvidenceFile[] = serviceDocuments ?? [];
  const linkedStageDocuments = selectedStage
    ? documents.filter((file) => file.serviceStageId === String(selectedStage.id))
    : [];
  const stageDocuments = linkedStageDocuments.length ? linkedStageDocuments : documents;
  const requiredDocuments = getStageRequirements(selectedStage, linkedStageDocuments, documents);
  const recentActivity = useMemo(() => {
    const stageEvents = stages.flatMap((stage) => {
      const details = stage.details ?? {};
      const timestamp = readField(
        details,
        "completedAt",
        "updatedAt",
        "modifiedAt",
        "createdAt",
        "createdDate",
      );
      if (!readText(timestamp)) return [];
      return [{
        id: `stage-${stage.id}`,
        description:
          readText(readField(details, "activity", "event", "description", "notes")) ||
          `${formatStageName(stage)}: ${formatStageStatus(stage)}`,
        createdAt: timestamp,
      }];
    });
    return [...activities, ...stageEvents].sort((left, right) => {
      const leftTime = new Date(readText(readField(left, "createdAt", "createAt", "timestamp"))).getTime();
      const rightTime = new Date(readText(readField(right, "createdAt", "createAt", "timestamp"))).getTime();
      if (!Number.isFinite(leftTime)) return 1;
      if (!Number.isFinite(rightTime)) return -1;
      return rightTime - leftTime;
    });
  }, [activities, stages]);
  const stageDiscussions = selectedStage && serviceId
    ? stageDiscussionsByKey[`${serviceId}:${selectedStage.id}`] ?? []
    : [];
  const tabs: Array<{ id: DetailTab; label: string; count?: number }> = [
    { id: "stage", label: "Stage work" },
    { id: "documents", label: "Documents", count: stageDocuments.length },
    { id: "discussion", label: "Discussion", count: stageDiscussions.length },
    { id: "consignment", label: "Consignment" },
  ];
  const consignmentFields = useMemo(() => {
    const fields = [
      ["Commodity", ["commodity", "goodsDescription", "description"]],
      ["HS code", ["hsCode", "harmonizedSystemCode"]],
      ["Declared value", ["declaredValue", "invoiceValue"]],
      ["Currency", ["currency", "currencyCode"]],
      ["Incoterm", ["incoterm", "incoterms"]],
      ["Bill of lading", ["billOfLading", "billOfLadingNumber", "blNumber"]],
      ["Country of origin", ["countryOfOrigin", "originCountry"]],
      ["Transport mode", ["mode", "transportMode", "serviceType"]],
      ["Origin", ["origin", "originName", "loadingPort"]],
      ["Destination", ["destination", "destinationName", "deliveryLocation"]],
    ] as const;
    return fields.map(([label, keys]) => [label, display(consignor, ...keys)] as const);
  }, [consignor]);

  if (pageLoading && !service) {
    return (
      <div role="status" className="mx-auto flex min-h-64 max-w-4xl items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading service details…
      </div>
    );
  }

  if (!service) {
    return (
      <main className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href={`/${lang}/admin/assessor/services`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to services
        </Link>
        <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {pageError ?? "Service details are unavailable."}
        </p>
        <button type="button" onClick={() => void loadService()} className="mt-4 inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-5">
      <Link href={`/${lang}/admin/assessor/services`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to services
      </Link>

      {pageError && (
        <p role="alert" className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {pageError}
        </p>
      )}

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-slate-900">{trackingNumber}</h1>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-xs text-slate-500">
                {secondaryReference !== "Not recorded" ? secondaryReference : `Service #${serviceId}`}
              </span>
              <span className={`rounded border px-2.5 py-1 text-xs font-medium ${statusStyles(headerStatus)}`}>{headerStatus}</span>
              {serviceStatus && serviceStatus !== "Not recorded" && serviceStatus !== headerStatus && (
                <span className={`rounded border px-2.5 py-1 text-xs font-medium ${statusStyles(serviceStatus)}`}>
                  Service {serviceStatus}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${channelStyles(channel)}`}>
                <ShieldAlert className="h-3.5 w-3.5" /> {channel}
              </span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                {mode}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{serviceTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {display(importer, "businessName", "name", "companyName")} · {origin} → {destination}
              {" · "}ETA {display(service, "eta", "estimatedArrival", "expectedArrival")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab("stage");
              window.setTimeout(() => {
                document.getElementById("assessment-decision")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 0);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-900"
          >
            <CheckCircle2 className="h-4 w-4" /> Record assessment
          </button>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>{stages.length ? `Stage ${stageIndex + 1} of ${stages.length}` : "Workflow stages unavailable"}</span>
            <span>{completion}% complete</span>
          </div>
          {stages.length ? (
            <div
              role="progressbar"
              aria-label="Workflow completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion}
              className="flex h-2 gap-1"
            >
              {stages.map((stage) => {
                const status = formatStageStatus(stage).toLowerCase();
                const segmentColor = status.includes("complete")
                  ? "bg-emerald-500"
                  : stage.id === selectedStage?.id
                    ? "bg-violet-600"
                    : status.includes("progress") || status.includes("review")
                      ? "bg-blue-500"
                      : "bg-slate-100";
                return <span key={stage.id} className={`h-full min-w-0 flex-1 rounded-full ${segmentColor}`} />;
              })}
            </div>
          ) : (
            <div className="h-2 rounded-full bg-slate-100" />
          )}
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {mode} workflow
          </p>
          {stagesLoading ? (
            <p role="status" className="text-sm text-slate-500">Loading stages…</p>
          ) : stages.length === 0 ? (
            <p className="rounded border border-dashed border-slate-200 p-3 text-xs text-slate-500">No workflow stages were returned for this service.</p>
          ) : (
            <ol className="space-y-2">
              {stages.map((stage, index) => {
                const selected = selectedStage?.id === stage.id;
                const stageStatus = formatStageStatus(stage);
                const complete = stageStatus.toLowerCase().includes("complete");
                const customerAction = stageStatus.toLowerCase().includes("customer action");
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      aria-current={selected ? "step" : undefined}
                      onClick={() => setSelectedStageId(stage.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selected ? customerAction
                          ? "border-violet-200 bg-violet-50/70"
                          : "border-blue-200 bg-blue-50/70"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        complete ? "bg-emerald-100 text-emerald-700" : selected
                          ? customerAction ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {complete ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{String(index + 1).padStart(2, "0")}</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-slate-800">{formatStageName(stage)}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">{stageStatus}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500">Stage workspace</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">{selectedStage ? formatStageName(selectedStage) : "Workflow stage"}</h2>
              {selectedStage && (
                <span className={`rounded border px-2.5 py-1 text-xs font-medium ${statusStyles(formatStageStatus(selectedStage))}`}>
                  {formatStageStatus(selectedStage)}
                </span>
              )}
            </div>
          </div>
          <div role="tablist" aria-label="Service details" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4">
            {tabs.map((item) => (
              <button
                key={item.id}
                id={`service-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`service-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
                  tab === item.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}{item.count !== undefined ? ` (${item.count})` : ""}
              </button>
            ))}
          </div>
          <div
            id={`service-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`service-tab-${tab}`}
            className="space-y-5 p-5"
          >
            {tab === "stage" && (
              <>
                {selectedStage ? (
                  <div className="space-y-5">
                    <section className={`rounded-lg border p-4 ${statusStyles(formatStageStatus(selectedStage))}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">Current workflow stage</p>
                          <h3 className="mt-1 text-sm font-bold">{formatStageName(selectedStage)}</h3>
                        </div>
                        <span className="rounded border border-current/20 bg-white/60 px-2 py-1 text-[11px] font-semibold">
                          {formatStageStatus(selectedStage)}
                        </span>
                      </div>
                      {readText(readField(
                        selectedStage.details ?? {},
                        "statusMessage",
                        "actionRequired",
                        "notes",
                        "description",
                      )) && (
                        <p className="mt-3 text-xs leading-5">
                          {readText(readField(
                            selectedStage.details ?? {},
                            "statusMessage",
                            "actionRequired",
                            "notes",
                            "description",
                          ))}
                        </p>
                      )}
                    </section>

                    <section className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous stage</p>
                          <h3 className="mt-1 text-sm font-bold text-slate-900">
                            {previousStage ? formatStageName(previousStage) : "No previous stage"}
                          </h3>
                        </div>
                        {previousStage && (
                          <span className={`rounded border px-2 py-1 text-[11px] font-medium ${statusStyles(formatStageStatus(previousStage))}`}>
                            {formatStageStatus(previousStage)}
                          </span>
                        )}
                      </div>
                      {previousStage ? (
                        <>
                          {readText(readField(
                            previousStage.details ?? {},
                            "summary",
                            "notes",
                            "description",
                            "assessorNotes",
                          )) && (
                            <p className="mt-3 text-xs leading-5 text-slate-600">
                              {readText(readField(
                                previousStage.details ?? {},
                                "summary",
                                "notes",
                                "description",
                                "assessorNotes",
                              ))}
                            </p>
                          )}
                          {formatDateTime(readField(
                            previousStage.details ?? {},
                            "completedAt",
                            "completionDate",
                            "updatedAt",
                            "modifiedAt",
                          )) && (
                            <p className="mt-2 text-[11px] text-slate-500">
                              Completed {formatDateTime(readField(
                                previousStage.details ?? {},
                                "completedAt",
                                "completionDate",
                                "updatedAt",
                                "modifiedAt",
                              ))}
                            </p>
                          )}
                          {formatElapsed(
                            readField(previousStage.details ?? {}, "startedAt", "startDate", "createdAt"),
                            readField(previousStage.details ?? {}, "completedAt", "completionDate"),
                          ) && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Duration {formatElapsed(
                                readField(previousStage.details ?? {}, "startedAt", "startDate", "createdAt"),
                                readField(previousStage.details ?? {}, "completedAt", "completionDate"),
                              )}
                            </p>
                          )}
                          {readText(readField(previousStage.details ?? {}, "completedBy", "assessorName", "updatedBy")) && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              By {readText(readField(previousStage.details ?? {}, "completedBy", "assessorName", "updatedBy"))}
                            </p>
                          )}
                          {!readText(readField(
                            previousStage.details ?? {},
                            "summary",
                            "notes",
                            "description",
                            "assessorNotes",
                            "completedAt",
                            "completionDate",
                            "updatedAt",
                            "modifiedAt",
                            "completedBy",
                            "assessorName",
                            "updatedBy",
                          )) && (
                            <p className="mt-3 text-xs text-slate-500">
                              The workflow API returned the previous stage, but no summary or completion details.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">This is the first stage returned for this service.</p>
                      )}
                    </section>

                    <section className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required documents</p>
                          <h3 className="mt-1 text-sm font-bold text-slate-900">
                            {requiredDocuments.filter((item) => item.file).length} of {requiredDocuments.length} received
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTab("documents")}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          View documents
                        </button>
                      </div>
                      {requiredDocuments.length ? (
                        <ul className="space-y-2">
                          {requiredDocuments.map(({ name, file }, index) => (
                            <li key={`${name}-${index}`} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs">
                              <span className="truncate font-medium text-slate-700">{name}</span>
                              <span className={`shrink-0 font-semibold ${
                                file?.isVerified ? "text-emerald-700" : file ? "text-blue-700" : "text-amber-700"
                              }`}>
                                {file?.isVerified ? "Verified" : file ? "Received" : "Outstanding"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No required-document list or stage-linked documents were returned for this stage.
                        </p>
                      )}
                    </section>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select a stage to see its workspace.</p>
                )}
                {serviceId && <div id="assessment-decision"><AssessmentDecision key={serviceId} shipmentId={serviceId} serviceStatus={serviceStatus} showDiscussion={false} /></div>}
              </>
            )}
            {tab === "documents" && (
              <>
                {!linkedStageDocuments.length && documents.length > 0 && (
                  <p className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    These documents were returned for the service; the API did not associate them with the selected stage.
                  </p>
                )}
                <StageEvidence files={stageDocuments} loading={documentsLoading} error={documentsError} />
              </>
            )}
            {tab === "discussion" && (
              selectedStage && serviceId
                ? <ServiceDiscussion serviceId={serviceId} stage={selectedStage} />
                : <p className="text-sm text-slate-500">Select a stage to view its discussion.</p>
            )}
            {tab === "consignment" && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Consignment details</h3>
                </div>
                {consignment ? (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {consignmentFields.map(([label, value]) => (
                      <div key={label} className="border-b border-slate-100 pb-2">
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-medium text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">Consignment details were not returned by the API.</p>
                )}
              </section>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Importer</p>
            <p className="mt-2 text-sm font-bold text-slate-900">{display(importer, "businessName", "name", "companyName")}</p>
            <p className="mt-1 text-xs text-slate-500">
              {display(importer, "customerCode", "code", "id")} · TIN {display(importer, "tinNumber", "tin")}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              {display(importer, "contactPerson", "primaryContact")} · {display(importer, "contactPhone", "phone")}
            </p>
            <Link href={`/${lang}/admin/assessor/messages`} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:underline">
              Message importer
            </Link>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned staff</p>
            {assignedPeople.map(({ role, person }) => (
              <div key={role} className="mt-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  {readText(readField(person, "firstName"))[0] ?? "—"}
                  {readText(readField(person, "lastName"))[0] ?? ""}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {display(person, "fullName", "name", "username") === "Not recorded"
                      ? `${display(person, "firstName")} ${display(person, "lastName")}`
                      : display(person, "fullName", "name", "username")}
                  </span>
                  <span className="text-[11px] text-slate-500">{role}</span>
                </span>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk &amp; compliance</p>
            </div>
            <span className={`mt-3 inline-flex rounded border px-2.5 py-1 text-xs font-medium ${channelStyles(channel)}`}>{channel}</span>
            <p className="mt-2 text-xs text-slate-600">{display(service, "riskReason", "riskNotes", "complianceNotes")}</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent activity</p>
            </div>
            {recentActivity.length ? (
              <ol className="mt-3 space-y-3">
                {recentActivity.map((activity, index) => (
                  <li key={readText(readField(activity, "id", "activityId")) || index} className="border-l-2 border-slate-200 pl-3">
                    <p className="text-xs font-medium text-slate-700">{display(activity, "description", "title", "action", "message")}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatDateTime(readField(activity, "createdAt", "createAt", "timestamp")) || "Date not recorded"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No recent activity was returned by the service detail API.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Logistics</p>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-800">
              {display(consignor, "flightNumber", "vesselName", "transportReference", "carrier")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{origin} → {destination}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
