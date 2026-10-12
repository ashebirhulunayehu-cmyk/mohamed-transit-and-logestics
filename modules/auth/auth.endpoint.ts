// auth.endpoint.ts
import http from "@/modules/utils/axios/index";
import { API_ROUTES } from "@/modules/api";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";
import type {
  ChangePasswordRequest,
  EmailResetPasswordRequest,
  ForgotPasswordRequest,
  ILogin,
  IUser,
  LoginResponse,
  LoginUserRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
} from "./auth.types";

const authApiBaseUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5254/api/v1"
);

const authEndpoints = Object.freeze({
  signup: "/User/Create",
  login: "/User/Login",
  logout: "/User/LogOut",
  resetPassword: "/Password/ResetPassword",
  resetPasswordFromEmail: `${authApiBaseUrl}/auth/reset-password`,
  forgotPassword: "/Password/ForgotPassword",
  changePassword: "/Password/ChangePassword",
});

export type AuthResponse = Record<string, unknown> & {
  data?: Record<string, unknown>;
};

export const signup = async (user: FormData | IUser | unknown): Promise<AuthResponse> => {
  return http.post({ url: authEndpoints.signup, data: user });
};

export const login = (payload: ILogin): Promise<LoginResponse> => {
  const identifier = payload.username || payload.email || "";
  const normalizedPayload = {
    ...(identifier.includes("@") ? { email: identifier } : { userName: identifier }),
    password: payload.password,
  };

  return fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(normalizedPayload),
    cache: "no-store",
  }).then(async (response) => {
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
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
      throw new Error(`Login failed (${response.status}).`);
    }

    return body as LoginResponse;
  });
};

export const loginUser = (payload: LoginUserRequest): Promise<LoginResponse> =>
  login({ username: payload.userName, password: payload.password });

export const logout = (): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.logout, data: {} });

export const updateUser = (payload: UpdateUserRequest): Promise<unknown> =>
  http.put({ url: API_ROUTES.auth.user.update, data: payload });

export const forgotPassword = (payload: ForgotPasswordRequest): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.forgotPassword, data: payload });

export const resetPassword = (payload: ResetPasswordRequest): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.resetPassword, data: payload });

export const resetPasswordFromEmail = (
  payload: EmailResetPasswordRequest
): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.resetPasswordFromEmail, data: payload });

export const changePassword = (payload: ChangePasswordRequest): Promise<AuthResponse> =>
  http.post({
    url: authEndpoints.changePassword,
    data: {
      Password: payload.currentPassword,
      NewPassword: payload.newPassword,
    },
  });