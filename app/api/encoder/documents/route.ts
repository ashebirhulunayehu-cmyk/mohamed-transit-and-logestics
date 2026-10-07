import { NextResponse } from "next/server";
import { API_ROUTES } from "@/modules/api";
import { proxyDataEncoderRequest } from "@/app/api/encoder/data-encoder-proxy";

const DATA_ENCODER_ID = process.env.DATA_ENCODER_USER_ID ?? "5";

const isPositiveId = (value: FormDataEntryValue | null): value is string =>
	typeof value === "string" && /^\d+$/.test(value) && Number(value) > 0;

export async function POST(request: Request) {
	if (!/^\d+$/.test(DATA_ENCODER_ID) || Number(DATA_ENCODER_ID) <= 0) {
		return NextResponse.json({ error: "The data encoder ID is not configured." }, { status: 500 });
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json({ error: "A multipart document upload is required." }, { status: 400 });
	}

	const file = formData.get("File");
	if (!file || typeof file === "string") {
		return NextResponse.json({ error: "Select a document to upload." }, { status: 400 });
	}
	if (!isPositiveId(formData.get("ServiceId"))) {
		return NextResponse.json({ error: "A valid service ID is required." }, { status: 400 });
	}
	if (!isPositiveId(formData.get("ServiceStageId"))) {
		return NextResponse.json({ error: "A valid service stage ID is required." }, { status: 400 });
	}
	const documentType = formData.get("DocumentType");
	if (typeof documentType !== "string" || !documentType.trim()) {
		return NextResponse.json({ error: "A document type is required." }, { status: 400 });
	}

	formData.set("DocumentType", documentType.trim());
	formData.set("CreatedByDataEncoderId", DATA_ENCODER_ID);
	const forwardedRequest = new Request(request.url, {
		method: "POST",
		body: formData,
	});

	return proxyDataEncoderRequest(
		forwardedRequest,
		"POST",
		API_ROUTES.document.uploadServiceDocument,
	);
}