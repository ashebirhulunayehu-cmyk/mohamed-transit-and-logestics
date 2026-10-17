"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, BadgeCheck, Download, Eye, FileText, LoaderCircle, MoreHorizontal, Search, Trash2, UploadCloud, X } from "lucide-react";
import { API_BASE } from "@/modules/api";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import { CaseExecutorEndpoints } from "@/modules/case-Executer/case-executor.endpoint";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";

type DocumentStatus = "Verified" | "Flagged" | "Rejected" | "Pending check";
type ExecutorDocument = {
  id: string;
  source: "stage" | "service";
  name: string;
  type: string;
  description: string;
  serviceId: string;
  stageId: string;
  serviceTrackingNumber: string;
  serviceStage: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  verifiedBy: string;
  verificationNotes: string;
  status: DocumentStatus;
  mimeType: string;
  uploadedByCurrentUser: boolean;
};
type StageOption = {
  key: string;
  shipmentId: string;
  stageId: string;
  serviceLabel: string;
  stageLabel: string;
};

const typeOptions = [
  { value: "1", label: "Invoice" },
  { value: "2", label: "Bank receipt" },
  { value: "3", label: "Delivery order" },
  { value: "4", label: "Inspection report" },
  { value: "5", label: "Clearance document" },
  { value: "6", label: "Transport license" },
  { value: "7", label: "Arrival photo" },
  { value: "8", label: "Store receipt" },
  { value: "9", label: "Legal document" },
  { value: "10", label: "Other" },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readValue = (record: Record<string, unknown>, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown, fallback = ""): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : fallback;

const unwrapRows = (response: unknown): unknown[] => {
  let value = response;
  for (let depth = 0; depth < 4 && isRecord(value); depth += 1) {
    const nested = readValue(value, "data", "response", "payload", "items", "documents", "stages", "results");
    if (nested === undefined || nested === value) break;
    value = nested;
  }
  return Array.isArray(value) ? value : [];
};

const normalizeDocument = (
  value: unknown,
): ExecutorDocument | null => {
  if (!isRecord(value)) return null;
  const id = readText(readValue(value, "id", "documentId"));
  if (!id) return null;
  const rawType = readValue(value, "documentType", "type");
  const numericType = Number(rawType);
  const normalizedType = readText(rawType).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const type = Number.isInteger(numericType)
    ? typeOptions.find((option) => option.value === String(numericType))?.label ?? "Document"
    : typeOptions.find((option) => option.label.toLowerCase() === normalizedType)?.label
      ?? readText(rawType, "Document");
  const uploaderValue = readValue(value, "uploadedBy", "uploadedByName", "userName");
  const uploaderId = readText(readValue(value, "uploadedByUserId"));
  const uploader = isRecord(uploaderValue)
    ? readText(readValue(uploaderValue, "fullName", "name", "username", "email"), uploaderId ? `User ${uploaderId}` : "Unavailable")
    : readText(uploaderValue, uploaderId ? `User ${uploaderId}` : "Unavailable");
  const verifierValue = readValue(value, "verifiedBy", "verifiedByUser");
  const verifierId = readText(readValue(value, "verifiedByUserId"));
  const verifier = isRecord(verifierValue)
    ? readText(readValue(verifierValue, "fullName", "name", "username", "email"), verifierId ? `User ${verifierId}` : "")
    : readText(verifierValue, verifierId ? `User ${verifierId}` : "");
  const verified = readValue(value, "isVerified", "verified") === true;
  const statusValue = readText(readValue(value, "verificationStatus", "reviewStatus", "documentStatus", "status"))
    .toLowerCase();
  const isFlagged = readValue(value, "isFlagged", "flagged", "needsReview") === true ||
    statusValue.includes("flag");
  const isRejected = readValue(value, "isRejected", "rejected") === true ||
    ["rejected", "declined", "returned"].some((status) => statusValue.includes(status));
  const serviceId = readText(readValue(value, "serviceId", "shipmentId"));
  const serviceNumber = readText(readValue(value, "serviceNumber", "trackingNumber"), serviceId);
  const stageId = readText(readValue(value, "stageId", "serviceStageId"));
  const sourceValue = readText(readValue(value, "source")).toLowerCase();

  return {
    id,
    source: sourceValue === "stage" ? "stage" : "service",
    name: readText(readValue(value, "originalFileName", "fileName", "name"), "Untitled document"),
    type,
    description: readText(readValue(value, "description")),
    serviceId,
    stageId,
    serviceTrackingNumber: serviceNumber,
    serviceStage: readText(readValue(value, "stageName", "serviceStage"), "Stage unavailable"),
    uploadedBy: uploader,
    uploadedAt: readText(readValue(value, "uploadedAt", "createdDate", "createAt"), "Date unavailable"),
    status: verified ? "Verified" : isRejected ? "Rejected" : isFlagged ? "Flagged" : "Pending check",
    mimeType: readText(readValue(value, "mimeType", "contentType"), "application/octet-stream"),
    uploadedByCurrentUser: readValue(value, "uploadedByCurrentUser") === true,
    updatedAt: readText(readValue(value, "updatedAt", "modifiedAt")),
    verifiedBy: verifier || readText(readValue(value, "verifiedByUserName")),
    verificationNotes: readText(readValue(value, "verificationNotes", "reviewNotes", "auditNotes")),
  };
};

const readServiceId = (service: CaseExecutorServiceRecord): string => {
  const value = readValue(service, "id", "serviceId", "shipmentId");
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
};

const readServiceLabel = (service: CaseExecutorServiceRecord): string => {
  const id = readServiceId(service);
  const tracking = readText(readValue(service, "serviceNumber", "trackingNumber", "caseNumber"));
  const title = readText(readValue(service, "itemDescription", "description"));
  return [tracking || `Service ${id}`, title].filter(Boolean).join(" · ");
};

const getStageName = (stage: Record<string, unknown>, index: number): string => {
  const nestedStage = readValue(stage, "stage");
  const nestedName = isRecord(nestedStage)
    ? readText(readValue(nestedStage, "name", "stageName"))
    : "";
  return nestedName || readText(readValue(stage, "name", "stageName")) || `Stage ${index + 1}`;
};

const getStageId = (stage: Record<string, unknown>): string =>
  readText(readValue(stage, "id", "serviceStageId", "shipmentStageId"));

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getErrorMessage = (error: unknown): string =>
  typeof error === "string" && error.trim()
    ? error.trim()
    : error instanceof Error && error.message.trim()
      ? error.message
      : "The document request failed.";

type DownloadFile = { blob: Blob | null; name: string; url?: string };

const summarizeDownloadResponse = (value: unknown, depth = 0): unknown => {
  if (value instanceof Blob) return { type: "Blob", mimeType: value.type, size: value.size };
  if (value instanceof ArrayBuffer) return { type: "ArrayBuffer", byteLength: value.byteLength };
  if (ArrayBuffer.isView(value)) {
    return { type: value.constructor.name, byteLength: value.byteLength };
  }
  if (typeof value === "string") return { type: "string", length: value.length };
  if (Array.isArray(value)) {
    if (value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
      return { type: "byte array", length: value.length };
    }
    if (depth >= 5) return "[nested]";
    return value.slice(0, 20).map((item) => summarizeDownloadResponse(item, depth + 1));
  }
  if (!isRecord(value)) return value;
  if (depth >= 5) return "[nested]";
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      summarizeDownloadResponse(child, depth + 1),
    ]),
  );
};

const resolveBackendFileUrl = (path: string): string => {
  try {
    const backendOrigin = new URL(API_BASE).origin;
    return new URL(path, `${backendOrigin}/`).toString();
  } catch {
    return new URL(path, window.location.origin).toString();
  }
};

const findDownloadField = (
  value: unknown,
  keys: string[],
  depth = 0,
): unknown => {
  if (depth > 6 || !isRecord(value)) return undefined;
  const found = readValue(value, ...keys);
  if (found !== undefined && found !== null) return found;
  for (const nested of Object.values(value)) {
    const result = findDownloadField(nested, keys, depth + 1);
    if (result !== undefined && result !== null) return result;
  }
  return undefined;
};

const getDownloadError = (value: unknown): string | null => {
  if (!isRecord(value)) return null;
  const isError = readValue(value, "isError", "hasError");
  const error = readValue(value, "error");
  if (isError === true || error === true) {
    return readText(
      findDownloadField(value, ["detail", "message", "errorMessage", "title"]),
      "The document service returned an error.",
    );
  }
  if (typeof error === "string" && error.trim()) return error.trim();
  for (const nested of Object.values(value)) {
    const nestedError = getDownloadError(nested);
    if (nestedError) return nestedError;
  }
  return null;
};

const decodeBase64File = (encoded: string, mimeType: string): Blob => {
  const base64 = encoded.replace(/^data:[^,]*;base64,/i, "").replace(/\s/g, "");
  const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(normalized);
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
};

const findEncodedFileData = (value: unknown, depth = 0): unknown => {
  if (depth > 6 || !isRecord(value)) return undefined;
  for (const [key, candidate] of Object.entries(value)) {
    const isDataField = [
      "fileContent",
      "fileBytes",
      "bytes",
      "base64",
      "base64Content",
      "content",
    ].some((field) => key.toLowerCase() === field.toLowerCase());
    const isResponseData = key.toLowerCase() === "data";
    if (
      (isDataField || isResponseData) &&
      (typeof candidate === "string" ||
        (Array.isArray(candidate) &&
          candidate.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)))
    ) {
      return candidate;
    }
  }
  for (const candidate of Object.values(value)) {
    const found = findEncodedFileData(candidate, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
};

const validateDownloadBlob = async (
  blob: Blob,
  fallbackMimeType: string,
  fallbackName: string,
): Promise<DownloadFile> => {
  if (blob.size === 0) {
    throw new Error("The document download returned an empty file. Please try again.");
  }

  const contentType = (blob.type || fallbackMimeType).split(";")[0].trim().toLowerCase();
  const sample = (await blob.slice(0, 4096).text()).trim();
  const isJson = contentType.includes("json") || sample.startsWith("{") || sample.startsWith("[");
  if (isJson) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await blob.text()) as unknown;
    } catch {
      throw new Error("The document service returned an invalid file response.");
    }
    return decodeDownloadPayload(parsed, fallbackName, fallbackMimeType);
  }

  const isHtml = contentType.includes("html") || /^<!doctype html|^<html\b/i.test(sample);
  const isXmlError =
    (contentType.includes("xml") || sample.startsWith("<?xml")) &&
    /<(?:error|problem|problemdetails|exception|fault)\b/i.test(sample);
  if (isHtml || isXmlError) {
    throw new Error("The server returned an error instead of the document. Please try again.");
  }

  const mimeType = fallbackMimeType.toLowerCase().includes("pdf") ||
    fallbackName.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : blob.type || fallbackMimeType;
  return {
    blob: new Blob([blob], { type: mimeType }),
    name: fallbackName,
  };
};

const decodeDownloadPayload = (
  payload: unknown,
  fallbackName: string,
  fallbackMimeType: string,
): DownloadFile => {
  if (payload instanceof Blob) {
    const isPdf = fallbackMimeType.toLowerCase().includes("pdf") ||
      fallbackName.toLowerCase().endsWith(".pdf");
    return {
      blob: new Blob([payload], { type: isPdf ? "application/pdf" : payload.type || fallbackMimeType }),
      name: fallbackName,
    };
  }
  if (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)) {
    const bytes = payload instanceof ArrayBuffer
      ? new Uint8Array(payload)
      : new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
    if (bytes.byteLength === 0) {
      throw new Error("The document download returned an empty file. Please try again.");
    }
    const blobBytes = new Uint8Array(bytes.byteLength);
    blobBytes.set(bytes);
    return {
      blob: new Blob([blobBytes.buffer], {
        type: fallbackMimeType.toLowerCase().includes("pdf") ||
          fallbackName.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : fallbackMimeType,
      }),
      name: fallbackName,
    };
  }
  if (
    Array.isArray(payload) &&
    payload.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  ) {
    const blob = new Blob([Uint8Array.from(payload)], { type: "application/pdf" });
    if (!blob.size) throw new Error("The document download returned an empty file. Please try again.");
    return { blob, name: fallbackName };
  }
  if (typeof payload === "string") {
    const text = payload.trim();
    if (/^(https?:\/\/|\/)/i.test(text)) {
      return { blob: null, name: fallbackName, url: resolveBackendFileUrl(text) };
    }
    try {
      return decodeDownloadPayload(JSON.parse(text) as unknown, fallbackName, fallbackMimeType);
    } catch (error: unknown) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    try {
      const blob = decodeBase64File(text, "application/pdf");
      if (blob.size > 0) return { blob, name: fallbackName };
    } catch {
      // Continue to the invalid-payload error when the string is not base64.
    }
  }
  const error = getDownloadError(payload);
  if (error) throw new Error(error);
  if (!isRecord(payload)) {
    throw new Error("The document endpoint did not return file details.");
  }

  const name = readText(
    findDownloadField(payload, ["fileName", "originalFileName", "name"]),
    fallbackName,
  );
  const responseMimeType = readText(
    findDownloadField(payload, ["contentType", "mimeType", "fileType"]),
    fallbackMimeType,
  );
  const isPdf = responseMimeType.toLowerCase().includes("pdf") || name.toLowerCase().endsWith(".pdf");
  const mimeType = isPdf ? "application/pdf" : responseMimeType;
  const fileData = findEncodedFileData(payload);

  if (typeof fileData === "string") {
    const blob = decodeBase64File(fileData, mimeType);
    if (blob.size === 0) throw new Error("The document download returned an empty file. Please try again.");
    return { blob, name };
  }
  if (Array.isArray(fileData) && fileData.every(
    (byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255,
  )) {
    const blob = new Blob([Uint8Array.from(fileData)], { type: mimeType });
    if (blob.size === 0) throw new Error("The document download returned an empty file. Please try again.");
    return { blob, name };
  }

  const fileUrl = findDownloadField(payload, ["fileUrl", "downloadUrl", "url", "filePath"]);
  if (typeof fileUrl === "string" && fileUrl.trim()) {
    const url = fileUrl.trim();
    if (/^https?:\/\//i.test(url)) {
      return { blob: null, name, url };
    }
    if (!/^[a-z][a-z\d+.-]*:/i.test(url)) {
      return { blob: null, name, url: resolveBackendFileUrl(url) };
    }
    throw new Error("The document service returned an invalid download URL.");
  }

  throw new Error("The document endpoint returned an invalid file payload.");
};

const getDownloadFile = async (
  response: unknown,
  fallbackName: string,
  fallbackMimeType = "application/octet-stream",
): Promise<DownloadFile> => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Raw DownloadDocument Response:",
      summarizeDownloadResponse(response),
    );
  }
  if (response instanceof Blob) {
    return validateDownloadBlob(response, fallbackMimeType, fallbackName);
  }
  if (response instanceof ArrayBuffer || ArrayBuffer.isView(response)) {
    return decodeDownloadPayload(response, fallbackName, fallbackMimeType);
  }
  if (typeof response === "string") {
    try {
      return decodeDownloadPayload(JSON.parse(response) as unknown, fallbackName, fallbackMimeType);
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        throw new Error("The document service returned an invalid file response.");
      }
      throw error;
    }
  }
  return decodeDownloadPayload(response, fallbackName, fallbackMimeType);
};

const saveDownloadFile = (file: DownloadFile) => {
  if (!file.blob && !file.url) {
    throw new Error("The document endpoint did not return a downloadable file.");
  }
  const url = file.url ?? URL.createObjectURL(file.blob!);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (!file.url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Flagged: "border-amber-200 bg-amber-50 text-amber-800",
    Rejected: "border-rose-200 bg-rose-50 text-rose-700",
    "Pending check": "border-sky-200 bg-sky-50 text-sky-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function CaseExecutorDocumentsPage() {
  const searchParams = useSearchParams();
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);
  const [documents, setDocuments] = useState<ExecutorDocument[]>([]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExecutorDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAssignedServices();
      const state = useCaseExecutorStore.getState();
      if (state.assignedServicesError) throw new Error(state.assignedServicesError);

      const assignedServices = state.assignedServices
        .map((service) => {
          const id = readServiceId(service);
          return {
            id,
            label: readServiceLabel(service),
            trackingNumber: readText(readValue(service, "serviceNumber", "trackingNumber", "caseNumber"), id),
          };
        })
        .filter((service) => service.id.length > 0);

      if (assignedServices.length === 0) {
        setStageOptions([]);
        setDocuments([]);
        return;
      }

      const [documentResults, stageResults] = await Promise.all([
        Promise.allSettled(
          assignedServices.map(async (service) => ({
            service,
            rows: unwrapRows(await CaseExecutorEndpoints.getServiceDocuments(service.id)),
          })),
        ),
        Promise.allSettled(
          assignedServices.map(async (service) => {
            const rows = unwrapRows(await CaseExecutorEndpoints.getServiceStages(service.id));
            const options: StageOption[] = [{
              key: `${service.id}:service`,
              shipmentId: service.id,
              stageId: "",
              serviceLabel: service.label,
              stageLabel: "Service document",
            }];
            rows.forEach((row, index) => {
              if (!isRecord(row)) return;
              const stageId = getStageId(row);
              if (!stageId) return;
              options.push({
                key: `${service.id}:${stageId}`,
                shipmentId: service.id,
                stageId,
                serviceLabel: service.label,
                stageLabel: getStageName(row, index),
              });
            });
            return { options };
          }),
        ),
      ]);
      const serviceStages = stageResults
        .filter((result): result is PromiseFulfilledResult<{ options: StageOption[] }> =>
          result.status === "fulfilled",
        )
        .map(({ value }) => value);
      setStageOptions(serviceStages.flatMap(({ options }) => options));
      const stageNames = new Map(
        serviceStages.flatMap(({ options }) =>
          options
            .filter((option) => option.stageId.length > 0)
            .map((option) => [`${option.shipmentId}:${option.stageId}`, option.stageLabel] as const),
        ),
      );

      const successfulDocumentResults = documentResults.filter(
        (result): result is PromiseFulfilledResult<{
          service: { id: string; label: string; trackingNumber: string };
          rows: unknown[];
        }> => result.status === "fulfilled",
      );
      const failedDocumentRequests = documentResults.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      const serviceDocuments = successfulDocumentResults.flatMap(({ value }) =>
        value.rows
          .map((document): ExecutorDocument | null => {
            const normalized = normalizeDocument(document);
            if (!normalized) return null;
            return {
              ...normalized,
              source: "service" as const,
              serviceId: normalized.serviceId || value.service.id,
              serviceTrackingNumber: normalized.serviceTrackingNumber === normalized.serviceId
                ? value.service.trackingNumber
                : normalized.serviceTrackingNumber,
              serviceStage: normalized.stageId
                ? stageNames.get(`${value.service.id}:${normalized.stageId}`) ?? normalized.serviceStage
                : "Service document",
            };
          })
          .filter((document): document is ExecutorDocument => document !== null),
      );
      setDocuments(serviceDocuments);
      if (failedDocumentRequests.length > 0) {
        const firstFailure = failedDocumentRequests[0];
        setError(
          `Could not load documents for ${failedDocumentRequests.length} assigned service(s): ${getErrorMessage(firstFailure.reason)}`,
        );
      }
    } catch (requestError: unknown) {
      setStageOptions([]);
      setDocuments([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [fetchAssignedServices]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDocuments();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchDocuments]);

  useEffect(() => {
    if (!preview) return;
    let active = true;
    let url: string | null = null;
    void Promise.resolve()
      .then(() => CaseExecutorEndpoints.downloadAssignedDocument(preview.id, preview.source))
      .then(async (response) => {
        const fileResult = await getDownloadFile(response, preview.name, preview.mimeType);
        if (!fileResult.blob && !fileResult.url) {
          throw new Error("The document endpoint did not return a previewable file.");
        }
        url = fileResult.url ?? URL.createObjectURL(fileResult.blob!);
        if (active) setPreviewUrl(url);
        else if (!fileResult.url) URL.revokeObjectURL(url);
      })
      .catch((previewError: unknown) => {
        if (active) setActionError(getErrorMessage(previewError));
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [preview]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((document) =>
      (!query || [
        document.name,
        document.type,
        document.serviceId,
        document.serviceTrackingNumber,
        document.stageId,
        document.uploadedBy,
        document.serviceStage,
        document.description ?? "",
        document.verificationNotes,
      ].some((field) => field.toLowerCase().includes(query))) &&
      (statusFilter === "ALL" || document.status === statusFilter) &&
      (typeFilter === "ALL" || document.type === typeFilter),
    );
  }, [documents, search, statusFilter, typeFilter]);

  const closePreview = () => {
    setPreview(null);
    setPreviewUrl(null);
    setActionError(null);
  };

  const downloadSelected = async (document: ExecutorDocument) => {
    setActionError(null);
    try {
      if (previewUrl && preview?.id === document.id) {
        if (!previewUrl.startsWith("blob:")) {
          saveDownloadFile({ blob: null, name: document.name, url: previewUrl });
          return;
        }
        const response = await fetch(previewUrl);
        if (response.status !== 200) {
          throw new Error("The document could not be downloaded. Please try again.");
        }
        const file = await validateDownloadBlob(
          await response.blob(),
          document.mimeType,
          document.name,
        );
        saveDownloadFile(file);
        return;
      }
      const file = await getDownloadFile(
        await CaseExecutorEndpoints.downloadAssignedDocument(document.id, document.source),
        document.name,
        document.mimeType,
      );
      saveDownloadFile(file);
    } catch (downloadError: unknown) {
      setActionError(getErrorMessage(downloadError));
    }
  };

  const downloadAll = async () => {
    const documentIds = filteredDocuments
      .filter((document) => document.source === "service")
      .map((document) => document.id);
    if (!documentIds.length) return;
    setActionError(null);
    setDownloadingAll(true);
    try {
      const response = await CaseExecutorEndpoints.downloadAssignedDocuments(documentIds);
      const result = await getDownloadFile(response, "case-executor-documents.zip", "application/zip");
      saveDownloadFile(result);
    } catch (downloadError: unknown) {
      setActionError(getErrorMessage(downloadError));
    } finally {
      setDownloadingAll(false);
    }
  };

  const uploadSelected = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    const stage = stageOptions.find((option) => option.key === selectedStage);
    if (!stage || !documentType || !file) {
      setActionError("Choose an assigned service, document type, and file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setActionError("File is too large. Maximum size is 25 MB.");
      return;
    }
    const form = new FormData();
    form.append("ServiceId", stage.shipmentId);
    if (stage.stageId) form.append("serviceStageId", stage.stageId);
    form.append("DocumentType", documentType);
    form.append("File", file, file.name);
    form.append("Description", description.trim());
    setUploading(true);
    try {
      await CaseExecutorEndpoints.uploadAssignedServiceDocument(form);
      setUploadOpen(false);
      setFile(null);
      setDescription("");
      setDocumentType("");
      await fetchDocuments();
    } catch (uploadError: unknown) {
      setActionError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const openPreview = (document: ExecutorDocument) => {
    setOpenActionMenu(null);
    setActionError(null);
    setPreviewUrl(null);
    setPreviewLoading(true);
    setPreview(document);
  };

  const verifyDocument = async (document: ExecutorDocument) => {
    setOpenActionMenu(null);
    setActionError(null);
    try {
      await CaseExecutorEndpoints.verifyAssignedDocument({
        documentId: document.id,
        source: document.source,
      });
      await fetchDocuments();
    } catch (verifyError: unknown) {
      setActionError(getErrorMessage(verifyError));
    }
  };

  const deleteDocument = async (document: ExecutorDocument) => {
    setOpenActionMenu(null);
    if (!window.confirm(`Delete ${document.name}?`)) return;
    setActionError(null);
    try {
      await CaseExecutorEndpoints.deleteAssignedDocument(document.id, document.source);
      await fetchDocuments();
    } catch (deleteError: unknown) {
      setActionError(getErrorMessage(deleteError));
    }
  };

  const verifiedCount = documents.filter((document) => document.status === "Verified").length;
  const flaggedCount = documents.filter((document) => document.status === "Flagged").length;
  const rejectedCount = documents.filter((document) => document.status === "Rejected").length;
  const availableTypes = [...new Set(documents.map((document) => document.type))].sort();
  const selectableStages = [...stageOptions].sort((left, right) =>
    `${left.serviceLabel} ${left.stageLabel}`.localeCompare(`${right.serviceLabel} ${right.stageLabel}`),
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Document centre</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Every file attached to an assigned service, with its verification state and available audit details.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{documents.length} documents</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{verifiedCount} verified</span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">{flaggedCount} flagged</span>
            <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-700">{rejectedCount} rejected</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadAll()}
            disabled={downloadingAll || filteredDocuments.length === 0}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {downloadingAll ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download filtered
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setUploadOpen(true);
            }}
            disabled={selectableStages.length === 0}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <UploadCloud className="size-4" /> Upload document
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => void fetchDocuments()} className="ml-auto font-semibold hover:underline">Retry</button>
        </div>
      )}
      {actionError && !uploadOpen && !preview && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            aria-label="Search documents"
            placeholder="Search by file name, service, or uploader"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select aria-label="Filter by document status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="ALL">All statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending check">Pending check</option>
          <option value="Flagged">Flagged</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select aria-label="Filter by document type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="ALL">All document types</option>
          {availableTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service / stage</th>
                <th className="px-4 py-3">Uploaded by</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading assigned documents…</td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">{error ? "Documents are unavailable until the request succeeds." : "No documents found for your assigned services."}</td></tr>
              ) : filteredDocuments.map((document) => (
                <tr key={`${document.source}-${document.id}`} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <button type="button" onClick={() => openPreview(document)} className="flex max-w-[280px] items-center gap-2.5 text-left font-semibold text-slate-800 hover:text-blue-700">
                      <span className="rounded-lg bg-slate-100 p-2 text-slate-500"><FileText className="size-4" /></span>
                      <span className="truncate">{document.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{document.type}</td>
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-blue-700">{document.serviceTrackingNumber || document.serviceId}</span>
                    <span className="block text-[11px] text-slate-400">{document.serviceStage}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{document.uploadedBy}</td>
                  <td className="px-4 py-3.5 text-slate-500">{formatDate(document.uploadedAt)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={document.status} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1 text-slate-400">
                      <button type="button" onClick={() => openPreview(document)} title={`Preview ${document.name}`} aria-label={`Preview ${document.name}`} className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700"><Eye className="size-4" /></button>
                      <button type="button" onClick={() => void downloadSelected(document)} title={`Download ${document.name}`} aria-label={`Download ${document.name}`} className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700"><Download className="size-4" /></button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenActionMenu((current) =>
                            current === `${document.source}-${document.id}` ? null : `${document.source}-${document.id}`,
                          )}
                          title={`More actions for ${document.name}`}
                          aria-label={`More actions for ${document.name}`}
                          aria-expanded={openActionMenu === `${document.source}-${document.id}`}
                          className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {openActionMenu === `${document.source}-${document.id}` && (
                          <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                            <button type="button" onClick={() => openPreview(document)} className="block w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">View details</button>
                            <button type="button" onClick={() => { setOpenActionMenu(null); void downloadSelected(document); }} className="block w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">Download</button>
                            {document.status === "Pending check" && !document.uploadedByCurrentUser && (
                              <button type="button" onClick={() => void verifyDocument(document)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"><BadgeCheck className="size-3.5" />Verify</button>
                            )}
                            {document.uploadedByCurrentUser && (
                              <button type="button" onClick={() => void deleteDocument(document)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"><Trash2 className="size-3.5" />Delete</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-500">Showing {filteredDocuments.length} of {documents.length} documents</div>
      </section>

      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false); }}>
          <form onSubmit={(event) => void uploadSelected(event)} className="w-full max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned services</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Upload document</h2></div>
              <button type="button" aria-label="Close upload form" onClick={() => setUploadOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
            </div>
            {actionError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>}
            <label className="block text-xs font-semibold text-slate-700">Assigned service or stage
              <select required value={selectedStage} onChange={(event) => setSelectedStage(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800">
                <option value="">Select an assigned service or stage</option>
                {selectableStages.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.serviceLabel}{stage.stageId ? ` · ${stage.stageLabel}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">Document type
              <select required value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800">
                <option value="">Select a document type</option>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">File <input required type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm font-normal text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold" /></label>
            <p className="text-xs text-slate-500">PDF, JPG, PNG, XLSX, XLS, or CSV · Maximum 25 MB</p>
            <label className="block text-xs font-semibold text-slate-700">Description <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setUploadOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{uploading && <LoaderCircle className="size-4 animate-spin" />}{uploading ? "Uploading…" : "Upload document"}</button>
            </div>
          </form>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="executor-document-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0"><h2 id="executor-document-title" className="truncate text-sm font-bold text-slate-900">{preview.name}</h2><p className="mt-1 text-xs text-slate-500">{preview.type} · {preview.uploadedAt} · {preview.uploadedBy}</p></div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => void downloadSelected(preview)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download className="size-3.5" />Download</button>
                <button type="button" onClick={closePreview} aria-label="Close document preview" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
              </div>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-slate-200 px-5 py-4 text-xs sm:grid-cols-4">
              <div><dt className="text-slate-500">Service / stage</dt><dd className="mt-1 font-medium text-slate-800">{preview.serviceTrackingNumber || preview.serviceId} · {preview.serviceStage}</dd></div>
              <div><dt className="text-slate-500">Verification</dt><dd className="mt-1"><StatusBadge status={preview.status} /></dd></div>
              {preview.verifiedBy && <div><dt className="text-slate-500">Reviewed by</dt><dd className="mt-1 font-medium text-slate-800">{preview.verifiedBy}</dd></div>}
              {preview.updatedAt && <div><dt className="text-slate-500">Last updated</dt><dd className="mt-1 font-medium text-slate-800">{formatDate(preview.updatedAt)}</dd></div>}
              {preview.verificationNotes && <div className="col-span-full"><dt className="text-slate-500">Verification notes</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{preview.verificationNotes}</dd></div>}
              {preview.description && <div className="col-span-full"><dt className="text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{preview.description}</dd></div>}
            </dl>
            <div className="flex min-h-[240px] flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
              {actionError ? <p role="alert" className="text-sm text-rose-700">{actionError}</p> : previewLoading ? <LoaderCircle className="size-6 animate-spin text-slate-400" /> : previewUrl && (preview.mimeType.startsWith("image/") || preview.mimeType === "application/pdf" || preview.name.toLowerCase().endsWith(".pdf")) ? <iframe title={`Preview ${preview.name}`} src={previewUrl} className="h-[70vh] w-full rounded bg-white" /> : <div className="text-center"><FileText className="mx-auto size-10 text-slate-400" /><p className="mt-2 text-sm text-slate-600">Preview is unavailable for this file type.</p></div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
