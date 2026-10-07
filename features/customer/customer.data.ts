import { mockServices } from "../services/service.data";
import { CustomerService } from "./customer.types";

export const customerServices: CustomerService[] = mockServices.map((service) => ({
  ...service,
  riskChannel: service.riskChannel as CustomerService["riskChannel"],
  channel: service.riskChannel as CustomerService["riskChannel"],
  mode: service.mode as CustomerService["mode"],
  status: service.status as CustomerService["status"],
  caseExecutor: service.caseExecutor ?? "N/A",
  executor: service.caseExecutor ?? "N/A",
}));
