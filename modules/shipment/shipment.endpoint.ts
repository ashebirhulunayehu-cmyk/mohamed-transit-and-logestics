import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";
import type { ShipmentDocumentPayload, ShipmentParams, ShipmentPayload } from "./shipment.types";

export const shipmentEndpoints = {
  create: (payload: ShipmentPayload) =>
    service.post(API_ROUTES.shipment.create, payload),

  assign: (payload: ShipmentPayload) =>
    service.put(API_ROUTES.shipment.assign, payload),

  createStageTransport: (payload: ShipmentPayload) =>
    service.post(API_ROUTES.shipment.createStageTransport, payload),

  updateStatus: (id: string | number, payload: ShipmentPayload) =>
    service.put(API_ROUTES.shipment.updateStatus(id), payload),

  updateServiceStage: (payload: ShipmentPayload) =>
    service.put(API_ROUTES.shipment.updateServiceStage, payload),

  updateStageTransport: (payload: ShipmentPayload) =>
    service.put(API_ROUTES.shipment.updateStageTransport, payload),

  uploadDocument: (payload: ShipmentDocumentPayload) =>
    service.post(API_ROUTES.shipment.uploadDocument, payload),

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

export const createStageTransport = (payload: ShipmentPayload) =>
  shipmentEndpoints.createStageTransport(payload);

export const updateShipmentStatus = (
  id: string | number,
  payload: ShipmentPayload,
) => shipmentEndpoints.updateStatus(id, payload);

export const updateShipmentServiceStage = (payload: ShipmentPayload) =>
  shipmentEndpoints.updateServiceStage(payload);

export const updateShipmentStageTransport = (payload: ShipmentPayload) =>
  shipmentEndpoints.updateStageTransport(payload);

export const uploadShipmentDocument = (payload: ShipmentDocumentPayload) =>
  shipmentEndpoints.uploadDocument(payload);

export const getAllShipments = (params?: ShipmentParams) =>
  shipmentEndpoints.getAll(params);

export const getShipmentById = (id: string | number) =>
  shipmentEndpoints.getById(id);

export const getShipmentsByImporter = (importerId: string | number) =>
  shipmentEndpoints.getByImporter(importerId);

export const deleteShipment = (id: string | number) =>
  shipmentEndpoints.delete(id);
