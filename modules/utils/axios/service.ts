import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { config } from "./config";
import { getToken } from "../token";
import { getTokenClient } from "../token/client-token.storage";

interface ApiResponse<T = any> {
  statusCode?: number;
  error?: boolean;
  errors?: string[] | Record<string, string[]>;
  message?: string;
  payload?: T;
  response?: {
    data: T | null;
  };
}

const service: AxiosInstance = axios.create({
  baseURL: config.base_url.base,
  timeout: config.request_timeout,
  // 💡 የካሽ (Caching) ችግር እንዳይፈጠር እና 304 ኤርረርን ለመከላከል ይህንን ሄደር ጨምረናል
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

// Request Interceptor
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = await getToken();
    if (!token) {
      token = getTokenClient();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData በሚሆንበት ጊዜ Content-Type-ን Axios boundary ራሱ እንዲያዘጋጅ መተው
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // Form-urlencoded Handling
    if (
      config.method?.toLowerCase() === "post" &&
      config.headers["Content-Type"] === "application/x-www-form-urlencoded" &&
      typeof config.data === "object" &&
      !(config.data instanceof FormData)
    ) {
      const params = new URLSearchParams();
      Object.keys(config.data).forEach((key) => {
        params.append(key, (config.data as any)[key]);
      });
      config.data = params;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const data = response.data;

    if (response.status === 200 || response.status === 201 || data?.statusCode === 200) {
      if (data?.response?.data !== undefined) {
        return data.response.data;
      }
      if (data?.payload !== undefined) {
        return data.payload;
      }
      return data;
    }

    if (response.status === 401 || data?.statusCode === 401) {
      if (typeof window !== "undefined") {
        const currentLocale = window.location.pathname.split("/")[1] || "en";
        window.location.href = `/${currentLocale}/auth/login`;
      }
      return Promise.reject("Session expired");
    }

    return Promise.reject(data?.message || "Unexpected response format");
  },
  (error: AxiosError<any>) => {
    let errorMessage = "An unexpected error occurred";

    if (error.response) {
      const data = error.response.data;
      console.error("❌ API Error Path:", error.config?.url);
      console.error("❌ API Error Status:", error.response.status, data);

      if (error.response.status === 404) {
        errorMessage = `Server Error: 404 Not Found (${error.config?.baseURL || ''}${error.config?.url || ''})`;
      } else if (error.response.status === 401) {
        if (typeof window !== "undefined") {
          const currentLocale = window.location.pathname.split("/")[1] || "en";
          window.location.href = `/${currentLocale}/auth/login`;
        }
        return Promise.reject("Unauthorized access");
      } else if (data?.errors) {
        // ASP.NET Core Validation ProblemDetails (Validation Error) አያያዝ
        if (typeof data.errors === "object" && !Array.isArray(data.errors)) {
          const validationMessages = Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
            .join(" | ");
          console.error("📋 Detailed Validation Errors:", data.errors);
          errorMessage = validationMessages;
        } else if (Array.isArray(data.errors)) {
          errorMessage = data.errors.join(", ");
        }
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.title) {
        errorMessage = data.title;
      } else {
        errorMessage = `Server Error: ${error.response.status} ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server. Check your network/URL.";
    }

    return Promise.reject(errorMessage);
  }
);

export { service };