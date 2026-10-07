"use client";

const tokenKeys = {
  accessToken: "MohamedTransit-portal-accessToken",
  refreshToken: "MohamedTransit-portal-refreshToken",
  cookieAccessToken: "accessToken",
  legacyCookieAccessToken: "transit-portal-accessToken",
};

export interface StoreTokenRequest {
  token: string;
  refresh_token?: string;
}

const setAccessTokenCookie = (token: string) => {
  if (typeof window === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${tokenKeys.cookieAccessToken}=${encodeURIComponent(token)}; path=/; max-age=7200; SameSite=Strict${secure}`;
};

const clearAccessTokenCookie = () => {
  if (typeof window === "undefined") return;

  document.cookie = `${tokenKeys.cookieAccessToken}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${tokenKeys.legacyCookieAccessToken}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export const storeTokenClient = (request: StoreTokenRequest) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(tokenKeys.accessToken, request.token);
      if (request.refresh_token) {
        localStorage.setItem(tokenKeys.refreshToken, request.refresh_token);
      }
      setAccessTokenCookie(request.token);
    }
  } catch (error) {
    console.error("Failed to store token:", error);
    throw error;
  }
};

export const getTokenClient = (): string | null => {
  try {
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem(tokenKeys.accessToken);
      if (localToken) return localToken;

      const cookieValue = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) =>
          item.startsWith(`${tokenKeys.cookieAccessToken}=`) ||
          item.startsWith(`${tokenKeys.legacyCookieAccessToken}=`)
        );

      if (!cookieValue) return null;
      return decodeURIComponent(cookieValue.split("=").slice(1).join("="));
    }
    return null;
  } catch (error) {
    console.error("Failed to get token:", error);
    return null;
  }
};

export const deleteTokensClient = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(tokenKeys.accessToken);
      localStorage.removeItem(tokenKeys.refreshToken);
      clearAccessTokenCookie();
    }
  } catch (error) {
    console.error("Failed to delete tokens:", error);
  }
};

export const getRefreshTokenClient = (): string | null => {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(tokenKeys.refreshToken);
    }
    return null;
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
};

export const storeToken = async (request: StoreTokenRequest) => storeTokenClient(request);
export const deleteTokens = async () => deleteTokensClient();