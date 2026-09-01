import { config } from "./config";
import { service } from "./service";
import type { AxiosRequestConfig } from "axios";

type RequestOptions = {
  url: string;
  method?: AxiosRequestConfig["method"];
  params?: AxiosRequestConfig["params"];
  data?: unknown;
  headersType?: string;
  responseType?: AxiosRequestConfig["responseType"];
};

const { default_headers } = config;

const http = (option: RequestOptions) => {
  const { url, method, params, data, headersType, responseType } = option;
  // If sending FormData, do not set Content-Type so axios/browser can add the boundary
  const headers =
    data instanceof FormData
      ? {}
      : { "Content-Type": headersType || default_headers };

  return service({
    url: url,
    method,
    params,
    data,
    responseType: responseType,
    headers,
  });
};

const httpClient = {
  get: <T = unknown>(option: RequestOptions) => {
    return http({ method: "get", ...option }) as unknown as T;
  },
  post: <T = unknown>(option: string | RequestOptions, data?: unknown) => {
    const request = typeof option === "string"
      ? { url: option, data }
      : option;

    return http({ method: "post", ...request }) as unknown as T;
  },
  delete: <T = unknown>(option: RequestOptions) => {
    return http({ method: "delete", ...option }) as unknown as T;
  },
  put: <T = unknown>(option: RequestOptions) => {
    return http({ method: "put", ...option }) as unknown as T;
  },
};

export default httpClient;
