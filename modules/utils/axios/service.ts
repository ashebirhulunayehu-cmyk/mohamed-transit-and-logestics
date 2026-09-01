import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";


import { config } from "./config";
import { getToken } from "../token";
import { getTokenClient } from "../token/client-token.storage";

interface ApiResponse<T> {
  statusCode?: number;
  error?: boolean;
  errors?: string[] | Record<string, string[]>;
  message?: string;
  response?: {
    data: T | null;
  };
}

const service: AxiosInstance = axios.create({
  baseURL: config.base_url.base,
  timeout: config.request_timeout,
});

// Request Interceptor
service.interceptors.request.use(
  async (config: any) => {
    let token = await getToken();
    if (!token) {
      token = getTokenClient();
    }

    if (token != null) {
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }

    if (
      config.method === "post" &&
      (config.headers as any)["Content-Type"] ===
        "application/x-www-form-urlencoded"
    ) {
      config.data = JSON.stringify(config.data);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const data = response.data;

    // SUCCESS LOGIC: Handle both nested and flat responses
    if (data.statusCode === 200 || response.status === 200) {
      // If backend uses the old { response: { data: ... } } structure
      if (data.response && data.response.data !== undefined) {
        return data.response.data;
      }
      // If backend uses a new "flat" structure, return the whole body
      return data;
    }

    // AUTH LOGIC
    if (data.statusCode === 401 || response.status === 401) {
      const currentLocale =
        typeof window !== "undefined"
          ? window.location.pathname.split("/")[1] || "en"
          : "en";
      if (typeof window !== "undefined") {
        window.location.href = `/${currentLocale}/auth/login`;
      }
      return Promise.reject("Session expired");
    }

    return Promise.reject(data.message || "Unexpected response format");
  },
  (error: AxiosError<any>) => {
    // IMPROVED ERROR LOGIC: No more silent crashes
    let errorMessage = "An unexpected error occurred";

    if (error.response) {
      const data = error.response.data;

      // Log the error so you can see exactly what the backend sent
      console.error("❌ API Error:", error.response.status, data);

      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.errors) {
        errorMessage = Array.isArray(data.errors)
          ? data.errors.join(", ")
          : Object.values(data.errors).flat().join(", ");
      } else {
        // Fallback to standard HTTP status text (e.g., "Not Found")
        errorMessage = `Server Error: ${error.response.status} ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server. Check your network/URL.";
    }

    return Promise.reject(errorMessage);
  }
);

export { service };
