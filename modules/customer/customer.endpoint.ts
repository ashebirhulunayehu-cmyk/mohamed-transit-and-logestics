import { service } from "@/modules/utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import type {
  CustomerCreateServicePayload,
  CustomerRegisterPayload,
  CustomerUpdateProfilePayload,
} from "./customer.type";

export const customerEndpoints = {
  registerCustomer: (payload: CustomerRegisterPayload) =>
    service.post(API_ROUTES.customer.register, payload),
  getProfile: () => service.get(API_ROUTES.customer.getProfile),
  getAccountProfile: async (): Promise<unknown> => {
    const response = await fetch("/api/customer/account-profile", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const text = await response.text();
    let body: unknown = null;

    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        if (response.ok) {
          throw new Error("The Account/GetProfile endpoint returned invalid JSON.");
        }
        body = text;
      }
    }

    if (!response.ok) {
      if (typeof body === "string" && body.trim()) throw new Error(body);
      if (typeof body === "object" && body !== null && !Array.isArray(body)) {
        const record = body as Record<string, unknown>;
        const message = [record.message, record.detail, record.error, record.title].find(
          (value): value is string => typeof value === "string" && Boolean(value.trim()),
        );
        if (message) throw new Error(message);
      }
      throw new Error(`Account profile request failed (${response.status}).`);
    }

    return body;
  },
  updateProfile: (payload: CustomerUpdateProfilePayload) =>
    service.put(API_ROUTES.customer.updateProfile, payload),
  getNotifications: () => service.get(API_ROUTES.customer.getNotifications),
  createService: (payload: CustomerCreateServicePayload) =>
    service.post(API_ROUTES.customer.createService, payload),
  getMyServices: () => service.get(API_ROUTES.customer.getMyServices),
};

export const registerCustomer = (payload: CustomerRegisterPayload) =>
  customerEndpoints.registerCustomer(payload);

export const getCustomerProfile = () => customerEndpoints.getProfile();

export const getCustomerAccountProfile = () =>
  customerEndpoints.getAccountProfile();

export const updateCustomerProfile = (payload: CustomerUpdateProfilePayload) =>
  customerEndpoints.updateProfile(payload);

export const getCustomerNotifications = () => customerEndpoints.getNotifications();

export const createCustomerService = (payload: CustomerCreateServicePayload) =>
  customerEndpoints.createService(payload);

export const getMyCustomerServices = () => customerEndpoints.getMyServices();
