import { create } from "zustand";
import { deleteTokens, storeToken } from "../utils/token/client-token.storage";
import { getUserData, removeUserData, setUserData } from "../utils/token/user.storage";
import {
  AuthState,
  AuthStore,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ILogin,
  IUser,
  ResetPasswordRequest,
} from "./auth.types";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  resetPassword,
  signup,
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
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...defaultInitState,

  login: async (payload: ILogin) => {
    set({ loading: true, error: null });

    try {
      const res = await login(payload);
      
      const userPayload = (res.data ?? res) as LoginPayload;

      const token = userPayload.token || userPayload.accessToken || "";
      const refreshToken = userPayload.refreshToken || "";

      const user: IUser = {
        id: userPayload?.id || "user-1",
        email: userPayload?.email || payload.email || payload.username || "",
        username: userPayload?.username || payload.username || payload.email || "",
        firstName: userPayload?.firstName || "",
        lastName: userPayload?.lastName || "",
        phone: userPayload?.phone || "",
        roles: userPayload?.userRoles || userPayload?.roles || [],
        profilePhoto: userPayload?.profilePhoto || "",
      };

      if (token) {
        await storeToken({ token, refresh_token: refreshToken });
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
}));

export default useAuthStore;