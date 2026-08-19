"use client";

import { create } from "zustand";
import { ServiceRecord, ServiceFiltersState } from "./service.types";
import { mockServices } from "./service.data";

interface ServiceStore extends ServiceFiltersState {
  services: ServiceRecord[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setModeFilter: (mode: string) => void;
  setChannelFilter: (channel: string) => void;
  getFilteredServices: () => ServiceRecord[];
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  services: mockServices,
  searchQuery: "",
  statusFilter: "ALL",
  modeFilter: "ALL",
  channelFilter: "ALL",

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