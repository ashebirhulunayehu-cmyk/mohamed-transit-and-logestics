import { create } from "zustand";
import { deleteTokens, storeToken } from "../utils/token/client-token.storage";
import { getUserData, removeUserData, setUserData } from "../utils/token/user.storage";
import { AuthState, AuthStore, IPasswordPayload, ILogin, IUser } from "./auth.types";
import { forgotPassword, changePassword, resetPassword, signup, login as loginRequest } from "./auth.endpoint";

const storedUser = typeof window !== "undefined" ? getUserData() : null;

const defaultInitState: AuthState = {
  user: storedUser as IUser | null,
  error: null,
  loading: false,
};

const useAuthStore = create<AuthStore>((set) => ({
  ...defaultInitState,
  login: async (payload: ILogin) => {
    set({ loading: true, error: null });

    try {
      const res: any = await loginRequest(payload);
      const responseData = res?.data || res;
      const userPayload = responseData?.payload || responseData;
      const token = userPayload?.accessToken || responseData?.accessToken || "";
      const refreshToken = userPayload?.refreshToken || responseData?.refreshToken || "";

      const user: IUser = {
        id: userPayload?.id || responseData?.id || "user-1",
        email: userPayload?.email || payload.email || payload.username || "",
        username: userPayload?.username || payload.username || payload.email || "",
        firstName: userPayload?.firstName || "",
        lastName: userPayload?.lastName || "",
        phone: userPayload?.phone || userPayload?.phoneNumber || "",
        roles: userPayload?.roles || responseData?.roles || [],
        profilePhoto: userPayload?.profilePhoto || responseData?.profilePhoto || "",
      };

      if (token) {
        await storeToken({ token, refresh_token: refreshToken });
      }

      setUserData(user);
      set({ user, loading: false, error: null });
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message || "Login failed. Please try again.";
      set({ loading: false, error: message });
      console.error("Login failed:", message);
      throw new Error(message);
    }
  },
  logout: async () => {
    set({ loading: true });
    await deleteTokens();
    removeUserData();
    set({ user: null, error: null, loading: false });
  },
  signUp: async (data: IUser) => {
    set({ loading: true, error: null });
    try {
      await signup(data);
      set({ loading: false, error: null });
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message || "Sign up failed.";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
  forgotPassword: async (payload: IPasswordPayload) => {
    set({ loading: true, error: null });
    try {
      const res = await forgotPassword(payload);
      set({ loading: false, error: null });
      return res;
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message || "Failed to reset password.";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
  updatePassword: async (payload: IPasswordPayload) => {
    set({ loading: true, error: null });
    try {
      const res = await changePassword(payload);
      set({ loading: false, error: null });
      return res;
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message || "Failed to update password.";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
  resetPassword: async (payload: IPasswordPayload) => {
    set({ loading: true, error: null });
    try {
      const res = await resetPassword(payload);
      set({ loading: false, error: null });
      return res;
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message || "Failed to reset password.";
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));

useAuthStore.subscribe((state) => {
  console.log("👀 AUTH STORE CHANGED:", state.user);
});

export default useAuthStore;

