import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

const BACKEND_PATHS = {
  profile: "/Customer/GetProfile",
  documents: "/Document/GetServiceDocuments",
} as const;

type Subview = "profile" | "shipments" | "stages" | "documents";

const isSubview = (value: string): value is Subview =>
  value === "profile" ||
  value === "shipments" ||
  value === "stages" ||
  value === "documents";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeBooleanFlags = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeBooleanFlags);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (
        ["isverified", "isblocked", "requirescustomeraction"].includes(
          key.toLowerCase(),
        ) &&
        (item === 0 || item === 1 || item === "0" || item === "1")
      ) {
        return [key, item === 1 || item === "1"];
      }

      return [key, normalizeBooleanFlags(item)];
    }),
  );
};

const getAccessToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return (
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("transit-portal-accessToken")?.value ??
    cookieStore.get("MohamedTransit-portal-accessToken")?.value ??
    null
  );
};

const proxyRequest = async (
  request: Request,
  subview: string,
) => {
  if (!isSubview(subview)) {
    return NextResponse.json({ error: "Unknown customer dashboard view." }, { status: 404 });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const customerUserId =
    process.env.CUSTOMER_SIDEBAR_USER_ID ??
    (process.env.NODE_ENV === "development" ? "3" : "");
  if (subview !== "profile" && !/^\d+$/.test(customerUserId)) {
    return NextResponse.json(
      { error: "The authenticated customer ID is not configured." },
      { status: 500 },
    );
  }

  const backendPath =
    subview === "shipments"
      ? `/Shipments/GetByImporter/${customerUserId}`
      : subview === "stages"
        ? "/Shipments/GetStages"
        : BACKEND_PATHS[subview];
  if (!backendPath.startsWith("/") || backendPath.startsWith("//")) {
    console.error(`Invalid configured backend path for ${subview}.`);
    return NextResponse.json(
      { error: `The configured backend route for ${subview} is invalid.` },
      { status: 500 },
    );
  }

  const backendBase = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );
  const incomingUrl = new URL(request.url);
  const isDocumentDownload =
    subview === "documents" && incomingUrl.searchParams.has("downloadId");
  const backendUrl = new URL(
    `${backendBase}${isDocumentDownload ? "/Document/DownloadDocument" : backendPath}`,
  );

  incomingUrl.searchParams.forEach((value, key) => {
    if (key !== "downloadId" || !isDocumentDownload) {
      backendUrl.searchParams.set(key, value);
    }
  });
  if (isDocumentDownload) {
    const documentId = incomingUrl.searchParams.get("downloadId");
    if (!documentId || !/^[\w-]+$/.test(documentId)) {
      return NextResponse.json({ error: "A valid document ID is required." }, { status: 400 });
    }
    backendUrl.searchParams.set("documentId", documentId);
  }

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (isDocumentDownload) {
      const headers = new Headers({ "Cache-Control": "no-store" });
      const contentType = response.headers.get("Content-Type");
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentType) headers.set("Content-Type", contentType);
      if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
      return new Response(response.body, { status: response.status, headers });
    }

    if (response.status === 204) {
      return new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const responseText = await response.text();
    let responseBody: unknown = null;
    if (responseText) {
      try {
        responseBody = JSON.parse(responseText) as unknown;
      } catch {
        responseBody = responseText;
      }
    }

    return NextResponse.json(normalizeBooleanFlags(responseBody), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error(`Customer ${subview} proxy request failed:`, error);
    return NextResponse.json(
      { error: `Unable to reach the backend for ${subview}.` },
      { status: 502 },
    );
  }
};

type RouteContext = { params: Promise<{ subview: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { subview } = await params;
  return proxyRequest(request, subview);
}
