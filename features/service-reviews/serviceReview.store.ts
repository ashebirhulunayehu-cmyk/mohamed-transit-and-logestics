"use client";

import { create } from "zustand";
import { ServiceCase, ServiceReviewStats } from "./serviceReview.types";
import { mockServiceCases, mockServiceStats } from "./serviceReview.data";

interface ServiceReviewStore {
  cases: ServiceCase[];
  stats: ServiceReviewStats;
  selectedCaseId: string | null;
  searchTerm: string;
  setSelectedCaseId: (id: string) => void;
  setSearchTerm: (term: string) => void;
  getSelectedCase: () => ServiceCase | undefined;
}

export const useServiceReviewStore = create<ServiceReviewStore>((set, get) => ({
  cases: mockServiceCases,
  stats: mockServiceStats,
  selectedCaseId: mockServiceCases[0]?.id || null,
  searchTerm: "",
  setSelectedCaseId: (id: string) => set({ selectedCaseId: id }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  getSelectedCase: () => {
    const { cases, selectedCaseId } = get();
    return cases.find((c) => c.id === selectedCaseId);
  },
}));