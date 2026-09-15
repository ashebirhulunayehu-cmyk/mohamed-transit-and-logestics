// auth.endpoint.ts
import http from "@/modules/utils/axios/index";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ILogin,
  IUser,
  LoginUserRequest,
  ResetPasswordRequest,
} from "./auth.types";

const authEndpoints = Object.freeze({
  signup: "/User/Create",
  login: "/User/Login",
  logout: "/User/LogOut",
  resetPassword: "/Password/ResetPassword",
  forgotPassword: "/Password/ForgotPassword",
  changePassword: "/Password/ChangePassword",
});

export type AuthResponse = Record<string, unknown> & {
  data?: Record<string, unknown>;
};

export const signup = async (user: FormData | IUser | unknown): Promise<AuthResponse> => {
  return http.post({ url: authEndpoints.signup, data: user });
};

export const login = (payload: ILogin): Promise<AuthResponse> => {
  const identifier = payload.username || payload.email || "";
  const normalizedPayload = {
    username: identifier,
    password: payload.password,
  };

  return http.post({ url: authEndpoints.login, data: normalizedPayload });
};

export const loginUser = (payload: LoginUserRequest): Promise<AuthResponse> =>
  login({ username: payload.userName, password: payload.password });

export const logout = (): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.logout });

export const forgotPassword = (payload: ForgotPasswordRequest): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.forgotPassword, data: payload });

export const resetPassword = (payload: ResetPasswordRequest): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.resetPassword, data: payload });

export const changePassword = (payload: ChangePasswordRequest): Promise<AuthResponse> =>
  http.post({ url: authEndpoints.changePassword, data: payload });