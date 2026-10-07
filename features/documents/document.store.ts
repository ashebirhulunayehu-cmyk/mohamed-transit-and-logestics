"use client";

import { create } from "zustand";
import { DocumentRecord, DocumentFiltersState } from "./document.types";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";
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

  const id = String(value.id ?? value.documentId ?? value.documentID ?? value.fileId ?? "");
  if (!id) return null;

  const fileName = value.name ?? value.fileName ?? value.documentName ?? value.title ?? "Untitled document";
  const type = value.type ?? value.documentType ?? value.category ?? "Document";
  const serviceId = value.serviceId ?? value.serviceID ?? value.serviceNumber ?? "N/A";
  const serviceStage = value.serviceStage ?? value.stageName ?? value.stage ?? "General";
  const uploadedBy = value.uploadedBy ?? value.createdBy ?? value.uploadedByUser ?? value.userName ?? "System";
  const uploadedAt = value.uploadedAt ?? value.createdAt ?? value.uploadDate ?? value.dateUploaded ?? "Recently";
  const statusValue = String(value.status ?? value.verificationStatus ?? value.state ?? "").trim().toLowerCase();
  const status = value.isVerified === true || ["verified", "approved"].includes(statusValue)
    ? "Verified"
    : value.isFlagged === true || ["flagged", "needs review"].includes(statusValue)
      ? "Flagged"
      : ["rejected", "declined"].includes(statusValue)
        ? "Rejected"
        : "Pending check";

  return {
    id,
    name: String(fileName),
    type: String(type),
    serviceId: String(serviceId),
    serviceStage: String(serviceStage),
    uploadedBy: String(uploadedBy),
    uploadedAt: String(uploadedAt),
    status,
  };
};

interface DocumentStore extends DocumentFiltersState {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (params?: Record<string, unknown>) => Promise<void>;
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
      await uploadServiceDocument(payload);
      await get().fetchDocuments();
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Upload failed"),
        loading: false,
      });
      throw err;
    }
  },

  verifyDocumentById: async (payload) => {
    set({ loading: true, error: null });
    try {
      const documentId = payload.documentId ?? payload.id;
      await verifyDocument({
        documentId,
        id: payload.id,
        isVerified: payload.isVerified ?? true,
        notes: payload.notes ?? payload.verificationNotes ?? "Verified by user",
        verificationNotes: payload.verificationNotes ?? payload.notes ?? "Verified by user",
        verifiedByUserId: payload.verifiedByUserId,
      });
      await get().fetchDocuments();
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
      await get().fetchDocuments();
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
      await get().fetchDocuments();
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
