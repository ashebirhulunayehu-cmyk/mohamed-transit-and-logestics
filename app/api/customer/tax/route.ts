import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeTaxStatuses = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeTaxStatuses);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (key.toLowerCase() === "status" && (item === 0 || item === "0")) {
        return [key, "Unpaid"];
      }
      if (key.toLowerCase() === "status" && (item === 1 || item === "1")) {
        return [key, "Paid"];
      }
      return [key, normalizeTaxStatuses(item)];
    }),
  );
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
      { error: "The authenticated customer ID is not configured." },
      { status: 500 },
    );
  }

  const backendUrl = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );

  try {
    const response = await fetch(
      `${backendUrl}/TaxRecords/GetByCustomer/${customerUserId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (response.status === 204) {
      return NextResponse.json([], {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const responseText = await response.text();

    if (!responseText) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            state: "unavailable",
            error: "The backend tax-records endpoint returned 404.",
          },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json(
        { error: `The backend tax-records endpoint returned ${response.status}.` },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(responseText) as unknown;
    } catch {
      return NextResponse.json(
        { error: "The tax records endpoint returned invalid JSON." },
        { status: 502 },
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        {
          state: "unavailable",
          error:
            typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? `Tax data is unavailable: ${body.message}`
            : "The backend tax-records endpoint returned 404.",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(normalizeTaxStatuses(body), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error("Customer tax records proxy request failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the backend for tax records." },
      { status: 502 },
    );
  }
}
