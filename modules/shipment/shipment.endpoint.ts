import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";
import type {
  ShipmentDocumentPayload,
  ShipmentParams,
  ShipmentPayload,
  ShipmentServiceStageUpdatePayload,
  StageTransportUpdatePayload,
} from "./shipment.types";

const buildShipmentPayload = (id: string | number | undefined, payload: ShipmentPayload | FormData | undefined) => {
  if (payload instanceof FormData) {
    if (id !== undefined && id !== null && !payload.has("id")) {
      payload.append("id", String(id));
    }
    return payload;
  }

  const basePayload = typeof payload === "object" && payload !== null ? { ...payload } : {};

  if (id !== undefined && id !== null && String(id).trim() !== "" && !("id" in basePayload) && !("shipmentId" in basePayload)) {
    return { ...basePayload, id };
  }

  return basePayload;
};

export const shipmentEndpoints = {
  create: (payload: ShipmentPayload) =>
    service.post(API_ROUTES.shipment.create, payload),

  assign: (payload: ShipmentPayload) =>
    service.put(API_ROUTES.shipment.assign, payload),

  update: (payload: ShipmentPayload) =>
    service.put(API_ROUTES.shipment.update, payload),

  createStageTransport: (payload: ShipmentPayload) =>
    service.post(API_ROUTES.shipment.createStageTransport, payload),

  updateStatus: (id: string | number | undefined, payload?: ShipmentPayload | FormData) =>
    service.put(API_ROUTES.shipment.updateStatus(id), buildShipmentPayload(id, payload)),

  updateServiceStage: (payload: ShipmentServiceStageUpdatePayload) =>
    service.put(API_ROUTES.shipment.updateServiceStage, payload),

  updateStageStatus: (id: string | number | undefined, payload?: ShipmentPayload | FormData) =>
    service.put(API_ROUTES.shipment.updateStageStatus(id), buildShipmentPayload(id, payload)),

  updateStageTransport: (payload: StageTransportUpdatePayload) => {
    const formData = new FormData();
    formData.append("Id", payload.id);
    formData.append("ServiceStageId", payload.serviceStageId);
    formData.append("FullName", payload.fullName);
    formData.append("LicenceDocument", payload.licenceDocument);
    formData.append("PhoneNumber", payload.phoneNumber);
    formData.append("PlateNumber", payload.plateNumber);
    formData.append("ProductAmount", payload.productAmount);
    if (payload.licenceDocumentImage) {
      formData.append("LicenceDocumentImage", payload.licenceDocumentImage);
    }
    return service.put(API_ROUTES.shipment.updateStageTransport, formData);
  },

  uploadDocument: (payload: ShipmentDocumentPayload) =>
    service.post(API_ROUTES.shipment.uploadDocument, payload),

  getStages: (params?: ShipmentParams) =>
    service.get(API_ROUTES.shipment.getStages, { params }),

  getAll: (params?: ShipmentParams) =>
    service.get(API_ROUTES.shipment.getAll, { params }),

  getById: (id: string | number) =>
    service.get(API_ROUTES.shipment.getById(id)),

  getByImporter: (importerId: string | number) =>
    service.get(API_ROUTES.shipment.getByImporter(importerId)),

  delete: (id: string | number) =>
    service.delete(API_ROUTES.shipment.delete(id)),
};

export const createShipment = (payload: ShipmentPayload) =>
  shipmentEndpoints.create(payload);

export const assignShipment = (payload: ShipmentPayload) =>
  shipmentEndpoints.assign(payload);

export const updateShipment = (payload: ShipmentPayload) =>
  shipmentEndpoints.update(payload);

export const createStageTransport = (payload: ShipmentPayload) =>
  shipmentEndpoints.createStageTransport(payload);

export const updateShipmentStatus = (
  id: string | number | undefined,
  payload?: ShipmentPayload | FormData,
) => shipmentEndpoints.updateStatus(id, payload);

export const updateShipmentStageStatus = (
  id: string | number | undefined,
  payload?: ShipmentPayload | FormData,
) => shipmentEndpoints.updateStageStatus(id, payload);

export const updateShipmentServiceStage = (payload: ShipmentServiceStageUpdatePayload) =>
  shipmentEndpoints.updateServiceStage(payload);

export const updateShipmentStageTransport = (payload: StageTransportUpdatePayload) =>
  shipmentEndpoints.updateStageTransport(payload);

export const uploadShipmentDocument = (payload: ShipmentDocumentPayload) =>
  shipmentEndpoints.uploadDocument(payload);

export const getShipmentStages = (params?: ShipmentParams) =>
  shipmentEndpoints.getStages(params);

export const getAllShipments = (params?: ShipmentParams) =>
  shipmentEndpoints.getAll(params);

export const getShipmentById = (id: string | number) =>
  shipmentEndpoints.getById(id);

export const getShipmentsByImporter = (importerId: string | number) =>
  shipmentEndpoints.getByImporter(importerId);

export const deleteShipment = (id: string | number) =>
  shipmentEndpoints.delete(id);
