'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileDown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserCircle,
  UsersRound,
} from "lucide-react";
import {
	getEncoderServiceDraft,
	saveEncoderServiceDraft,
	deleteEncoderServiceDraft,
	type EncoderServiceDraft,
} from "@/modules/dataencoder/data-encoder.drafts";
import useAuthStore from "@/modules/auth/auth.store";
import {
	useDataEncoderStore,
	type DataEncoderDashboardMetric,
} from "@/modules/dataencoder/data-encoder.store";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";
import { useNotificationStore } from "@/features/notifications/notification.store";
import {
	readCreatedServiceId,
	readCreatedServiceIdFromLocation,
	readJsonResponse,
} from "@/modules/dataencoder/data-encoder.response";
import EncoderRoleSwitcher from "@/components/data-encoder/EncoderRoleSwitcher";

interface EncoderCustomer extends Record<string, unknown> {
  id: string;
  businessName: string;
  tinNumber: string;
  businessLicense: string;
  contactPerson: string;
  isVerified: boolean;
}

interface CreatedCustomer {
  id: string;
  businessName: string;
  tinNumber: string;
  isVerified: boolean;
  recordStatus: string;
  createdAt: string;
}

interface PendingEncoderService {
  id: string;
  serviceType: number;
  serviceTypeUpdated: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const findValue = (record: Record<string, unknown>, ...names: string[]) => {
  const key = Object.keys(record).find((candidate) =>
    names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const toText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const toBoolean = (value: unknown) =>
  value === true || value === 1 || value === "1" ||
  (typeof value === "string" && value.trim().toLowerCase() === "true");

const unwrapRows = (value: unknown): Record<string, unknown>[] => {
  let candidate = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(candidate)) {
      if (!candidate.every(isRecord)) throw new Error("The backend returned an invalid record list.");
      return candidate;
    }
    if (!isRecord(candidate)) break;
    const key = Object.keys(candidate).find((name) =>
      ["data", "payload", "response", "items", "customers", "requirements", "result"].includes(
        name.toLowerCase(),
      ),
    );
    if (!key) break;
    candidate = candidate[key];
  }
  throw new Error("The backend response did not contain a record list.");
};

const readResponseError = (body: unknown, fallback: string) => {
  if (typeof body === "string" && body.trim()) return body;
  if (!isRecord(body)) return fallback;
  for (const key of ["message", "detail", "error", "title"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  if (Array.isArray(body.errors)) {
    const messages = body.errors.filter(
      (value): value is string => typeof value === "string" && Boolean(value.trim()),
    );
    if (messages.length) return messages.join("; ");
  }
  if (isRecord(body.errors)) {
    const messages = Object.entries(body.errors).flatMap(([field, value]) =>
      Array.isArray(value)
        ? value
            .filter((message): message is string => typeof message === "string")
            .map((message) => `${field}: ${message}`)
        : [],
    );
    if (messages.length) return messages.join("; ");
  }
  return fallback;
};

const readCreatedCustomer = (value: unknown): CreatedCustomer | null => {
  let candidate = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!isRecord(candidate)) return null;

    const id = findValue(candidate, "id", "customerId");
    const businessName = findValue(candidate, "businessName", "companyName");
    if (id !== undefined && businessName !== undefined) {
      return {
        id: toText(id),
        businessName: toText(businessName),
        tinNumber: toText(findValue(candidate, "tinNumber", "tin")),
        isVerified: toBoolean(findValue(candidate, "isVerified", "verified")),
        recordStatus: toText(findValue(candidate, "recordStatus")),
        createdAt: toText(findValue(candidate, "createAt", "createdAt")),
      };
    }

    const nested = findValue(candidate, "response", "data", "payload", "result");
    if (!isRecord(nested)) return null;
    candidate = nested;
  }
  return null;
};

const mapEncoderCustomer = (record: Record<string, unknown>, index: number): EncoderCustomer => ({
  ...record,
  id: toText(findValue(record, "id", "customerId")) || `customer-${index + 1}`,
  businessName: toText(findValue(record, "businessName", "companyName")),
  tinNumber: toText(findValue(record, "tinNumber", "tin", "tinNumber")),
  businessLicense: toText(findValue(record, "businessLicense", "licenseNumber")),
  contactPerson: toText(findValue(record, "contactPerson", "fullName")),
  isVerified: toBoolean(findValue(record, "isVerified", "verified")),
});

const readText = (...values: unknown[]): string => {
  const value = values.find(
    (candidate) =>
      (typeof candidate === "string" && candidate.trim()) ||
      typeof candidate === "number",
  );

  return value === undefined ? "" : String(value).trim();
};

const getRelatedName = (value: unknown): string => {
  if (!value || typeof value !== "object") {
    return readText(value);
  }

  const record = value as Record<string, unknown>;
  return readText(record.businessName, record.name, record.companyName);
};

const formatDate = (...values: unknown[]): string => {
  const value = readText(...values);
  if (!value) return "Date unavailable";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getStatusTone = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("complete")) return "success";
  if (normalized.includes("pending") || normalized.includes("draft")) return "warning";
  return "info";
};

const getDashboardServiceStatus = (value: unknown): string => {
  if (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value.trim()))) {
    const status = Number(value);
    if (status === 1) return "Pending";
    if (status === 2) return "In progress";
    if (status === 3) return "Needs review";
    if (status === 4) return "Completed";
    if (status === 5) return "Blocked";
  }
  return readText(value) || "Created";
};

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const palette = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-blue-50 text-blue-700",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${palette[tone as keyof typeof palette] ?? palette.info}`}
    >
      {label}
    </span>
  );
}

export default function DataEncoderDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const locale = firstSegment === "am" || firstSegment === "en" ? firstSegment : "en";
  const encoderBase = `/${locale}/admin/data-encoder`;
  const createServiceHref = `${encoderBase}/services/new`;
  const isStandaloneDashboard = pathname.includes("/admin/data-encoder/dashboard");
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const authenticatedUserId = useAuthStore((state) => state.user?.id);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notificationsLoading = useNotificationStore((state) => state.loading);
  const notificationsError = useNotificationStore((state) => state.error);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markNotificationRead = useNotificationStore((state) => state.markAsRead);
  const { dashboardData, unavailableMetrics, loading, error, fetchDashboard } = useDataEncoderStore();
  const [customers, setCustomers] = useState<EncoderCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [shipmentSubmitting, setShipmentSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<CreatedCustomer | null>(null);
  const [pendingService, setPendingService] = useState<PendingEncoderService | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const shipmentFormRef = useRef<HTMLFormElement>(null);
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || user?.email?.split("@")[0] || "Data Encoder";
  const userInitials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "DE";

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/auth/login`);
  };

  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const response = await fetch("/api/encoder/customers?recordStatus=1", {
        cache: "no-store",
      });
      const body: unknown = response.status === 204 ? [] : await response.json();
      if (!response.ok) {
        throw new Error(readResponseError(body, `Customer list failed (${response.status}).`));
      }
      const rows = unwrapRows(body).map(mapEncoderCustomer);
      setCustomers(rows);
    } catch (loadError: unknown) {
      setCustomers([]);
      setCustomersError(
        loadError instanceof Error ? loadError.message : "Unable to load encoder customer records.",
      );
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (isStandaloneDashboard) return;
    const timeoutId = window.setTimeout(() => void fetchCustomers(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchCustomers, isStandaloneDashboard]);

  useEffect(() => {
    if (isStandaloneDashboard) return;
    if (customersLoading || typeof window === "undefined") return;
    const timeoutId = window.setTimeout(() => {
      const draftId = new URLSearchParams(window.location.search).get("draftId");
      if (!draftId) return;

      try {
        const draft = getEncoderServiceDraft(draftId);
        if (!draft || !shipmentFormRef.current) {
          setFormError("This saved draft could not be found in this browser.");
          return;
        }
        const values: Record<string, string> = {
          customerId: draft.customerId,
          serviceType: draft.serviceType,
          routeCategory: draft.routeCategory,
          itemDescription: draft.itemDescription,
          countryOfOrigin: draft.countryOfOrigin,
          declaredValue: draft.declaredValue,
          taxCategory: draft.taxCategory,
        };
        for (const [name, value] of Object.entries(values)) {
          const field = shipmentFormRef.current.elements.namedItem(name);
          if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
            field.value = value;
          }
        }
        setActiveDraftId(draft.id);
        setFormSuccess(`Resumed draft ${draft.id}. Changes are not saved until you choose Save draft.`);
      } catch (loadError: unknown) {
        setFormError(
          loadError instanceof Error ? loadError.message : "Unable to open the saved draft.",
        );
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [customersLoading, isStandaloneDashboard]);

  const submitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setCreatedCustomer(null);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = Object.fromEntries(fields.entries());
    const userId = Number(authenticatedUserId);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      setFormError("Your authenticated user ID is unavailable. Sign in again, then retry customer creation.");
      return;
    }
    payload.userId = String(userId);
    setCustomerSubmitting(true);
    try {
      const response = await fetch("/api/encoder/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJsonResponse(response);
      if (
        !response.ok ||
        (isRecord(body) &&
          (body.error === true ||
            body.isError === true ||
            (typeof body.statusCode === "number" && body.statusCode >= 400)))
      ) {
        throw new Error(
          readResponseError(body, `Customer registration failed (${response.status}).`),
        );
      }
      const customer = readCreatedCustomer(body);
      setCreatedCustomer(customer);
      setFormSuccess(
        customer
          ? `Customer ${customer.businessName || "record"} was created successfully.`
          : "Customer onboarding record was submitted successfully.",
      );
      form.reset();
      await Promise.all([fetchCustomers(), fetchDashboard()]);
    } catch (submitError: unknown) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Unable to create customer record.",
      );
    } finally {
      setCustomerSubmitting(false);
    }
  };

  const submitShipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setCreatedCustomer(null);
    setShipmentSubmitting(true);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const serviceType = String(fields.get("serviceType") ?? "Multimodal");
    const routeCategory = String(fields.get("routeCategory") ?? "");
    const customerId = String(fields.get("customerId") ?? "");
    const customer = customers.find((entry) => entry.id === customerId);
    const serviceTypeValue = serviceType === "Unimodal" ? 1 : 0;
    const notes = [
      `Importer: ${customer?.businessName ?? ""} (TIN: ${customer?.tinNumber ?? ""})`,
      `Goods description: ${String(fields.get("itemDescription") ?? "").trim()}`,
      `Route category: ${routeCategory}`,
      `Country of origin: ${String(fields.get("countryOfOrigin") ?? "").trim()}`,
      `Declared value: ${String(fields.get("declaredValue") ?? "")}`,
      `Tax category: ${String(fields.get("taxCategory") ?? "General").trim() || "General"}`,
    ].join("\n");
    let service = pendingService;
    try {
      if (!service) {
        const response = await fetch("/api/encoder/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: "",
            contactPerson: toText(findValue(customer ?? {}, "contactPerson", "fullName")),
            email: toText(findValue(customer ?? {}, "contactEmail", "email")),
            phone: toText(findValue(customer ?? {}, "contactPhone", "phone")),
            notes,
          }),
        });
        const body = await readJsonResponse(response);
        if (
          !response.ok ||
          (isRecord(body) &&
            (body.error === true ||
              body.isError === true ||
              (typeof body.statusCode === "number" && body.statusCode >= 400)))
        ) {
          throw new Error(readResponseError(body, `Service creation failed (${response.status}).`));
        }
        const id =
          readCreatedServiceId(body) ||
          readCreatedServiceIdFromLocation(response.headers.get("Location"));
        if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
          throw new Error("The service was created, but its ID was not returned. Contact support before retrying to avoid creating a duplicate.");
        }
        service = { id, serviceType: serviceTypeValue, serviceTypeUpdated: false };
        setPendingService(service);
      }

      if (!service.serviceTypeUpdated) {
        await DataEncoderEndpoints.updateServiceType(service.id, {
          serviceType: service.serviceType,
        });
        service = { ...service, serviceTypeUpdated: true };
        setPendingService(service);
      }

      const submitResponse = await fetch(`/api/encoder/services/${encodeURIComponent(service.id)}/submit`, {
        method: "POST",
      });
      const submitBody = await readJsonResponse(submitResponse);
      if (
        !submitResponse.ok ||
        (isRecord(submitBody) &&
          (submitBody.error === true ||
            submitBody.isError === true ||
            (typeof submitBody.statusCode === "number" && submitBody.statusCode >= 400)))
      ) {
        throw new Error(readResponseError(submitBody, `Service submission failed (${submitResponse.status}).`));
      }

      let successMessage = "Service submitted successfully.";
      if (activeDraftId) {
        try {
          deleteEncoderServiceDraft(activeDraftId);
          setActiveDraftId(null);
          window.history.replaceState(null, "", window.location.pathname);
          successMessage = "Service submitted successfully and its saved draft was removed.";
        } catch (draftError: unknown) {
          successMessage = `Service submitted, but draft ${activeDraftId} could not be removed from this browser: ${
            draftError instanceof Error ? draftError.message : "storage error"
          }`;
        }
      }
      setPendingService(null);
      setFormSuccess(successMessage);
      form.reset();
      void fetchDashboard();
      const servicesHref = `${encoderBase}/services`;
      router.push(`${servicesHref}?serviceId=${encodeURIComponent(service.id)}`);
    } catch (submitError: unknown) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Unable to submit this service.",
      );
    } finally {
      setShipmentSubmitting(false);
    }
  };

  const saveShipmentDraft = () => {
    const form = shipmentFormRef.current;
    if (!form) return;
    setFormError(null);
    setFormSuccess(null);
    setCreatedCustomer(null);
    const fields = new FormData(form);
    const now = new Date().toISOString();
    const draftId =
      activeDraftId ??
      `DRF-${now.slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    try {
      const existing = activeDraftId ? getEncoderServiceDraft(activeDraftId) : undefined;
      const draft: EncoderServiceDraft = {
        id: draftId,
        type: "Service",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        customerId: String(fields.get("customerId") ?? "").trim(),
        serviceType: String(fields.get("serviceType") ?? "").trim(),
        routeCategory: String(fields.get("routeCategory") ?? "").trim(),
        itemDescription: String(fields.get("itemDescription") ?? "").trim(),
        countryOfOrigin: String(fields.get("countryOfOrigin") ?? "").trim(),
        declaredValue: String(fields.get("declaredValue") ?? "").trim(),
        taxCategory: String(fields.get("taxCategory") ?? "").trim(),
      };
      saveEncoderServiceDraft(draft);
      setActiveDraftId(draft.id);
      setFormSuccess(`Draft ${draft.id} saved in this browser.`);
      void fetchDashboard();
    } catch (saveError: unknown) {
      setFormError(
        saveError instanceof Error ? saveError.message : "Unable to save this draft.",
      );
    }
  };

  const metrics: {
    metric: DataEncoderDashboardMetric;
    title: string;
    value: number;
    tone: "default" | "warning" | "success";
    icon: typeof FolderOpen;
  }[] = [
    { metric: "totalCustomersCreated", title: "Customers created", value: dashboardData.totalCustomersCreated, tone: "default", icon: FolderOpen },
    { metric: "pendingCustomerApprovals", title: "Pending customer approvals", value: dashboardData.pendingCustomerApprovals, tone: "warning", icon: CircleAlert },
    { metric: "totalServicesCreated", title: "Services created", value: dashboardData.totalServicesCreated, tone: "default", icon: Clock3 },
    { metric: "pendingServiceApprovals", title: "Pending service approvals", value: dashboardData.pendingServiceApprovals, tone: "warning", icon: ShieldCheck },
    { metric: "draftServices", title: "Draft services", value: dashboardData.draftServices, tone: "success", icon: Check },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-dvh w-[270px] flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:h-screen ${
          sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[270px]"
        } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-200 px-4">
          <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            M
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p>
              <p className="text-xs text-slate-500">Data Operations</p>
            </div>
          )}
          </div>
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav aria-label="Data Encoder navigation" className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-6">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Overview
              </p>
            )}
            <Link
              href={`${encoderBase}/dashboard`}
              title={sidebarCollapsed ? "Dashboard" : undefined}
              onClick={() => {
                setActiveSection("overview");
                setMobileSidebarOpen(false);
              }}
              aria-current={activeSection === "overview" ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeSection === "overview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard
                className={`h-[19px] w-[19px] shrink-0 ${
                  activeSection === "overview" ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                }`}
                strokeWidth={1.9}
              />
              {!sidebarCollapsed && <span className="truncate">Dashboard</span>}
            </Link>
          </div>
          <div>
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Capture operations
              </p>
            )}
            <div className="space-y-1">
              {[
                { label: "Customers", href: `${encoderBase}/customers`, id: "customers", Icon: UsersRound },
                { label: "Create service", href: createServiceHref, id: "create-service", Icon: BriefcaseBusiness },
                { label: "Services", href: `${encoderBase}/services`, id: "services", Icon: BriefcaseBusiness },
                { label: "Draft services", href: `${encoderBase}/draft-services`, id: "draft-services", Icon: FileText },
              ].map(({ label, href, id, Icon }) => {
                const active = activeSection === id;
                return (
                  <Link
                    key={href}
                    href={href}
                    title={sidebarCollapsed ? label : undefined}
                    onClick={() => {
                      setActiveSection(id);
                      setMobileSidebarOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-[19px] w-[19px] shrink-0 ${
                        active ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                      }`}
                      strokeWidth={1.9}
                    />
                    {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="mt-6">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Documents
              </p>
            )}
            <div className="space-y-1">
              {[
                { label: "Documents", href: `${encoderBase}/documents`, id: "documents", Icon: FolderOpen },
                { label: "Bulk Upload", href: `${encoderBase}/bulk-upload`, id: "bulk-upload", Icon: UploadCloud },
                { label: "Service document library", href: `${encoderBase}/templates`, id: "templates", Icon: FileDown },
              ].map(({ label, href, id, Icon }) => {
                const active = activeSection === id;
                return (
                  <Link
                    key={id}
                    href={href}
                    title={sidebarCollapsed ? label : undefined}
                    onClick={() => {
                      setActiveSection(id);
                      setMobileSidebarOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-[19px] w-[19px] shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} strokeWidth={1.9} />
                    {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="mt-6">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Communication
              </p>
            )}
            <div className="space-y-1">
              {[
                { label: "Messages", href: `${encoderBase}/messages`, id: "messages", Icon: MessageSquare },
                { label: "Notifications", href: `${encoderBase}/notifications`, id: "notifications", Icon: Bell },
              ].map(({ label, href, id, Icon }) => (
                <Link
                  key={id}
                  href={href}
                  title={sidebarCollapsed ? label : undefined}
                  onClick={() => {
                    setActiveSection(id);
                    setMobileSidebarOpen(false);
                  }}
                  aria-current={activeSection === id ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    activeSection === id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] shrink-0 ${
                      activeSection === id ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                    }`}
                    strokeWidth={1.9}
                  />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Account
              </p>
            )}
            <Link
              href={`${encoderBase}/profile`}
              title={sidebarCollapsed ? "Profile" : undefined}
              onClick={() => {
                setActiveSection("profile");
                setMobileSidebarOpen(false);
              }}
              aria-current={activeSection === "profile" ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeSection === "profile"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <UserCircle className={`h-[19px] w-[19px] shrink-0 ${activeSection === "profile" ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} strokeWidth={1.9} />
              {!sidebarCollapsed && <span className="truncate">Profile</span>}
            </Link>
          </div>
        </nav>
        <div className="border-t border-slate-200 p-3">
          <EncoderRoleSwitcher collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <div className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[270px]"}`}>
        <div className="mx-auto max-w-[1600px]">
          <section className="flex min-h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
              <div className="flex h-[64px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[76px]">
                <button
                  type="button"
                  aria-label="Open navigation"
                  aria-expanded={mobileSidebarOpen}
                  onClick={() => setMobileSidebarOpen(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                    <span>Data Encoder</span><ChevronRight className="h-4 w-4 text-slate-300" />
                    <span className="font-medium text-slate-900">Dashboard</span>
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-900 sm:hidden">Data Encoder Dashboard</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className={`h-2 w-2 rounded-full ${error ? 'bg-amber-500' : loading ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-medium text-slate-600">{error ? 'Sync issue' : loading ? 'Updating' : 'Live data'}</span>
                  </div>
                  <details
                    className="relative"
                    onToggle={(event) => {
                      if (event.currentTarget.open) void fetchNotifications();
                    }}
                  >
                    <summary aria-label="Notifications" className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                      <Bell className="h-[19px] w-[19px]" />
                      {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
                    </summary>
                    <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                        <span className="text-xs text-slate-500">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                        {notificationsLoading ? (
                          <p className="px-4 py-8 text-center text-xs text-slate-500">Loading notifications...</p>
                        ) : notificationsError ? (
                          <p role="alert" className="px-4 py-5 text-xs text-rose-700">{notificationsError}</p>
                        ) : notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications available.</p>
                        ) : notifications.slice(0, 4).map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => { if (!notification.isRead) void markNotificationRead(notification.id); }}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${notification.isRead ? "bg-white" : "bg-blue-50/30"}`}
                          >
                            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-blue-600"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-slate-800">{notification.title}</span>
                              <span className="mt-0.5 block text-xs leading-5 text-slate-600">{notification.description}</span>
                              <span className="mt-1 block text-[10px] text-slate-400">{notification.category} · {notification.time}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <Link href={`${encoderBase}/notifications`} className="block border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100">
                        Open notification centre
                      </Link>
                    </div>
                  </details>
                  <details className="relative">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-xs font-semibold text-blue-700">{userInitials}</span>
                      <span className="hidden min-w-0 text-left sm:block">
                        <span className="block max-w-32 truncate text-xs font-semibold text-slate-900">{userName}</span>
                        <span className="block text-[10px] text-slate-500">Data Encoder</span>
                      </span>
                      <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
                    </summary>
                    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 px-3 py-3">
                        <p className="truncate text-xs font-semibold text-slate-900">{userName}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email || user?.username || "Data Encoder"}</p>
                      </div>
                      <Link href={`${encoderBase}/profile`} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
                        <Settings className="h-4 w-4 text-slate-500" />
                        Profile &amp; security
                      </Link>
                      <div className="border-t border-slate-100 p-1.5">
                        <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">
                          <LogOut className="h-4 w-4 text-slate-500" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-6 px-4 py-5 sm:px-6 lg:px-8">
              <section id="overview" className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      <span>Ministry of Transport</span><span className="text-slate-300">/</span><span>Data Operations</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Data Encoder Dashboard</h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Customer onboarding, cargo entry, and operational records returned by the backend.</p>
                    {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${error ? 'bg-amber-500' : loading ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <span className="text-sm font-medium text-slate-600">{error ? 'Sync issue' : loading ? 'Updating' : 'Live data'}</span>
                  </div>
                </div>
              </section>

              {!isStandaloneDashboard && (formError || formSuccess) && (
                <div
                  role={formError ? "alert" : "status"}
                  className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
                    formError
                      ? "border-rose-200 bg-rose-50 text-rose-900"
                      : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  {formError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p>{formError ?? formSuccess}</p>
                    {!formError && createdCustomer && (
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="inline font-semibold">Customer ID: </dt>
                          <dd className="inline">{createdCustomer.id || "Not returned"}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">TIN: </dt>
                          <dd className="inline">{createdCustomer.tinNumber || "Not returned"}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">Verification: </dt>
                          <dd className="inline">
                            {createdCustomer.isVerified ? "Verified" : "Awaiting verification"}
                          </dd>
                        </div>
                        {createdCustomer.recordStatus && (
                          <div>
                            <dt className="inline font-semibold">Record status: </dt>
                            <dd className="inline">{createdCustomer.recordStatus}</dd>
                          </div>
                        )}
                        {createdCustomer.createdAt && (
                          <div>
                            <dt className="inline font-semibold">Created: </dt>
                            <dd className="inline">{formatDate(createdCustomer.createdAt)}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </div>
              )}

              {!isStandaloneDashboard && (
              <section className="grid gap-6 xl:grid-cols-2">
                <form id="customer-registration" onSubmit={submitCustomer} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Phase 2 · Importer onboarding</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">Register customer</h2>
                      <p className="mt-1 text-xs text-slate-500">New customer records remain unavailable for shipment creation until they are verified and included in the active customer list.</p>
                    </div>
                    <UsersRound className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["businessName", "Business name", "text"],
                      ["tinNumber", "TIN number", "text"],
                      ["businessLicense", "Business license", "text"],
                      ["businessType", "Business type", "text"],
                      ["contactPerson", "Contact person", "text"],
                      ["contactPhone", "Contact phone", "tel"],
                      ["contactEmail", "Contact email", "email"],
                      ["importLicense", "Import license", "text"],
                      ["city", "City", "text"],
                      ["state", "State / region", "text"],
                      ["postalCode", "Postal code", "text"],
                    ].map(([name, label, type]) => (
                      <label key={name} className="block text-xs font-medium text-slate-700">
                        {label}
                        <input
                          name={name}
                          type={type}
                          required
                          maxLength={160}
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    ))}
                    <label className="block text-xs font-medium text-slate-700">
                      Import license expiry
                      <input name="importLicenseExpiry" type="date" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
                      Business address
                      <textarea name="businessAddress" required maxLength={500} rows={2} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                  </div>
                  <button type="submit" disabled={customerSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                    {customerSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {customerSubmitting ? "Saving customer…" : "Create customer record"}
                  </button>
                </form>

                <div className="space-y-5">
                  <form ref={shipmentFormRef} id="service-registration" onSubmit={submitShipment} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Phase 3 · Cargo entry</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950">Create shipment</h2>
                      </div>
                      <BriefcaseBusiness className="h-5 w-5 text-blue-700" />
                    </div>
                    <label className="block text-xs font-medium text-slate-700">
                      Customer
                      <select name="customerId" required defaultValue="" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                        <option value="" disabled>Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.businessName || customer.id} · {customer.tinNumber || "TIN unavailable"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium text-slate-700">
                        Service type
                        <select
                          name="serviceType"
                          required
                          defaultValue="Multimodal"
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        >
                          <option value="Multimodal">Multimodal</option>
                          <option value="Unimodal">Unimodal</option>
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-slate-700">
                        Route category
                        <select name="routeCategory" required defaultValue="Mojo" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                          <option>Mojo</option>
                          <option>Adama</option>
                          <option>Djibouti</option>
                          <option>Semera</option>
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
                        Goods description
                        <input name="itemDescription" required maxLength={500} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                      </label>
                      <label className="block text-xs font-medium text-slate-700">
                        Country of origin
                        <input name="countryOfOrigin" required maxLength={120} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                      </label>
                      <label className="block text-xs font-medium text-slate-700">
                        Declared value
                        <input name="declaredValue" type="number" min="0" step="0.01" required className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                      </label>
                      <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
                        Tax category
                        <input name="taxCategory" defaultValue="General" required maxLength={120} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={saveShipmentDraft} disabled={shipmentSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        <FileText className="h-4 w-4" />
                        {activeDraftId ? "Save draft" : "Save as draft"}
                      </button>
                      <button type="submit" disabled={shipmentSubmitting || customers.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                        {shipmentSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {shipmentSubmitting ? "Submitting service…" : pendingService ? "Retry submission" : activeDraftId ? "Submit draft" : "Create service"}
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      Service details are included in the notes field supported by the Data Encoder service API.
                    </p>
                  </form>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase text-slate-400">Phase 4 · Supporting documents</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">Add service documents</h2>
                    <p className="mt-1 text-sm text-slate-500">Upload PDF, JPG, PNG, or XLSX files in the service wizard after entering the consignment details.</p>
                    <Link href={createServiceHref} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                      Open service wizard <ChevronRight className="h-4 w-4" />
                    </Link>
                  </section>
                </div>
              </section>
              )}

              {!isStandaloneDashboard && (
              <section id="recent-customers" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Phase 1 · Client records</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">Customer records</h2>
                    <p className="mt-1 text-xs text-slate-500">The current backend exposes all active encoder customer records; it does not publish a GetByEncoder route.</p>
                  </div>
                  <button type="button" onClick={() => void fetchCustomers()} disabled={customersLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${customersLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {customersError && <p role="alert" className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{customersError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Business</th><th className="px-5 py-3">TIN</th><th className="px-5 py-3">Business license</th><th className="px-5 py-3">Contact person</th><th className="px-5 py-3">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">{customer.businessName || "—"}</td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600">{customer.tinNumber || "—"}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{customer.businessLicense || "—"}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{customer.contactPerson || "—"}</td>
                          <td className="px-5 py-4"><StatusBadge label={customer.isVerified ? "Verified" : "Pending"} tone={customer.isVerified ? "success" : "warning"} /></td>
                        </tr>
                      ))}
                      {!customersLoading && customers.length === 0 && !customersError && (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">No customer records returned.</td></tr>
                      )}
                      {customersLoading && (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />Loading customer records…</span></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              )}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {metrics.map(({ metric, title, value, tone, icon: Icon }) => {
                  const unavailable = unavailableMetrics.includes(metric);
                  return (
                  <div key={title} className="group min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone === 'warning' ? 'bg-amber-50 text-amber-700' : tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${unavailable ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{loading ? 'Loading' : unavailable ? 'Unavailable' : 'Live'}</span>
                    </div>
                    <div className="mt-5">
                      <p className="text-sm font-medium text-slate-500">{title}</p>
                      <p className="mt-1 text-3xl font-semibold text-slate-950">{unavailable ? "—" : value.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-400">{tone === 'warning' ? 'Waiting for review' : tone === 'success' ? 'Saved, not submitted' : 'Current total'}</p>
                    </div>
                  </div>
                  );
                })}
              </section>

              {isStandaloneDashboard && (
              <>
              <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Approval workflow</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">Work awaiting review</h2>
                      <p className="mt-1 text-sm text-slate-500">Current customer and service approval queues.</p>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Live data</span>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ['Customer approvals', dashboardData.pendingCustomerApprovals],
                      ['Service approvals', dashboardData.pendingServiceApprovals],
                      ['Draft services', dashboardData.draftServices],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="draft-services" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Capture status</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-950">Draft workspace</h2>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><FileText className="h-5 w-5" /></div>
                  </div>
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Unsubmitted service drafts</p>
                        <p className="mt-1 text-xs text-slate-500">Saved records not yet sent for approval</p>
                      </div>
                      <span className="text-2xl font-semibold text-slate-950">{dashboardData.draftServices}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                    <p className="text-xs leading-5 text-blue-800">Counts reflect the latest Data Encoder dashboard response.</p>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div id="recent-services" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Work queue</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent services</h2>
                      </div>
                      <span className="text-xs font-medium text-slate-400">{dashboardData.recentServices.length} records</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-left">
                      <thead className="bg-slate-50">
                        <tr className="text-xs font-semibold uppercase text-slate-400">
                          <th className="w-[24%] px-3 py-3.5 sm:px-5">Service</th><th className="w-[31%] px-3 py-3.5 sm:px-5">Customer</th><th className="w-[23%] px-3 py-3.5 sm:px-5">Status</th><th className="w-[22%] px-3 py-3.5 sm:px-5">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dashboardData.recentServices.map((item, index) => {
                          const status = getDashboardServiceStatus(item.status);
                          const customer = readText(item.importerName, getRelatedName(item.importer));
                          return (
                            <tr key={readText(item.id, item.trackingNumber, item.serviceNumber) || `service-${index}`} className="transition hover:bg-slate-50/70">
                              <td className="min-w-0 px-3 py-4 sm:px-5">
                                <p className="truncate text-sm font-semibold text-slate-900" title={readText(item.trackingNumber, item.serviceNumber, item.id)}>{readText(item.trackingNumber, item.serviceNumber, item.id) || 'Service record'}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-400" title={readText(item.description, item.itemDescription)}>{readText(item.description, item.itemDescription) || 'No description provided'}</p>
                              </td>
                              <td className="truncate px-3 py-4 text-sm text-slate-600 sm:px-5" title={customer}>{customer || 'Customer unavailable'}</td>
                              <td className="truncate px-3 py-4 sm:px-5"><StatusBadge label={status} tone={getStatusTone(status)} /></td>
                              <td className="truncate px-3 py-4 text-xs text-slate-500 sm:px-5">{formatDate(item.updatedAt, item.createdDate, item.createAt)}</td>
                            </tr>
                          );
                        })}
                        {!loading && dashboardData.recentServices.length === 0 && (
                          <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">No recent services returned by the API.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id="recent-customers" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase text-slate-400">Customer register</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-950">Recent customers</h2>
                      <span className="text-xs font-medium text-slate-400">{dashboardData.recentCustomers.length} records</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dashboardData.recentCustomers.map((item, index) => (
                      <div key={readText(item.id, item.email) || `customer-${index}`} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><UsersRound className="h-4 w-4" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{readText(item.businessName, item.name) || `Customer ${readText(item.id)}`}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{readText(item.email) || 'Email unavailable'}</p>
                            <p className="mt-2 text-xs text-slate-400">Created {formatDate(item.createdDate, item.registeredDate, item.createAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!loading && dashboardData.recentCustomers.length === 0 && (
                      <p className="px-5 py-10 text-center text-sm text-slate-500">No recent customers returned by the API.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-400 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span>Data Encoder activity is synchronized with Data Operations.</span>
                <span>MOT Import Services · Data Operations</span>
              </section>
              </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
