"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type {
  ManagerServiceDetail,
  ManagerServiceDocument,
  ManagerServiceStage,
} from "@/modules/manager/manager.type";
import { useManagerStore } from "@/modules/manager/manager.store";

type DetailTab = "stage" | "documents" | "discussion" | "consignment";

const formatStatus = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "Status unavailable";
  if (typeof value === "string" && !/^\d+$/.test(value)) {
    const normalized = value.trim().toLowerCase().replaceAll(/[\s_-]+/g, "");
    const knownLabels: Record<string, string> = {
      needsreview: "Needs review",
      inprogress: "In progress",
      notstarted: "Not started",
    };
    return knownLabels[normalized] ?? value;
  }

  const knownStatuses: Record<number, string> = {
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
  return knownStatuses[numeric] ?? `Status ${numeric}`;
};

const getMode = (service: ManagerServiceDetail): string => {
  const mode = service.mode ?? service.serviceType;
  if (typeof mode === "string" && !/^\d+$/.test(mode)) {
    if (mode.toLowerCase().includes("uni")) return "Unimodal";
    if (mode.toLowerCase().includes("multi")) return "Multimodal";
    return mode;
  }
  if (Number(mode) === 2) return "Unimodal";
  if (Number(mode) === 1) return "Multimodal";
  return "Mode unavailable";
};

const personName = (person: ManagerServiceDetail["importer"]): string => {
  if (!person) return "Not assigned";
  return person.businessName
    || [person.firstName, person.lastName].filter(Boolean).join(" ")
    || person.username
    || person.email
    || "Not assigned";
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const stageName = (stage: ManagerServiceStage, index: number): string =>
  stage.stageName || stage.name || `Stage ${index + 1}`;

const stageStatus = (stage: ManagerServiceStage): string =>
  formatStatus(stage.status ?? stage.stageStatus ?? stage.currentStatus);

const stageStatusOption = (status: string): string => {
  const normalized = status.toLowerCase().replaceAll(/[\s_-]+/g, "");
  if (normalized.includes("complete") || normalized.includes("deliver")) return "Completed";
  if (normalized.includes("block")) return "Blocked";
  if (normalized.includes("progress") || normalized.includes("active")) return "InProgress";
  if (normalized.includes("review")) return "NeedsReview";
  if (normalized.includes("notstarted") || normalized.includes("draft")) return "NotStarted";
  return "Pending";
};

const stageTone = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("deliver")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (normalized.includes("progress") || normalized.includes("active")) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const stageIcon = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("deliver")) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  }
  if (normalized.includes("progress") || normalized.includes("active")) {
    return <Clock3 className="h-5 w-5 text-sky-600" />;
  }
  return <Circle className="h-5 w-5 text-slate-400" />;
};

const riskTone = (risk: string): string => {
  const normalized = risk.toLowerCase();
  if (normalized.includes("red")) return "border-red-200 bg-red-50 text-red-800";
  if (normalized.includes("yellow")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized.includes("green")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized.includes("blue")) return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function DocumentsPanel({ documents }: { documents: ManagerServiceDocument[] }) {
  if (!documents.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No documents were returned for this service.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
      {documents.map((document, index) => {
        const name = document.originalFileName || document.fileName || `Document ${index + 1}`;
        const verified = document.isVerified;
        return (
          <li key={document.id ?? `${name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{document.documentType || document.mimeType || "Document"} · {formatDate(document.createAt)}</p>
              </div>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              verified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"
            }`}>
              {verified ? "Verified" : "Awaiting verification"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function ManagerServiceDetailPage() {
  const { id, lang } = useParams<{ id: string; lang: string }>();
  const service = useManagerStore((state) => state.selectedService);
  const loading = useManagerStore((state) => state.serviceDetailLoading);
  const error = useManagerStore((state) => state.serviceDetailError);
  const fetchServiceById = useManagerStore((state) => state.fetchServiceById);
  const updateServiceStage = useManagerStore((state) => state.updateServiceStage);
  const [refreshing, setRefreshing] = useState(false);
  const [selection, setSelection] = useState<{
    serviceId: string;
    activeStage: number;
    activeTab: DetailTab;
  }>({ serviceId: id, activeStage: 0, activeTab: "stage" });
  const [stageDrafts, setStageDrafts] = useState<Record<string, { status: string; notes: string }>>({});
  const [stageSaving, setStageSaving] = useState(false);
  const [stageFeedback, setStageFeedback] = useState<{
    stageKey: string;
    error?: string;
    success?: string;
  } | null>(null);
  const activeStage = selection.serviceId === id ? selection.activeStage : 0;
  const activeTab = selection.serviceId === id ? selection.activeTab : "stage";

  useEffect(() => {
    if (id) void fetchServiceById(id);
  }, [fetchServiceById, id]);

  const mode = service ? getMode(service) : "Mode unavailable";
  const isUnimodal = mode === "Unimodal";
  const currentStage = service?.stages[activeStage];
  const currentStageStatus = currentStage ? stageStatus(currentStage) : "Status unavailable";
  const currentStageId = currentStage?.id;
  const stageDraftKey = service && currentStageId !== null && currentStageId !== undefined
    ? `${service.id}:${currentStageId}`
    : `${id}:${activeStage}`;
  const stageStatusDraft = stageDrafts[stageDraftKey]?.status
    ?? (currentStage ? stageStatusOption(stageStatus(currentStage)) : "Pending");
  const stageNotesDraft = stageDrafts[stageDraftKey]?.notes
    ?? currentStage?.notes
    ?? currentStage?.comments
    ?? "";
  const activeStageFeedback = stageFeedback?.stageKey === stageDraftKey ? stageFeedback : null;
  const importer = service ? personName(service.importer) : "—";
  const risk = service
    ? typeof service.riskLevel === "string" && !/^\d+$/.test(service.riskLevel)
      ? service.riskLevel
      : ({ 1: "Blue channel", 2: "Green channel", 3: "Yellow channel", 4: "Red channel" }[
          Number(service.riskLevel)
        ] ?? "Unassigned")
    : "—";
  const completedStages = service?.stages.filter((stage) => {
    const status = stageStatus(stage).toLowerCase();
    return status.includes("complete") || status.includes("deliver");
  }).length ?? 0;
  const progress = service?.stages.length
    ? Math.round((completedStages / service.stages.length) * 100)
    : null;
  const previousStage = activeStage > 0 ? service?.stages[activeStage - 1] : null;
  const stageDocuments = currentStage?.id === null || currentStage?.id === undefined
    ? []
    : service?.documents.filter(
        (document) =>
          document.stageId !== null &&
          document.stageId !== undefined &&
          String(document.stageId) === String(currentStage.id),
      ) ?? [];
  const recentActivity = service?.stages
    .flatMap((stage, index) => {
      const name = stageName(stage, index);
      const status = stageStatus(stage);
      const activity = [];

      if (stage.completedAt && (status.toLowerCase().includes("complete") || status.toLowerCase().includes("deliver"))) {
        activity.push({ label: `${name} completed`, date: stage.completedAt });
      }
      if (stage.updatedAt) activity.push({ label: `${name} updated · ${status}`, date: stage.updatedAt });
      if (stage.createdAt) activity.push({ label: `${name} created`, date: stage.createdAt });

      return activity;
    })
    .filter((activity) => !Number.isNaN(new Date(activity.date).getTime()))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5) ?? [];
  const assignedStaff: Array<[string, ManagerServiceDetail["assignedCaseExecutor"]]> = service
    ? [
        ["Case executor", service.assignedCaseExecutor],
        ["Assessor", service.assignedAssessor],
      ]
    : [];

  const submitStageUpdate = async (status: string) => {
    if (
      !service ||
      service.id === null ||
      service.id === undefined ||
      currentStageId === null ||
      currentStageId === undefined
    ) {
      setStageFeedback({ stageKey: stageDraftKey, error: "The service or workflow stage is missing an API ID." });
      return;
    }

    setStageSaving(true);
    setStageFeedback({ stageKey: stageDraftKey });
    const updated = await updateServiceStage({
      shipmentId: service.id,
      shipmentStageId: currentStageId,
      status,
      notes: stageNotesDraft.trim(),
    });
    setStageSaving(false);
    if (updated) {
      setStageDrafts((drafts) => ({
        ...drafts,
        [stageDraftKey]: { status, notes: stageNotesDraft },
      }));
      if (status === "Completed" && activeStage < (service?.stages.length ?? 0) - 1) {
        setSelection({
          serviceId: id,
          activeStage: activeStage + 1,
          activeTab: "stage",
        });
      }
    }
    setStageFeedback(updated
      ? { stageKey: stageDraftKey, success: "Stage updated and refreshed from the service API." }
      : { stageKey: stageDraftKey, error: useManagerStore.getState().serviceDetailError || "Unable to update this stage." });
  };

  const refreshService = async () => {
    setRefreshing(true);
    try {
      await fetchServiceById(id);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] space-y-5 text-slate-800">
      <Link
        href={`/${lang}/admin/manager/services`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to services
      </Link>

      {loading && !service && (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading service details...
        </p>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && !service && (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          This service was not returned by the manager API.
        </p>
      )}

      {service && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-mono text-xl font-bold text-slate-900">{service.trackingNumber}</h1>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {formatStatus(service.status)}
                  </span>
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${riskTone(risk)}`}>
                    {risk}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {mode}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{service.description || "Service description unavailable"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {importer} · {[service.origin, service.destination].filter(Boolean).join(" → ") || "Route unavailable"}
                    {service.eta ? ` · ETA ${formatDate(service.eta)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">Last updated</span>
                  <p className="mt-1">{formatDate(service.updatedAt || service.createAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshService()}
                  disabled={refreshing || loading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
            {service.stages.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    {currentStage
                      ? `Stage ${activeStage + 1} of ${service.stages.length}`
                      : `${completedStages} of ${service.stages.length} stages completed`}
                  </span>
                  <span className="font-semibold text-slate-800">{progress === null ? "—" : `${progress}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="grid min-h-[560px] gap-4 xl:grid-cols-[minmax(220px,0.85fr)_minmax(320px,1.35fr)_minmax(240px,0.9fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {isUnimodal ? "Unimodal workflow" : "Multimodal workflow"}
              </p>
              {service.stages.length ? (
                <ol className="mt-4 space-y-1">
                  {service.stages.map((stage, index) => {
                    const status = stageStatus(stage);
                    const selected = activeStage === index;
                    return (
                      <li key={stage.id ?? `${stageName(stage, index)}-${index}`}>
                        <button
                          type="button"
                          onClick={() => setSelection({ serviceId: id, activeStage: index, activeTab: "stage" })}
                          className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                            selected ? "bg-blue-50 ring-1 ring-blue-100" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="mt-0.5">{stageIcon(status)}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">{stageName(stage, index)}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{status}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No workflow stages were returned by the API.
                </p>
              )}
            </aside>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Stage workspace</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {currentStage ? stageName(currentStage, activeStage) : "Service details"}
                  </h2>
                </div>
                {currentStage && (
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${stageTone(currentStageStatus)}`}>
                    {currentStageStatus}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {([
                  ["stage", "Stage work", null],
                  ["documents", "Documents", service.documents.length],
                  ["discussion", "Discussion", service.messages.length],
                  ["consignment", "Consignment", null],
                ] as const).map(([tab, label, count]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelection({ serviceId: id, activeStage, activeTab: tab })}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      activeTab === tab
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {label}{count === null ? "" : ` (${count})`}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {activeTab === "documents" ? (
                  <DocumentsPanel documents={service.documents} />
                ) : activeTab === "discussion" ? (
                  service.messages.length ? (
                    <ul className="space-y-3">
                      {service.messages.map((message) => (
                        <li key={message.id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <MessageSquare className="h-4 w-4 text-slate-500" />
                              {message.subject || "Service message"}
                            </div>
                            <time className="shrink-0 text-xs text-slate-500">{formatDate(message.createdDate || message.createAt)}</time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{message.content || "No message content."}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {message.senderUser
                              ? [message.senderUser.firstName, message.senderUser.lastName].filter(Boolean).join(" ") || message.senderUser.username
                              : "Sender unavailable"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No discussion messages were returned for this service.</p>
                  )
                ) : activeTab === "consignment" ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-800">Consignment details</p>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <DetailField label="Description" value={service.description || "—"} />
                      <DetailField label="Origin" value={service.countryOfOrigin || service.origin || "—"} />
                      <DetailField label="Destination" value={service.destination || service.routeCategory || "—"} />
                      <DetailField label="Declared value" value={service.declaredValue === null || service.declaredValue === undefined ? "—" : String(service.declaredValue)} />
                      <DetailField label="Tax category" value={service.taxCategory || "—"} />
                      <DetailField label="Registered" value={formatDate(service.createAt)} />
                    </dl>
                  </div>
                ) : (
                  currentStage ? (
                    <div className="space-y-4">
                      {previousStage && (
                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <h3 className="text-sm font-semibold text-slate-900">Previous stage summary</h3>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-700">
                              {stageName(previousStage, activeStage - 1)}
                            </p>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${stageTone(stageStatus(previousStage))}`}>
                              {stageStatus(previousStage)}
                            </span>
                          </div>
                          {(previousStage.notes || previousStage.comments) && (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                              {previousStage.notes || previousStage.comments}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-slate-500">
                            Last updated {formatDate(previousStage.updatedAt || previousStage.completedAt || previousStage.createdAt)}
                          </p>
                        </section>
                      )}
                      {stageDocuments.length > 0 && (
                        <section className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">Documents for this stage</h3>
                            <span className="text-xs text-slate-500">
                              {stageDocuments.filter((document) => document.isVerified).length} of {stageDocuments.length} verified
                            </span>
                          </div>
                          <ul className="mt-3 divide-y divide-slate-100">
                            {stageDocuments.map((document, index) => (
                              <li key={document.id ?? `${document.fileName}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                <span className="text-sm text-slate-700">
                                  {document.originalFileName || document.fileName || `Document ${index + 1}`}
                                  {document.isRequired ? <span className="ml-2 text-xs text-slate-500">Required</span> : null}
                                </span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  document.isVerified
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-800"
                                }`}>
                                  {document.isVerified ? "Verified" : "Received"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                      <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{stageName(currentStage, activeStage)}</h3>
                          <p className="mt-1 text-sm text-slate-500">{stageStatus(currentStage)}</p>
                          </div>
                        </div>
                        {stageIcon(currentStageStatus)}
                      </div>
                      <dl className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                        <DetailField label="Created" value={formatDate(currentStage.createdAt)} />
                        <DetailField label="Last updated" value={formatDate(currentStage.updatedAt)} />
                        <DetailField label="Completed" value={formatDate(currentStage.completedAt)} />
                      </dl>
                      {(currentStage.notes || currentStage.comments) && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stage note</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                            {currentStage.notes || currentStage.comments}
                          </p>
                        </div>
                      )}
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void submitStageUpdate(stageStatusDraft);
                        }}
                        className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">Update stage</h3>
                          <p className="mt-1 text-xs text-slate-500">Changes are saved to the service API.</p>
                        </div>
                        <label className="block text-xs font-medium text-slate-700">
                          Stage status
                          <select
                            value={stageStatusDraft}
                            onChange={(event) => setStageDrafts((drafts) => ({
                              ...drafts,
                              [stageDraftKey]: { status: event.target.value, notes: stageNotesDraft },
                            }))}
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="NotStarted">Not started</option>
                            <option value="Pending">Pending</option>
                            <option value="InProgress">In progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                            <option value="NeedsReview">Needs review</option>
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-700">
                          Stage note
                          <textarea
                            value={stageNotesDraft}
                            onChange={(event) => setStageDrafts((drafts) => ({
                              ...drafts,
                              [stageDraftKey]: { status: stageStatusDraft, notes: event.target.value },
                            }))}
                            maxLength={2000}
                            rows={3}
                            placeholder="Describe what was done, any exception found, and the next step."
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                        {activeStageFeedback?.error && <p role="alert" className="text-xs text-red-700">{activeStageFeedback.error}</p>}
                        {activeStageFeedback?.success && <p role="status" className="text-xs text-emerald-700">{activeStageFeedback.success}</p>}
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="submit"
                            disabled={stageSaving}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                          >
                            {stageSaving ? "Saving..." : "Save draft"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitStageUpdate("Completed")}
                            disabled={stageSaving}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                          >
                            Save & advance stage
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitStageUpdate("Blocked")}
                            disabled={stageSaving}
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                          >
                            Mark blocked
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-medium text-slate-800">Service overview</p>
                      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                        <DetailField label="Description" value={service.description || "—"} />
                        <DetailField label="Service status" value={formatStatus(service.status)} />
                        <DetailField label="Service mode" value={mode} />
                        <DetailField label="Registered" value={formatDate(service.createAt)} />
                        <DetailField label="Declared value" value={service.declaredValue === null || service.declaredValue === undefined ? "—" : String(service.declaredValue)} />
                        <DetailField label="Tax category" value={service.taxCategory || "—"} />
                      </dl>
                    </div>
                  )
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Importer</p>
                <h2 className="mt-2 text-sm font-semibold text-slate-900">{importer}</h2>
                <p className="mt-1 break-all text-xs text-slate-500">{service.importer?.email || "Contact details unavailable"}</p>
                <p className="mt-1 text-xs text-slate-500">{service.importer?.phone || ""}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Assigned staff</p>
                <div className="mt-3 space-y-3">
                  {assignedStaff.map(([role, staffMember]) => {
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {(staffMember?.firstName?.[0] || staffMember?.username?.[0] || "—").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{staffMember ? personName(staffMember) : "Not assigned"}</p>
                          <p className="text-xs text-slate-500">{role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Risk & compliance</p>
                </div>
                <p className="mt-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{risk}</p>
                {service.isBlocked && <p className="mt-2 text-xs font-medium text-red-700">This service is blocked.</p>}
                {service.requiresCustomerAction && <p className="mt-2 text-xs font-medium text-amber-700">Customer action is required.</p>}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  {service.mode === 2 || service.mode === "2" ? <Truck className="h-4 w-4 text-slate-500" /> : <MapPin className="h-4 w-4 text-slate-500" />}
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Logistics</p>
                </div>
                <dl className="mt-3 space-y-3">
                  <DetailField label="Origin" value={service.countryOfOrigin || service.origin || "—"} />
                  <DetailField label="Destination" value={service.destination || service.routeCategory || "—"} />
                  <DetailField label="Route category" value={service.routeCategory || "—"} />
                  <DetailField label="Estimated arrival" value={formatDate(service.eta)} />
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recent activity</p>
                </div>
                {recentActivity.length ? (
                  <ol className="mt-3 space-y-3">
                    {recentActivity.map((activity, index) => (
                      <li key={`${activity.date}-${activity.label}-${index}`} className="border-l-2 border-slate-200 pl-3">
                        <p className="text-xs font-medium text-slate-700">{activity.label}</p>
                        <time className="mt-0.5 block text-[11px] text-slate-500">{formatDate(activity.date)}</time>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">No dated stage activity was returned by the service API.</p>
                )}
              </section>
            </aside>
          </section>
        </>
      )}
    </main>
  );
}
