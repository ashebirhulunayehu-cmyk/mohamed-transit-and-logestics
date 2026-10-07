"use client";

import { create } from "zustand";
import { ManagerEndpoints } from "@/modules/manager/manager.endpoint";
import type { ManagerExecutorAssignment } from "@/modules/manager/manager.type";
import { ServiceRecord, ServiceFiltersState } from "./service.types";

interface ServiceStore extends ServiceFiltersState {
  services: ServiceRecord[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<ServiceRecord[]>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setModeFilter: (mode: string) => void;
  setChannelFilter: (channel: string) => void;
  getFilteredServices: () => ServiceRecord[];
}

const normalizeMode = (value: unknown): ServiceRecord["mode"] => {
  const normalized = typeof value === "string" ? value.toLowerCase() : String(value ?? "").toLowerCase();
  return normalized.includes("multi") ? "Multimodal" : "Unimodal";
};

const normalizeStatus = (value: unknown): ServiceRecord["status"] => {
  if (typeof value === "string") {
    const status = value.trim().toLowerCase();
    if (status.includes("blocked")) return "Blocked";
    if (status.includes("review")) return "Needs review";
    if (status.includes("complete")) return "Completed";
    if (status.includes("progress")) return "In progress";
    if (status.includes("action")) return "Requires customer action";
    if (status.includes("pending")) return "Pending";
  }

  const numeric = Number(value ?? 0);
  if (numeric === 1) return "Pending";
  if (numeric === 2) return "In progress";
  if (numeric === 3) return "Needs review";
  if (numeric === 4) return "Completed";
  if (numeric === 5) return "Blocked";

  return "Pending";
};

const normalizeRisk = (value: unknown): ServiceRecord["riskChannel"] => {
  const numeric = Number(value ?? 0);
  if (numeric >= 3) return "Red channel";
  if (numeric === 2) return "Yellow channel";
  if (numeric === 1) return "Green channel";
  return "Blue channel";
};

const formatDateLabel = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const mapManagerService = (item: ManagerExecutorAssignment): ServiceRecord | null => {
  if (!item) return null;

  const assignedCaseExecutor = item.assignedCaseExecutor;
  const caseExecutorName = assignedCaseExecutor
    ? `${assignedCaseExecutor.firstName ?? ""} ${assignedCaseExecutor.lastName ?? ""}`.trim() || assignedCaseExecutor.username || "Unassigned"
    : "Unassigned";

  const importerName =
    typeof (item as Record<string, unknown>).importerName === "string"
      ? (item as Record<string, unknown>).importerName as string
      : item.importer
        ? `${item.importer.firstName ?? ""} ${item.importer.lastName ?? ""}`.trim() || item.importer.username || "Importer"
        : "Importer";

  const importerCode = typeof item.importerId === "number" || typeof item.importerId === "string"
    ? String(item.importerId)
    : "—";

  return {
    id: item.trackingNumber || String(item.id ?? "SVC-NEW"),
    title: item.description || "Import service",
    importerName,
    importerCode,
    mode: normalizeMode(item.mode),
    status: normalizeStatus(item.status),
    riskChannel: normalizeRisk(item.riskLevel),
    caseExecutor: caseExecutorName,
    eta: item.assignedHub ? `Hub ${item.assignedHub}` : "—",
    sla: item.updatedAt ? "In review" : "—",
    updated: item.updatedAt ? formatDateLabel(item.updatedAt) : formatDateLabel(item.createAt),
    isOverdue: false,
  };
};

const unwrapApiData = (value: unknown): unknown => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of ["data", "payload", "response", "items", "result"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") return unwrapApiData(nested);
  }

  return [];
};

export const useServiceStore = create<ServiceStore>((set, get) => ({
  services: [],
  loading: false,
  error: null,
  searchQuery: "",
  statusFilter: "ALL",
  modeFilter: "ALL",
  channelFilter: "ALL",

  fetchServices: async () => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.getAllServices();
      const payload = unwrapApiData(response);
      const rows = Array.isArray(payload) ? payload : [];
      const services = rows
        .map((row) => mapManagerService(row as ManagerExecutorAssignment))
        .filter((row): row is ServiceRecord => row !== null);

      set({ services, loading: false, error: null });
      return services;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load services.";
      set({ services: [], loading: false, error: message });
      return [];
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setModeFilter: (mode) => set({ modeFilter: mode }),
  setChannelFilter: (channel) => set({ channelFilter: channel }),

  getFilteredServices: () => {
    const { services, searchQuery, statusFilter, modeFilter, channelFilter } = get();

    return services.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.importerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || item.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesMode =
        modeFilter === "ALL" || item.mode.toLowerCase() === modeFilter.toLowerCase();

      const matchesChannel =
        channelFilter === "ALL" ||
        item.riskChannel.toLowerCase().includes(channelFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesMode && matchesChannel;
    });
  },
}));