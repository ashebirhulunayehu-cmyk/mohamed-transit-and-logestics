import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

const readAccessToken = async (request: Request): Promise<string | null> => {
	const authorization = request.headers.get("authorization");
	const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
	if (bearerToken) return bearerToken;

	const cookieStore = await cookies();
	return (
		cookieStore.get("accessToken")?.value ??
		cookieStore.get("transit-portal-accessToken")?.value ??
		cookieStore.get("MohamedTransit-portal-accessToken")?.value ??
		null
	);
};

export const proxyDataEncoderRequest = async (
	request: Request,
	method: "GET" | "POST" | "PUT",
	endpoint: string,
): Promise<Response> => {
	const accessToken = await readAccessToken(request);
	if (!accessToken) {
		return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	}

	const headers = new Headers({
		Authorization: `Bearer ${accessToken}`,
		Accept: "application/json",
	});
	let body: BodyInit | undefined;

	if (method !== "GET") {
		const contentType = request.headers.get("content-type") ?? "";
		if (contentType.includes("multipart/form-data")) {
			body = await request.formData();
		} else {
			const requestText = await request.text();
			if (requestText) {
				body = requestText;
				headers.set("Content-Type", contentType || "application/json");
			}
		}
	}

	try {
		const response = await fetch(
			`${normalizeApiBaseUrl(
				process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
			)}${endpoint}`,
			{
				method,
				headers,
				body,
				cache: "no-store",
				signal: AbortSignal.timeout(20_000),
			},
		);
		const responseHeaders = new Headers({
			"Cache-Control": "no-store",
		});
		const responseType = response.headers.get("content-type");
		if (responseType) responseHeaders.set("Content-Type", responseType);
		const location = response.headers.get("Location");
		if (location) responseHeaders.set("Location", location);
		return new Response(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch (error: unknown) {
		console.error(`Data encoder API request failed (${method} ${endpoint}):`, error);
		return NextResponse.json(
			{ error: "Unable to reach the Data Encoder service API." },
			{ status: 502, headers: { "Cache-Control": "no-store" } },
		);
	}
};
