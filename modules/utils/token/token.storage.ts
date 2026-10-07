// src/modules/utils/token/token.storage.ts

const ACCESS_KEY = "MohamedTransit-portal-accessToken";
const REFRESH_KEY = "MohamedTransit-portal-refreshToken";
const ACCESS_COOKIE_KEY = "transit-portal-accessToken";

export interface StoreTokenRequest {
  token: string;
  refresh_token?: string;
}

const setAccessCookie = (token: string) => {
  if (typeof window !== "undefined") {
    document.cookie = `${ACCESS_COOKIE_KEY}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
};

const clearAccessCookie = () => {
  if (typeof window !== "undefined") {
    document.cookie = `${ACCESS_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
};

export const storeToken = async (request: StoreTokenRequest): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_KEY, request.token);
    if (request.refresh_token) {
      localStorage.setItem(REFRESH_KEY, request.refresh_token);
    }
    setAccessCookie(request.token);
    console.log("💾 Token stored in LocalStorage");
  }
};

export const getToken = async (): Promise<string | null> => {
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem(ACCESS_KEY);
    if (localToken) return localToken;

    const cookieValue = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${ACCESS_COOKIE_KEY}=`));

    if (!cookieValue) return null;
    return decodeURIComponent(cookieValue.split("=").slice(1).join("="));
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
    clearAccessCookie();
    console.log("🗑️ Tokens cleared from LocalStorage");
  }
};