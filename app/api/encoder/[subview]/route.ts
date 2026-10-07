import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

const ENCODER_ID =
  process.env.DATA_ENCODER_USER_ID ??
  "5";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeFlags = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeFlags);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (key.toLowerCase() === "isverified" || key.toLowerCase() === "isrequired") {
        if (item === 1 || item === "1" || item === true) return [key, true];
        if (item === 0 || item === "0" || item === false || item == null) {
          return [key, false];
        }
      }
      return [key, normalizeFlags(item)];
    }),
  );
};

const readAccessToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return (
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("transit-portal-accessToken")?.value ??
    cookieStore.get("MohamedTransit-portal-accessToken")?.value ??
    null
  );
};

const jsonResponse = (body: unknown, status: number) => {
  const headers = { "Cache-Control": "no-store" };
  if (status === 204 || status === 304) {
    return new Response(null, { status, headers });
  }
  return NextResponse.json(body, { status, headers });
};

const readJsonBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

type RouteContext = { params: Promise<{ subview: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { subview } = await params;
  const allowedViews = new Set(["customers", "dashboard"]);
  if (!allowedViews.has(subview)) {
    return jsonResponse({ error: "Unknown encoder resource." }, 404);
  }

  const accessToken = await readAccessToken();
  if (!accessToken) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  const backendUrl = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );
  const incomingUrl = new URL(request.url);
  let endpoint: string;

  if (subview === "dashboard") {
    endpoint = `${backendUrl}/DataEncoder/GetDashboard`;
  } else {
    const recordStatus = incomingUrl.searchParams.get("recordStatus");
    if (!recordStatus?.trim()) {
      return jsonResponse(
        { error: "A recordStatus is required to load encoder customers." },
        400,
      );
    }
    endpoint = `${backendUrl}/DataEncoder/GetAllCustomers/${encodeURIComponent(
      recordStatus.trim(),
    )}`;
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: "Bearer " + accessToken,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = await readJsonBody(response);
    return jsonResponse(normalizeFlags(body), response.status);
  } catch (error: unknown) {
    console.error(`Data encoder ${subview} request failed:`, error);
    return jsonResponse(
      { error: `Unable to reach the backend for encoder ${subview}.` },
      502,
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { subview } = await params;
  if (subview !== "customers" && subview !== "shipments") {
    return jsonResponse({ error: "Unknown encoder submission." }, 404);
  }

  const accessToken = await readAccessToken();
  if (!accessToken) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  let submitted: unknown;
  try {
    submitted = await request.json();
  } catch {
    return jsonResponse({ error: "A valid JSON request body is required." }, 400);
  }
  if (!isRecord(submitted)) {
    return jsonResponse({ error: "A request object is required." }, 400);
  }

  let endpoint: string;
  let payload: JsonRecord;
  if (subview === "customers") {
    const requiredFields = [
      "businessName",
      "tinNumber",
      "businessLicense",
      "businessAddress",
      "city",
      "state",
      "postalCode",
      "contactPerson",
      "contactPhone",
      "contactEmail",
      "businessType",
      "importLicense",
    ] as const;
    const values: JsonRecord = {};
    for (const key of requiredFields) {
      const value = submitted[key];
      if (typeof value !== "string" || !value.trim()) {
        return jsonResponse({ error: `${key} is required.` }, 400);
      }
      values[key] = value.trim();
    }
    if (
      typeof submitted.contactEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitted.contactEmail)
    ) {
      return jsonResponse({ error: "Enter a valid customer contact email." }, 400);
    }
    if (!/^\d+$/.test(ENCODER_ID)) {
      return jsonResponse({ error: "The data encoder ID is not configured." }, 500);
    }
    const userId = Number(submitted.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return jsonResponse({ error: "A valid authenticated user ID is required to create a customer." }, 400);
    }
    values.userId = userId;
    const expiry = submitted.importLicenseExpiry;
    if (typeof expiry === "string" && expiry.trim()) {
      if (Number.isNaN(Date.parse(expiry))) {
        return jsonResponse({ error: "Import license expiry must be a valid date." }, 400);
      }
      values.importLicenseExpiry = new Date(expiry).toISOString();
    } else {
      values.importLicenseExpiry = null;
    }
    values.CreatedByDataEncoderId = Number(ENCODER_ID);
    endpoint = `${normalizeApiBaseUrl(
      process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    )}/DataEncoder/CreateCustomer`;
    payload = values;
  } else {
    const customerId = Number(submitted.customerId);
    const declaredValue = Number(submitted.declaredValue);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return jsonResponse({ error: "Select a valid customer before creating a shipment." }, 400);
    }
    if (!Number.isFinite(declaredValue) || declaredValue < 0) {
      return jsonResponse({ error: "Declared value must be a non-negative amount." }, 400);
    }
    const serviceType = submitted.serviceType;
    if (serviceType !== "Multimodal" && serviceType !== "Unimodal") {
      return jsonResponse({ error: "Choose Multimodal or Unimodal service type." }, 400);
    }
    const itemDescription =
      typeof submitted.itemDescription === "string"
        ? submitted.itemDescription.trim()
        : "";
    const countryOfOrigin =
      typeof submitted.countryOfOrigin === "string"
        ? submitted.countryOfOrigin.trim()
        : "";
    const routeCategory =
      typeof submitted.routeCategory === "string"
        ? submitted.routeCategory.trim()
        : "";
    if (!itemDescription || !countryOfOrigin || !routeCategory) {
      return jsonResponse(
        { error: "Description, origin, and route category are required." },
        400,
      );
    }

    payload = {
      customerId,
      itemDescription,
      routeCategory,
      declaredValue,
      taxCategory:
        typeof submitted.taxCategory === "string" && submitted.taxCategory.trim()
          ? submitted.taxCategory.trim()
          : "General",
      countryOfOrigin,
      serviceType,
    };
    endpoint = `${normalizeApiBaseUrl(
      process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    )}/Shipments/Create`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const body = await readJsonBody(response);
    return jsonResponse(normalizeFlags(body), response.status);
  } catch (error: unknown) {
    console.error(`Data encoder ${subview} submission failed:`, error);
    return jsonResponse(
      { error: `Unable to reach the backend to create ${subview}.` },
      502,
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { subview } = await params;
  if (subview !== "customers") {
    return jsonResponse({ error: "Unknown encoder update target." }, 404);
  }

  const accessToken = await readAccessToken();
  if (!accessToken) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  let submitted: unknown;
  try {
    submitted = await request.json();
  } catch {
    return jsonResponse({ error: "A valid JSON request body is required." }, 400);
  }

  if (!isRecord(submitted)) {
    return jsonResponse({ error: "A request object is required." }, 400);
  }

  const customerId = Number(submitted.id ?? submitted.customerId ?? submitted.customerID);
  if (!Number.isSafeInteger(customerId) || customerId <= 0) {
    return jsonResponse({ error: "A valid customer id is required." }, 400);
  }

  const requiredFields = [
    "businessName",
    "tinNumber",
    "businessLicense",
    "businessAddress",
    "city",
    "state",
    "postalCode",
    "contactPerson",
    "contactPhone",
    "contactEmail",
    "businessType",
    "importLicense",
  ] as const;

  const values: JsonRecord = { id: customerId };
  for (const key of requiredFields) {
    const value = submitted[key];
    if (typeof value !== "string" || !value.trim()) {
      return jsonResponse({ error: `${key} is required.` }, 400);
    }
    values[key] = value.trim();
  }

  if (
    typeof submitted.contactEmail !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitted.contactEmail)
  ) {
    return jsonResponse({ error: "Enter a valid customer contact email." }, 400);
  }

  const expiry = submitted.importLicenseExpiry;
  if (typeof expiry === "string" && expiry.trim()) {
    if (Number.isNaN(Date.parse(expiry))) {
      return jsonResponse({ error: "Import license expiry must be a valid date." }, 400);
    }
    values.importLicenseExpiry = new Date(expiry).toISOString();
  } else if (expiry === null || expiry === undefined) {
    values.importLicenseExpiry = null;
  }

  const endpoint = `${normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  )}/DataEncoder/UpdateCustomer`;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + accessToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const body = await readJsonBody(response);
    return jsonResponse(normalizeFlags(body), response.status);
  } catch (error: unknown) {
    console.error(`Data encoder customer update failed:`, error);
    return jsonResponse(
      { error: "Unable to reach the backend to update the customer." },
      502,
    );
  }
}
