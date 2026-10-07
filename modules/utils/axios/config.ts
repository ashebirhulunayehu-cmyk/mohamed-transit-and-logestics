export const normalizeApiBaseUrl = (input: string | undefined) => {
  const fallback = "http://localhost:5254/api/v1";
  const rawValue = (input || fallback).trim().replace(/\/+$/, "");

  if (/\/api\/v1$/i.test(rawValue)) {
    return rawValue;
  }

  if (/\/api$/i.test(rawValue)) {
    return `${rawValue}/v1`;
  }

  return `${rawValue.replace(/\/api.*$/, "")}/api/v1`;
};

export const config = {
  base_url: {
    base: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  },
  request_timeout: 10000,
  default_headers: "application/json",
};