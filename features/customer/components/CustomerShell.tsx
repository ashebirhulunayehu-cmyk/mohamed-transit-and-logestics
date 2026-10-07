"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PackageSearch,
  Plus,
  LogOut,
  Search,
  Truck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useCustomerStore } from "../customer.store";
import useAuthStore from "@/modules/auth/auth.store";
import { useNotificationStore } from "@/features/notifications/notification.store";

interface SidebarIssue {
  id: string;
  shipmentId: string | number | null;
  isBlocked: boolean;
  requiresCustomerAction: boolean;
  stageName: string | null;
  description: string | null;
}

interface SidebarSummary {
  servicesCount: number;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  issuesCount: number | null;
  issuesAvailable: boolean;
  issuesError: string | null;
  issues: SidebarIssue[];
}

const isSidebarSummary = (value: unknown): value is SidebarSummary => {
  if (typeof value !== "object" || value === null) return false;
  const summary = value as Partial<SidebarSummary>;

  return (
    Number.isInteger(summary.servicesCount) &&
    Number.isInteger(summary.unreadNotificationsCount) &&
    Number.isInteger(summary.unreadMessagesCount) &&
    (summary.issuesCount === null || Number.isInteger(summary.issuesCount)) &&
    typeof summary.issuesAvailable === "boolean" &&
    (typeof summary.issuesError === "string" || summary.issuesError === null) &&
    Array.isArray(summary.issues) &&
    summary.issues.every(
      (issue) =>
        typeof issue === "object" &&
        issue !== null &&
        typeof issue.id === "string" &&
        (typeof issue.shipmentId === "string" ||
          typeof issue.shipmentId === "number" ||
          issue.shipmentId === null) &&
        typeof issue.isBlocked === "boolean" &&
        typeof issue.requiresCustomerAction === "boolean" &&
        (typeof issue.stageName === "string" || issue.stageName === null) &&
        (typeof issue.description === "string" || issue.description === null),
    )
  );
};

const groups = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/customer/dashboard", LayoutDashboard],
      ["My Services", "/customer/dashboard?view=shipments", PackageSearch],
      ["Request New Service", "/component/request-service", Plus],
    ],
  },
  {
    label: "Records",
    items: [["Tax Information", "/customer/dashboard?view=tax-records", WalletCards], ["Documents", "/customer/dashboard?view=documents", FileText]],
  },
  {
    label: "Communication",
    items: [["Notifications", "/customer/notifications", Bell], ["Messages", "/customer/messages", MessageSquare],     ["Contact Us", "/customer/dashboard?view=support-requests", CircleHelp]],
  },
  { label: "Account", items: [["Profile", "/customer/profile", UserRound]] },
] as const;

const customerSearchTargets = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "My services and shipments", href: "/customer/dashboard?view=shipments" },
  { label: "Request a new service", href: "/component/request-service" },
  { label: "Tax information and invoices", href: "/customer/dashboard?view=tax-records" },
  { label: "Customer documents", href: "/customer/dashboard?view=documents" },
  { label: "Notifications", href: "/customer/notifications" },
  { label: "Messages", href: "/customer/messages" },
  { label: "Support requests and contact", href: "/customer/dashboard?view=support-requests" },
  { label: "Profile and account settings", href: "/customer/profile" },
] as const;

const readAccountRole = (user: unknown): string => {
  if (typeof user !== "object" || user === null) return "Signed in account";
  const account = user as {
    roles?: unknown;
    userRoles?: unknown;
  };
  const roles = account.roles ?? account.userRoles;
  if (!Array.isArray(roles)) return "Signed in account";

  for (const role of roles) {
    if (typeof role === "string" && role.trim()) return role.trim();
    if (typeof role !== "object" || role === null) continue;

    const assignment = role as {
      roleName?: unknown;
      name?: unknown;
      role?: { name?: unknown } | string | null;
    };
    const name =
      assignment.roleName ??
      assignment.name ??
      (typeof assignment.role === "string"
        ? assignment.role
        : assignment.role?.name);
    if (typeof name === "string" && name.trim()) return name.trim();
  }

  return "Signed in account";
};

export function CustomerShell({ children }: { children: ReactNode }) {
  const { lang = "en" } = useParams<{ lang: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sidebarOpen, closeSidebar, toggleSidebar } = useCustomerStore();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const hasDocumentRedFlag = useNotificationStore((state) => state.hasDocumentRedFlag);
  const fetchDocumentMonitoringAlerts = useNotificationStore((state) => state.fetchDocumentMonitoringAlerts);
  const [summary, setSummary] = useState<SidebarSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const accountName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.email ||
    "Customer";
  const profilePhoto =
    user?.profilePhoto ||
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80";
  const accountRole = readAccountRole(user);
  const matchingSearchTargets = customerSearchTargets.filter((target) =>
    target.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    void fetchDocumentMonitoringAlerts();
  }, [fetchDocumentMonitoringAlerts]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
      try {
        const response = await fetch("/api/customer/sidebar-summary", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
              ? body.error
              : "Unable to load sidebar counts.";
          throw new Error(message);
        }

        if (!isSidebarSummary(body)) {
          throw new Error("The sidebar summary response was invalid.");
        }

        setSummary(body);
        setSummaryError(null);
        setSummaryLoading(false);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setSummary(null);
        setSummaryLoading(false);
        setSummaryError(
          error instanceof Error ? error.message : "Unable to load sidebar counts.",
        );
      }
    };

    void loadSummary();
    const refreshTimer = window.setInterval(() => void loadSummary(), 60_000);

    return () => {
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace(`/${lang}/auth/login`);
  };

  const handleCustomerSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = matchingSearchTargets[0];
    if (!target) return;
    router.push(`/${lang}${target.href}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200 bg-white text-slate-600 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><Truck className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p><p className="text-xs text-slate-500">Ministry of Transport</p></div>
          <button className="ml-auto text-slate-500 lg:hidden" onClick={closeSidebar} aria-label="Close navigation"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(([label, href, Icon]) => {
                  const [routePath, routeQuery] = href.split("?");
                  const active =
                    pathname === `/${lang}${routePath}` &&
                    (routeQuery
                      ? new URLSearchParams(routeQuery).get("view") ===
                        searchParams.get("view")
                      : !searchParams.get("view"));
                  const badgeCount =
                    label === "My Services"
                      ? summary?.servicesCount
                      : label === "Notifications"
                        ? summary?.unreadNotificationsCount
                        : label === "Messages"
                          ? summary?.unreadMessagesCount
                          : undefined;
                  const hasBadge =
                    label === "My Services" ||
                    label === "Notifications" ||
                    label === "Messages";

                  return (
                    <Link
                      key={href}
                      href={`/${lang}${href}`}
                      onClick={closeSidebar}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-[19px] w-[19px] shrink-0 ${
                          active
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-700"
                        }`}
                        strokeWidth={1.9}
                      />
                      <span className="truncate">{label}</span>
                      {hasBadge && (badgeCount !== undefined || summaryLoading) && (
                        <span
                          className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {badgeCount ?? "…"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-3 p-3">
          {summaryError && (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"
              role="status"
            >
              Sidebar counts unavailable: {summaryError}
            </p>
          )}
          {summary?.issuesError && (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"
              role="status"
            >
              Issue status unavailable: {summary.issuesError}
            </p>
          )}
          {summary && summary.issuesCount !== null && summary.issuesCount > 0 && (
            <button
              type="button"
              onClick={() => setIssuesOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-700 bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-haspopup="dialog"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                !
              </span>
              {summary.issuesCount} {summary.issuesCount === 1 ? "Issue" : "Issues"}
              <span className="text-xs font-medium text-red-100">View details</span>
            </button>
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Account role
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-900">
              {accountRole}
            </p>
          </div>
        </div>
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={closeSidebar} aria-label="Close navigation" />}
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden" onClick={toggleSidebar} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden w-[260px] md:block">
              <form role="search" onSubmit={handleCustomerSearch}>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search customer portal"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Search customer portal..."
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                />
              </form>
              {searchOpen && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {matchingSearchTargets.length ? matchingSearchTargets.map((target) => (
                    <Link
                      key={target.href}
                      href={`/${lang}${target.href}`}
                      onClick={() => {
                        setSearchQuery("");
                        setSearchOpen(false);
                      }}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                      {target.label}
                    </Link>
                  )) : (
                    <p className="px-3 py-2 text-sm text-slate-500">No customer pages match that search.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push(`/${lang}/customer/notifications`)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell className="h-[19px] w-[19px]" />
              {hasDocumentRedFlag && <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${lang}/customer/dashboard?view=support-requests`)}
              className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:block"
              aria-label="Open customer support"
              title="Customer support"
            >
              <CircleHelp className="h-5 w-5" />
            </button>
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2 rounded-lg px-1.5 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                <img src={profilePhoto} alt={accountName} className="h-full w-full object-cover" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-xs font-semibold text-slate-900">{accountName}</p>
                <p className="text-[11px] text-slate-500">{accountRole}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        {children}
      </div>
      {issuesOpen && summary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIssuesOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-issues-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Action required
                </p>
                <h2
                  id="customer-issues-title"
                  className="mt-1 text-lg font-bold text-slate-900"
                >
                  Shipment issues
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIssuesOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close issue details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="mt-5 space-y-3">
              {summary.issues.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-xl border border-red-100 bg-red-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {issue.stageName ||
                      `Stage execution #${issue.id}`}
                    {issue.shipmentId !== null && issue.stageName
                      ? ` · Shipment ${issue.shipmentId}`
                      : ""}
                  </p>
                  {!issue.stageName && issue.shipmentId !== null && (
                    <p className="mt-1 text-xs text-slate-600">
                      Shipment {issue.shipmentId}
                    </p>
                  )}
                  {issue.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {issue.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium text-red-700">
                    {[
                      issue.isBlocked ? "This step is blocked" : null,
                      issue.requiresCustomerAction
                        ? "Your action is required"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href={`/${lang}/customer/services`}
              onClick={() => setIssuesOpen(false)}
              className="mt-5 inline-flex items-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Open my services
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
