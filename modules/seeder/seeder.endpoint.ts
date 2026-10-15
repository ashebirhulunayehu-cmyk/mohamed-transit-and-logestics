import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export interface SeedResponse {
  message: string;
}

export interface SeededCredential {
  role: string;
  username: string;
  password: string;
  email: string;
}

export interface SeededCredentialsResponse {
  users: SeededCredential[];
}

export const seedDatabase = (): Promise<SeedResponse> =>
  service.post(API_ROUTES.seeder.seed);

export const getSeededCredentials = (): Promise<SeededCredentialsResponse> =>
  service.get(API_ROUTES.seeder.credentials);