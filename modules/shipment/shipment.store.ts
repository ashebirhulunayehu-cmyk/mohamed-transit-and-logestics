"use client";

import { create } from "zustand";
import {
  assignShipment,
  createShipment,
  deleteShipment,
  getAllShipments,
  getShipmentById,
  getShipmentStages,
  getShipmentsByImporter,
  updateShipment,
  updateShipmentServiceStage,
  updateShipmentStageStatus,
  updateShipmentStageTransport,
  updateShipmentStatus,
  uploadShipmentDocument,
} from "./shipment.endpoint";
import type {
  ShipmentDocumentPayload,
  ShipmentParams,
  ShipmentPayload,
  ShipmentRecord,
  ShipmentServiceStageUpdatePayload,
  StageTransportUpdatePayload,
} from "./shipment.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapApiData = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;

  if ("data" in record && record.data !== undefined) {
    return unwrapApiData(record.data);
  }

  if ("payload" in record && record.payload !== undefined) {
    return unwrapApiData(record.payload);
  }

  if ("response" in record && record.response !== undefined) {
    return unwrapApiData(record.response);
  }

  return record;
};

const normalizeShipmentRecord = (item: Record<string, unknown>): ShipmentRecord => {
  const normalized = { ...item } as ShipmentRecord;

  if (normalized.createAt === undefined && typeof normalized.createdAt === "string") {
    normalized.createAt = normalized.createdAt;
  }

  if (normalized.createdAt === undefined && typeof normalized.createAt === "string") {
    normalized.createdAt = normalized.createAt;
  }

  if (normalized.trackingNumber === undefined && typeof normalized.id !== "undefined") {
    normalized.trackingNumber = String(normalized.id);
  }

  return normalized;
};

const normalizeShipmentList = (value: unknown): ShipmentRecord[] => {
  const payload = unwrapApiData(value);

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter(isRecord).map((item) => normalizeShipmentRecord(item));
};

const normalizeShipmentItem = (value: unknown): ShipmentRecord | null => {
  const payload = unwrapApiData(value);

  if (!isRecord(payload)) {
    return null;
  }

  return normalizeShipmentRecord(payload);
};

interface ShipmentState {
  shipments: ShipmentRecord[];
  selectedShipment: ShipmentRecord | null;
  loading: boolean;
  error: string | null;

  setShipments: (shipments: ShipmentRecord[]) => void;
  fetchShipments: (params?: ShipmentParams) => Promise<ShipmentRecord[]>;
  fetchShipmentById: (id: string | number) => Promise<ShipmentRecord | null>;
  fetchShipmentsByImporter: (importerId: string | number) => Promise<ShipmentRecord[]>;
  fetchShipmentStages: (params?: ShipmentParams) => Promise<unknown[]>;
  createShipmentAction: (payload: ShipmentPayload) => Promise<ShipmentRecord | null>;
  assignShipmentAction: (payload: ShipmentPayload) => Promise<ShipmentRecord | null>;
  updateShipmentAction: (payload: ShipmentPayload) => Promise<ShipmentRecord | null>;
  updateShipmentStatusAction: (id: string | number, payload: ShipmentPayload) => Promise<ShipmentRecord | null>;
  updateShipmentStageStatusAction: (id: string | number, payload: ShipmentPayload) => Promise<ShipmentRecord | null>;
  updateShipmentServiceStageAction: (payload: ShipmentServiceStageUpdatePayload) => Promise<ShipmentRecord | null>;
  updateShipmentStageTransportAction: (payload: StageTransportUpdatePayload) => Promise<ShipmentRecord | null>;
  uploadShipmentDocumentAction: (payload: ShipmentDocumentPayload) => Promise<ShipmentRecord | null>;
  deleteShipmentAction: (id: string | number) => Promise<boolean>;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
};

export const useShipmentStore = create<ShipmentState>((set) => ({
  shipments: [],
  selectedShipment: null,
  loading: false,
  error: null,

  setShipments: (shipments) => set({ shipments }),

  fetchShipments: async (params?: ShipmentParams) => {
    set({ loading: true, error: null });

    try {
      const response = await getAllShipments(params);
      const nextShipments = normalizeShipmentList(response);
      set({ shipments: nextShipments, loading: false, error: null });
      return nextShipments;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to load shipments.");
      set({ loading: false, error: message });
      return [];
    }
  },

  fetchShipmentById: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await getShipmentById(id);
      const shipment = normalizeShipmentItem(response);
      set({ selectedShipment: shipment, loading: false, error: null });
      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to load shipment details.");
      set({ loading: false, error: message });
      return null;
    }
  },

  fetchShipmentsByImporter: async (importerId) => {
    set({ loading: true, error: null });

    try {
      const response = await getShipmentsByImporter(importerId);
      const nextShipments = normalizeShipmentList(response);
      set({ shipments: nextShipments, loading: false, error: null });
      return nextShipments;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to load importer shipments.");
      set({ loading: false, error: message });
      return [];
    }
  },

  fetchShipmentStages: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = await getShipmentStages(params);
      const stages = Array.isArray(response) ? response : unwrapApiData(response);
      set({ loading: false, error: null });
      return Array.isArray(stages) ? stages : [];
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to load shipment stages.");
      set({ loading: false, error: message });
      return [];
    }
  },

  createShipmentAction: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await createShipment(payload);
      const shipment = normalizeShipmentItem(response);

      if (shipment) {
        set((state) => ({
          shipments: [shipment, ...state.shipments.filter((item) => String(item.id) !== String(shipment.id))],
          selectedShipment: shipment,
          loading: false,
          error: null,
        }));
      } else {
        set({ loading: false, error: "No shipment returned from API." });
      }

      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to create shipment.");
      set({ loading: false, error: message });
      return null;
    }
  },

  assignShipmentAction: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await assignShipment(payload);
      const shipment = normalizeShipmentItem(response);
      set({ selectedShipment: shipment ?? null, loading: false, error: null });
      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to assign shipment.");
      set({ loading: false, error: message });
      return null;
    }
  },

  updateShipmentAction: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await updateShipment(payload);
      const shipment = normalizeShipmentItem(response);

      if (shipment) {
        set((state) => ({
          shipments: state.shipments.map((item) =>
            String(item.id) === String(shipment.id) ? { ...item, ...shipment } : item,
          ),
          selectedShipment: shipment,
          loading: false,
          error: null,
        }));
      } else {
        set({ loading: false, error: null });
      }

      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to update shipment.");
      set({ loading: false, error: message });
      return null;
    }
  },

  updateShipmentStatusAction: async (id, payload) => {
    set({ loading: true, error: null });

    try {
      const response = await updateShipmentStatus(id, payload);
      const shipment = normalizeShipmentItem(response);

      if (shipment) {
        set((state) => ({
          shipments: state.shipments.map((item) =>
            String(item.id) === String(shipment.id) ? { ...item, ...shipment } : item,
          ),
          selectedShipment: shipment,
          loading: false,
          error: null,
        }));
      } else {
        set({ loading: false, error: null });
      }

      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to update shipment status.");
      set({ loading: false, error: message });
      return null;
    }
  },

  updateShipmentStageStatusAction: async (id, payload) => {
    set({ loading: true, error: null });

    try {
      const response = await updateShipmentStageStatus(id, payload);
      const shipment = normalizeShipmentItem(response);
      set({ selectedShipment: shipment ?? null, loading: false, error: null });
      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to update shipment stage status.");
      set({ loading: false, error: message });
      return null;
    }
  },

  updateShipmentServiceStageAction: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await updateShipmentServiceStage(payload);
      const shipment = normalizeShipmentItem(response);
      set({ selectedShipment: shipment ?? null, loading: false, error: null });
      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to update shipment stage.");
      set({ loading: false, error: message });
      return null;
    }
  },

  updateShipmentStageTransportAction: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await updateShipmentStageTransport(payload);
      const shipment = normalizeShipmentItem(response);
      set({ selectedShipment: shipment ?? null, loading: false, error: null });
      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to update stage transport.");
      set({ loading: false, error: message });
      return null;
    }
  },

  uploadShipmentDocumentAction: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await uploadShipmentDocument(payload);
      const shipment = normalizeShipmentItem(response);
      set({ selectedShipment: shipment ?? null, loading: false, error: null });
      return shipment;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to upload shipment document.");
      set({ loading: false, error: message });
      return null;
    }
  },

  deleteShipmentAction: async (id) => {
    set({ loading: true, error: null });

    try {
      await deleteShipment(id);
      set((state) => ({
        shipments: state.shipments.filter((item) => String(item.id) !== String(id)),
        selectedShipment: state.selectedShipment && String(state.selectedShipment.id) === String(id) ? null : state.selectedShipment,
        loading: false,
        error: null,
      }));
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to delete shipment.");
      set({ loading: false, error: message });
      return false;
    }
  },
}));
