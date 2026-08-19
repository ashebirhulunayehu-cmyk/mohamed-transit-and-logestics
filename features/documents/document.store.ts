"use client";

import { create } from "zustand";
import { DocumentRecord, DocumentFiltersState } from "./document.types";
import { mockDocuments } from "./document.data";

interface DocumentStore extends DocumentFiltersState {
  documents: DocumentRecord[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  getFilteredDocuments: () => DocumentRecord[];
  addDocument: (doc: DocumentRecord) => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: mockDocuments,
  searchQuery: "",
  statusFilter: "ALL",
  typeFilter: "ALL",

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

  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
}));