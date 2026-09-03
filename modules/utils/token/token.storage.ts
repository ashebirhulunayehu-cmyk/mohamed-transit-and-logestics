// src/modules/utils/token/token.storage.ts

const ACCESS_KEY = "MohamedTransit-portal-accessToken";
const REFRESH_KEY = "MohamedTransit-portal-refreshToken";

export interface StoreTokenRequest {
  token: string;
  refresh_token?: string;
}

export const storeToken = async (request: StoreTokenRequest): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_KEY, request.token);
    if (request.refresh_token) {
      localStorage.setItem(REFRESH_KEY, request.refresh_token);
    }
    console.log("💾 Token stored in LocalStorage");
  }
};

export const getToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_KEY);
  }
  return null;
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_KEY);
  }
  return null;
};

export const deleteTokens = async (): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    console.log("🗑️ Tokens cleared from LocalStorage");
  }
};