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

export const updateCustomerProfile = (payload: CustomerUpdateProfilePayload) =>
  customerEndpoints.updateProfile(payload);

export const getCustomerNotifications = () => customerEndpoints.getNotifications();

export const createCustomerService = (payload: CustomerCreateServicePayload) =>
  customerEndpoints.createService(payload);

export const getMyCustomerServices = () => customerEndpoints.getMyServices();
