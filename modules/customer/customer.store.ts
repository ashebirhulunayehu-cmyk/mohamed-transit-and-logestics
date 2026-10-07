"use client";

import { create } from "zustand";
import {
  createCustomerService,
  getCustomerProfile,
  getMyCustomerServices,
  registerCustomer,
} from "./customer.endpoint";
import type {
  CustomerProfileApiEnvelope,
  CustomerProfileRecord,
  CustomerCreatedServiceRecord,
  CustomerCreateServicePayload,
  CustomerRegistrationApiEnvelope,
  CustomerRegistrationRecord,
  CustomerRegisterPayload,
  CustomerServiceApiItem,
} from "./customer.type";

const statusMap: Record<number, string> = {
  0: "Pending",
  1: "In progress",
  2: "Pending",
  3: "Needs review",
  4: "Completed",
};

const normalizeCustomerService = (item: CustomerServiceApiItem): CustomerCreatedServiceRecord => ({
  id: item.id,
  trackingNumber: item.serviceNumber || `SR-${item.id}`,
  importerId: item.customerId || 0,
  description: item.itemDescription || "Import service",
  mode: item.serviceType === 0 ? "Road" : item.serviceType === 1 ? "Sea" : "Air",
  assignedHub: item.routeCategory || "-",
  status: statusMap[item.status] || "Pending",
  origin: item.countryOfOrigin || "-",
  destination: item.routeCategory || "-",
  createAt: item.registeredDate || new Date().toISOString(),
});

interface CustomerServiceState {
  services: CustomerCreatedServiceRecord[];
  registration: CustomerRegistrationRecord | null;
  profile: CustomerProfileRecord | null;
  loading: boolean;
  error: string | null;
  registerCustomer: (payload: CustomerRegisterPayload) => Promise<CustomerRegistrationRecord | null>;
  getCustomerProfile: () => Promise<CustomerProfileRecord | null>;
  createService: (payload: CustomerCreateServicePayload) => Promise<CustomerCreatedServiceRecord | null>;
  getMyServices: () => Promise<CustomerCreatedServiceRecord[]>;
  setServices: (services: CustomerCreatedServiceRecord[]) => void;
}

export const useCustomerServiceStore = create<CustomerServiceState>((set) => ({
  services: [],
  registration: null,
  profile: null,
  loading: false,
  error: null,
  setServices: (services) => set({ services }),
  getCustomerProfile: async () => {
    set({ loading: true, error: null });

    try {
      const response = await getCustomerProfile();
      const candidate =
        (response as unknown as CustomerProfileApiEnvelope | undefined)?.response?.data ??
        (response as unknown as CustomerProfileRecord | undefined) ??
        (response as { data?: CustomerProfileRecord } | undefined)?.data ??
        null;

      const normalized =
        candidate && typeof candidate === "object" ? (candidate as CustomerProfileRecord) : null;

      if (!normalized) {
        set({ profile: null, loading: false, error: "No customer profile returned from API." });
        return null;
      }

      set({ profile: normalized, loading: false, error: null });
      return normalized;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to load customer profile.";
      set({ profile: null, loading: false, error: message });
      return null;
    }
  },
  registerCustomer: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await registerCustomer(payload);
      const candidate =
        (response as unknown as CustomerRegistrationApiEnvelope | undefined)?.response?.data ??
        (response as unknown as CustomerRegistrationRecord | undefined) ??
        (response as { data?: CustomerRegistrationRecord } | undefined)?.data ??
        null;

      const normalized =
        candidate && typeof candidate === "object" ? (candidate as CustomerRegistrationRecord) : null;

      if (!normalized) {
        set({ loading: false, error: "No customer registration returned from API." });
        return null;
      }

      set({ registration: normalized, loading: false, error: null });
      return normalized;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to register customer.";
      set({ loading: false, error: message });
      return null;
    }
  },
  getMyServices: async () => {
    set({ loading: true, error: null });

    try {
      const response = await getMyCustomerServices();
      const data = Array.isArray(response) ? response : response?.data ?? [];
      const normalized = (data as CustomerServiceApiItem[]).map(normalizeCustomerService);

      set({ services: normalized, loading: false, error: null });
      return normalized;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to load services.";
      set({ loading: false, error: message });
      return [];
    }
  },
  createService: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await createCustomerService(payload);
      const candidate = (response as { data?: CustomerCreatedServiceRecord } | CustomerCreatedServiceRecord | undefined) ?? null;
      const normalized: CustomerCreatedServiceRecord | null =
        candidate && typeof candidate === "object" && "data" in candidate && candidate.data ? candidate.data :
        candidate && typeof candidate === "object" ? candidate as CustomerCreatedServiceRecord : null;

      if (!normalized) {
        set({ loading: false, error: "No service returned from API." });
        return null;
      }

      set((state) => ({
        services: [normalized, ...state.services.filter((item) => item.id !== normalized.id)],
        loading: false,
        error: null,
      }));

      return normalized;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to create service.";
      set({ loading: false, error: message });
      return null;
    }
  },
}));
