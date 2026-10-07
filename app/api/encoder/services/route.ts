import { API_ROUTES } from "@/modules/api";
import { proxyDataEncoderRequest } from "@/app/api/encoder/data-encoder-proxy";

export async function GET(request: Request) {
	return proxyDataEncoderRequest(request, "GET", API_ROUTES.dataEncoder.services);
}

export async function POST(request: Request) {
	return proxyDataEncoderRequest(request, "POST", API_ROUTES.dataEncoder.createService);
}
