"use client";

import { create } from "zustand";
import {
  deleteDocument,
  deleteStageTransportDocument,
  downloadDocument,
  downloadDocuments,
  getServiceDocuments,
  uploadServiceDocument,
  verifyDocument,
} from "./document.endpoint";
import type { DocumentFiltersState, DocumentRecord } from "./document.types";

interface DocumentStore extends DocumentFiltersState {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (params?: Record<string, unknown>) => Promise<void>;
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

const initialDocuments: DocumentRecord[] = [
  {
    id: "doc-1",
    name: "Proforma-Invoice-HAI-4417.pdf",
    type: "Proforma Invoice",
    serviceId: "SVC-2026-0417",
    serviceStage: "Prepayment Invoice",
    uploadedBy: "Selamawit Bekele",
    uploadedAt: "18 Jun 2026, 12:14",
    status: "Verified",
  },
];

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialDocuments,
  searchQuery: "",
  statusFilter: "ALL",
  typeFilter: "ALL",
  loading: false,
  error: null,

  fetchDocuments: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await getServiceDocuments(params);
      const payload = asRecord(response)?.data ?? response;
      const list = Array.isArray(payload)
        ? payload
        : asRecord(payload)?.items ??
          asRecord(payload)?.data ??
          asRecord(payload)?.documents ??
          initialDocuments;

      set({
        documents: Array.isArray(list) ? (list as DocumentRecord[]) : initialDocuments,
        loading: false,
      });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to load documents",
        loading: false,
      });
      set({ documents: initialDocuments });
    }
  },

  uploadDocument: async (payload) => {
    set({ loading: true, error: null });
    try {
      await uploadServiceDocument(payload);
      await get().fetchDocuments();
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Upload failed",
        loading: false,
      });
      throw err;
    }
  },

  verifyDocumentById: async (payload) => {
    set({ loading: true, error: null });
    try {
      await verifyDocument({
        documentId: payload.documentId ?? payload.id,
        id: payload.id,
        isVerified: payload.isVerified ?? true,
        notes: payload.notes ?? payload.verificationNotes ?? "Verified by user",
        verificationNotes: payload.verificationNotes ?? payload.notes ?? "Verified by user",
        verifiedByUserId: payload.verifiedByUserId,
      });
      await get().fetchDocuments();
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Verification failed",
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
        error: err instanceof Error ? err.message : "Delete failed",
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
        error: err instanceof Error ? err.message : "Stage transport document delete failed",
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
        error: err instanceof Error ? err.message : "Download failed",
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
        error: err instanceof Error ? err.message : "Batch download failed",
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
