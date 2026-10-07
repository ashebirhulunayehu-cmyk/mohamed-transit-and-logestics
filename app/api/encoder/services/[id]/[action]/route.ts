import { NextResponse } from "next/server";
import { proxyDataEncoderRequest } from "@/app/api/encoder/data-encoder-proxy";
import { API_ROUTES } from "@/modules/api";

type RouteContext = { params: Promise<{ id: string; action: string }> };

const readServiceId = (value: string): number | null => {
	const id = Number(value);
	return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export async function PUT(request: Request, { params }: RouteContext) {
	const { id: rawId, action } = await params;
	const id = readServiceId(rawId);
	if (!id) {
		return NextResponse.json({ error: "A valid service ID is required." }, { status: 400 });
	}
	if (action !== "service-type") {
		return NextResponse.json({ error: "Unknown service update action." }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
	}
	if (
		typeof body !== "object" ||
		body === null ||
		!("serviceType" in body) ||
		typeof body.serviceType !== "number" ||
		!Number.isInteger(body.serviceType)
	) {
		return NextResponse.json({ error: "A valid numeric service type is required." }, { status: 400 });
	}

	return proxyDataEncoderRequest(
		new Request(request.url, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
		"PUT",
		API_ROUTES.dataEncoder.updateServiceType(id),
	);
}

export async function POST(request: Request, { params }: RouteContext) {
	const { id: rawId, action } = await params;
	const id = readServiceId(rawId);
	if (!id) {
		return NextResponse.json({ error: "A valid service ID is required." }, { status: 400 });
	}
	if (action === "submit") {
		return proxyDataEncoderRequest(request, "POST", API_ROUTES.dataEncoder.submitService(id));
	}
	if (action !== "documents") {
		return NextResponse.json({ error: "Unknown service action." }, { status: 404 });
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json({ error: "A multipart document upload is required." }, { status: 400 });
	}
	if (!formData.getAll("files").some((file) => typeof file !== "string")) {
		return NextResponse.json({ error: "Select at least one document to upload." }, { status: 400 });
	}
	const forwardedRequest = new Request(request.url, {
		method: "POST",
		body: formData,
	});
	return proxyDataEncoderRequest(
		forwardedRequest,
		"POST",
		API_ROUTES.dataEncoder.uploadServiceDocuments(id),
	);
}
