"use client";

import { create } from "zustand";
import { ServiceCase, ServiceReviewStats } from "./serviceReview.types";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint.ts";
import type {
  AssessorReviewedService,
  AssessorServiceReviewRequest,
} from "@/modules/assessor/assessor.type";

interface ServiceReviewStore {
  cases: ServiceCase[];
  stats: ServiceReviewStats;
  loading: boolean;
  error: string | null;
  reviewedService: AssessorReviewedService | null;
  selectedCaseId: string | null;
  searchTerm: string;
  fetchCases: () => Promise<void>;
  reviewCase: (payload: AssessorServiceReviewRequest) => Promise<AssessorReviewedService>;
  setSelectedCaseId: (id: string) => void;
  setSearchTerm: (term: string) => void;
  getSelectedCase: () => ServiceCase | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapList = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];

  for (const key of ["data", "payload", "response", "items"]) {
    if (value[key] !== undefined) return unwrapList(value[key]);
  }

  return [];
};

const readText = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const getRelatedName = (value: unknown): string => {
  if (!isRecord(value)) return "";
  return readText(value.businessName, readText(value.name, readText(value.username, "")));
};

const normalizeService = (record: Record<string, unknown>): ServiceCase | null => {
  const shipmentId = Number(record.id ?? record.shipmentId);
  if (!Number.isInteger(shipmentId) || shipmentId <= 0) return null;

  const trackingNumber = readText(record.trackingNumber, `Service ${shipmentId}`);
  const origin = readText(record.origin, "-");
  const destination = readText(record.destination, "-");
  const modeNames = ["Road", "Sea", "Air"];
  const mode = typeof record.mode === "number" ? modeNames[record.mode] ?? "Other" : "Other";
  const documents = Array.isArray(record.documents) ? record.documents : [];

  return {
    id: String(shipmentId),
    shipmentId,
    title: readText(record.description, trackingNumber),
    containerCount: "-",
    importer: getRelatedName(record.importer) || `Importer ${String(record.importerId ?? "")}`,
    route: `${origin} → ${destination}`,
    statusTag: "Needs review",
    channel: record.riskLevel == null ? "Unassigned" : "Yellow channel",
    commodity: readText(record.description, "Service review"),
    hsCode: "-",
    declaredValue: typeof record.declaredValue === "number" ? String(record.declaredValue) : "-",
    incoterm: "-",
    billOfLading: trackingNumber,
    caseExecutor: getRelatedName(record.assignedCaseExecutor) || "Unassigned",
    currentStage: "Review",
    sla: "-",
    mode,
    timeAgo: readText(record.updatedAt, readText(record.createAt, "")),
    evidenceFiles: documents.filter(isRecord).map((document, index) => ({
      id: String(document.id ?? index),
      name: readText(document.fileName, readText(document.name, `Document ${index + 1}`)),
      type: readText(document.documentType, "Document"),
      url: typeof document.url === "string" ? document.url : undefined,
    })),
  };
};

const emptyStats: ServiceReviewStats = {
  awaitingReview: 0,
  redChannel: 0,
  submittedForReview: 0,
  signedOff: 0,
};

export const useServiceReviewStore = create<ServiceReviewStore>((set, get) => ({
  cases: [],
  stats: emptyStats,
  loading: false,
  error: null,
  reviewedService: null,
  selectedCaseId: null,
  searchTerm: "",
  fetchCases: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AssessorEndpoints.getPendingServiceReviews();
      const cases = unwrapList(response)
        .map(normalizeService)
        .filter((item): item is ServiceCase => item !== null);

      set({
        cases,
        selectedCaseId: cases[0]?.id ?? null,
        stats: {
          ...emptyStats,
          awaitingReview: cases.length,
          redChannel: cases.filter((item) => item.channel === "Red channel").length,
          submittedForReview: cases.length,
        },
        loading: false,
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : "Unable to load service reviews.",
        loading: false,
      });
    }
  },
  reviewCase: async (payload) => {
    set({ loading: true, error: null, reviewedService: null });
    try {
      const reviewedService = await AssessorEndpoints.reviewService(payload);
      set((state) => {
        const cases = state.cases.filter((item) => item.shipmentId !== payload.shipmentId);
        return {
          reviewedService,
          cases,
          selectedCaseId: cases[0]?.id ?? null,
          stats: { ...state.stats, awaitingReview: cases.length, submittedForReview: cases.length },
          loading: false,
        };
      });
      return reviewedService;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Service review failed.";
      set({ error: message, loading: false });
      throw error;
    }
  },
  setSelectedCaseId: (id: string) => set({ selectedCaseId: id }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  getSelectedCase: () => {
    const { cases, selectedCaseId } = get();
    return cases.find((c) => c.id === selectedCaseId);
  },
}));