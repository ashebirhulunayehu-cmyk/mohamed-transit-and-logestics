import http from "@/modules/utils/axios";
import { API_ROUTES } from "@/modules/api";
import type {
  CreateUserRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ILogin,
  IUser,
  LoginUserRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  UserListParams,
  UpdateUserRequest,
  UserResponse,
} from "./auth.types";

export const userEndpoints = Object.freeze(API_ROUTES.auth.user);

const passwordEndpoints = Object.freeze(API_ROUTES.auth.password);

export const testEndpoint = (): Promise<unknown> =>
  http.get({ url: API_ROUTES.test });

export const createUser = (payload: FormData | CreateUserRequest | IUser): Promise<UserResponse> =>
  http.post({ url: userEndpoints.create, data: payload });

export const dbTest = (): Promise<string> =>
  http.get<string>({ url: userEndpoints.dbTest });

export const updateUser = (payload: FormData | UpdateUserRequest): Promise<UserResponse> => {
  if (payload instanceof FormData) {
    return http.put({ url: userEndpoints.update, data: payload });
  }

  const form = new URLSearchParams();
  const append = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  };

  append("Id", payload.id);
  append("RecordStatus", payload.recordStatus);
  append("FirstName", payload.firstName);
  append("LastName", payload.lastName);
  append("ProfilePhoto", payload.profilePhoto);
  append("Phone", payload.phone);
  append("Email", payload.email);
  append("UserName", payload.username);
  append("IsSuperAdmin", payload.isSuperAdmin);
  append("OrganizationId", payload.organizationId);
  payload.roles?.forEach((role) => append("Roles", role));

  return http.put({
    url: userEndpoints.update,
    data: form,
    headersType: "application/x-www-form-urlencoded",
  });
};

export const deleteUser = (id: string | number): Promise<unknown> =>
  http.delete({ url: userEndpoints.remove(id) });

export const loginUser = (payload: LoginUserRequest): Promise<UserResponse> =>
  http.post({ url: userEndpoints.login, data: payload });

export const logoutUser = (): Promise<unknown> =>
  http.post({ url: userEndpoints.logout, data: {} });

export const getAllUsers = (params?: UserListParams): Promise<IUser[]> =>
  http.get<IUser[]>({ url: userEndpoints.getAll, params });

export const getUserById = (id: string | number): Promise<UserResponse> =>
  http.get({ url: userEndpoints.getById(id) });

export const refreshToken = (payload: RefreshTokenRequest): Promise<UserResponse> =>
  http.post({
    url: userEndpoints.refreshToken,
    data: {
      refreshToken: payload.refreshToken,
      command: payload.command || "RefreshToken",
    },
  });

export const signup = (payload: FormData | IUser): Promise<unknown> =>
  createUser(payload);

export const login = (payload: ILogin): Promise<unknown> =>
  loginUser({
    email: payload.email,
    userName: payload.username,
    password: payload.password,
  });

export const logout = (): Promise<unknown> => logoutUser();
export const forgotPassword = (payload: ForgotPasswordRequest): Promise<unknown> =>
  http.post({ url: passwordEndpoints.forgot, data: payload });
export const resetPassword = (payload: ResetPasswordRequest): Promise<unknown> =>
  http.post({ url: passwordEndpoints.reset, data: payload });
export const changePassword = (payload: ChangePasswordRequest): Promise<unknown> =>
  http.post({ url: passwordEndpoints.change, data: payload });
