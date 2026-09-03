// auth.endpoint.ts
import http from "@/modules/utils/axios/index";
import type { IUser, ILogin, IPasswordPayload } from "./auth.types";

const authEndpoints = Object.freeze({
  signup: "v1/User/Create", // 👈 /api/v1 BaseURL ላይ ስላለ እዚህ /User/Create ብቻ ይበቃል!
  login: "v1/User/Login",
  logout: "v1/User/LogOut",
  resetPassword: "v1/Password/ResetPassword",
  forgotPassword: "v1/Password/ForgotPassword",
  changePassword: "v1/Password/ChangePassword",
});

export const signup = async (user: FormData | IUser | any): Promise<any> => {
  return http.post({ url: authEndpoints.signup, data: user });
};

export const login = (payload: ILogin): Promise<any> => {
  const identifier = payload.username || payload.email || "";
  const normalizedPayload = {
    username: identifier,
    password: payload.password,
  };

  return http.post({ url: authEndpoints.login, data: normalizedPayload });
};