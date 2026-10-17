import { proxyDataEncoderRequest } from "@/app/api/encoder/data-encoder-proxy";
import { API_ROUTES } from "@/modules/api";

export async function GET(request: Request) {
  return proxyDataEncoderRequest(request, "GET", API_ROUTES.account.getProfile);
}
