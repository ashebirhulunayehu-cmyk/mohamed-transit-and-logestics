import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";
import {
  CustomerContextError,
  getCustomerAccessToken,
  getCustomerRequestContext,
} from "../_shared";

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

const proxyRequest = async (
  request: Request,
  subview: string,
) => {
  if (!isSubview(subview)) {
    return NextResponse.json({ error: "Unknown customer dashboard view." }, { status: 404 });
  }

  const accessToken = await getCustomerAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let context: Awaited<ReturnType<typeof getCustomerRequestContext>> | null = null;
  try {
    if (subview === "shipments" || subview === "stages") {
      context = await getCustomerRequestContext();
    }
  } catch (error: unknown) {
    if (error instanceof CustomerContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  const customerUserId = context?.customerUserId;

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

  const backendBase =
    context?.backendUrl ??
    normalizeApiBaseUrl(
      process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    );
  const incomingUrl = new URL(request.url);
  if (subview === "stages") {
    const requestedIds = incomingUrl.searchParams.get("shipmentIds");
    if (!requestedIds) {
      return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
    }

    const shipmentIds = [...new Set(requestedIds.split(",").map((id) => id.trim()))];
    if (
      shipmentIds.length > 100 ||
      shipmentIds.some((id) => !/^[1-9]\d*$/.test(id))
    ) {
      return NextResponse.json(
        { error: "Valid shipment IDs are required to load milestones." },
        { status: 400 },
      );
    }

    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };
      const shipmentResponse = await fetch(
        `${backendBase}/Shipments/GetByImporter/${customerUserId}`,
        {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!shipmentResponse.ok) {
        return NextResponse.json(
          { error: `Unable to validate customer shipments (status ${shipmentResponse.status}).` },
          { status: shipmentResponse.status },
        );
      }
      const shipmentRows = extractRows(await shipmentResponse.json());
      const ownedIds = new Set(
        shipmentRows
          .map((shipment) => fieldValue(shipment, "id", "shipmentId"))
          .filter((id): id is string | number => typeof id === "string" || typeof id === "number")
          .map(String),
      );
      if (shipmentIds.some((id) => !ownedIds.has(id))) {
        return NextResponse.json(
          { error: "Milestones can only be loaded for your own shipments." },
          { status: 403 },
        );
      }

      const stageResponses = await Promise.all(
        shipmentIds.map((shipmentId) =>
          fetch(
            `${backendBase}/Shipments/GetStages?shipmentId=${encodeURIComponent(shipmentId)}`,
            {
              headers,
              cache: "no-store",
              signal: AbortSignal.timeout(15_000),
            },
          ),
        ),
      );
      const failedResponse = stageResponses.find((response) => !response.ok);
      if (failedResponse) {
        return NextResponse.json(
          { error: `Unable to load shipment milestones (status ${failedResponse.status}).` },
          { status: failedResponse.status },
        );
      }

      const stageRows = await Promise.all(
        stageResponses.map((response) => response.json().then(extractRows)),
      );
      return NextResponse.json(stageRows.flat().map(normalizeBooleanFlags), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error: unknown) {
      if (error instanceof CustomerContextError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Customer stages proxy request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach the backend for shipment milestones." },
        { status: 502 },
      );
    }
  }
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
    if (error instanceof CustomerContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(`Customer ${subview} proxy request failed:`, error);
    return NextResponse.json(
      { error: `Unable to reach the backend for ${subview}.` },
      { status: 502 },
    );
  }
};

const fieldValue = (
  record: Record<string, unknown>,
  ...names: string[]
): unknown => {
  const key = Object.keys(record).find((candidate) =>
    names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const extractRows = (value: unknown): Record<string, unknown>[] => {
  let candidate = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(candidate)) {
      if (!candidate.every(isRecord)) {
        throw new Error("The backend returned an invalid list.");
      }
      return candidate;
    }
    if (!isRecord(candidate)) break;
    candidate =
      candidate.data ??
      candidate.payload ??
      candidate.response ??
      candidate.result ??
      candidate.items ??
      candidate.records;
  }
  if (candidate === null || candidate === undefined) return [];
  throw new Error("The backend response did not contain a list.");
};

type RouteContext = { params: Promise<{ subview: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { subview } = await params;
  return proxyRequest(request, subview);
}
