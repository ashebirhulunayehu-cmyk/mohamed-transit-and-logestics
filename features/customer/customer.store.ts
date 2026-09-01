import { create } from "zustand";

interface CustomerStore {
  sidebarOpen: boolean;
  selectedServiceId: string | null;
  serviceDraftOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  selectService: (serviceId: string | null) => void;
  openServiceDraft: () => void;
  closeServiceDraft: () => void;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  sidebarOpen: false,
  selectedServiceId: null,
  serviceDraftOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  selectService: (selectedServiceId) => set({ selectedServiceId }),
  openServiceDraft: () => set({ serviceDraftOpen: true }),
  closeServiceDraft: () => set({ serviceDraftOpen: false }),
}));
