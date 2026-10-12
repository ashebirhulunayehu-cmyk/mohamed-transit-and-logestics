import { normalizeApiBaseUrl } from "@/modules/utils/axios/config";

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "A valid login request is required." }, { status: 400 });
	}

	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		return Response.json({ error: "A username or email and password are required." }, { status: 400 });
	}

	const loginPayload = body as Record<string, unknown>;
	if (
		typeof loginPayload.password !== "string" ||
		(typeof loginPayload.userName !== "string" &&
			typeof loginPayload.email !== "string")
	) {
		return Response.json({ error: "A username or email and password are required." }, { status: 400 });
	}

	try {
		const response = await fetch(
			`${normalizeApiBaseUrl(
				process.env.BACKEND_API_URL ??
					process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ??
					process.env.NEXT_PUBLIC_API_URL,
			)}/User/Login`,
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(loginPayload),
				cache: "no-store",
				signal: AbortSignal.timeout(15_000),
			},
		);

		const contentType = response.headers.get("content-type");
		return new Response(response.body, {
			status: response.status,
			headers: {
				"Cache-Control": "no-store",
				...(contentType ? { "Content-Type": contentType } : {}),
			},
		});
	} catch (error: unknown) {
		console.error("Authentication API request failed:", error);
		return Response.json(
			{ error: "Unable to reach the authentication service. Check that the API is running." },
			{ status: 502, headers: { "Cache-Control": "no-store" } },
		);
	}
}
