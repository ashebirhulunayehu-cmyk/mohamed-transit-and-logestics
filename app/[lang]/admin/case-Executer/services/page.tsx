"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpDown,
  Columns,
  Download,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import CaseExecutorStageActions from "@/components/case-executor/CaseExecutorStageActions";
import SlaBadge from "@/components/SlaBadge";
import { useAuthStore } from "@/modules/auth/auth.store";
import { CaseExecutorEndpoints } from "@/modules/case-Executer/case-executor.endpoint";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";
import { getCaseExecutorServiceCategory } from "@/modules/case-Executer/service-category";
import { getSLAStatus } from "@/lib/utils";

type ServiceStatus =
  | "Draft"
  | "Submitted"
  | "Under review"
  | "Approved"
  | "In progress"
  | "Needs review"
  | "Requires customer action"
  | "Pending"
  | "Blocked"
  | "Completed"
  | "Rejected"
  | "Cancelled"
  | "Delivered"
  | "Unknown";
type RiskChannel = "Green channel" | "Yellow channel" | "Red channel" | "Blue channel" | "Unassigned";
type TransportMode = "Unimodal" | "Multimodal" | "Unknown";
type ColumnKey = "service" | "importer" | "mode" | "status" | "risk" | "caseExecutor" | "eta" | "sla" | "updated";
type ServiceRowData = {
  id: string;
  shipmentId: string;
  referenceNumber: string;
  category: string;
  title: string;
  importerName: string;
  importerCode: string;
  mode: TransportMode;
  status: ServiceStatus;
  riskChannel: RiskChannel;
  caseExecutor: string;
  eta: string;
  sla: string;
  isOverdue: boolean;
  dueDate: string | null;
  updated: string;
  updatedAt: number | null;
};

const columns: Array<{ key: ColumnKey; label: string }> = [
  { key: "service", label: "Service" },
  { key: "importer", label: "Importer" },
  { key: "mode", label: "Mode" },
  { key: "status", label: "Status" },
  { key: "risk", label: "Risk" },
  { key: "caseExecutor", label: "Case executor" },
  { key: "eta", label: "ETA" },
  { key: "sla", label: "SLA" },
  { key: "updated", label: "Updated" },
];

const readValue = (record: CaseExecutorServiceRecord, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const readNestedText = (value: unknown, ...keys: string[]): string => {
  const direct = readText(value);
  if (direct) return direct;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const record = value as CaseExecutorServiceRecord;
  return readText(readValue(record, ...keys));
};

const normalizeStatus = (record: CaseExecutorServiceRecord): ServiceStatus => {
  if (readValue(record, "isBlocked", "hasBlockedStage") === true) return "Blocked";
  if (readValue(record, "requiresCustomerAction") === true) return "Requires customer action";
  if (readValue(record, "hasNeedsReview") === true) return "Needs review";
  const rawValue = readValue(record, "status", "serviceStatus", "currentStatus");
  const raw = rawValue && typeof rawValue === "object"
    ? readValue(rawValue as CaseExecutorServiceRecord, "value", "id", "code", "name", "label", "status")
    : rawValue;
  const labels: Record<string, ServiceStatus> = {
    "1": "Draft",
    "2": "Submitted",
    "3": "Under review",
    "4": "Approved",
    "5": "In progress",
    "6": "Completed",
    "7": "Rejected",
    "8": "Cancelled",
    "9": "Delivered",
  };
  if (typeof raw === "number" || (typeof raw === "string" && /^\d+$/.test(raw))) {
    const serviceStatus = labels[String(raw)] ?? "Unknown";
    return serviceStatus === "In progress" && readValue(record, "hasPendingStage") === true
      ? serviceStatus
      : readValue(record, "hasPendingStage") === true && serviceStatus !== "Completed"
        ? "Pending"
        : serviceStatus;
  }
  if (typeof raw !== "string") return "Unknown";
  const normalized = raw.trim().replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  if (normalized === "deliverd") return "Delivered";
  const known = Object.values(labels).find((label) => label.toLowerCase() === normalized);
  if (!known) return "Unknown";
  if (readValue(record, "hasPendingStage") === true && known !== "In progress" && known !== "Completed") {
    return "Pending";
  }
  return known;
};

const normalizeMode = (record: CaseExecutorServiceRecord): TransportMode => {
  const raw = readValue(record, "serviceType", "mode", "transportMode");
  if (raw === 1 || raw === "1") return "Multimodal";
  if (raw === 2 || raw === "2") return "Unimodal";
  if (typeof raw === "string") {
    const normalized = raw.toLowerCase();
    if (normalized.includes("multi")) return "Multimodal";
    if (normalized.includes("uni")) return "Unimodal";
  }
  return "Unknown";
};

const normalizeRisk = (record: CaseExecutorServiceRecord): RiskChannel => {
  const raw = readValue(record, "riskLevel", "riskChannel");
  if (raw === 1 || raw === "1") return "Blue channel";
  if (raw === 2 || raw === "2") return "Green channel";
  if (raw === 3 || raw === "3") return "Yellow channel";
  if (raw === 4 || raw === "4") return "Red channel";
  if (typeof raw === "string") {
    const label = raw.trim().toLowerCase();
    if (label.includes("blue")) return "Blue channel";
    if (label.includes("green")) return "Green channel";
    if (label.includes("yellow")) return "Yellow channel";
    if (label.includes("red")) return "Red channel";
  }
  return "Unassigned";
};

const formatDate = (value: unknown, includeTime = false): string => {
  const text = readText(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" });
};

const toTimestamp = (value: unknown): number | null => {
  const text = readText(value);
  if (!text) return null;
  const timestamp = new Date(text).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const normalizeService = (
  record: CaseExecutorServiceRecord,
  currentUserName: string,
): ServiceRowData | null => {
  const rawId = readValue(record, "id", "shipmentId", "serviceId");
  const shipmentId = readText(rawId);
  if (!shipmentId) return null;
  const serviceNumber = readText(readValue(record, "serviceNumber", "trackingNumber", "caseNumber"));
  const status = normalizeStatus(record);
  const dueDate = readText(readValue(record, "dueAt", "slaDueAt", "dueDate"));
  const sla = getSLAStatus(dueDate || null, status);
  const updatedAt = readValue(record, "lastUpdateDate", "updatedAt", "updatedDate", "createAt", "registeredDate");
  const estimatedArrival = readValue(record, "eta", "estimatedArrival", "expectedArrival");
  const importer = readValue(record, "importer");
  const customer = readValue(record, "customer");
  const explicitETA = formatDate(estimatedArrival);
  return {
    id: serviceNumber || shipmentId,
    shipmentId,
    referenceNumber: readText(readValue(record, "referenceNumber", "serviceReference", "clientReference")),
    category: getCaseExecutorServiceCategory(record),
    title: readText(readValue(record, "itemDescription", "description", "title")) || "—",
    importerName:
      readText(readValue(record, "importerName", "customerName", "businessName")) ||
      readNestedText(customer, "businessName", "companyName") ||
      readNestedText(importer, "businessName", "fullName", "firstName") ||
      "—",
    importerCode:
      readText(readValue(record, "importerTinNumber", "tinNumber", "importerCode", "customerCode")) ||
      readNestedText(customer, "tinNumber", "tin") ||
      "—",
    mode: normalizeMode(record),
    status,
    riskChannel: normalizeRisk(record),
    caseExecutor: currentUserName || "—",
    eta: explicitETA === "—" ? "Not provided" : explicitETA,
    sla: sla.label,
    isOverdue: sla.variant === "overdue",
    dueDate: dueDate || null,
    updated: formatDate(updatedAt, true),
    updatedAt: toTimestamp(updatedAt),
  };
};

const attentionPriority: Partial<Record<ServiceStatus, number>> = {
  Blocked: 0,
  "Requires customer action": 1,
  "Needs review": 2,
  "Under review": 2,
  Submitted: 3,
  "In progress": 4,
  Pending: 5,
  Approved: 6,
  Draft: 7,
  Completed: 8,
  Delivered: 8,
  Rejected: 9,
  Cancelled: 9,
};

const riskPriority: RiskChannel[] = [
  "Red channel",
  "Yellow channel",
  "Blue channel",
  "Green channel",
  "Unassigned",
];

const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;

const isRecord = (value: unknown): value is CaseExecutorServiceRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapServiceDetail = (value: unknown): CaseExecutorServiceRecord | null => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!isRecord(current)) return null;
    let nested: CaseExecutorServiceRecord | undefined;
    for (const key of ["assignedService", "service", "data", "payload", "response", "result"]) {
      const candidate = readValue(current, key);
      if (isRecord(candidate)) {
        nested = candidate;
        break;
      }
    }
    if (nested) {
      current = nested;
      continue;
    }
    return current;
  }
  return null;
};

function AssignedServiceRow({
  row,
  visibleColumns,
}: {
  row: ServiceRowData;
  visibleColumns: ColumnKey[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<CaseExecutorServiceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = visibleColumns.length;
  const rawRiskLevel = detail ? readValue(detail, "riskLevel") : undefined;
  const currentRiskLevel =
    typeof rawRiskLevel === "number" || typeof rawRiskLevel === "string"
      ? rawRiskLevel
      : null;

  const toggleDetails = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detail) return;
    setLoading(true);
    setError(null);
    try {
      const result = await CaseExecutorEndpoints.getAssignedServiceById(row.shipmentId);
      const serviceDetails = unwrapServiceDetail(result);
      if (!serviceDetails) {
        throw new Error("No service details were returned.");
      }
      setDetail(serviceDetails);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  };

  const refreshDetails = async () => {
    try {
      const result = await CaseExecutorEndpoints.getAssignedServiceById(row.shipmentId);
      const serviceDetails = unwrapServiceDetail(result);
      if (!serviceDetails) {
        throw new Error("No service details were returned.");
      }
      setDetail(serviceDetails);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  };

  return (
    <>
      <tr className="transition-colors hover:bg-slate-50/60">
        {visibleColumns.includes("service") && (
          <td className="px-4 py-3.5">
            <button type="button" onClick={() => void toggleDetails()} aria-expanded={expanded} className="font-semibold text-sky-700 hover:underline">
              {row.id}
            </button>
            <span className="mt-0.5 block text-[11px] text-slate-500">{row.title}</span>
          </td>
        )}
        {visibleColumns.includes("importer") && (
          <td className="px-4 py-3.5">
            <span className="block font-semibold text-slate-800">{row.importerName}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-slate-400">{row.importerCode}</span>
          </td>
        )}
        {visibleColumns.includes("mode") && <td className="px-4 py-3.5 font-medium text-slate-700">{row.mode}</td>}
        {visibleColumns.includes("status") && (
          <td className="px-4 py-3.5">
            <StatusBadge status={row.status} />
          </td>
        )}
        {visibleColumns.includes("risk") && (
          <td className="px-4 py-3.5">
            <RiskBadge risk={row.riskChannel} />
          </td>
        )}
        {visibleColumns.includes("caseExecutor") && <td className="px-4 py-3.5 font-medium text-slate-800">{row.caseExecutor}</td>}
        {visibleColumns.includes("eta") && <td className="px-4 py-3.5 text-slate-700">{row.eta}</td>}
        {visibleColumns.includes("sla") && (
          <td className="px-4 py-3.5">
            <SlaBadge dueDate={row.dueDate} status={row.status} />
          </td>
        )}
        {visibleColumns.includes("updated") && <td className="px-4 py-3.5 text-slate-400">{row.updated}</td>}
      </tr>
      {expanded && (
        <tr>
          <td colSpan={count} className="bg-slate-50 px-4 py-3">
            {loading ? (
              <p role="status" className="flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle className="size-4 animate-spin" /> Loading service details…
              </p>
            ) : error ? (
              <p role="alert" className="text-sm text-rose-700">{error}</p>
            ) : detail ? (
              <div>
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500">Status</dt>
                    <dd className="mt-1"><StatusBadge status={row.status} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Risk</dt>
                    <dd className="mt-1"><RiskBadge risk={row.riskChannel} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">ETA</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">{row.eta}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">SLA</dt>
                    <dd className="mt-1"><SlaBadge dueDate={row.dueDate} status={row.status} /></dd>
                  </div>
                  {Object.entries(detail)
                    .filter(([key, value]) =>
                      value !== null &&
                      value !== undefined &&
                      value !== "" &&
                      !["status", "risklevel", "dueat", "sladueat", "duedate", "eta", "estimatedarrival", "expectedarrival"].includes(key.toLowerCase()),
                    )
                    .map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-xs capitalize text-slate-500">{key.replace(/([a-z0-9])([A-Z])/g, "$1 $2")}</dt>
                        <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                </dl>
                <CaseExecutorStageActions
                  shipmentId={row.shipmentId}
                  currentRiskLevel={currentRiskLevel}
                  serviceDetails={detail}
                  currentStatus={readValue(detail, "status")}
                  onUpdated={refreshDetails}
                />
              </div>
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const appearance: Record<ServiceStatus, string> = {
    "In progress": "border-sky-200 bg-sky-50 text-sky-700",
    "Needs review": "border-amber-200 bg-amber-50 text-amber-800",
    "Requires customer action": "border-purple-200 bg-purple-50 text-purple-700",
    Pending: "border-slate-200 bg-slate-100 text-slate-700",
    Blocked: "border-rose-200 bg-rose-50 text-rose-700",
    Draft: "border-slate-200 bg-slate-100 text-slate-700",
    Cancelled: "border-slate-200 bg-slate-100 text-slate-700",
    Submitted: "border-amber-200 bg-amber-50 text-amber-800",
    "Under review": "border-amber-200 bg-amber-50 text-amber-800",
    Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Rejected: "border-rose-200 bg-rose-50 text-rose-700",
    Unknown: "border-slate-200 bg-slate-100 text-slate-700",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${appearance[status]}`}>{status}</span>;
}

function RiskBadge({ risk }: { risk: RiskChannel }) {
  const appearance: Record<RiskChannel, string> = {
    "Green channel": "border-emerald-200 bg-emerald-50 text-emerald-800",
    "Yellow channel": "border-amber-200 bg-amber-50 text-amber-900",
    "Red channel": "border-rose-200 bg-rose-50 text-rose-800",
    "Blue channel": "border-sky-200 bg-sky-50 text-sky-800",
    Unassigned: "border-slate-200 bg-slate-100 text-slate-600",
  };
  const Icon = risk === "Red channel" ? ShieldX : risk === "Yellow channel" ? ShieldAlert : ShieldCheck;
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-xs font-medium ${appearance[risk]}`}>
      <Icon className="size-3.5" />
      {risk}
    </span>
  );
}

export default function CaseExecutorServicesPage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category") ?? "";
  const routeSearchFilter = searchParams.get("search") ?? "";
  const services = useCaseExecutorStore((state) => state.assignedServices);
  const loading = useCaseExecutorStore((state) => state.assignedServicesLoading);
  const error = useCaseExecutorStore((state) => state.assignedServicesError);
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const currentUserName = isHydrated
    ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || ""
    : "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(columns.map(({ key }) => key));
  const [sort, setSort] = useState<"priority" | "asc" | "desc">("priority");

  useEffect(() => {
    void fetchAssignedServices();
  }, [fetchAssignedServices]);

  const mappedServices = useMemo(
    () => services
      .map((record) => normalizeService(record, currentUserName))
      .filter((record): record is ServiceRowData => record !== null),
    [currentUserName, services],
  );

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const routeQuery = routeSearchFilter.trim().toLowerCase();
    return mappedServices.filter((row) =>
      (!query || [
        row.id,
        row.shipmentId,
        row.referenceNumber,
        row.title,
        row.importerName,
        row.importerCode,
        row.caseExecutor,
      ].some((value) => value.toLowerCase().includes(query))) &&
      (!routeQuery || [
        row.id,
        row.shipmentId,
        row.referenceNumber,
        row.title,
        row.importerName,
        row.importerCode,
      ].some((value) => value.toLowerCase().includes(routeQuery))) &&
      (statusFilter === "ALL" || row.status === statusFilter) &&
      (modeFilter === "ALL" || row.mode === modeFilter) &&
      (riskFilter === "ALL" || row.riskChannel === riskFilter) &&
      (!categoryFilter || row.category === categoryFilter),
    );
  }, [categoryFilter, mappedServices, modeFilter, riskFilter, routeSearchFilter, search, statusFilter]);

  const sortedServices = useMemo(() => [...filteredServices].sort((left, right) => {
    if (sort === "priority") {
      const priority = (attentionPriority[left.status] ?? 10) - (attentionPriority[right.status] ?? 10);
      if (priority !== 0) return priority;
      if (left.isOverdue !== right.isOverdue) return left.isOverdue ? -1 : 1;
      const riskOrder = riskPriority.indexOf(left.riskChannel) -
        riskPriority.indexOf(right.riskChannel);
      if (riskOrder !== 0) return riskOrder;
      return (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
    }
    const a = left.updatedAt ?? (sort === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY);
    const b = right.updatedAt ?? (sort === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY);
    return sort === "desc" ? b - a : a - b;
  }), [filteredServices, sort]);

  const toggleColumn = (column: ColumnKey) => {
    setVisibleColumns((current) => {
      if (current.includes(column)) {
        return current.length === 1 ? current : current.filter((item) => item !== column);
      }
      return columns.filter(({ key }) => current.includes(key) || key === column).map(({ key }) => key);
    });
  };

  const exportServices = () => {
    const exportColumns: Array<{ label: string; value: (row: ServiceRowData) => string }> = [
      { label: "Service", value: (row) => row.id },
      { label: "Shipment ID", value: (row) => row.shipmentId },
      { label: "Reference", value: (row) => row.referenceNumber },
      { label: "Title", value: (row) => row.title },
      { label: "Importer", value: (row) => row.importerName },
      { label: "Importer code", value: (row) => row.importerCode },
      { label: "Mode", value: (row) => row.mode },
      { label: "Status", value: (row) => row.status },
      { label: "Risk", value: (row) => row.riskChannel },
      { label: "Case executor", value: (row) => row.caseExecutor },
      { label: "ETA", value: (row) => row.eta },
      { label: "SLA", value: (row) => row.sla },
      { label: "Updated", value: (row) => row.updated },
    ];
    const csv = [
      exportColumns.map(({ label }) => escapeCsv(label)).join(","),
      ...sortedServices.map((row) => exportColumns.map(({ value }) => escapeCsv(value(row))).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "case-executor-assigned-services.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Case register</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Assigned services</h1>
          <p className="mt-1 text-sm text-slate-500">The cases assigned to you, ordered by what needs attention first.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAssignedServices()}
          disabled={loading}
          aria-label="Refresh assigned services"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {categoryFilter && (
        <p className="text-xs text-slate-500">
          Category: <span className="font-semibold text-slate-700">{categoryFilter}</span>
          {" · "}
          <Link
            href={`/${lang}/admin/case-Executer/services`}
            className="font-semibold text-blue-700 hover:underline"
          >
            Clear category
          </Link>
        </p>
      )}

      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
        <div className="flex w-full flex-1 flex-wrap items-center gap-2 lg:w-auto">
          <div className="relative min-w-[260px] flex-1 lg:flex-initial">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <input
              aria-label="Search services"
              placeholder="Search by service ID, reference, commodity or importer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="ALL">All statuses</option>
              {["Draft", "Submitted", "Under review", "Approved", "In progress", "Needs review", "Requires customer action", "Pending", "Blocked", "Completed", "Rejected", "Cancelled", "Delivered", "Unknown"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <select aria-label="Filter by transport mode" value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="ALL">All modes</option>
            <option value="Unimodal">Unimodal</option>
            <option value="Multimodal">Multimodal</option>
            <option value="Unknown">Unknown</option>
          </select>
          <select aria-label="Filter by risk channel" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="ALL">All channels</option>
            {["Green channel", "Yellow channel", "Red channel", "Blue channel", "Unassigned"].map((risk) => <option key={risk}>{risk}</option>)}
          </select>
        </div>
        <div className="flex w-full items-center justify-end gap-2 lg:w-auto">
          <div className="relative">
            <button type="button" aria-controls="executor-service-columns" aria-expanded={columnsOpen} onClick={() => setColumnsOpen((open) => !open)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              <Columns className="size-3.5 text-slate-500" /> Columns
            </button>
            {columnsOpen && (
              <div id="executor-service-columns" className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {columns.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                    <input type="checkbox" checked={visibleColumns.includes(key)} onChange={() => toggleColumn(key)} className="accent-blue-600" />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={exportServices} aria-label="Export filtered services as CSV" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <Download className="size-3.5 text-slate-500" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div role="alert" className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={() => void fetchAssignedServices()} className="ml-auto font-semibold underline">Try again</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {columns.filter(({ key }) => visibleColumns.includes(key)).map(({ key, label }) => (
                  <th key={key} className="px-4 py-3">
                    {key === "updated" ? (
                      <button
                        type="button"
                        onClick={() => setSort((current) => current === "priority" || current === "desc" ? "asc" : "desc")}
                        aria-label={`Sort updated date ${sort === "asc" ? "newest first" : "oldest first"}`}
                        className="flex items-center gap-1"
                      >
                        {label} <ArrowUpDown className="size-3 text-slate-400" />
                      </button>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && !mappedServices.length ? (
                <tr><td colSpan={visibleColumns.length} className="px-4 py-10 text-center text-sm text-slate-500"><span role="status" className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" />Loading assigned services…</span></td></tr>
              ) : sortedServices.length ? (
                sortedServices.map((row) => <AssignedServiceRow key={row.shipmentId} row={row} visibleColumns={visibleColumns} />)
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-10 text-center text-sm text-slate-500">
                    {error ? "Assigned services could not be loaded." : mappedServices.length ? "No services match your filters." : "No services are assigned to you."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
          <span>Showing {sortedServices.length} of {mappedServices.length} services</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
