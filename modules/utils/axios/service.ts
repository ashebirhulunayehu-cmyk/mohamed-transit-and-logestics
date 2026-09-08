import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { config } from "./config";
import { getToken } from "../token";
import { getTokenClient } from "../token/client-token.storage";

/* =========================================================
   API Response Type
========================================================= */

interface ApiResponse<T = unknown> {
  statusCode?: number;
  error?: boolean;
  errors?: string[] | Record<string, string[]>;
  message?: string;
  payload?: T;

  response?: {
    data: T | null;
  };
}

/* =========================================================
   Axios Instance
========================================================= */

const service: AxiosInstance = axios.create({
  baseURL: config.base_url.base,
  timeout: config.request_timeout,

  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

/* =========================================================
   Request Interceptor
========================================================= */

service.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    let token = await getToken();

    if (!token) {
      token = getTokenClient();
    }

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    if (requestConfig.data instanceof FormData) {
      delete requestConfig.headers["Content-Type"];
    }

    if (
      requestConfig.method?.toLowerCase() === "post" &&
      requestConfig.headers["Content-Type"] === "application/x-www-form-urlencoded" &&
      typeof requestConfig.data === "object" &&
      requestConfig.data !== null &&
      !(requestConfig.data instanceof FormData)
    ) {
      const params = new URLSearchParams();

      Object.keys(requestConfig.data).forEach((key) => {
        params.append(
          key,
          String((requestConfig.data as Record<string, unknown>)[key] ?? "")
        );
      });

      requestConfig.data = params;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "➡️ API Request:",
        requestConfig.method?.toUpperCase(),
        `${requestConfig.baseURL}${requestConfig.url}`
      );
    }

    return requestConfig;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/* =========================================================
   Response Interceptor
========================================================= */

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const data = response.data;

    if (process.env.NODE_ENV === "development") {
      console.log(
        "⬅️ API Response:",
        response.status,
        response.config.url,
        response.data
      );
    }

    if (response.status === 200 || response.status === 201 || data?.statusCode === 200) {
      if (data?.response?.data !== undefined) {
        return data.response.data as unknown as AxiosResponse<ApiResponse>;
      }

      if (data?.payload !== undefined) {
        return data.payload as unknown as AxiosResponse<ApiResponse>;
      }

      return data as unknown as AxiosResponse<ApiResponse>;
    }

    if (response.status === 401 || data?.statusCode === 401) {
      redirectToLogin();
      return Promise.reject("Unauthorized access");
    }

    return Promise.reject(data?.message || "Unexpected response format");
  },
  (error: AxiosError<ApiResponse>) => {
    let errorMessage = "An unexpected error occurred.";

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error("❌ API Error Path:", error.config?.url);
      console.error("❌ API Error Status:", status, data);

      if (status === 401) {
        redirectToLogin();
        return Promise.reject("Unauthorized access");
      }

      if (status === 404) {
        errorMessage = `Server Error: 404 Not Found (${error.config?.baseURL || ""}${error.config?.url || ""})`;
      } else if (data?.errors) {
        if (typeof data.errors === "object" && !Array.isArray(data.errors)) {
          const validationMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`)
            .join(" | ");

          console.error("📋 Detailed Validation Errors:", data.errors);
          errorMessage = validationMessages;
        } else if (Array.isArray(data.errors)) {
          errorMessage = data.errors.join(", ");
        }
      } else if (data?.message) {
        errorMessage = data.message;
      } else {
        const errorData = data as { title?: string } | undefined;

        if (errorData?.title) {
          errorMessage = errorData.title;
        } else {
          errorMessage = `Server Error: ${status} ${error.response.statusText}`;
        }
      }
    } else if (error.request) {
      errorMessage = "No response from server. Check your network connection and API URL.";
    }

    return Promise.reject(errorMessage);
  }
);

/* =========================================================
   Redirect Helper
========================================================= */

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0] || "en";
  const isLoginPage = segments.includes("login");

  if (isLoginPage) {
    return;
  }

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  } catch {
    // Ignore localStorage errors
  }

  // This redirect runs from a browser-only utility outside a React component,
  // so the framework rule is intentionally suppressed here.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/${currentLocale}/auth/login`;
}

/* =========================================================
   Export
========================================================= */

export { service };
