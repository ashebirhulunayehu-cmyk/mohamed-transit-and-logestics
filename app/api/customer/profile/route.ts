import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeBooleanFlags = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeBooleanFlags);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (key.toLowerCase() === "isverified") {
        if (item === 0 || item === "0" || item === false || item === null) {
          return [key, false];
        }
        if (
          item === 1 ||
          item === "1" ||
          item === true ||
          (typeof item === "string" && item.trim().toLowerCase() === "true")
        ) {
          return [key, true];
        }
        if (typeof item === "string" && item.trim().toLowerCase() === "false") {
          return [key, false];
        }
      }
      return [key, normalizeBooleanFlags(item)];
    }),
  );
};

const readBackendError = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 300);
  if (!isRecord(value)) return null;

  for (const key of ["error", "title", "message"]) {
    const detail = value[key];
    if (typeof detail === "string" && detail.trim()) {
      const normalized = detail.trim();
      if (normalized.toLowerCase() !== "operation success") {
        return normalized.slice(0, 300);
      }
    }
  }

  if (Array.isArray(value.errors)) {
    const detail = value.errors.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (detail) return detail.trim().slice(0, 300);
  }

  return null;
};

export async function GET() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("transit-portal-accessToken")?.value ??
    cookieStore.get("MohamedTransit-portal-accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const customerUserId =
    process.env.CUSTOMER_SIDEBAR_USER_ID ??
    (process.env.NODE_ENV === "development" ? "3" : "");
  if (!/^\d+$/.test(customerUserId)) {
    return NextResponse.json(
      { error: "The authenticated customer ID is not configured correctly." },
      { status: 500 },
    );
  }

  const backendUrl = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );

  try {
    const response = await fetch(`${backendUrl}/Customer/GetProfile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const responseText = await response.text();
    if (!responseText) {
      return new Response(null, {
        status: response.status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    let body: unknown;
    try {
      body = JSON.parse(responseText) as unknown;
    } catch {
      return NextResponse.json(
        { error: "The customer profile endpoint returned invalid JSON." },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const backendDetail = readBackendError(body);

      if (
        response.status === 404 &&
        backendDetail?.toLowerCase().includes("customer profile not found")
      ) {
        return NextResponse.json(
          { state: "not-found", profile: null },
          {
            status: 200,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }

      const statusMessage =
        response.status === 401
          ? "The backend rejected the saved session. Sign in again with a customer/importer account."
          : response.status === 403
            ? "The signed-in account is not authorized to view a customer profile."
            : response.status === 404
              ? "No customer profile was found for the signed-in account, or the backend profile route is unavailable."
              : `The backend customer profile request failed with status ${response.status}.`;

      return NextResponse.json(
        {
          error: backendDetail
            ? `${statusMessage} Backend: ${backendDetail}`
            : statusMessage,
          status: response.status,
        },
        {
          status: response.status,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(normalizeBooleanFlags(body), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error("Customer profile proxy request failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the backend for the customer profile." },
      { status: 502 },
    );
  }
}
