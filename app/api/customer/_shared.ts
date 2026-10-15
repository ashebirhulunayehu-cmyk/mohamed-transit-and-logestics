import { cookies } from "next/headers";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

type JsonRecord = Record<string, unknown>;

export class CustomerContextError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "CustomerContextError";
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function getCustomerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("transit-portal-accessToken")?.value ??
    cookieStore.get("MohamedTransit-portal-accessToken")?.value ??
    null
  );
}

const readCustomerUserId = (value: unknown): string | null => {
  let candidate = value;

  for (let depth = 0; depth < 7; depth += 1) {
    if (!isRecord(candidate)) return null;

    const userIdKey = Object.keys(candidate).find(
      (key) => key.toLowerCase() === "userid",
    );
    const userId = userIdKey ? candidate[userIdKey] : undefined;
    if (
      (typeof userId === "number" && Number.isSafeInteger(userId) && userId > 0) ||
      (typeof userId === "string" && /^[1-9]\d*$/.test(userId))
    ) {
      return String(userId);
    }

    const wrapperKey = Object.keys(candidate).find((key) =>
      ["data", "payload", "response", "result"].includes(key.toLowerCase()),
    );
    if (!wrapperKey) return null;
    candidate = candidate[wrapperKey];
  }

  return null;
};

export async function getCustomerRequestContext() {
  const accessToken = await getCustomerAccessToken();
  if (!accessToken) {
    throw new CustomerContextError("Authentication required.", 401);
  }

  const backendUrl = normalizeApiBaseUrl(
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );
  let response: Response;
  try {
    response = await fetch(`${backendUrl}/Customer/GetProfile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error: unknown) {
    console.error("Unable to resolve the authenticated customer profile:", error);
    throw new CustomerContextError(
      "Unable to reach the backend for the customer profile.",
      502,
    );
  }

  if (!response.ok) {
    throw new CustomerContextError(
      response.status === 404
        ? "No customer profile is linked to the signed-in account."
        : `Unable to resolve the signed-in customer profile (status ${response.status}).`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CustomerContextError(
      "The customer profile endpoint returned invalid JSON.",
      502,
    );
  }

  const customerUserId = readCustomerUserId(body);
  if (!customerUserId) {
    throw new CustomerContextError(
      "The authenticated customer profile did not include a valid user ID.",
      502,
    );
  }

  return {
    accessToken,
    backendUrl,
    customerUserId,
  };
}
