import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export interface SeedResponse {
  message: string;
}

export const seedDatabase = (): Promise<SeedResponse> =>
  service.post(API_ROUTES.seeder.seed);