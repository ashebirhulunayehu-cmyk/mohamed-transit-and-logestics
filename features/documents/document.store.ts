"use client";

import { create } from "zustand";
import { DocumentRecord, DocumentFiltersState } from "./document.types";
import { mockDocuments } from "./document.data";
import {
  deleteDocument,
  downloadDocument,
  getServiceDocuments,
  uploadServiceDocument,
  verifyDocument,
} from "./document.endpoint";

interface DocumentStore extends DocumentFiltersState {
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (params?: Record<string, unknown>) => Promise<void>;
  uploadDocument: (payload: FormData) => Promise<void>;
  verifyDocumentById: (payload: { documentId?: string | number; id?: string | number; isVerified?: boolean; notes?: string }) => Promise<void>;
  removeDocument: (id: string | number) => Promise<void>;
  downloadFile: (documentId: string | number) => Promise<unknown>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  getFilteredDocuments: () => DocumentRecord[];
  addDocument: (doc: DocumentRecord) => void;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: mockDocuments,
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
          [];

      set({
        documents: Array.isArray(list) ? (list as DocumentRecord[]) : mockDocuments,
        loading: false,
      });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to load documents",
        loading: false,
      });
      set({ documents: mockDocuments });
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
      await verifyDocument(payload);
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
