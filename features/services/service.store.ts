"use client";

import { create } from "zustand";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";
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
    if (normalized === "deliverd") return "Delivered";
    const match = Object.values(statusLabels).find((status) => status.toLowerCase().replaceAll(/\s+/g, "") === normalized);
    if (match) return match;
  }
  return "Unknown";
};

const normalizeMode = (value: unknown): ServiceRecord["mode"] => {
  if (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value))) {
    if (Number(value) === 1) return "Multimodal";
    if (Number(value) === 2) return "Unimodal";
    return "Unknown";
  }
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("multi")) return "Multimodal";
    if (normalized.includes("uni")) return "Unimodal";
  }
  return "Unknown";
};

const normalizeRisk = (value: unknown): ServiceRecord["riskChannel"] => {
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

const formatDate = (value: unknown): string => {
  const text = readText(value);
  if (!text) return "—";
  const date = new Date(text);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const mapService = (item: ApiRecord): ServiceRecord | null => {
  const databaseId = readText(readValue(item, "id", "shipmentId", "serviceId"));
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
  const executorFirstName = readNestedText(executor, "firstName");
  const executorLastName = readNestedText(executor, "lastName");
  const executorName = [executorFirstName, executorLastName].filter(Boolean).join(" ");

  return {
    id,
    shipmentId: databaseId || id,
    title: readText(readValue(item, "description", "title")) || "—",
    importerName,
    importerCode:
      readText(readValue(item, "importerCode", "customerReference", "customerCode", "tinNumber", "tin")) ||
      readNestedText(customer, "tinNumber", "tin", "customerCode") ||
      readText(readValue(item, "importerId", "customerId")) ||
      "—",
    mode: normalizeMode(readValue(item, "serviceType") ?? readValue(item, "mode", "type")),
    status: normalizeStatus(readValue(item, "status", "shipmentStatus")),
    riskChannel: normalizeRisk(readValue(item, "riskLevel") ?? readValue(item, "riskChannel")),
    caseExecutor: executorName || readNestedText(executor, "username") || "—",
    eta: "—",
    sla: "—",
    updated: formatDate(readValue(item, "updatedAt") ?? readValue(item, "createAt", "createdAt")),
  };
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
        services: [],
        loading: false,
        error: typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Failed to load assessor services.",
      });
    }
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
        [item.id, item.title, item.importerName, item.importerCode].some((value) => value.toLowerCase().includes(query))) &&
      (statusFilter === "ALL" || item.status === statusFilter) &&
      (modeFilter === "ALL" || item.mode === modeFilter) &&
      (channelFilter === "ALL" || item.riskChannel === channelFilter),
    );
  },
}));
