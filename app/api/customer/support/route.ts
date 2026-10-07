import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

interface CreateSupportRequest {
  subject: string;
  description: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
}

const readAccessToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return (
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("transit-portal-accessToken")?.value ??
    cookieStore.get("MohamedTransit-portal-accessToken")?.value ??
    null
  );
};

const forwardRequest = async (
  accessToken: string,
  method: "GET" | "POST",
  payload?: CreateSupportRequest,
) => {
  const backendUrl = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );
  const response = await fetch(
    `${backendUrl}${method === "GET" ? "/SupportRequests/Mine" : "/SupportRequests"}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (response.status === 204) {
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const responseText = await response.text();
  if (!responseText) {
    return NextResponse.json(null, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let responseBody: unknown;
  try {
    responseBody = JSON.parse(responseText) as unknown;
  } catch {
    return NextResponse.json(
      { error: "The support requests endpoint returned invalid JSON." },
      { status: 502 },
    );
  }

  return NextResponse.json(responseBody, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
};

export async function GET() {
  const accessToken = await readAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    return await forwardRequest(accessToken, "GET");
  } catch (error: unknown) {
    console.error("Customer support requests proxy failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the backend for support requests." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const accessToken = await readAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let submitted: unknown;
  try {
    submitted = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON ticket is required." }, { status: 400 });
  }

  if (
    typeof submitted !== "object" ||
    submitted === null ||
    Array.isArray(submitted)
  ) {
    return NextResponse.json({ error: "A valid ticket object is required." }, { status: 400 });
  }

  const value = submitted as Record<string, unknown>;
  const subject = typeof value.subject === "string" ? value.subject.trim() : "";
  const description =
    typeof value.description === "string" ? value.description.trim() : "";
  const priority = value.priority;

  if (
    subject.length < 5 ||
    subject.length > 200 ||
    description.length < 10 ||
    description.length > 4000
  ) {
    return NextResponse.json(
      {
        error:
          "Subject must be 5–200 characters and description must be 10–4000 characters.",
      },
      { status: 400 },
    );
  }
  if (
    priority !== "Low" &&
    priority !== "Normal" &&
    priority !== "High" &&
    priority !== "Urgent"
  ) {
    return NextResponse.json(
      { error: "Priority must be Low, Normal, High, or Urgent." },
      { status: 400 },
    );
  }

  const payload: CreateSupportRequest = {
    subject,
    description,
    priority,
  };

  try {
    return await forwardRequest(accessToken, "POST", payload);
  } catch (error: unknown) {
    console.error("Customer support ticket creation proxy failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the backend to create a support request." },
      { status: 502 },
    );
  }
}
