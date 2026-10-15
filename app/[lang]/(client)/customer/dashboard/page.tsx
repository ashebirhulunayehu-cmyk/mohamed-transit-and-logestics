"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LoaderCircle,
  Package,
  Plus,
  Truck,
  X,
} from "lucide-react";
import { CustomerPageHeader } from "@/features/customer/components/CustomerPageHeader";
import useAuthStore from "@/modules/auth/auth.store";

type ViewKey = "shipments" | "tax-records" | "documents" | "support-requests";
type TaxStatus = "Unpaid" | "Paid";
type TicketStatus = "Pending" | "Responded" | "Closed";

interface Shipment {
  id: string;
  trackingNumber: string;
  mode: string;
  assignedHub: string;
  status: string;
  origin: string;
  destination: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface StageExecution {
  id: string;
  shipmentId: string;
  stageName: string;
  description: string;
  status: string;
  sequence: number;
  isBlocked: boolean;
  requiresCustomerAction: boolean;
}

interface CustomerProfile {
  id: string;
  businessName: string;
  tinNumber: string;
  contactPerson: string;
  isVerified: boolean;
  verificationNotes: string;
}

interface TaxRecord {
  id: string;
  shipmentId: string | null;
  taxCategory: string;
  referenceNumber: string;
  assessedAmount: number;
  paidAmount: number;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  status: TaxStatus;
}

interface CustomerDocument {
  id: string;
  originalFileName: string;
  mimeType: string;
  isVerified: boolean;
  serviceId: string | null;
  downloadUrl: string | null;
}

interface SupportRequest {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
}

type ViewData =
  | {
      view: "shipments";
      data: {
        shipments: Shipment[];
        stages: StageExecution[];
        stagesError: string | null;
      };
    }
  | { view: "tax-records"; data: TaxRecord[] }
  | { view: "documents"; data: CustomerDocument[] }
  | { view: "support-requests"; data: SupportRequest[] };

const VIEW_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof Package }> = [
  { key: "shipments", label: "Shipments", icon: Truck },
  { key: "tax-records", label: "Tax records", icon: CircleDollarSign },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "support-requests", label: "Support requests", icon: ClipboardList },
];

const supportedViews: ViewKey[] = [
  "shipments",
  "tax-records",
  "documents",
  "support-requests",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const field = (record: Record<string, unknown>, ...names: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const extractRows = (value: unknown): Record<string, unknown>[] => {
  let candidate = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(candidate)) {
      if (!candidate.every(isRecord)) {
        throw new Error("The backend returned an invalid list.");
      }
      return candidate;
    }
    if (!isRecord(candidate)) break;
    candidate =
      candidate.data ??
      candidate.payload ??
      candidate.response ??
      candidate.result ??
      candidate.items ??
      candidate.records;
  }
  if (candidate === null || candidate === undefined) return [];
  throw new Error("The backend response did not contain a list.");
};

const readString = (record: Record<string, unknown>, ...names: string[]): string => {
  const value = field(record, ...names);
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
};

const readAmount = (record: Record<string, unknown>, ...names: string[]): number => {
  const value = field(record, ...names);
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const readBoolean = (record: Record<string, unknown>, ...names: string[]): boolean => {
  const value = field(record, ...names);
  if (value === true || value === 1) return true;
  if (
    value === false ||
    value === 0 ||
    value === null ||
    value === undefined
  ) {
    return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0" || normalized === "") {
      return false;
    }
  }
  throw new Error(`The backend returned an invalid ${names[0]} flag.`);
};

const requiredId = (record: Record<string, unknown>, ...names: string[]): string => {
  const id = readString(record, ...names).trim();
  if (!id) throw new Error(`The backend returned a record without ${names[0]}.`);
  return id;
};

const mapShipment = (record: Record<string, unknown>): Shipment => ({
  id: requiredId(record, "id", "shipmentId"),
  trackingNumber: readString(record, "trackingNumber", "trackingId", "serviceNumber"),
  mode: readString(record, "mode", "serviceType") || "Not specified",
  assignedHub: readString(record, "assignedHub", "hub") || "Not assigned",
  status: (() => {
    const status = field(record, "status", "statusName");
    if (typeof status === "number" || (typeof status === "string" && /^\d+$/.test(status))) {
      const labels: Record<number, string> = {
        0: "Pending",
        1: "InProgress",
        2: "Pending",
        3: "NeedsReview",
        4: "Completed",
      };
      return labels[Number(status)] ?? "Pending";
    }
    return typeof status === "string" && status.trim() ? status : "Pending";
  })(),
  origin: readString(record, "origin", "originPort", "countryOfOrigin") || "Not specified",
  destination: readString(record, "destination") || "Not specified",
  createdAt: readString(record, "createAt", "createdAt") || null,
  updatedAt: readString(record, "updatedAt") || null,
});

const mapStageExecution = (
  record: Record<string, unknown>,
): StageExecution => ({
  id: requiredId(record, "id", "serviceStageExecutionId"),
  shipmentId: readString(record, "shipmentId", "shipmentID"),
  stageName: readString(record, "stageName", "serviceStageName", "stage", "name", "title"),
  description: readString(record, "description", "notes", "comments", "blockReason"),
  status: readString(record, "status", "statusName") || "Pending",
  sequence: readAmount(record, "sequence", "stageOrder", "executionOrder", "order"),
  isBlocked: readBoolean(record, "isBlocked"),
  requiresCustomerAction: readBoolean(record, "requiresCustomerAction"),
});

const mapCustomerProfile = (record: Record<string, unknown>): CustomerProfile => ({
  id: readString(record, "id", "customerId"),
  businessName: readString(record, "businessName", "companyName"),
  tinNumber: readString(record, "tinNumber", "tin"),
  contactPerson: readString(record, "contactPerson", "fullName"),
  isVerified: readBoolean(record, "isVerified", "verified"),
  verificationNotes: readString(record, "verificationNotes"),
});

const mapTaxRecord = (record: Record<string, unknown>): TaxRecord => {
  const rawStatus = field(record, "status", "paymentStatus");
  const isPaid =
    rawStatus === 1 ||
    rawStatus === "1" ||
    rawStatus === true ||
    (typeof rawStatus === "string" && rawStatus.toLowerCase() === "paid");

  return {
    id: requiredId(record, "id", "taxRecordId"),
    shipmentId: readString(record, "shipmentId") || null,
    taxCategory: readString(record, "taxCategory") || "Tax",
    referenceNumber: readString(record, "referenceNumber", "reference") || "—",
    assessedAmount: readAmount(record, "assessedAmount"),
    paidAmount: readAmount(record, "paidAmount"),
    dueDate: readString(record, "dueDate") || null,
    paidAt: readString(record, "paidAt") || null,
    notes: readString(record, "notes") || null,
    status: isPaid ? "Paid" : "Unpaid",
  };
};

const mapDocument = (record: Record<string, unknown>): CustomerDocument => {
  const rawVerified = field(record, "isVerified", "verified");
  return {
    id: requiredId(record, "id", "documentId"),
    originalFileName:
      readString(record, "originalFileName", "fileName", "name") || "Uploaded document",
    mimeType: readString(record, "mimeType", "contentType") || "Unknown file type",
    isVerified:
      rawVerified === true ||
      rawVerified === 1 ||
      rawVerified === "1" ||
      (typeof rawVerified === "string" && rawVerified.toLowerCase() === "true"),
    serviceId: readString(record, "serviceId", "shipmentId") || null,
    downloadUrl: readString(record, "downloadUrl", "fileUrl", "url") || null,
  };
};

const mapTicket = (record: Record<string, unknown>): SupportRequest => {
  const rawStatus = readString(record, "status", "ticketStatus");
  const normalizedStatus = rawStatus.toLowerCase();
  const status: TicketStatus = normalizedStatus.includes("respond")
    ? "Responded"
    : normalizedStatus.includes("clos")
      ? "Closed"
      : "Pending";
  return {
    id: requiredId(record, "id", "ticketId"),
    subject: readString(record, "subject", "title") || "Support request",
    description: readString(record, "description", "message") || "",
    status,
    priority: readString(record, "priority") || "Normal",
  };
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);

async function readApiList<T>(
  endpoint: string,
  name: ViewKey,
  map: (record: Record<string, unknown>, index: number) => T,
  signal: AbortSignal,
  query = "",
): Promise<T[]> {
  const response = await fetch(`/api/customer/${endpoint}${query}`, {
    cache: "no-store",
    signal,
  });
  if (response.status === 204) return [];

  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      isRecord(body) && typeof body.error === "string"
        ? body.error
        : `Unable to load ${name}.`;
    throw new Error(message);
  }
  if (
    isRecord(body) &&
    body.state === "unavailable" &&
    typeof body.error === "string"
  ) {
    throw new Error(body.error);
  }
  return extractRows(body).map(map);
}

const extractRecord = (value: unknown): Record<string, unknown> => {
  let candidate = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!isRecord(candidate)) break;
    const wrapped =
      candidate.data ??
      candidate.payload ??
      candidate.response ??
      candidate.result;
    if (wrapped !== undefined) {
      candidate = wrapped;
      continue;
    }
    return candidate;
  }
  throw new Error("The customer profile endpoint returned an invalid record.");
};

async function readCustomerProfile(signal: AbortSignal): Promise<CustomerProfile | null> {
  const response = await fetch("/api/customer/profile", {
    cache: "no-store",
    signal,
  });
  if (response.status === 204) return null;

  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      isRecord(body) && typeof body.error === "string"
        ? body.error
        : "Unable to load the customer profile.",
    );
  }
  if (isRecord(body) && body.state === "not-found" && body.profile === null) {
    return null;
  }
  return mapCustomerProfile(extractRecord(body));
}

async function fetchViewData(view: ViewKey, signal: AbortSignal): Promise<ViewData> {
  if (view === "shipments") {
    const shipments = await readApiList("shipments", view, mapShipment, signal);
    let stages: StageExecution[] = [];
    let stagesError: string | null = null;
    if (shipments.length) {
      try {
        stages = await readApiList(
          "stages",
          view,
          mapStageExecution,
          signal,
          `?shipmentIds=${encodeURIComponent(shipments.map((shipment) => shipment.id).join(","))}`,
        );
      } catch (error: unknown) {
        stagesError =
          error instanceof Error
            ? error.message
            : "Unable to load shipment milestones.";
      }
    }
    return {
      view,
      data: {
        shipments,
        stages: stages
          .filter((stage) => shipments.some((shipment) => shipment.id === stage.shipmentId))
          .sort((a, b) => a.sequence - b.sequence),
        stagesError,
      },
    };
  }
  if (view === "tax-records") {
    return { view, data: await readApiList("tax", view, mapTaxRecord, signal) };
  }
  if (view === "documents") {
    const shipmentRows = await readApiList("shipments", "shipments", mapShipment, signal);
    const documentLists = await Promise.all(
      shipmentRows.map((shipment) =>
        readApiList(
          "documents",
          "documents",
          mapDocument,
          signal,
          `?serviceId=${encodeURIComponent(shipment.id)}`,
        ),
      ),
    );
    return { view, data: documentLists.flat() };
  }
  return { view, data: await readApiList("support", view, mapTicket, signal) };
}

function LoadingPanel() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      Loading live customer data…
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
      <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{message}</span>
      <button onClick={onRetry} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100">Retry</button>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const signedInUser = useAuthStore((state) => state.user);
  const { lang = "en" } = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const hasExplicitView = supportedViews.includes(requestedView as ViewKey);
  const activeView = hasExplicitView
    ? (requestedView as ViewKey)
    : "shipments";
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stageExecutions, setStageExecutions] = useState<StageExecution[]>([]);
  const [stageExecutionsError, setStageExecutionsError] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [taxRecordsLoaded, setTaxRecordsLoaded] = useState(false);
  const [taxRecordsError, setTaxRecordsError] = useState<string | null>(null);
  const [shipmentsLoaded, setShipmentsLoaded] = useState(false);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedView, setLoadedView] = useState<ViewKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorView, setErrorView] = useState<ViewKey | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<TaxRecord | null>(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const retryCustomerProfile = () => {
    setProfileLoading(true);
    setProfileError(null);
    setProfileNotFound(false);
    setProfileRetryCount((count) => count + 1);
  };

  const applyViewData = useCallback((result: ViewData) => {
    if (result.view === "shipments") {
      setShipments(result.data.shipments);
      setStageExecutions(result.data.stages);
      setStageExecutionsError(result.data.stagesError);
      setShipmentsLoaded(true);
    } else if (result.view === "tax-records") {
      setTaxRecords(result.data);
      setTaxRecordsLoaded(true);
      setTaxRecordsError(null);
    } else if (result.view === "documents") {
      setDocuments(result.data);
    } else {
      setTickets(result.data);
    }
    setLoadedView(result.view);
  }, []);

  const loadView = useCallback(async (view: ViewKey) => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setErrorView(null);
    try {
      applyViewData(await fetchViewData(view, controller.signal));
    } catch (loadError: unknown) {
      if (controller.signal.aborted) return;
      if (view === "tax-records") {
        setTaxRecordsLoaded(true);
        setTaxRecordsError(
          loadError instanceof Error ? loadError.message : "Unable to load tax records.",
        );
      }
      setLoadedView(view);
      setErrorView(view);
      setError(loadError instanceof Error ? loadError.message : "Unable to load customer data.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [applyViewData]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const profile = await readCustomerProfile(controller.signal);
        setCustomerProfile(profile);
        setProfileNotFound(profile === null);
        setProfileError(null);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setCustomerProfile(null);
        setProfileNotFound(false);
        setProfileError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to verify the customer profile.",
        );
      } finally {
        if (!controller.signal.aborted) setProfileLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [profileRetryCount]);

  useEffect(() => {
    if (profileLoading || !customerProfile?.isVerified) return;
    const controller = new AbortController();
    void readApiList("tax", "tax-records", mapTaxRecord, controller.signal)
      .then((records) => {
        setTaxRecords(records);
        setTaxRecordsLoaded(true);
        setTaxRecordsError(null);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setTaxRecordsLoaded(true);
        setTaxRecordsError(
          loadError instanceof Error ? loadError.message : "Unable to load tax records.",
        );
      });
    return () => controller.abort();
  }, [profileLoading, customerProfile?.isVerified]);

  useEffect(() => {
    if (profileLoading || !customerProfile?.isVerified) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        applyViewData(await fetchViewData(activeView, controller.signal));
        setError(null);
        setErrorView(null);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        if (activeView === "tax-records") {
          setTaxRecordsLoaded(true);
          setTaxRecordsError(
            loadError instanceof Error ? loadError.message : "Unable to load tax records.",
          );
        }
        setLoadedView(activeView);
        setErrorView(activeView);
        setError(loadError instanceof Error ? loadError.message : "Unable to load customer data.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [activeView, applyViewData, profileLoading, customerProfile?.isVerified]);

  const selectView = (view: ViewKey) => {
    if (view === activeView) {
      void loadView(view);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorView(null);
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.pushState({}, "", url);
  };

  const viewLoading = loading || loadedView !== activeView;
  const currentError = errorView === activeView ? error : null;

  const metrics = useMemo(() => {
    const pendingDuties = taxRecords
      .filter((record) => record.status === "Unpaid")
      .reduce((sum, record) => sum + Math.max(0, record.assessedAmount - record.paidAmount), 0);
    const actionsRequired =
      taxRecords.filter((record) => record.status === "Unpaid").length +
      stageExecutions.filter(
        (stage) => stage.isBlocked || stage.requiresCustomerAction,
      ).length;
    const completedShipments = shipments.filter((shipment) =>
      /complete|done|delivered/i.test(shipment.status),
    ).length;
    const activeShipments = shipments.filter(
      (shipment) => !/complete|done|delivered|cancel|reject/i.test(shipment.status),
    ).length;
    const actionDataUnavailable = Boolean(stageExecutionsError || taxRecordsError);
    return [
      { label: "Active services", value: shipmentsLoaded ? String(activeShipments) : "Loading…", icon: Truck },
      { label: "Awaiting your action", value: !shipmentsLoaded || !taxRecordsLoaded ? "Loading…" : actionDataUnavailable ? "Unavailable" : String(actionsRequired), icon: ClipboardList },
      { label: "Pending duties", value: !taxRecordsLoaded ? "Loading…" : taxRecordsError ? "Unavailable" : formatMoney(pendingDuties), icon: CircleDollarSign },
      { label: "Completed services", value: shipmentsLoaded ? String(completedShipments) : "Loading…", icon: Package },
    ];
  }, [
    shipments,
    stageExecutions,
    stageExecutionsError,
    taxRecords,
    shipmentsLoaded,
    taxRecordsLoaded,
    taxRecordsError,
  ]);
  const actionItems = useMemo(() => {
    const shipmentById = new Map(shipments.map((shipment) => [shipment.id, shipment]));
    const stages = stageExecutions
      .filter((stage) => stage.isBlocked || stage.requiresCustomerAction)
      .map((stage) => {
        const shipment = shipmentById.get(stage.shipmentId);
        return {
          id: `stage-${stage.id}`,
          title: stage.stageName || "Milestone update",
          detail: [
            shipment?.trackingNumber || null,
            stage.isBlocked ? "Blocked" : null,
            stage.requiresCustomerAction ? "Customer action required" : null,
          ].filter(Boolean).join(" · "),
          description: stage.description,
          href: `/${lang}/customer/dashboard?view=shipments`,
        };
      });
    const unpaidTaxes = taxRecords
      .filter((record) => record.status === "Unpaid")
      .map((record) => ({
        id: `tax-${record.id}`,
        title: record.taxCategory || "Unpaid duty",
        detail: `${record.referenceNumber} · ${formatMoney(Math.max(0, record.assessedAmount - record.paidAmount))} outstanding`,
        description: record.dueDate ? `Due ${record.dueDate}` : "",
        href: `/${lang}/customer/dashboard?view=tax-records`,
      }));
    return [...stages, ...unpaidTaxes];
  }, [lang, shipments, stageExecutions, taxRecords]);
  const recentShipments = useMemo(() => {
    const byRecentDate = (a: Shipment, b: Shipment) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    };
    const active = shipments
      .filter((shipment) => !/complete|done|delivered|cancel|reject/i.test(shipment.status))
      .sort(byRecentDate);
    const completed = shipments
      .filter((shipment) => /complete|done|delivered/i.test(shipment.status))
      .sort(byRecentDate);
    return { active: active.slice(0, 3), completed: completed.slice(0, 3) };
  }, [shipments]);

  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      subject: String(formData.get("subject") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      priority: String(formData.get("priority") ?? "Normal"),
    };
    if (!payload.subject || !payload.description) return;

    setTicketSubmitting(true);
    setTicketError(null);
    setTicketSuccess(false);
    try {
      const response = await fetch("/api/customer/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: unknown = response.status === 204 ? null : await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(body) && typeof body.error === "string"
            ? body.error
            : "Unable to create the support request.",
        );
      }
      setTicketSuccess(true);
      setTicketOpen(false);
      await loadView("support-requests");
    } catch (submitError: unknown) {
      setTicketError(
        submitError instanceof Error ? submitError.message : "Unable to create the support request.",
      );
    } finally {
      setTicketSubmitting(false);
    }
  };

  const title = customerProfile?.businessName || "Customer workspace";
  const activeLabel = VIEW_ITEMS.find((item) => item.key === activeView)?.label ?? "Dashboard";
  const signedInAccount =
    [signedInUser?.firstName, signedInUser?.lastName].filter(Boolean).join(" ") ||
    signedInUser?.username ||
    signedInUser?.email ||
    "";

  return (
    <>
      <CustomerPageHeader
        eyebrow="MOT Import Services"
        title={`Customer dashboard · ${title}`}
        description="Live shipment, duty, document and support information from your importer account."
      />
      <main className="mx-auto max-w-[1200px] space-y-6 p-5 sm:p-7">
        {profileLoading ? (
          <LoadingPanel />
        ) : profileNotFound ? (
          <section className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h2 className="font-semibold">This account is not linked to a customer profile</h2>
                <p className="mt-1 text-sm">
                  The signed-in account{signedInAccount ? ` (${signedInAccount})` : ""} has no customer profile in the backend.
                  Customer shipment and document data cannot be loaded for this account.
                </p>
                <p className="mt-2 text-sm">
                  Sign out and sign in with the customer/importer account linked to the importer profile.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={retryCustomerProfile}
              className="rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
            >
              Retry profile lookup
            </button>
          </section>
        ) : profileError ? (
          <ErrorPanel message={profileError} onRetry={retryCustomerProfile} />
        ) : !customerProfile?.isVerified ? (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h2 className="font-semibold">Customer profile verification required</h2>
                <p className="mt-1 text-sm">The secure importer workspace stays locked until the customer profile is verified.</p>
                {customerProfile?.verificationNotes && <p className="mt-2 text-sm">{customerProfile.verificationNotes}</p>}
                {customerProfile && <p className="mt-3 text-xs">TIN: {customerProfile.tinNumber || "Not provided"} · Contact: {customerProfile.contactPerson || "Not provided"}</p>}
              </div>
              <span className="ml-auto rounded-full bg-amber-200 px-3 py-1 text-xs font-bold">Not verified</span>
            </div>
          </section>
        ) : (
          <>
        {!hasExplicitView && (
          <div className="space-y-6">
            <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {customerProfile.businessName || "Customer account"}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {signedInAccount ? `Welcome back, ${signedInAccount}` : "Welcome to your dashboard"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Track your services, review outstanding actions, and manage your importer records.
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified importer{customerProfile.tinNumber ? ` · TIN ${customerProfile.tinNumber}` : ""}
                </p>
              </div>
              <Link
                href={`/${lang}/component/request-service`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                Request a service
              </Link>
            </section>

            {currentError && (
              <ErrorPanel
                message={currentError}
                onRetry={() => void loadView("shipments")}
              />
            )}

            {actionItems.length > 0 && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold">
                      {actionItems.length} item{actionItems.length === 1 ? "" : "s"} may need your attention
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Review service milestones and unpaid duties from your account records.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${lang}/customer/dashboard?view=shipments`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline"
                >
                  Review services <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, icon: Icon }) => (
                <section key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
                  </div>
                </section>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service progress</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">Active services</h2>
                  </div>
                  <Link
                    href={`/${lang}/customer/dashboard?view=shipments`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 px-5">
                  {viewLoading ? (
                    <div className="py-5"><LoadingPanel /></div>
                  ) : currentError ? (
                    <p className="py-5 text-sm text-slate-600">Service progress is unavailable until the shipment list loads.</p>
                  ) : recentShipments.active.length ? (
                    recentShipments.active.map((shipment) => {
                      const rows = stageExecutions.filter((stage) => stage.shipmentId === shipment.id);
                      const completedCount = rows.filter((stage) =>
                        /complete|done|delivered/i.test(stage.status),
                      ).length;
                      const progress = rows.length
                        ? Math.round((completedCount / rows.length) * 100)
                        : null;
                      return (
                        <article key={shipment.id} className="py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-mono text-sm font-bold text-blue-800">
                                {shipment.trackingNumber || "Tracking number unavailable"}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {shipment.origin} <span aria-hidden>→</span> {shipment.destination}
                              </p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                              {shipment.status}
                            </span>
                          </div>
                          {progress === null ? (
                            <p className="mt-3 text-xs text-slate-500">
                              {stageExecutionsError
                                ? "Milestone progress is unavailable."
                                : "No milestone records are available for this service."}
                            </p>
                          ) : (
                            <div className="mt-4">
                              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                                <span>{completedCount} of {rows.length} milestones complete</span>
                                <span className="font-semibold text-slate-700">{progress}%</span>
                              </div>
                              <div
                                className="h-2 overflow-hidden rounded-full bg-slate-100"
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Progress for ${shipment.trackingNumber || "service"}`}
                              >
                                <div
                                  className="h-full rounded-full bg-blue-600 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <p className="py-6 text-sm text-slate-500">
                      No active services were returned for this customer account.
                    </p>
                  )}
                  {stageExecutionsError && (
                    <p className="py-3 text-xs text-amber-800" role="status">
                      Milestone information is incomplete: {stageExecutionsError}
                    </p>
                  )}
                </div>
              </section>

              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Important updates</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">Items to review</h2>
                  </div>
                  <div className="divide-y divide-slate-100 px-5">
                    {taxRecordsError && (
                      <p className="py-3 text-xs text-amber-800" role="status">
                        Duty updates unavailable: {taxRecordsError}
                      </p>
                    )}
                    {!shipmentsLoaded || !taxRecordsLoaded ? (
                      <p className="py-5 text-sm text-slate-500">Loading account updates…</p>
                    ) : actionItems.length ? (
                      actionItems.slice(0, 4).map((item) => (
                        <Link key={item.id} href={item.href} className="block py-3 hover:bg-slate-50">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
                          {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
                        </Link>
                      ))
                    ) : !stageExecutionsError && !taxRecordsError ? (
                      <p className="py-5 text-sm text-slate-500">
                        No outstanding actions were returned by your account records.
                      </p>
                    ) : null}
                    {actionItems.length > 4 && (
                      <Link
                        href={`/${lang}/customer/dashboard?view=shipments`}
                        className="inline-flex items-center gap-1 py-3 text-xs font-semibold text-blue-700 hover:text-blue-900"
                      >
                        View all updates <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recently completed</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-950">Completed services</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 px-5">
                    {!shipmentsLoaded ? (
                      <p className="py-4 text-sm text-slate-500">Loading completed services…</p>
                    ) : recentShipments.completed.length ? (
                      recentShipments.completed.map((shipment) => (
                        <div key={shipment.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-sm font-semibold text-slate-900">
                              {shipment.trackingNumber || "Tracking number unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {shipment.updatedAt || shipment.createdAt || "Completion date unavailable"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {shipment.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-sm text-slate-500">
                        No completed services were returned for this account.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {hasExplicitView && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer workspace</p><h2 className="mt-1 text-lg font-bold text-slate-950">{activeLabel}</h2></div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Customer dashboard views">
              {VIEW_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeView === key}
                  onClick={() => selectView(key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeView === key ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {currentError && <ErrorPanel message={currentError} onRetry={() => void loadView(activeView)} />}
            {viewLoading ? <LoadingPanel /> : !currentError && activeView === "shipments" && (
              <div className="space-y-3">
                {shipments.length === 0 ? <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">No shipments were returned for this account.</p> : shipments.map((shipment) => {
                  const executionRows = stageExecutions.filter((stage) => stage.shipmentId === shipment.id);
                  const firstIncompleteIndex = executionRows.findIndex(
                    (stage) => !/complete|done|delivered/i.test(stage.status),
                  );
                  return (
                    <article key={shipment.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><h3 className="font-mono text-sm font-bold text-blue-800">{shipment.trackingNumber}</h3><p className="mt-1 text-sm text-slate-600">{shipment.origin} <span aria-hidden>→</span> {shipment.destination}</p></div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{shipment.status}</span>
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2"><p>Mode: <span className="font-medium text-slate-800">{shipment.mode}</span></p><p>Assigned hub: <span className="font-medium text-slate-800">{shipment.assignedHub}</span></p></div>
                      {executionRows.some((stage) => stage.isBlocked || stage.requiresCustomerAction) && (
                        <div className="mt-4 space-y-2">
                          {executionRows
                            .filter((stage) => stage.isBlocked || stage.requiresCustomerAction)
                            .map((stage) => (
                              <div key={stage.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-950" role="alert">
                                <p className="text-sm font-semibold">{stage.stageName}</p>
                                {stage.description && <p className="mt-1 text-xs">{stage.description}</p>}
                                <p className="mt-1 text-xs font-medium">
                                  {[stage.isBlocked ? "Blocked" : null, stage.requiresCustomerAction ? "Customer action required" : null].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                      {executionRows.length > 0 ? (
                        <ol className="mt-5 space-y-3">
                          {executionRows.map((stage, index) => {
                            const complete = /complete|done|delivered/i.test(stage.status);
                            const active = !complete && (firstIncompleteIndex < 0 || index === firstIncompleteIndex);
                            const color = stage.isBlocked
                              ? "bg-rose-100 text-rose-700"
                              : stage.requiresCustomerAction
                                ? "bg-amber-100 text-amber-800"
                                : complete
                                  ? "bg-emerald-100 text-emerald-700"
                                  : active
                                    ? "bg-blue-700 text-white"
                                    : "bg-slate-100 text-slate-400";
                            return (
                              <li key={stage.id} className="flex items-start gap-3">
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                                  {complete && !stage.isBlocked && !stage.requiresCustomerAction ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                </span>
                                <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{stage.stageName}</p>
                                    <span className="text-xs text-slate-500">{stage.status}</span>
                                  </div>
                                  {stage.description && <p className="mt-1 text-xs text-slate-600">{stage.description}</p>}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p className={`mt-5 rounded-lg p-3 text-xs ${stageExecutionsError ? "border border-amber-200 bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-500"}`}>
                          {stageExecutionsError
                            ? `Shipment milestones are unavailable: ${stageExecutionsError}`
                            : "No stage execution records are available for this shipment."}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {!viewLoading && !currentError && activeView === "tax-records" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr>{["Reference", "Shipment", "Category", "Assessed", "Paid", "Due date", "Status", "Payment"].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">{taxRecords.map((record) => <tr key={record.id}>
                    <td className="px-3 py-4 font-mono font-semibold">{record.referenceNumber}</td><td className="px-3 py-4">{record.shipmentId ?? "—"}</td><td className="px-3 py-4">{record.taxCategory}</td><td className="px-3 py-4">{formatMoney(record.assessedAmount)}</td><td className="px-3 py-4">{formatMoney(record.paidAmount)}</td><td className="px-3 py-4">{record.dueDate ?? "—"}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{record.status}</span>{record.paidAt && <p className="mt-1 text-xs text-slate-500">Paid {record.paidAt}</p>}{record.notes && <p className="mt-1 text-xs text-slate-500">{record.notes}</p>}</td>                    <td className="px-3 py-4">{record.status === "Unpaid" && <button onClick={() => setPaymentRecord(record)} className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800">Payment preview</button>}</td>
                  </tr>)}</tbody>
                </table>
                {taxRecords.length === 0 && <p className="p-5 text-sm text-slate-500">No tax records found.</p>}
              </div>
            )}

            {!viewLoading && !currentError && activeView === "documents" && (
              <div className="divide-y divide-slate-100">
                {documents.map((document) => <div key={document.id} className="flex flex-wrap items-center gap-3 py-4">
                  <FileText className="h-5 w-5 shrink-0 text-blue-700" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{document.originalFileName}</p><p className="mt-1 text-xs text-slate-500">{document.mimeType}{document.serviceId ? ` · Shipment ${document.serviceId}` : ""}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${document.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{document.isVerified ? "Verified" : "Awaiting review"}</span>
                  <a href={`/api/customer/documents?downloadId=${encodeURIComponent(document.id)}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-slate-50">Download</a>
                </div>)}
                {documents.length === 0 && <p className="py-5 text-sm text-slate-500">No documents found for your shipments.</p>}
              </div>
            )}

            {!viewLoading && !currentError && activeView === "support-requests" && (
              <div className="space-y-4">
                {ticketSuccess && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Your support request was submitted.</p>}
                {ticketError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{ticketError}</p>}
                <div className="flex justify-end"><button onClick={() => { setTicketError(null); setTicketOpen(true); }} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Create ticket</button></div>
                {tickets.map((ticket) => <article key={ticket.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">{ticket.subject}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{ticket.status} · {ticket.priority}</span></div><p className="mt-2 text-sm text-slate-600">{ticket.description}</p></article>)}
                {tickets.length === 0 && <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">No support requests found.</p>}
              </div>
            )}
          </div>
        </section>
        )}
          </>
        )}
      </main>

      {paymentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={(event) => { if (event.target === event.currentTarget) setPaymentRecord(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Payment preview</p><h2 id="payment-dialog-title" className="mt-1 text-lg font-bold text-slate-900">Tax assessment details</h2></div><button onClick={() => setPaymentRecord(null)} aria-label="Close payment dialog" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <dl className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Reference</dt><dd className="font-mono font-semibold">{paymentRecord.referenceNumber}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Category</dt><dd className="font-medium">{paymentRecord.taxCategory}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Outstanding amount</dt><dd className="font-bold">{formatMoney(Math.max(0, paymentRecord.assessedAmount - paymentRecord.paidAmount))}</dd></div></dl>
            <p role="status" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Preview only. A payment provider is not connected, no payment will be submitted, and this invoice will remain unpaid.
            </p>
            <button type="button" onClick={() => setPaymentRecord(null)} className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Close preview
            </button>
          </section>
        </div>
      )}

      {ticketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={(event) => { if (event.target === event.currentTarget && !ticketSubmitting) setTicketOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="ticket-dialog-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Customer support</p><h2 id="ticket-dialog-title" className="mt-1 text-lg font-bold">Create a support ticket</h2></div><button disabled={ticketSubmitting} onClick={() => setTicketOpen(false)} aria-label="Close ticket form" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <form className="mt-5 space-y-4" onSubmit={submitTicket}>
              <label className="block text-sm font-medium text-slate-700">Subject<input name="subject" required minLength={5} maxLength={200} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-slate-700">Description<textarea name="description" required minLength={10} maxLength={4000} rows={5} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-slate-700">Priority<select name="priority" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"><option>Normal</option><option>Low</option><option>High</option><option>Urgent</option></select></label>
              {ticketError && <p role="alert" className="text-sm text-rose-700">{ticketError}</p>}
              <button disabled={ticketSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{ticketSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}Submit request</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
