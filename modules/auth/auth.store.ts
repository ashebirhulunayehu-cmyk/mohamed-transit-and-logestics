import { create } from "zustand";
import { deleteTokens, storeToken } from "../utils/token/client-token.storage";
import { getUserData, removeUserData, setUserData } from "../utils/token/user.storage";
import {
  AuthState,
  AuthStore,
  ChangePasswordRequest,
  EmailResetPasswordRequest,
  ForgotPasswordRequest,
  ILogin,
  IUser,
  ResetPasswordRequest,
  UpdateUserRequest,
} from "./auth.types";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  resetPassword,
  resetPasswordFromEmail,
  signup,
  updateUser,
} from "./auth.endpoint";

const storedUser = typeof window !== "undefined" ? getUserData() : null;

const defaultInitState: AuthState = {
  user: storedUser as IUser | null,
  error: null,
  loading: false,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return fallback;
};

type LoginPayload = Partial<IUser> & {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  response?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
  userName?: string;
  roleName?: string;
};

const extractRoleName = (value: unknown): string => {
  if (!value) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractRoleName(item);
      if (result) return result;
    }
    return "";
  }

  if (typeof value === "string") return value.trim();

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;

    const directCandidates = [
      source.role,
      source.roleName,
      source.userType,
      source.accountType,
      source.userTypeName,
      source.type,
      source.name,
      source.Role,
      source.RoleName,
      source.userRole,
      source.userRoles,
      source.roles,
    ];

    for (const candidate of directCandidates) {
      const result = extractRoleName(candidate);
      if (result) return result;
    }
  }

  return "";
};

export const hasCustomerAccount = (user: IUser | null | undefined): boolean => {
  const roles = user?.roles ?? user?.userRoles;
  if (!Array.isArray(roles) || roles.length === 0) return true;

  return roles.some((role) => {
    if (typeof role === "string") {
      const normalized = role.toLowerCase().replace(/[^a-z]/g, "");
      return normalized.includes("customer") || normalized.includes("importer");
    }

    if (!role || typeof role !== "object") return false;
    const roleRecord = role as Record<string, unknown>;
    const nestedRole = roleRecord.role;
    const nestedName = nestedRole && typeof nestedRole === "object"
      ? (nestedRole as Record<string, unknown>).name
      : undefined;
    const name = roleRecord.roleName ?? roleRecord.name ?? nestedName;
    if (typeof name !== "string") return false;

    const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
    return normalized.includes("customer") || normalized.includes("importer");
  });
};

const extractUserPayload = (responseData: unknown): LoginPayload | null => {
  if (!responseData || typeof responseData !== "object") return null;

  const candidate = responseData as Record<string, unknown>;
  const knownKeys = ["user", "data", "payload", "response", "result", "resultData"];

  for (const key of knownKeys) {
    const value = candidate[key];
    if (value && typeof value === "object") {
      if (key === "response" && value && typeof value === "object") {
        const responseObj = value as Record<string, unknown>;
        const nested = responseObj.data ?? responseObj.payload ?? responseObj.user;
        if (nested && typeof nested === "object") {
          return nested as LoginPayload;
        }
      }

      if (key === "data" || key === "payload") {
        const maybeUser = value as Record<string, unknown>;
        if (maybeUser.user || maybeUser.role || maybeUser.roles || maybeUser.userRoles || maybeUser.email || maybeUser.username) {
          return maybeUser as LoginPayload;
        }
      }

      const maybeUser = value as Record<string, unknown>;
      if (maybeUser.user || maybeUser.role || maybeUser.roles || maybeUser.userRoles || maybeUser.email || maybeUser.username) {
        return maybeUser as LoginPayload;
      }
    }
  }

  if (candidate.email || candidate.username || candidate.role || candidate.roles || candidate.userRoles) {
    return candidate as LoginPayload;
  }

  return null;
};

const buildUserFromPayload = (payload: LoginPayload | null | undefined, fallbackUsername?: string): IUser => {
  const source = payload ?? {};
  const roles = (source.roles ?? source.userRoles ?? []) as unknown[];
  const firstRole = extractRoleName(roles);

  return {
    id: (source.id as string | number | undefined) ?? "user-1",
    email: (source.email as string | undefined) ?? fallbackUsername ?? "",
    username: (source.username as string | undefined) ?? (source.userName as string | undefined) ?? fallbackUsername ?? "",
    firstName: (source.firstName as string | undefined) ?? "",
    lastName: (source.lastName as string | undefined) ?? "",
    phone: (source.phone as string | undefined) ?? (source.phoneNumber as string | undefined) ?? "",
    roles: roles.length ? roles : [],
    userRoles: Array.isArray(source.userRoles) ? source.userRoles : undefined,
    profilePhoto: (source.profilePhoto as string | undefined) ?? "",
    roleName: firstRole || undefined,
  } as IUser & { roleName?: string };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...defaultInitState,

  login: async (payload: ILogin) => {
    set({ loading: true, error: null });

    try {
      const res = await login(payload);

      const unwrappedResponse = (res && typeof res === "object" && "data" in res ? res.data : res) as Record<string, unknown>;
      const nestedUser = extractUserPayload(unwrappedResponse) ?? extractUserPayload(res) ?? extractUserPayload((res as Record<string, unknown>)?.response);
      const userPayload = nestedUser ?? (unwrappedResponse as LoginPayload);

      const token =
        (userPayload?.token as string | undefined) ||
        (userPayload?.accessToken as string | undefined) ||
        (userPayload?.refreshToken as string | undefined) ||
        (unwrappedResponse?.token as string | undefined) ||
        (unwrappedResponse?.accessToken as string | undefined) ||
        (unwrappedResponse?.refreshToken as string | undefined) ||
        "";

      const refreshToken =
        (userPayload?.refreshToken as string | undefined) ||
        (unwrappedResponse?.refreshToken as string | undefined) ||
        "";

      const user: IUser = buildUserFromPayload(userPayload, payload.username || payload.email || "");

      if (token) {
        await storeToken({ token, refresh_token: refreshToken || undefined });
      }

      setUserData(user);
      set({ user, loading: false, error: null });
      return user;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Login failed. Please try again.");
      set({ loading: false, error: message });
      console.error("Login failed:", message);
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await logout();
    } catch (error) {
      console.error("Logout API call error:", error);
    } finally {
      await deleteTokens();
      removeUserData();
      set({ user: null, error: null, loading: false });
    }
  },

  syncProfile: (payload: Partial<IUser>, options?: { persist?: boolean }) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const user: IUser = { ...currentUser, ...payload, id: currentUser.id };
    if (options?.persist !== false) setUserData(user);
    set({ user });
  },

  updateProfile: async (payload: UpdateUserRequest) => {
    const currentUser = get().user;
    if (!currentUser?.id) {
      throw new Error("Your account ID is unavailable. Sign in again before updating your profile.");
    }

    set({ loading: true, error: null });
    try {
      await updateUser({ ...payload, id: currentUser.id });
      const user: IUser = {
        ...currentUser,
        id: currentUser.id,
        ...(payload.firstName !== undefined ? { firstName: payload.firstName } : {}),
        ...(payload.lastName !== undefined ? { lastName: payload.lastName } : {}),
        ...(payload.email !== undefined ? { email: payload.email } : {}),
        ...(payload.username !== undefined ? { username: payload.username } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.profilePhoto !== undefined ? { profilePhoto: payload.profilePhoto } : {}),
      };
      setUserData(user);
      set({ user, loading: false, error: null });
      return user;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Unable to update your profile.");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  signUp: async (data: FormData | IUser) => {
    set({ loading: true, error: null });
    try {
      await signup(data);
      set({ loading: false, error: null });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Sign up failed.");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  forgotPassword: async (payload: ForgotPasswordRequest) => {
    set({ loading: true, error: null });
    try {
      await forgotPassword(payload);
      set({ loading: false, error: null });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to reset password.");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  updatePassword: async (payload: ChangePasswordRequest) => {
    set({ loading: true, error: null });
    try {
      await changePassword(payload);
      set({ loading: false, error: null });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to update password.");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  resetPassword: async (payload: ResetPasswordRequest) => {
    set({ loading: true, error: null });
    try {
      await resetPassword(payload);
      set({ loading: false, error: null });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to reset password.");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  resetPasswordFromEmail: async (payload: EmailResetPasswordRequest) => {
    set({ loading: true, error: null });
    try {
      await resetPasswordFromEmail(payload);
      set({ loading: false, error: null });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to reset password.");
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));

export default useAuthStore;