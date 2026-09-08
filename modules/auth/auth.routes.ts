import { API_ROUTES } from "@/modules/api";

export const authRoutes = Object.freeze({
  login: (lang: string) => `/${lang}/auth/login`,
  signup: (lang: string) => `/${lang}/auth/signup`,
  createUser: API_ROUTES.auth.user.create,
});