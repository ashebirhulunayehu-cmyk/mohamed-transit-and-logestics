"use client";

import { create } from "zustand";
import { EvidenceFile, ServiceCase, ServiceReviewStats } from "./serviceReview.types";
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
  serviceDocuments: Record<string, EvidenceFile[]>;
  documentsLoading: boolean;
  documentsError: string | null;
  reviewedService: AssessorReviewedService | null;
  selectedCaseId: string | null;
  searchTerm: string;
  fetchCases: () => Promise<void>;
  fetchServiceDocuments: (serviceId: number) => Promise<void>;
  reviewCase: (payload: AssessorServiceReviewRequest) => Promise<AssessorReviewedService>;
  setSelectedCaseId: (id: string) => void;
  setSearchTerm: (term: string) => void;
  getSelectedCase: () => ServiceCase | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readField = (record: Record<string, unknown>, ...names: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown, fallback: string): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim() || fallback
    : fallback;

const unwrapList = (value: unknown): Record<string, unknown>[] => {
  let current = value;
  const listKeys = [
    "data",
    "payload",
    "response",
    "result",
    "resultData",
    "items",
    "records",
    "rows",
    "services",
    "pendingServices",
    "pendingServiceReviews",
    "pendingServiceReviewList",
    "pendingReviews",
    "pendingReviewServices",
    "serviceReviewRecords",
    "serviceReviews",
    "reviewQueue",
  ];

  for (let depth = 0; depth < 8; depth += 1) {
    if (Array.isArray(current)) {
      if (!current.every(isRecord)) {
        throw new Error("The service review response contains invalid records.");
      }
      return current;
    }
    if (!isRecord(current)) break;

    const entries = Object.entries(current);
    const list = entries.find(
      ([key, candidate]) =>
        listKeys.some((name) => name.toLowerCase() === key.toLowerCase()) &&
        (Array.isArray(candidate) || isRecord(candidate)),
    );
    if (list) {
      current = list[1];
      continue;
    }

    if (readField(current, "id", "serviceId", "shipmentId", "trackingNumber")) {
      return [current];
    }
    break;
  }

  throw new Error("The service review response did not contain a service record list.");
};

const unwrapDocumentList = (value: unknown): Record<string, unknown>[] => {
  let current = value;
  const listKeys = ["documents", "serviceDocuments", "items", "records", "rows"];

  for (let depth = 0; depth < 8; depth += 1) {
    if (Array.isArray(current)) {
      if (!current.every(isRecord)) {
        throw new Error("The service documents response contains invalid records.");
      }
      return current;
    }
    if (!isRecord(current)) {
      if (current == null) return [];
      break;
    }

    const entry = Object.entries(current).find(([key, entryValue]) =>
      listKeys.some((name) => name.toLowerCase() === key.toLowerCase()) &&
      (Array.isArray(entryValue) || isRecord(entryValue)),
    );
    if (entry) {
      current = entry[1];
      continue;
    }

    const wrapper = Object.entries(current).find(([key, entryValue]) =>
      ["data", "payload", "response", "result", "resultData"].includes(key.toLowerCase()) &&
      (Array.isArray(entryValue) || isRecord(entryValue)),
    );
    if (wrapper) {
      current = wrapper[1];
      continue;
    }

    if (readField(current, "id", "documentId")) return [current];
    break;
  }

  throw new Error("The service documents response did not contain a document list.");
};

const getRelatedName = (value: unknown): string => {
  if (!isRecord(value)) return "";
  return readText(
    readField(value, "businessName", "name", "username", "fullName"),
    "",
  );
};

const normalizeService = (record: Record<string, unknown>): ServiceCase | null => {
  const rawId = readField(record, "id", "serviceId", "shipmentId");
  const numericId = Number(rawId);
  const shipmentId = Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
  const trackingNumber = readText(
    readField(record, "trackingNumber", "serviceNumber", "referenceNumber", "reference"),
    shipmentId ? `Service ${shipmentId}` : "Service record",
  );
  const id = readText(rawId, trackingNumber);
  const description = readText(
    readField(record, "description", "itemDescription", "commodity", "goodsDescription", "serviceTypeName", "notes"),
    trackingNumber,
  );
  const origin = readText(readField(record, "origin", "originName", "countryOfOrigin"), "-");
  const destination = readText(readField(record, "destination", "destinationName", "routeCategory"), "-");
  const modeNames = ["Road", "Sea", "Air"];
  const rawMode = readField(record, "mode", "transportMode");
  const modeIndex = typeof rawMode === "number" ? rawMode : Number(rawMode);
  const mode = Number.isInteger(modeIndex)
    ? modeNames[modeIndex] ?? readText(rawMode, "Other")
    : readText(rawMode, "Other");
  const relatedImporter = readField(record, "importer", "customer", "importerCustomer");
  const documentsValue = readField(record, "documents", "serviceDocuments", "attachments");
  const documents = Array.isArray(documentsValue) ? documentsValue : [];
  const rawChannel = readField(record, "channel", "riskChannel", "riskCategory");
  const channelText = readText(rawChannel, "Unassigned");
  const channels: ServiceCase["channel"][] = [
    "Red channel",
    "Yellow channel",
    "Green channel",
    "Unassigned",
  ];
  const channel = channels.find(
    (item) => item.toLowerCase() === channelText.toLowerCase(),
  ) ?? "Unassigned";
  const rawStatus = readText(readField(record, "status", "serviceStatus", "reviewStatus"), "");
  const statusTag: ServiceCase["statusTag"] = /signed.?off|approved|completed/i.test(rawStatus)
    ? "Signed off"
    : /blocked|rejected/i.test(rawStatus)
      ? "Blocked"
      : /customer action|returned/i.test(rawStatus)
        ? "Requires customer action"
        : "Needs review";

  return {
    id,
    shipmentId,
    title: description,
    containerCount: readText(readField(record, "containerCount", "numberOfContainers"), "-"),
    importer:
      getRelatedName(relatedImporter) ||
      readText(readField(record, "importerName", "customerName", "businessName", "contactPerson", "email"), "Importer"),
    route: `${origin} → ${destination}`,
    statusTag,
    channel,
    commodity: description,
    hsCode: readText(readField(record, "hsCode", "hsCodeNumber"), "-"),
    declaredValue: readText(readField(record, "declaredValue", "value"), "-"),
    incoterm: readText(readField(record, "incoterm", "termsOfTrade"), "-"),
    billOfLading: trackingNumber,
    caseExecutor:
      getRelatedName(readField(record, "assignedCaseExecutor", "caseExecutor")) ||
      readText(readField(record, "caseExecutorName", "assignedCaseExecutorName"), "Unassigned"),
    currentStage: readText(readField(record, "currentStage", "stageName"), "Review"),
    sla: readText(readField(record, "sla", "slaDueDate"), "-"),
    mode,
    timeAgo: readText(readField(record, "updatedAt", "createAt", "createdAt"), ""),
    evidenceFiles: documents.filter(isRecord).map((document, index) => {
      const rawDocumentId = readField(document, "id", "documentId");
      const documentId = rawDocumentId == null ? "" : String(rawDocumentId).trim();
      return {
        id: documentId || `unavailable-${index}`,
        documentId: documentId || undefined,
        name: readText(readField(document, "fileName", "name", "documentName"), `Document ${index + 1}`),
        type: readText(readField(document, "documentType", "type"), "Document"),
        url: (() => {
          const url = readField(document, "url", "fileUrl", "downloadUrl");
          return typeof url === "string" ? url : undefined;
        })(),
      };
    }),
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
  serviceDocuments: {},
  documentsLoading: false,
  documentsError: null,
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
  fetchServiceDocuments: async (serviceId) => {
    const key = String(serviceId);
    set({ documentsLoading: true, documentsError: null });
    try {
      const response = await AssessorEndpoints.getServiceDocuments(serviceId);
      const files = unwrapDocumentList(response).map((document, index) => {
        const rawDocumentId = readField(document, "id", "documentId");
        const documentId = rawDocumentId == null ? "" : String(rawDocumentId).trim();
        return {
          id: documentId || `unavailable-${index}`,
          documentId: documentId || undefined,
          name: readText(
            readField(document, "fileName", "name", "documentName", "originalFileName"),
            `Document ${index + 1}`,
          ),
          type: readText(
            readField(document, "documentType", "type", "contentType", "mimeType"),
            "Document",
          ),
          url: (() => {
            const value = readField(document, "url", "fileUrl", "downloadUrl");
            return typeof value === "string" ? value : undefined;
          })(),
        };
      });

      set((state) => ({
        serviceDocuments: { ...state.serviceDocuments, [key]: files },
        documentsLoading: false,
        documentsError: null,
      }));
    } catch (error: unknown) {
      set({
        documentsLoading: false,
        documentsError: error instanceof Error ? error.message : "Unable to load service documents.",
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