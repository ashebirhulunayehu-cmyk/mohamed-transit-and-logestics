// src/modules/utils/token/token.storage.ts

const ACCESS_KEY = "SkyTech-portal-accessToken";
const REFRESH_KEY = "SkyTech-portal-refreshToken";

export const storeToken = async (request: {
  token: string;
  refresh_token: string;
}) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_KEY, request.token);
    localStorage.setItem(REFRESH_KEY, request.refresh_token);
    console.log("💾 Token stored in LocalStorage");
  }
};

export const getToken = async () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_KEY);
  }
  return null;
};

export const deleteCookies = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};
