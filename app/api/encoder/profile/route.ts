import { proxyDataEncoderRequest } from "@/app/api/encoder/data-encoder-proxy";
import { API_ROUTES } from "@/modules/api";

export async function GET(request: Request) {
	return proxyDataEncoderRequest(request, "GET", API_ROUTES.account.getProfile);
}

export async function PUT(request: Request) {
	const contentType = request.headers.get("content-type") ?? "";
	let validationValues: FormData | URLSearchParams;

	try {
		if (contentType.includes("multipart/form-data")) {
			validationValues = await request.clone().formData();
		} else if (contentType.includes("application/x-www-form-urlencoded")) {
			validationValues = new URLSearchParams(await request.clone().text());
		} else if (contentType.includes("application/json")) {
			const payload: unknown = await request.clone().json();
			if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
				return Response.json({ error: "A profile update object is required." }, { status: 400 });
			}
			const values = payload as Record<string, unknown>;
			validationValues = new URLSearchParams({
				FirstName: String(values.FirstName ?? values.firstName ?? ""),
				LastName: String(values.LastName ?? values.lastName ?? ""),
				Phone: String(values.Phone ?? values.phone ?? ""),
				Username: String(values.Username ?? values.username ?? ""),
				Email: String(values.Email ?? values.email ?? ""),
				ProfilePhotoFile: "",
			});
		} else {
			return Response.json(
				{ error: "Profile updates must use form-urlencoded or multipart form data." },
				{ status: 415 },
			);
		}
	} catch {
		return Response.json({ error: "A valid profile update form is required." }, { status: 400 });
	}

	for (const field of ["FirstName", "LastName", "Username", "Email"]) {
		const value = validationValues.get(field);
		if (typeof value !== "string" || !value.trim()) {
			return Response.json({ error: `${field} is required.` }, { status: 400 });
		}
	}

	return proxyDataEncoderRequest(request, "PUT", API_ROUTES.account.updateProfile);
}
