import { config } from "./config";
import { service } from "./service";
import type { AxiosRequestConfig } from "axios";

export type RequestOptions = {
  url: string;
  method?: AxiosRequestConfig["method"];
  params?: AxiosRequestConfig["params"];
  data?: unknown;
  headersType?: string;
  headers?: Record<string, string>; // ተጨማሪ headers ለመቀበል
  responseType?: AxiosRequestConfig["responseType"];
};

const { default_headers } = config;

const http = <T = unknown>(option: RequestOptions): Promise<T> => {
  const { url, method, params, data, headersType, headers: customHeaders, responseType } = option;

  // FormData ከሆነ Browser-ኡ ራሱ boundary እንዲያዘጋጅ Content-Type አይላክም
  const contentTypeHeader =
    data instanceof FormData
      ? {}
      : { "Content-Type": headersType || default_headers };

  const finalHeaders = {
    ...contentTypeHeader,
    ...customHeaders,
  };

  return service({
    url,
    method,
    params,
    data,
    responseType,
    headers: finalHeaders,
  }) as Promise<T>;
};

const httpClient = {
  get: <T = unknown>(option: RequestOptions): Promise<T> => {
    return http<T>({ method: "get", ...option });
  },

  post: <T = unknown>(option: string | RequestOptions, data?: unknown): Promise<T> => {
    const request =
      typeof option === "string"
        ? { url: option, data }
        : option;

    return http<T>({ method: "post", ...request });
  },

  put: <T = unknown>(option: string | RequestOptions, data?: unknown): Promise<T> => {
    const request =
      typeof option === "string"
        ? { url: option, data }
        : option;

    return http<T>({ method: "put", ...request });
  },

  delete: <T = unknown>(option: RequestOptions): Promise<T> => {
    return http<T>({ method: "delete", ...option });
  },
};

export default httpClient;