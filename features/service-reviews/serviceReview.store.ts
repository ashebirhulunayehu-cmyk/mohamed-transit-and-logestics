"use client";

import { create } from "zustand";
import {
  EvidenceFile,
  RiskChannel,
  ServiceCase,
  ServiceReviewStats,
} from "./serviceReview.types";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";
import type {
  AssessorReviewedService,
  AssessorServiceReviewRequest,
} from "@/modules/assessor/assessor.type";

interface ServiceReviewStore {
  cases: ServiceCase[];
  stats: ServiceReviewStats;
  loading: boolean;
  casesLoaded: boolean;
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
  setSelectedCaseId: (id: string | null) => void;
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

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message.trim()
    ? error.message
    : typeof error === "string" && error.trim()
      ? error
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
    "activeServices",
    "activeServiceList",
    "activeServiceRecords",
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

const formatEnum = (value: unknown, entries: Record<number, string>): string => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isInteger(numericValue) && entries[numericValue]) {
    return entries[numericValue];
  }

  return typeof value === "string" && value.trim()
    ? value.replace(/([a-z])([A-Z])/g, "$1 $2")
    : "Not recorded";
};

const documentTypeNames: Record<number, string> = {
  1: "Invoice",
  2: "Bank receipt",
  3: "Delivery order",
  4: "Inspection report",
  5: "Clearance document",
  6: "Transport license",
  7: "Arrival photo",
  8: "Store receipt",
  9: "Legal document",
  10: "Other",
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

const getDocumentType = (document: Record<string, unknown>): string => {
  const rawType = readField(document, "documentType", "type");
  const typeIndex = typeof rawType === "number" ? rawType : Number(rawType);
  return documentTypeNames[typeIndex] ?? readText(rawType, "Document");
};

const normalizeDocuments = (
  value: unknown,
  source: EvidenceFile["source"],
): EvidenceFile[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((document, index) => {
    const rawId = readField(document, "id", "documentId");
    const documentId = rawId == null ? "" : String(rawId).trim();
    const rawExpiry = readField(document, "expiryDate");
    const expiryDate = typeof rawExpiry === "string" ? rawExpiry : undefined;
    const isExpired = Boolean(
      expiryDate && new Date(expiryDate).getTime() < Date.now(),
    );

    return {
      id: `${source.toLowerCase()}-${documentId || index}`,
      documentId: source === "Service" ? documentId || undefined : undefined,
      serviceStageId:
        readField(document, "serviceStageId", "shipmentStageId", "stageId") == null
          ? undefined
          : String(readField(document, "serviceStageId", "shipmentStageId", "stageId")),
      name: readText(
        readField(document, "originalFileName", "fileName", "name"),
        `Document ${index + 1}`,
      ),
      type: getDocumentType(document),
      source,
      description: readText(readField(document, "description"), "") || undefined,
      size: readText(readField(document, "fileSizeBytes"), "") || undefined,
      mimeType: readText(readField(document, "mimeType"), "") || undefined,
      isRequired: readField(document, "isRequired") === true,
      isVerified: readField(document, "isVerified") === true,
      verificationNotes:
        readText(readField(document, "verificationNotes"), "") || undefined,
      submittedAt:
        readText(readField(document, "createAt", "createdDate"), "") || undefined,
      expiryDate,
      isExpired,
    };
  });
};

const normalizeService = (record: Record<string, unknown>): ServiceCase | null => {
  const rawId = readField(record, "id", "shipmentId");
  const shipmentId = Number(rawId);
  if (!Number.isInteger(shipmentId) || shipmentId <= 0) return null;

  const customerValue = readField(record, "customer");
  const customer = isRecord(customerValue) ? customerValue : {};
  const importerValue = readField(record, "importer");
  const importer = isRecord(importerValue) ? importerValue : {};
  const executorValue = readField(record, "assignedCaseExecutor");
  const executor = isRecord(executorValue) ? executorValue : {};
  const firstName = readText(readField(importer, "firstName"), "");
  const lastName = readText(readField(importer, "lastName"), "");
  const importerName = [firstName, lastName].filter(Boolean).join(" ");
  const origin = readText(readField(record, "origin"), "");
  const destination = readText(readField(record, "destination"), "");
  const rawMode = readField(record, "mode");
  const rawRisk = readField(record, "riskLevel");
  const rawStatus = readField(record, "status");
  const rawStages = readField(record, "stages");
  const stages = Array.isArray(rawStages) ? rawStages.filter(isRecord) : [];
  const stageLabels = stages.map((stage) => {
    const stageValue = readField(stage, "stage");
    const stageNumber = typeof stageValue === "number" ? stageValue : Number(stageValue);
    const stageName = stageNames[stageNumber] ?? formatEnum(stageValue, {});
    const stageStatus = formatEnum(readField(stage, "status"), {
      1: "Not started",
      2: "Pending",
      3: "In progress",
      4: "Completed",
      5: "Blocked",
      6: "Needs review",
    });
    return `${stageName} — ${stageStatus}`;
  });
  const currentStageRecord = stages.find((stage) => {
    const status = formatEnum(readField(stage, "status"), {
      1: "Not started",
      2: "Pending",
      3: "In progress",
      4: "Completed",
      5: "Blocked",
      6: "Needs review",
    }).toLowerCase();
    return status !== "completed" && status !== "not started";
  });
  const currentStageValue = currentStageRecord
    ? readField(currentStageRecord, "stageName", "name", "title", "stage")
    : undefined;
  const currentStageNumber =
    typeof currentStageValue === "number" ? currentStageValue : Number(currentStageValue);
  const slaValue = readField(
    record,
    "sla",
    "slaRemaining",
    "slaDaysRemaining",
    "timeToDue",
  );
  const slaDueDate = readField(record, "dueAt", "dueDate", "slaDueAt", "expectedCompletionDate");
  const sla =
    typeof slaValue === "number" || (typeof slaValue === "string" && slaValue.trim())
      ? String(slaValue)
      : typeof slaDueDate === "string" && Number.isFinite(new Date(slaDueDate).getTime())
        ? `${Math.ceil((new Date(slaDueDate).getTime() - Date.now()) / 86_400_000)} day(s) ${new Date(slaDueDate).getTime() < Date.now() ? "overdue" : "left"}`
        : "Not recorded";
  const rawServiceDocuments = readField(record, "documents");
  const customerDocuments = normalizeDocuments(
    readField(customer, "documents"),
    "Customer",
  );
  const serviceDocuments = normalizeDocuments(rawServiceDocuments, "Service");
  const shipmentStatus = formatEnum(rawStatus, {
    1: "Draft",
    2: "Submitted",
    3: "Under review",
    4: "Approved",
    5: "In progress",
    6: "Completed",
    7: "Rejected",
    8: "Cancelled",
    9: "Delivered",
  });
  const reviewStatus = readField(record, "hasBlockedStage") === true
    ? "Blocked"
    : readField(record, "hasCustomerAction") === true
      ? "Requires customer action"
      : readField(record, "hasNeedsReview") === true
        ? "Needs review"
        : shipmentStatus;
  const rawDeclaredValue = readField(record, "declaredValue");
  const declaredValue =
    typeof rawDeclaredValue === "number" || typeof rawDeclaredValue === "string"
      ? String(rawDeclaredValue)
      : "Not recorded";
  const rawCreatedAt = readField(record, "createAt");
  const rawUpdatedAt = readField(record, "updatedAt");
  const createdAt =
    typeof rawCreatedAt === "string" ? rawCreatedAt : "Not recorded";
  const updatedAt =
    typeof rawUpdatedAt === "string" ? rawUpdatedAt : createdAt;
  const riskText = formatEnum(rawRisk, {
    1: "Blue channel",
    2: "Green channel",
    3: "Yellow channel",
    4: "Red channel",
  });
  const channel: RiskChannel =
    riskText === "Blue channel" ||
    riskText === "Green channel" ||
    riskText === "Yellow channel" ||
    riskText === "Red channel"
      ? riskText
      : "Unassigned";
  const rawHub = readField(record, "assignedHub");

  return {
    id: String(shipmentId),
    shipmentId,
    trackingNumber: readText(readField(record, "trackingNumber"), "Not recorded"),
    title: readText(readField(record, "description"), "No goods description recorded"),
    importer: readText(
      readField(customer, "businessName"),
      importerName || readText(readField(importer, "username"), "Not recorded"),
    ),
    importerId: Number(readField(record, "importerId")),
    businessName: readText(readField(customer, "businessName"), "Not recorded"),
    tinNumber: readText(readField(customer, "tinNumber"), "Not recorded"),
    businessLicense: readText(readField(customer, "businessLicense"), "Not recorded"),
    importLicense: readText(readField(customer, "importLicense"), "Not recorded"),
    importLicenseExpiry:
      readText(readField(customer, "importLicenseExpiry"), "Not recorded"),
    businessType: readText(readField(customer, "businessType"), "Not recorded"),
    businessAddress: readText(readField(customer, "businessAddress"), "Not recorded"),
    contactPerson: readText(readField(customer, "contactPerson"), "Not recorded"),
    contactEmail: readText(
      readField(customer, "contactEmail"),
      readText(readField(importer, "email"), "Not recorded"),
    ),
    contactPhone: readText(
      readField(customer, "contactPhone"),
      readText(readField(importer, "phone"), "Not recorded"),
    ),
    customerIsVerified:
      typeof readField(customer, "isVerified") === "boolean"
        ? readField(customer, "isVerified") as boolean
        : null,
    route: `${origin || "Not recorded"} → ${destination || "Not recorded"}`,
    origin: origin || "Not recorded",
    destination: destination || "Not recorded",
    countryOfOrigin: readText(readField(record, "countryOfOrigin"), "Not recorded"),
    routeCategory: readText(readField(record, "routeCategory"), "Not recorded"),
    commodity: readText(
      readField(record, "commodity", "goodsDescription", "cargoDescription"),
      "Not recorded",
    ),
    hsCode: readText(readField(record, "hsCode", "harmonizedSystemCode"), "Not recorded"),
    incoterm: readText(readField(record, "incoterm", "incoterms"), "Not recorded"),
    billOfLading: readText(
      readField(record, "billOfLading", "billOfLadingNumber", "blNumber"),
      "Not recorded",
    ),
    currentStage: readText(
      readField(record, "currentStage", "currentStageName"),
      stageNames[currentStageNumber] ??
        (typeof currentStageValue === "string" ? currentStageValue : "Not recorded"),
    ),
    sla,
    status: reviewStatus,
    shipmentStatus,
    assignedHub: formatEnum(rawHub, { 1: "Djibouti", 2: "Mojo", 3: "Adama" }),
    mode: formatEnum(rawMode, { 1: "Multimodal sea/rail", 2: "Unimodal road" }),
    declaredValue,
    taxCategory: readText(readField(record, "taxCategory"), "Not recorded"),
    riskLevel: riskText,
    channel,
    caseExecutor: [readField(executor, "firstName"), readField(executor, "lastName")]
      .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
      .join(" ") || "Not assigned",
    stages: stageLabels,
    registeredDate: createdAt,
    updatedAt,
    evidenceFiles: [...customerDocuments, ...serviceDocuments],
  };
};

const emptyStats: ServiceReviewStats = {
  awaitingReview: 0,
  redChannel: 0,
  submittedForReview: 0,
};

const getServiceReviewStats = (cases: ServiceCase[]): ServiceReviewStats => ({
  awaitingReview: cases.length,
  redChannel: cases.filter((item) => item.channel === "Red channel").length,
  submittedForReview: cases.filter(
    (item) => item.shipmentStatus.toLowerCase() === "submitted",
  ).length,
});

export const useServiceReviewStore = create<ServiceReviewStore>((set, get) => ({
  cases: [],
  stats: emptyStats,
  loading: false,
  casesLoaded: false,
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
      const response = await AssessorEndpoints.getActiveServicesForRegister();
      const cases = unwrapList(response)
        .map(normalizeService)
        .filter(
          (item): item is ServiceCase =>
            item !== null &&
            (item.shipmentStatus.toLowerCase() === "submitted" ||
              item.status === "Needs review" ||
              item.status === "Blocked" ||
              item.status === "Requires customer action"),
        );

      set({
        cases,
        selectedCaseId: cases.some((item) => item.id === get().selectedCaseId)
          ? get().selectedCaseId
          : cases[0]?.id ?? null,
        stats: getServiceReviewStats(cases),
        loading: false,
        casesLoaded: true,
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
          type: getDocumentType(document),
          source: "Service" as const,
          description: readText(readField(document, "description"), "") || undefined,
          size: readText(readField(document, "fileSizeBytes"), "") || undefined,
          mimeType: readText(readField(document, "mimeType"), "") || undefined,
          isRequired: readField(document, "isRequired") === true,
          isVerified: readField(document, "isVerified") === true,
          verificationNotes:
            readText(readField(document, "verificationNotes"), "") || undefined,
          submittedAt:
            readText(readField(document, "createAt", "createdDate"), "") || undefined,
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
          stats: getServiceReviewStats(cases),
          loading: false,
        };
      });
      return reviewedService;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Service review failed.");
      set({ error: message, loading: false });
      throw error;
    }
  },
  setSelectedCaseId: (id: string | null) => set({ selectedCaseId: id }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  getSelectedCase: () => {
    const { cases, selectedCaseId } = get();
    return cases.find((c) => c.id === selectedCaseId);
  },
}));