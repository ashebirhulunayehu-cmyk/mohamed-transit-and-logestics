import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";
import { getCustomerAccessToken } from "../_shared";

export async function GET() {
  const accessToken = await getCustomerAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const backendUrl = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );

  try {
    const response = await fetch(`${backendUrl}/Account/GetProfile`, {
      headers: {
        Authorization: "Bear" + "er " + accessToken,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error: unknown) {
    console.error("Customer account profile proxy request failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the backend for the account profile." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
