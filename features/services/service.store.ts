"use client";

import { create } from "zustand";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";
import { useManagerStore } from "@/modules/manager/manager.store";
import type { ManagerExecutorAssignment, ManagerServiceQuery } from "@/modules/manager/manager.type";
import type { AssessorItem } from "@/modules/assessor/assessor.type";
import type { ServiceColumn, ServiceFiltersState, ServiceRecord } from "./service.types";

const allColumns: ServiceColumn[] = [
  "service",
  "importer",
  "mode",
  "status",
  "risk",
  "caseExecutor",
  "eta",
  "sla",
  "updated",
];

interface ServiceStore extends ServiceFiltersState {
  services: ServiceRecord[];
  visibleColumns: ServiceColumn[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  fetchManagerServices: (params?: ManagerServiceQuery) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setModeFilter: (mode: string) => void;
  setChannelFilter: (channel: string) => void;
  toggleColumn: (column: ServiceColumn) => void;
  getFilteredServices: () => ServiceRecord[];
}

type ApiRecord = AssessorItem;

const readValue = (record: ApiRecord, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
};

const readNestedText = (value: unknown, ...keys: string[]): string => {
  const direct = readText(value);
  if (direct) return direct;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const record = value as ApiRecord;
  for (const key of keys) {
    const result = readText(readValue(record, key));
    if (result) return result;
  }

  return "";
};

const normalizeRecordList = (value: unknown): ApiRecord[] => {
  if (Array.isArray(value)) {
    if (!value.every((item) => !!item && typeof item === "object" && !Array.isArray(item))) {
      throw new Error("The assessor response contains invalid service records.");
    }
    return value as ApiRecord[];
  }
  if (!value || typeof value !== "object") {
    throw new Error("The assessor response did not contain a service record list.");
  }

  const record = value as ApiRecord;
  for (const key of [
    "data",
    "payload",
    "response",
    "result",
    "resultData",
    "items",
    "services",
    "activeServices",
    "activeServiceList",
    "activeServiceRecords",
    "serviceList",
    "serviceRecords",
    "shipments",
    "records",
    "rows",
    "pendingServices",
    "pendingServiceReviews",
    "pendingServiceReviewList",
    "pendingReviews",
    "pendingReviewServices",
    "serviceReviewRecords",
    "serviceReviews",
    "reviewQueue",
    "servicesUnderOversight",
    "oversightServices",
    "underOversight",
  ]) {
    const nested = readValue(record, key);
    if (nested !== undefined && nested !== value) {
      const rows = normalizeRecordList(nested);
      if (rows.length || Array.isArray(nested)) return rows;
    }
  }

  if (readValue(record, "id", "shipmentId", "serviceId", "trackingNumber") !== undefined) {
    return [record];
  }

  throw new Error("The assessor response did not contain a service record list.");
};

const normalizeStatus = (value: unknown): ServiceRecord["status"] => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as ApiRecord;
    return normalizeStatus(readValue(record, "value", "id", "code", "name", "label", "status"));
  }

  const statusLabels: Record<number, ServiceRecord["status"]> = {
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
  if (Number.isInteger(numeric) && statusLabels[numeric]) return statusLabels[numeric];
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().replaceAll(/[\s_-]+/g, "");
    const textLabels: Record<string, ServiceRecord["status"]> = {
      draft: "Draft",
      submitted: "Submitted",
      underreview: "Under review",
      approved: "Approved",
      inprogress: "In progress",
      needsreview: "Needs review",
      requirescustomeraction: "Requires customer action",
      pending: "Pending",
      blocked: "Blocked",
      completed: "Completed",
      rejected: "Rejected",
      cancelled: "Cancelled",
      delivered: "Delivered",
      deliverd: "Delivered",
    };
    return textLabels[normalized] ?? "Unknown";
  }
  return "Unknown";
};

const normalizeMode = (value: unknown): ServiceRecord["mode"] => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as ApiRecord;
    return normalizeMode(readValue(record, "value", "id", "code", "name", "label", "mode"));
  }

  if (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value))) {
    if (Number(value) === 1) return "Multimodal";
    if (Number(value) === 2) return "Unimodal";
    return "Unknown";
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes("multi")) return "Multimodal";
    if (normalized.includes("uni")) return "Unimodal";
  }
  return "Unknown";
};

const normalizeRisk = (value: unknown): ServiceRecord["riskChannel"] => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as ApiRecord;
    return normalizeRisk(readValue(record, "value", "id", "code", "name", "label", "riskLevel", "riskChannel"));
  }

  if (typeof value === "string" && !/^\d+$/.test(value)) {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes("blue")) return "Blue channel";
    if (normalized.includes("green")) return "Green channel";
    if (normalized.includes("yellow")) return "Yellow channel";
    if (normalized.includes("red")) return "Red channel";
    return "Unassigned";
  }

  const riskLabels: Record<number, Exclude<ServiceRecord["riskChannel"], "Unassigned">> = {
    1: "Blue channel",
    2: "Green channel",
    3: "Yellow channel",
    4: "Red channel",
  };
  return riskLabels[Number(value)] ?? "Unassigned";
};

const normalizeRegisterStatus = (item: ApiRecord): ServiceRecord["status"] => {
  const status = normalizeStatus(readValue(item, "status", "shipmentStatus"));
  if (
    status !== "Under review" &&
    status !== "Approved" &&
    status !== "In progress"
  ) {
    return status;
  }

  const hasFlag = (...keys: string[]) => readValue(item, ...keys) === true;
  if (hasFlag("hasBlockedStage", "isBlocked")) return "Blocked";
  if (hasFlag("hasCustomerAction", "requiresCustomerAction")) {
    return "Requires customer action";
  }
  if (hasFlag("hasNeedsReview", "needsReview")) return "Needs review";
  if (hasFlag("hasPendingStage", "hasPending")) return "Pending";
  return status;
};

const formatDate = (value: unknown): string => {
  const text = readText(value);
  if (!text) return "—";
  const date = new Date(text);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const formatDateOnly = (value: unknown): string => {
  const text = readText(value);
  if (!text) return "—";
  const date = new Date(text);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleDateString(undefined, { dateStyle: "medium" });
};

const getSla = (
  dueAt: unknown,
  explicitSla: unknown,
  status: ServiceRecord["status"],
  overdueValue: unknown,
) => {
  const explicitlyOverdue = overdueValue === true || overdueValue === 1 || overdueValue === "true";
  const providedSla = readText(explicitSla);
  if (providedSla) {
    return {
      sla: providedSla,
      isOverdue: explicitlyOverdue || providedSla.toLowerCase().includes("overdue"),
    };
  }

  if (status === "Completed" || status === "Delivered") {
    return { sla: "Closed", isOverdue: false };
  }

  const dueAtText = readText(dueAt);
  if (!dueAtText) return { sla: "—", isOverdue: false };

  const dueDate = new Date(dueAtText);
  if (Number.isNaN(dueDate.getTime())) return { sla: "—", isOverdue: false };

  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysRemaining = Math.round((dueDay - todayDay) / 86_400_000);

  if (daysRemaining < 0) {
    return { sla: `${Math.abs(daysRemaining)}d overdue`, isOverdue: true };
  }
  if (daysRemaining === 0) return { sla: "Due today", isOverdue: false };
  return { sla: `${daysRemaining}d left`, isOverdue: false };
};

const toTimestamp = (value: unknown): number | null => {
  const text = readText(value);
  if (!text) return null;
  const timestamp = new Date(text).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const readDatabaseId = (record: ApiRecord): string => {
  for (const key of [
    "id",
    "shipmentId",
    "serviceId",
    "databaseId",
    "shipmentDatabaseId",
    "serviceDatabaseId",
    "recordId",
  ]) {
    const value = readValue(record, key);
    const text = readText(value);
    const numeric = Number(text);
    if (text && /^\d+$/.test(text) && Number.isSafeInteger(numeric) && numeric > 0) return text;
  }
  return "";
};

const mapService = (item: ApiRecord): ServiceRecord | null => {
  const databaseId = readDatabaseId(item);
  const trackingNumber = readText(readValue(item, "trackingNumber", "serviceNumber"));
  const id = trackingNumber || databaseId;
  if (!id) return null;

  const importer = readValue(item, "importer");
  const customer = readValue(item, "customer");
  const importerFirstName = readNestedText(importer, "firstName");
  const importerLastName = readNestedText(importer, "lastName");
  const importerName =
    readText(readValue(item, "importerName", "businessName")) ||
    readNestedText(customer, "businessName", "companyName", "importerName") ||
    readNestedText(importer, "businessName", "fullName") ||
    [importerFirstName, importerLastName].filter(Boolean).join(" ") ||
    readNestedText(importer, "username") ||
    "—";
  const executor = readValue(item, "assignedCaseExecutor", "caseExecutor");
  const referenceNumber = readText(
    readValue(item, "referenceNumber", "serviceReference", "clientReference", "externalReference"),
  );
  const updatedAt = readValue(item, "updatedAt") ?? readValue(item, "createAt", "createdAt");
  const eta = readValue(item, "eta", "estimatedArrival", "expectedArrival", "dueAt");
  const dueAt = readValue(item, "dueAt", "slaDueAt");
  const status = normalizeRegisterStatus(item);
  const sla = getSla(
    dueAt,
    readValue(item, "sla", "slaPosition"),
    status,
    readValue(item, "isOverdue", "overdue"),
  );
  const executorFirstName = readNestedText(executor, "firstName");
  const executorLastName = readNestedText(executor, "lastName");
  const executorName = [executorFirstName, executorLastName].filter(Boolean).join(" ");

  return {
    id,
    ...(databaseId ? { shipmentId: databaseId } : {}),
    ...(referenceNumber ? { referenceNumber } : {}),
    title: readText(readValue(item, "description", "title")) || "—",
    importerName,
    importerCode:
      readText(readValue(item, "importerCode", "customerReference", "customerCode", "tinNumber", "tin")) ||
      readNestedText(customer, "tinNumber", "tin", "customerCode") ||
      readText(readValue(item, "importerId", "customerId")) ||
      "—",
    mode: normalizeMode(
      readValue(item, "mode", "transportMode") ?? readValue(item, "serviceType", "type"),
    ),
    status,
    riskChannel: normalizeRisk(readValue(item, "riskLevel") ?? readValue(item, "riskChannel")),
    caseExecutor: executorName || readNestedText(executor, "username") || "—",
    eta: formatDateOnly(eta),
    sla: sla.sla,
    ...(sla.isOverdue ? { isOverdue: true } : {}),
    updated: formatDate(updatedAt),
    updatedAtTimestamp: toTimestamp(updatedAt),
  };
};

const mapManagerService = (item: ManagerExecutorAssignment): ServiceRecord | null => {
  const mode = normalizeMode(item.mode);
  const serviceType = normalizeMode(item.serviceType);

  return mapService({
    id: item.id,
    trackingNumber: item.trackingNumber,
    description: item.description,
    importer: item.importer,
    importerName: item.importerName,
    importerId: item.importerId,
    mode: mode !== "Unknown" ? mode : serviceType,
    status: item.status,
    riskLevel: item.riskLevel,
    assignedCaseExecutor: item.assignedCaseExecutor,
    createAt: item.createAt,
    updatedAt: item.updatedAt,
    dueAt: item.dueAt,
  });
};

const unwrapApiData = (value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as ApiRecord;
  for (const key of ["data", "payload", "response", "result"]) {
    const nested = readValue(record, key);
    if (nested !== undefined && nested !== value) return unwrapApiData(nested);
  }
  return value;
};

export const useServiceStore = create<ServiceStore>((set, get) => ({
  services: [],
  visibleColumns: allColumns,
  loading: false,
  error: null,
  searchQuery: "",
  statusFilter: "ALL",
  modeFilter: "ALL",
  channelFilter: "ALL",

  fetchServices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AssessorEndpoints.getActiveServicesForRegister();
      const services = normalizeRecordList(unwrapApiData(response))
        .map(mapService)
        .filter((service): service is ServiceRecord => service !== null);
      set({
        services,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Failed to load assessor services.",
      });
    }
  },

  fetchManagerServices: async (params) => {
    set({ loading: true, error: null });

    const managerStore = useManagerStore.getState();
    const records = await managerStore.fetchServices(params);
    const error = useManagerStore.getState().error;

    if (error) {
      set({ services: [], loading: false, error });
      return;
    }

    set({
      services: records
        .map(mapManagerService)
        .filter((service): service is ServiceRecord => service !== null),
      loading: false,
      error: null,
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setModeFilter: (mode) => set({ modeFilter: mode }),
  setChannelFilter: (channel) => set({ channelFilter: channel }),
  toggleColumn: (column) => set((state) => {
    const visibleColumns = state.visibleColumns.includes(column)
      ? state.visibleColumns.filter((visible) => visible !== column)
      : [...state.visibleColumns, column];
    return { visibleColumns: visibleColumns.length ? visibleColumns : state.visibleColumns };
  }),

  getFilteredServices: () => {
    const { services, searchQuery, statusFilter, modeFilter, channelFilter } = get();
    const query = searchQuery.trim().toLowerCase();

    return services.filter((item) =>
      (!query ||
        [item.id, item.shipmentId ?? "", item.referenceNumber ?? "", item.title, item.importerName, item.importerCode]
          .some((value) => value.toLowerCase().includes(query))) &&
      (statusFilter === "ALL" || item.status === statusFilter) &&
      (modeFilter === "ALL" || item.mode === modeFilter) &&
      (channelFilter === "ALL" || item.riskChannel === channelFilter),
    );
  },
}));
