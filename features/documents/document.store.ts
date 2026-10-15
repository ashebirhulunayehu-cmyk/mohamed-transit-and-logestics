"use client";

import { create } from "zustand";
import { DocumentRecord, DocumentFiltersState } from "./document.types";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";
import { AssessorEndpoints } from "@/modules/assessor/assessor.endpoint";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  deleteDocument,
  deleteStageTransportDocument,
  downloadDocument,
  downloadDocuments,
  getServiceDocuments,
  uploadServiceDocument,
  verifyDocument,
} from "./document.endpoint";

const normalizeDocumentRecord = (value: unknown): DocumentRecord | null => {
  if (!isRecord(value)) return null;

  const readField = (...names: string[]): unknown => {
    const nameSet = new Set(names.map((name) => name.toLowerCase()));
    const key = Object.keys(value).find((candidate) => nameSet.has(candidate.toLowerCase()));
    return key ? value[key] : undefined;
  };
  const id = String(readField("id", "documentId", "fileId") ?? "");
  if (!id) return null;

  const fileName = readField("originalFileName", "fileName", "name", "documentName", "title") ?? "Untitled document";
  const rawType = readField("type", "documentType", "category");
  const documentTypes = ["", "Invoice", "Bank receipt", "Delivery order", "Inspection report", "Clearance document", "Transport license", "Arrival photo", "Store receipt", "Legal document", "Other"];
  const numericType = Number(rawType);
  const type = typeof rawType === "number" || (typeof rawType === "string" && /^\d+$/.test(rawType))
    ? documentTypes[numericType] || "Document"
    : rawType ?? "Document";
  const serviceId = readField("serviceId", "shipmentId", "serviceNumber") ?? "N/A";
  const serviceValue = readField("service");
  const service = isRecord(serviceValue) ? serviceValue : {};
  const trackingNumber = readField("trackingNumber", "serviceTrackingNumber") ??
    service.trackingNumber;
  const serviceStage = readField("serviceStage", "shipmentStageId", "stageName", "stage") ?? "General";
  const uploader = readField("uploadedByUser", "uploadedBy", "createdBy", "userName");
  const uploadedBy = isRecord(uploader)
    ? uploader.firstName ?? uploader.username ?? uploader.email ?? "Uploader"
    : uploader ?? (readField("uploadedByUserId") ? `User ${String(readField("uploadedByUserId"))}` : "Unavailable");
  const uploadedAt = readField("uploadedAt", "createdAt", "createAt", "uploadDate", "dateUploaded") ?? "Date unavailable";
  const statusValue = String(readField("status", "verificationStatus", "state") ?? "").trim().toLowerCase();
  const verificationNotes = readField("verificationNotes", "reviewNotes", "notes");
  const normalizedNotes = typeof verificationNotes === "string" ? verificationNotes.trim().toLowerCase() : "";
  const status = ["verified", "approved"].includes(statusValue) || readField("isVerified") === true
    ? "Verified"
    : ["flagged", "needs review"].includes(statusValue) ||
      readField("isFlagged") === true ||
      normalizedNotes.startsWith("flagged:")
      ? "Flagged"
      : ["rejected", "declined"].includes(statusValue) || normalizedNotes.startsWith("rejected:")
        ? "Rejected"
        : "Pending check";
  const rawHistory = readField("history", "auditHistory", "verificationHistory", "documentHistory");
  const history = Array.isArray(rawHistory)
    ? rawHistory.flatMap((entry): string[] => {
        if (typeof entry === "string" && entry.trim()) return [entry.trim()];
        if (!isRecord(entry)) return [];
        const parts = [
          entry.action,
          entry.description,
          entry.status,
          entry.actor,
          entry.userName,
          entry.createdAt,
          entry.createAt,
        ].filter((part): part is string | number => typeof part === "string" || typeof part === "number");
        return parts.length ? [parts.map(String).join(" · ")] : [];
      })
    : undefined;
  const checksum = readField("checksum", "fileChecksum", "hash");
  const accessRestriction = readField("accessRestriction", "accessLevel", "access");
  const virusScanStatus = readField("virusScanStatus", "scanStatus", "virusScanResult");

  return {
    id,
    name: String(fileName),
    type: String(type),
    serviceId: String(serviceId),
    ...(trackingNumber == null ? {} : { serviceTrackingNumber: String(trackingNumber) }),
    serviceStage: String(serviceStage),
    uploadedBy: String(uploadedBy),
    uploadedAt: String(uploadedAt),
    status,
    ...(typeof checksum === "string" ? { checksum } : {}),
    ...(typeof accessRestriction === "string" ? { accessRestriction } : {}),
    ...(typeof virusScanStatus === "string" ? { virusScanStatus } : {}),
    ...(history ? { history } : {}),
    ...(typeof verificationNotes === "string" ? { verificationNotes } : {}),
  };
};

interface DocumentStore extends DocumentFiltersState {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (params?: Record<string, unknown>) => Promise<void>;
  fetchAssessmentDocuments: () => Promise<void>;
  fetchDocumentsForServices: (serviceIds: Array<string | number>) => Promise<void>;
  uploadDocument: (payload: FormData) => Promise<void>;
  verifyDocumentById: (payload: {
    documentId?: string | number;
    id?: string | number;
    isVerified?: boolean;
    notes?: string;
    verificationNotes?: string;
    verifiedByUserId?: string | number;
  }) => Promise<void>;
  removeDocument: (id: string | number) => Promise<void>;
  removeStageTransportDocument: (id: string | number) => Promise<void>;
  downloadFile: (documentId: string | number) => Promise<unknown>;
  downloadFiles: (documentIds: Array<string | number>) => Promise<unknown>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  getFilteredDocuments: () => DocumentRecord[];
  addDocument: (doc: DocumentRecord) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  return fallback;
};

const refreshCurrentDocuments = async (get: () => DocumentStore, additionalServiceIds: string[] = []) => {
  const serviceIds = new Set([
    ...get().documents.flatMap((document) =>
      document.serviceId !== "N/A" && document.serviceId.trim() ? [document.serviceId] : [],
    ),
    ...additionalServiceIds,
  ]);
  await get().fetchDocumentsForServices([...serviceIds]);
};

const readDocumentRows = (response: unknown): unknown[] => {
  const payload = asRecord(response)?.data ?? response;
  const payloadRecord = asRecord(payload);
  const source = Array.isArray(payload)
    ? payload
    : payloadRecord?.items ??
      payloadRecord?.data ??
      payloadRecord?.documents ??
      payloadRecord?.results ??
      [];
  return Array.isArray(source) ? source : [];
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  searchQuery: "",
  statusFilter: "ALL",
  typeFilter: "ALL",
  loading: false,
  error: null,

  fetchDocuments: async (params) => {
    const serviceIdEntry = Object.entries(params ?? {}).find(
      ([key]) => key.toLowerCase() === "serviceid",
    );
    const serviceId = Number(serviceIdEntry?.[1]);
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      set({
        error: "A valid service ID is required to load service documents.",
        loading: false,
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await getServiceDocuments(params);
      const normalized = readDocumentRows(response)
        .map((item) => normalizeDocumentRecord(item))
        .filter((item): item is DocumentRecord => item !== null);

      set({
        documents: normalized,
        loading: false,
      });
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Failed to load documents"),
        loading: false,
      });
    }
  },

  fetchAssessmentDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AssessorEndpoints.getAssessmentDocuments();
      const documents = readDocumentRows(response)
        .map((item) => normalizeDocumentRecord(item))
        .filter((item): item is DocumentRecord => item !== null);

      set({ documents, loading: false, error: null });
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Failed to load assessment documents"),
        loading: false,
      });
    }
  },

  fetchDocumentsForServices: async (serviceIds) => {
    set({ loading: true, error: null });
    try {
      const uniqueServiceIds = [...new Set(serviceIds.map(String).filter(Boolean))];
      if (!uniqueServiceIds.length) {
        set({ documents: [], loading: false });
        return;
      }

      const responses = await Promise.allSettled(
        uniqueServiceIds.map((serviceId) => DataEncoderEndpoints.getServiceDocuments(serviceId)),
      );
      const documents = responses
        .flatMap((result) => result.status === "fulfilled" ? readDocumentRows(result.value) : [])
        .map((item) => normalizeDocumentRecord(item))
        .filter((item): item is DocumentRecord => item !== null);
      const uniqueDocuments = [...new Map(documents.map((document) => [document.id, document])).values()];
      const error = responses
        .flatMap((result) => result.status === "rejected" ? [getErrorMessage(result.reason, "Failed to load documents")] : [])
        .find((message) => !/no document data for this service/i.test(message)) ?? null;

      set({ documents: uniqueDocuments, error, loading: false });
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Failed to load documents"),
        loading: false,
      });
    }
  },

  uploadDocument: async (payload) => {
    set({ loading: true, error: null });
    try {
      const uploadedServiceId = payload.get("ServiceId");
      await uploadServiceDocument(payload);
      await refreshCurrentDocuments(
        get,
        uploadedServiceId === null || uploadedServiceId === undefined ? [] : [String(uploadedServiceId)],
      );
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Upload failed"),
        loading: false,
      });
      throw err;
    }
  },

  verifyDocumentById: async (payload) => {
    const requestedId = payload.documentId ?? payload.id;
    const documentId = Number(requestedId);
    if (!Number.isSafeInteger(documentId) || documentId <= 0) {
      throw new Error("A valid numeric document ID is required for verification.");
    }
    const verifiedByUserId = Number(
      payload.verifiedByUserId ?? useAuthStore.getState().user?.id,
    );
    if (!Number.isSafeInteger(verifiedByUserId) || verifiedByUserId <= 0) {
      throw new Error("Your account ID is unavailable. Sign in again before verifying documents.");
    }

    set({ loading: true, error: null });
    try {
      const verificationNotes = payload.verificationNotes ?? payload.notes ?? "Verified by assessor";
      await verifyDocument({
        documentId,
        isVerified: payload.isVerified ?? true,
        verificationNotes,
        verifiedByUserId,
      });
      const id = String(documentId);
      const notes = verificationNotes.trim().toLowerCase();
      const status: DocumentRecord["status"] = payload.isVerified ?? true
        ? "Verified"
        : notes.startsWith("flagged:")
          ? "Flagged"
          : notes.startsWith("rejected:")
            ? "Rejected"
            : "Pending check";
      set((state) => ({
        documents: state.documents.map((document) =>
          document.id === id ? { ...document, status, verificationNotes } : document,
        ),
        loading: false,
      }));
      await get().fetchAssessmentDocuments();
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Verification failed"),
        loading: false,
      });
      throw err;
    }
  },

  removeDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDocument(id);
      await refreshCurrentDocuments(get);
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Delete failed"),
        loading: false,
      });
      throw err;
    }
  },

  removeStageTransportDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteStageTransportDocument(id);
      await refreshCurrentDocuments(get);
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Stage transport document delete failed"),
        loading: false,
      });
      throw err;
    }
  },

  downloadFile: async (documentId) => {
    set({ loading: true, error: null });
    try {
      const response = await downloadDocument(documentId);
      set({ loading: false });
      return response;
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Download failed"),
        loading: false,
      });
      throw err;
    }
  },

  downloadFiles: async (documentIds) => {
    set({ loading: true, error: null });
    try {
      const response = await downloadDocuments(documentIds);
      set({ loading: false });
      return response;
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Batch download failed"),
        loading: false,
      });
      throw err;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setTypeFilter: (type) => set({ typeFilter: type }),

  getFilteredDocuments: () => {
    const { documents, searchQuery, statusFilter, typeFilter } = get();

    return documents.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || item.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesType =
        typeFilter === "ALL" || item.type.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  },

  addDocument: (doc) =>
    set((state) => ({ documents: [doc, ...state.documents] })),
}));
