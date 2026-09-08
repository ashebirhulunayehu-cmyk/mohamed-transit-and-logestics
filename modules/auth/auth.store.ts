import { create } from "zustand";

import {
  deleteTokens,
  storeToken,
} from "../utils/token/client-token.storage";

import {
  getUserData,
  removeUserData,
  setUserData,
} from "../utils/token/user.storage";

import type {
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

/* =========================================================
   Helpers
========================================================= */

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const isRecord = (
  value: unknown
): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getString = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

/* =========================================================
   Initial State
========================================================= */

const initialState: AuthState = {
  user:
    typeof window !== "undefined"
      ? getUserData()
      : null,

  loading: false,
  error: null,
};

/* =========================================================
   Auth Store
========================================================= */

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  /* =======================================================
     LOGIN
  ======================================================= */

  login: async (payload: ILogin) => {
    set({
      loading: true,
      error: null,
    });

    try {
      /*
       * Login request
       *
       * Frontend:
       * username/email + password
       *
       * Backend:
       * POST /api/v1/User/Login
       */
      const response = await login(payload);

      console.log("LOGIN RESPONSE:", response);

      /* ---------------------------------------------------
         Normalize backend response
      --------------------------------------------------- */

      const responseRecord = isRecord(response)
        ? response
        : {};

      /*
       * Some API wrappers return:
       *
       * {
       *   data: {...}
       * }
       *
       * Others may directly return:
       *
       * {
       *   accessToken: "...",
       *   ...
       * }
       */

      const rawData =
        isRecord(responseRecord.data)
          ? responseRecord.data
          : response;

      const dataRecord = isRecord(rawData)
        ? rawData
        : {};

      /* ---------------------------------------------------
         Find actual user payload
      --------------------------------------------------- */

      const nestedResponse = isRecord(
        dataRecord.response
      )
        ? dataRecord.response
        : {};

      const payloadData = isRecord(
        dataRecord.payload
      )
        ? dataRecord.payload
        : {};

      const nestedData = isRecord(
        nestedResponse.data
      )
        ? nestedResponse.data
        : {};

      const userData = {
        ...nestedData,
        ...payloadData,
        ...dataRecord,
      };

      /* ---------------------------------------------------
         Access Token
      --------------------------------------------------- */

      const accessToken =
        getString(userData.accessToken) ||
        getString(userData.token);

      /* ---------------------------------------------------
         Refresh Token
      --------------------------------------------------- */

      const refreshToken =
        getString(userData.refreshToken);

      /*
       * IMPORTANT:
       *
       * Do NOT use refreshToken as access token.
       */

      if (!accessToken) {
        throw new Error(
          "Login succeeded but access token was not returned by the server."
        );
      }

      /* ---------------------------------------------------
         User
      --------------------------------------------------- */

      const user: IUser = {
        id:
          typeof userData.id === "string" ||
          typeof userData.id === "number"
            ? userData.id
            : "user-1",

        username:
          getString(userData.username) ||
          getString(userData.userName) ||
          payload.username ||
          payload.email ||
          "",

        email:
          getString(userData.email) ||
          payload.email ||
          payload.username ||
          "",

        firstName:
          getString(userData.firstName),

        lastName:
          getString(userData.lastName),

        phone:
          getString(userData.phone),

        userRoles:
          Array.isArray(userData.userRoles)
            ? userData.userRoles
            : [],

        roles:
          Array.isArray(userData.roles)
            ? (userData.roles as IUser["roles"])
            : [],

        profilePhoto:
          getString(userData.profilePhoto),
      };

      console.log("LOGIN USER:", user);

      console.log(
        "LOGIN ACCESS TOKEN:",
        accessToken
      );

      console.log(
        "LOGIN REFRESH TOKEN:",
        refreshToken
      );

      /* ---------------------------------------------------
         Save tokens
      --------------------------------------------------- */

      await storeToken({
        token: accessToken,
        refresh_token: refreshToken,
      });

      document.cookie = `transit-portal-accessToken=${encodeURIComponent(accessToken)}; path=/; max-age=7200; SameSite=Lax`;

      /* ---------------------------------------------------
         Save user
      --------------------------------------------------- */

      setUserData(user);

      /* ---------------------------------------------------
         Update Zustand
      --------------------------------------------------- */

      set({
        user,
        loading: false,
        error: null,
      });

      return user;

    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Login failed. Please try again."
      );

      console.error("LOGIN ERROR:", error);

      set({
        loading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     LOGOUT
  ======================================================= */

  logout: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      await logout();
    } finally {
      await deleteTokens();

      document.cookie = "transit-portal-accessToken=; path=/; max-age=0; SameSite=Lax";

      removeUserData();

      set({
        user: null,
        loading: false,
        error: null,
      });
    }
  },

  /* =======================================================
     SIGN UP
  ======================================================= */

  signUp: async (payload) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await signup(payload);

      set({
        loading: false,
        error: null,
      });

    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Sign up failed."
      );

      set({
        loading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  forgotPassword: async (
    payload: ForgotPasswordRequest
  ) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await forgotPassword(payload);

      set({
        loading: false,
        error: null,
      });

    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Password recovery failed."
      );

      set({
        loading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  updatePassword: async (
    payload: ChangePasswordRequest
  ) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await changePassword(payload);

      set({
        loading: false,
        error: null,
      });

    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Password update failed."
      );

      set({
        loading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  resetPassword: async (
    payload: ResetPasswordRequest
  ) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await resetPassword(payload);

      set({
        loading: false,
        error: null,
      });

    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Password reset failed."
      );

      set({
        loading: false,
        error: message,
      });

      throw new Error(message);
    }
  },
}));

export default useAuthStore;

