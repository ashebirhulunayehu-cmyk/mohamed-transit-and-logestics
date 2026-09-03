"use client";

const tokenKeys = {
  accessToken: "MohamedTransit-portal-accessToken",
  refreshToken: "MohamedTransit-portal-refreshToken",
};

export interface StoreTokenRequest {
  token: string;
  refresh_token?: string;
}

export const storeTokenClient = (request: StoreTokenRequest) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(tokenKeys.accessToken, request.token);
      if (request.refresh_token) {
        localStorage.setItem(tokenKeys.refreshToken, request.refresh_token);
      }
    }
  } catch (error) {
    console.error("Failed to store token:", error);
    throw error;
  }
};

export const getTokenClient = (): string | null => {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(tokenKeys.accessToken);
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