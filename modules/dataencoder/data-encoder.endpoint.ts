import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

const readProxyResponse = async (
  response: Response,
  resource: string,
): Promise<unknown> => {
  if (response.status === 204) return [];

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      if (response.ok) {
        throw new Error(`The ${resource} endpoint returned invalid JSON.`);
      }
      body = text;
    }
  }

  if (!response.ok) {
    if (typeof body === "string" && body.trim()) {
      throw new Error(body);
    }
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      const record = body as Record<string, unknown>;
      const message = [record.message, record.detail, record.error, record.title].find(
        (value): value is string => typeof value === "string" && Boolean(value.trim()),
      );
      if (message) throw new Error(message);
    }
    throw new Error(`${resource} request failed (${response.status}).`);
  }

  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    if (record.error === true || record.isError === true) {
      const message = [record.message, record.detail].find(
        (value): value is string => typeof value === "string" && Boolean(value.trim()),
      );
      throw new Error(message ?? `${resource} request was rejected.`);
    }
  }

  return body;
};

const getProxyJson = async (url: string, resource: string): Promise<unknown> =>
  readProxyResponse(
    await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    resource,
  );

export const DataEncoderEndpoints = {
  // Use the same-origin proxy so the server can forward the authenticated cookie.
  getDashboard: () =>
    getProxyJson("/api/encoder/dashboard", "Data Encoder dashboard"),

  // GET /api/v1/DataEncoder/GetAllCustomers/{recordStatus} via the authenticated proxy.
  getAllCustomers: (recordStatus = "1") =>
    getProxyJson(
      `/api/encoder/customers?recordStatus=${encodeURIComponent(recordStatus)}`,
      "Data Encoder customer records",
    ),

  // Browser requests use the authenticated same-origin proxy, which forwards
  // these requests to /DataEncoder/GetAllCustomers/{recordStatus}.
  getCustomerRegistry: (recordStatus = "1") =>
    fetch(
      `/api/encoder/customers?recordStatus=${encodeURIComponent(recordStatus)}`,
      { cache: "no-store" }
    ),

  // Browser requests use the proxy to validate the payload and attach the
  // authenticated user and data-encoder IDs before forwarding to CreateCustomer.
  createCustomer: (payload: Record<string, unknown>) =>
    fetch("/api/encoder/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // GET /api/v1/Account/GetProfile via the authenticated same-origin proxy.
  getProfile: () => fetch("/api/encoder/profile", { cache: "no-store" }),

  // PUT /api/v1/Account/UpdateProfile via the authenticated same-origin proxy.
  updateProfile: (profile: {
    firstName: string;
    lastName: string;
    phone: string;
    username: string;
    email: string;
    profilePhotoFile?: File;
  }) => {
    const { profilePhotoFile, ...fields } = profile;
    let body: FormData | URLSearchParams;
    if (profilePhotoFile) {
      body = new FormData();
      body.append("FirstName", fields.firstName);
      body.append("LastName", fields.lastName);
      body.append("Phone", fields.phone);
      body.append("Username", fields.username);
      body.append("Email", fields.email);
      body.append("ProfilePhotoFile", profilePhotoFile, profilePhotoFile.name);
    } else {
      body = new URLSearchParams({
        FirstName: fields.firstName,
        LastName: fields.lastName,
        Phone: fields.phone,
        Username: fields.username,
        Email: fields.email,
        ProfilePhotoFile: "",
      });
    }

    return fetch("/api/encoder/profile", {
      method: "PUT",
      body,
    });
  },

  // PUT /api/v1/DataEncoder/services/{id}/service-type
  updateServiceType: (
    id: number | string,
    payload: Record<string, unknown>
  ) =>
    service.put(API_ROUTES.dataEncoder.updateServiceType(id), payload),

  // GET /api/v1/DataEncoder/services via the authenticated same-origin proxy.
  getServices: () => getProxyJson("/api/encoder/services", "Data Encoder services"),

  // GET /api/v1/Document/GetServiceDocuments?serviceId={id}
  getServiceDocuments: (serviceId: number | string) =>
    service.get(API_ROUTES.document.getServiceDocuments, {
      params: { serviceId },
    }),

  // GET /api/v1/Document/DownloadDocument?documentId={id}
  downloadDocument: (documentId: number | string) =>
    service.get(API_ROUTES.document.downloadDocument, {
      params: { documentId },
      responseType: "blob",
    }),

  // POST /api/v1/Document/VerifyDocument
  verifyDocument: (payload: {
    documentId: number | string;
    isVerified: boolean;
    notes?: string;
    verificationNotes?: string;
    verifiedByUserId?: number | string;
  }) => service.post(API_ROUTES.document.verifyDocument, payload),
};