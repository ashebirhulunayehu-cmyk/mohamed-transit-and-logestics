import http from "@/modules/utils/axios/index";
import type { IUser, ILogin, IPasswordPayload } from "./auth.types";

const authEndpoints = Object.freeze({
  signup: "/User/Create",
  login: "/User/Login",
  resetPassword: "/Password/ResetPassword",
  forgotPassword: "/Password/ForgotPassword",
  changePassword: "/Password/ChangePassword",
});

export const login = (payload: ILogin): Promise<any> => {
  const identifier = payload.username || payload.email || "";

  const normalizedPayload = {
    username: identifier,
    email: identifier,
    userName: identifier,
    emailAddress: identifier,
    UserName: identifier,
    Email: identifier,
    password: payload.password,
  };

  return http.post({ url: authEndpoints.login, data: normalizedPayload });
};

export const signup = async (user: IUser): Promise<any> => {
  return http.post({ url: authEndpoints.signup, data: user });
};

export const forgotPassword = async (payload: IPasswordPayload): Promise<any> => {
  return http.post({ url: authEndpoints.forgotPassword, data: payload });
};

export const changePassword = async (payload: IPasswordPayload): Promise<any> => {
  return http.post({ url: authEndpoints.changePassword, data: payload });
};

export const resetPassword = async (payload: IPasswordPayload): Promise<any> => {
  const request = {
    username: payload.username || payload.email || "",
    password: payload.newPassword,
  };

  return http.post({ url: authEndpoints.resetPassword, data: request });
};
