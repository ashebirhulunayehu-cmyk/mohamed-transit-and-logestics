"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, MessageSquareText, RefreshCw, ShieldAlert } from "lucide-react";
import { CaseExecutorEndpoints } from "@/modules/case-Executer/case-executor.endpoint";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";

type RecordValue = Record<string, unknown>;
type StageStatus = 1 | 2 | 3 | 4 | 6;
type StageOption = {
  id: string;
  name: string;
  status: StageStatus;
  blocked: boolean;
};

const shipmentStatusOptions = [
  { value: 1, label: "Draft" },
  { value: 2, label: "Submitted" },
  { value: 3, label: "Under review" },
  { value: 4, label: "Approved" },
  { value: 5, label: "In progress" },
  { value: 6, label: "Completed" },
  { value: 7, label: "Rejected" },
  { value: 8, label: "Cancelled" },
  { value: 9, label: "Delivered" },
];

const hubOptions = [
  { value: 1, label: "Djibouti" },
  { value: 2, label: "Mojo" },
  { value: 3, label: "Adama" },
];

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readValue = (record: RecordValue, ...keys: string[]): unknown => {
  const matched = Object.keys(record).find((candidate) =>
    keys.some((key) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matched ? record[matched] : undefined;
};

const readText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const stageStatusLabels: Record<StageStatus, string> = {
  1: "Not started",
  2: "Pending",
  3: "In progress",
  4: "Completed",
  6: "Needs review",
};

const toStageStatus = (value: unknown): StageStatus => {
  const text = readText(value).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const byName = Object.entries(stageStatusLabels).find(([, label]) => label.toLowerCase() === text);
  const numeric = Number(byName?.[0] ?? text);
  return numeric === 2 || numeric === 3 || numeric === 4 || numeric === 6 ? numeric : 1;
};

const toEnumValue = (value: unknown, options: Array<{ value: number; label: string }>): string => {
  const nested = isRecord(value)
    ? readValue(value, "value", "id", "code", "name", "label", "status")
    : value;
  const text = readText(nested).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const normalizedText = text === "deliverd" ? "delivered" : text;
  const byLabel = options.find((option) => option.label.toLowerCase() === normalizedText);
  const numeric = Number(byLabel?.value ?? text);
  return options.some((option) => option.value === numeric) ? String(numeric) : "";
};

const toRiskValue = (value: unknown): number | null => {
  const named = typeof value === "string"
    ? { blue: 1, green: 2, yellow: 3, red: 4 }[value.trim().toLowerCase()]
    : undefined;
  const raw = isRecord(value)
    ? readValue(value, "value", "id", "code", "name", "label")
    : value;
  const numberValue = Number(named ?? raw);
  return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 4
    ? numberValue
    : null;
};

const unwrapRows = (response: unknown): unknown[] => {
  let value = response;
  for (let depth = 0; depth < 5 && isRecord(value); depth += 1) {
    const nested = readValue(value, "data", "response", "payload", "items", "stages", "results");
    if (nested === undefined || nested === value) break;
    value = nested;
  }
  return Array.isArray(value) ? value : [];
};

const toStage = (value: unknown, index: number): StageOption | null => {
  if (!isRecord(value)) return null;
  const id = readText(readValue(value, "id", "serviceStageId", "shipmentStageId"));
  if (!id) return null;
  const stage = readValue(value, "stage");
  const stageName = isRecord(stage) ? readText(readValue(stage, "name", "stageName")) : "";
  const rawStatus = readValue(value, "status");
  return {
    id,
    name: stageName || readText(readValue(value, "name", "stageName")) || `Stage ${index + 1}`,
    status: toStageStatus(rawStatus && typeof rawStatus === "object"
      ? readValue(rawStatus as RecordValue, "value", "id", "code", "name", "label", "status")
      : rawStatus),
    blocked: readValue(value, "isBlocked") === true,
  };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message.trim()
    ? error.message
    : typeof error === "string" && error.trim()
      ? error
      : "The Case Executor request failed.";

const controlClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60";

export default function CaseExecutorStageActions({
  shipmentId,
  currentRiskLevel,
  serviceDetails,
  currentStatus,
  onUpdated,
}: {
  shipmentId: string;
  currentRiskLevel?: string | number | null;
  serviceDetails?: RecordValue | null;
  currentStatus?: unknown;
  onUpdated?: () => Promise<void>;
}) {
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [stageStatus, setStageStatus] = useState<StageStatus>(1);
  const [riskLevel, setRiskLevel] = useState(() => {
    const namedValue = typeof currentRiskLevel === "string"
      ? { blue: "1", green: "2", yellow: "3", red: "4" }[currentRiskLevel.toLowerCase()]
      : undefined;
    const value = namedValue ?? String(currentRiskLevel ?? "");
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? String(parsed) : "";
  });
  const [riskNotes, setRiskNotes] = useState("");
  const [comment, setComment] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState(() =>
    toEnumValue(currentStatus ?? readValue(serviceDetails ?? {}, "status"), shipmentStatusOptions),
  );
  const [shipmentForm, setShipmentForm] = useState(() => {
    const details = serviceDetails ?? {};
    return {
      itemDescription: readText(readValue(details, "itemDescription", "description")),
      routeCategory: readText(readValue(details, "routeCategory")),
      declaredValue: readText(readValue(details, "declaredValue")),
      taxCategory: readText(readValue(details, "taxCategory")),
      countryOfOrigin: readText(readValue(details, "countryOfOrigin")),
    };
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = unwrapRows(await CaseExecutorEndpoints.getServiceStages(shipmentId))
        .map(toStage)
        .filter((stage): stage is StageOption => stage !== null);
      setStages(rows);
      const selected = rows.find((stage) => stage.id === selectedStageId) ?? rows[0];
      setSelectedStageId(selected?.id ?? "");
      setStageStatus(selected?.status ?? 1);
    } catch (requestError: unknown) {
      setStages([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedStageId, shipmentId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchStages(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchStages]);

  const withAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(successMessage);
      return true;
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stageId = Number(selectedStageId);
    const shipment = Number(shipmentId);
    const text = comment.trim();
    if (!Number.isSafeInteger(shipment) || shipment <= 0 || !Number.isSafeInteger(stageId) || stageId <= 0 || !text) {
      setError("A valid service, stage, and comment are required.");
      return;
    }
    if (await withAction(
      () => CaseExecutorEndpoints.addStageComment({
        shipmentId: shipment,
        stageId,
        comment: text,
      }),
      "Comment added to the stage.",
    )) {
      setComment("");
    }
  };

  const submitRisk = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(shipmentId);
    if (!Number.isSafeInteger(id) || id <= 0 || !["1", "2", "3", "4"].includes(riskLevel)) {
      setError("Choose a valid service risk level.");
      return;
    }
    if (await withAction(
      () => CaseExecutorEndpoints.setRiskLevel({
        shipmentId: id,
        riskLevel: Number(riskLevel),
        riskNotes: riskNotes.trim() || null,
      }),
      "Risk level updated.",
    )) {
      setRiskNotes("");
      await fetchAssignedServices();
    }
  };

  const submitBlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stageId = Number(selectedStageId);
    const shipment = Number(shipmentId);
    const reason = blockReason.trim();
    if (!Number.isSafeInteger(shipment) || shipment <= 0 || !Number.isSafeInteger(stageId) || stageId <= 0 || !reason) {
      setError("A valid service, stage, and block reason are required.");
      return;
    }
    if (await withAction(
      () => CaseExecutorEndpoints.blockStage({
        shipmentId: shipment,
        stageId,
        reason,
      }),
      "Stage blocked.",
    )) {
      setBlockReason("");
      await fetchStages();
    }
  };

  const selectedStage = stages.find((stage) => stage.id === selectedStageId);
  const currentShipmentStatus = toEnumValue(
    currentStatus ?? readValue(serviceDetails ?? {}, "status"),
    shipmentStatusOptions,
  );
  const submitStageStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stageId = Number(selectedStageId);
    const shipment = Number(shipmentId);
    if (!Number.isSafeInteger(shipment) || shipment <= 0 || !Number.isSafeInteger(stageId) || stageId <= 0) {
      setError("A valid service and stage are required.");
      return;
    }
    if (selectedStage?.blocked) {
      setError("Unblock the stage before changing its status.");
      return;
    }
    if (await withAction(
      () => CaseExecutorEndpoints.updateAssignedStageStatus({
        shipmentId: shipment,
        stageId,
        status: stageStatus,
      }),
      "Stage status updated.",
    )) {
      await Promise.all([fetchStages(), fetchAssignedServices()]);
    }
  };

  const submitShipmentUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(shipmentId);
    const declaredValue = Number(shipmentForm.declaredValue);
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !shipmentForm.itemDescription.trim() ||
      !shipmentForm.routeCategory.trim() ||
      !shipmentForm.taxCategory.trim() ||
      !shipmentForm.countryOfOrigin.trim() ||
      !Number.isFinite(declaredValue) ||
      declaredValue < 0
    ) {
      setError("Enter valid shipment details before saving.");
      return;
    }

    if (await withAction(
      () => CaseExecutorEndpoints.updateShipment({
        id,
        itemDescription: shipmentForm.itemDescription.trim(),
        routeCategory: shipmentForm.routeCategory.trim(),
        declaredValue,
        taxCategory: shipmentForm.taxCategory.trim(),
        countryOfOrigin: shipmentForm.countryOfOrigin.trim(),
        riskLevel: riskLevel ? Number(riskLevel) : toRiskValue(currentRiskLevel),
      }),
      "Shipment details updated.",
    )) {
      await fetchAssignedServices();
      await onUpdated?.();
    }
  };

  const submitShipmentStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(shipmentId);
    const updatedByHub = toEnumValue(readValue(serviceDetails ?? {}, "assignedHub"), hubOptions);
    const newStatus = Number(shipmentStatus);
    const currentShipmentStatus = toEnumValue(
      currentStatus ?? readValue(serviceDetails ?? {}, "status"),
      shipmentStatusOptions,
    );
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !shipmentStatus ||
      !updatedByHub ||
      !shipmentStatusOptions.some((option) => option.value === newStatus)
    ) {
      setError("A valid shipment status and assigned hub are required.");
      return;
    }
    if (shipmentStatus === currentShipmentStatus) {
      setError("Choose a different shipment status.");
      return;
    }
    if (currentShipmentStatus === "8" || currentShipmentStatus === "9") {
      setError("Cancelled or delivered shipments cannot be updated.");
      return;
    }

    if (await withAction(
      () => CaseExecutorEndpoints.updateShipmentStatus(id, {
        newStatus,
        updatedByHub: Number(updatedByHub),
        remarks: "",
      }),
      "Shipment status updated.",
    )) {
      await fetchAssignedServices();
      await onUpdated?.();
    }
  };

  return (
    <section className="mt-4 space-y-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Stage actions</h3>
          <p className="mt-1 text-xs text-slate-500">Update stage status, add a comment, set service risk, or block a stage.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchStages()}
          disabled={loading}
          aria-label="Refresh service stages"
          className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-white disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {notice && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {loading && stages.length === 0 ? (
        <p role="status" className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-4 animate-spin" /> Loading service stages…
        </p>
      ) : stages.length === 0 ? (
        <p className="rounded-md bg-white p-3 text-sm text-slate-500">{error ? "Stages are unavailable until the request succeeds." : "No stages are available for this service."}</p>
      ) : (
        <>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              Stage
              <select
                value={selectedStageId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedStageId(nextId);
                  setStageStatus(stages.find((stage) => stage.id === nextId)?.status ?? 1);
                }}
                className={`${controlClass} mt-1`}
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} · {stageStatusLabels[stage.status]}{stage.blocked ? " · Blocked" : ""}
                  </option>
                ))}
              </select>
            </label>
            <form onSubmit={submitStageStatus} className="flex items-end gap-2">
              <label className="min-w-0 flex-1 text-xs font-medium text-slate-600">
                Stage status
                <select
                  value={stageStatus}
                  onChange={(event) => setStageStatus(toStageStatus(event.target.value))}
                  disabled={selectedStage?.blocked}
                  className={`${controlClass} mt-1`}
                >
                  {Object.entries(stageStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={saving || selectedStage?.blocked} className={buttonClass}>
                {saving && <LoaderCircle className="size-3.5 animate-spin" />} Update status
              </button>
            </form>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <form onSubmit={submitComment} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <MessageSquareText className="size-4 text-blue-700" /> Add stage comment
              </h4>
              <textarea
                required
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Write a comment"
                className={controlClass}
              />
              <button type="submit" disabled={saving || !comment.trim()} className={buttonClass}>
                {saving && <LoaderCircle className="size-3.5 animate-spin" />} Add comment
              </button>
            </form>

            <form onSubmit={submitRisk} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <ShieldAlert className="size-4 text-amber-600" /> Set service risk
              </h4>
              <select required value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} className={controlClass}>
                <option value="">Select a risk level</option>
                <option value="1">Blue channel</option>
                <option value="2">Green channel</option>
                <option value="3">Yellow channel</option>
                <option value="4">Red channel</option>
              </select>
              <textarea
                value={riskNotes}
                onChange={(event) => setRiskNotes(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Risk notes (optional)"
                className={controlClass}
              />
              <button
                type="submit"
                disabled={saving}
                className={buttonClass}
              >
                {saving && <LoaderCircle className="size-3.5 animate-spin" />} Save risk
              </button>
            </form>

            <form onSubmit={submitBlock} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <ShieldAlert className="size-4 text-rose-600" /> Block selected stage
              </h4>
              <p className="text-xs text-slate-500">
                {selectedStage?.blocked ? "This stage is already blocked." : "Blocking prevents this stage from progressing."}
              </p>
              <textarea
                required
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Reason for blocking"
                className={controlClass}
              />
              <button type="submit" disabled={saving || selectedStage?.blocked || !blockReason.trim()} className={`${buttonClass} bg-rose-700 hover:bg-rose-800`}>
                {saving && <LoaderCircle className="size-3.5 animate-spin" />} Block stage
              </button>
            </form>
          </div>
        </>
      )}
      <details className="rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-800">
          Edit shipment details and status
        </summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <form onSubmit={submitShipmentUpdate} className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-800">Update shipment details</h4>
            <label className="block text-xs text-slate-600">
              Item description
              <input required value={shipmentForm.itemDescription} onChange={(event) => setShipmentForm((form) => ({ ...form, itemDescription: event.target.value }))} className={controlClass} />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-slate-600">
                Route category
                <input required value={shipmentForm.routeCategory} onChange={(event) => setShipmentForm((form) => ({ ...form, routeCategory: event.target.value }))} className={controlClass} />
              </label>
              <label className="block text-xs text-slate-600">
                Declared value
                <input required type="number" min="0" step="0.01" value={shipmentForm.declaredValue} onChange={(event) => setShipmentForm((form) => ({ ...form, declaredValue: event.target.value }))} className={controlClass} />
              </label>
              <label className="block text-xs text-slate-600">
                Tax category
                <input required value={shipmentForm.taxCategory} onChange={(event) => setShipmentForm((form) => ({ ...form, taxCategory: event.target.value }))} className={controlClass} />
              </label>
              <label className="block text-xs text-slate-600">
                Country of origin
                <input required value={shipmentForm.countryOfOrigin} onChange={(event) => setShipmentForm((form) => ({ ...form, countryOfOrigin: event.target.value }))} className={controlClass} />
              </label>
            </div>
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving && <LoaderCircle className="size-3.5 animate-spin" />} Save shipment details
            </button>
          </form>
          <form onSubmit={submitShipmentStatus} className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-800">Update shipment status</h4>
            <label className="block text-xs text-slate-600">
              Status
              <select required value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value)} className={controlClass}>
                <option value="">Select a status</option>
                {shipmentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">
              Assigned hub: {readText(readValue(serviceDetails ?? {}, "assignedHub")) || "Not provided"}
            </p>
            <button
              type="submit"
              disabled={saving || shipmentStatus === currentShipmentStatus || currentShipmentStatus === "8" || currentShipmentStatus === "9"}
              className={buttonClass}
            >
              {saving && <LoaderCircle className="size-3.5 animate-spin" />} Save shipment status
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}
