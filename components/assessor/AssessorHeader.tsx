"use client";

import { useSyncExternalStore } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  UserCircle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAssessorStore } from "@/store/assessorStore";
import useAuthStore from "@/modules/auth/auth.store";
import { useNotificationStore } from "@/features/notifications/notification.store";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";

const subscribeToHydration = () => () => {};

const readServiceValue = (
  service: CaseExecutorServiceRecord,
  ...keys: string[]
): unknown => {
  const matched = Object.keys(service).find((candidate) =>
    keys.some((key) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matched ? service[matched] : undefined;
};

const serviceSearchText = (service: CaseExecutorServiceRecord): string =>
  Object.values(service)
    .flatMap((value) => typeof value === "string" || typeof value === "number" ? [String(value)] : [])
    .join(" ")
    .toLowerCase();

export default function AssessorHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const roleLabel = pathname.includes("/admin/case-Executer")
    ? "Case Executor"
    : "Assessor";
  const isCaseExecutor = roleLabel === "Case Executor";
  const portalLabel = roleLabel === "Case Executor" ? "Case Operations" : "Assessment Portal";
  const locale = pathname.split("/").filter(Boolean)[0] || "en";
  const {
    sidebarCollapsed,
    toggleSidebar,
    toggleMobileSidebar,
  } = useAssessorStore();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const displayUser = hasHydrated ? user : null;
  const logout = useAuthStore((state) => state.logout);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loadingNotifications = useNotificationStore((state) => state.loading);
  const notificationError = useNotificationStore((state) => state.error);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const assignedServices = useCaseExecutorStore((state) => state.assignedServices);
  const assignedServicesLoading = useCaseExecutorStore((state) => state.assignedServicesLoading);
  const assignedServicesError = useCaseExecutorStore((state) => state.assignedServicesError);
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const servicesHref = `/${locale}/admin/case-Executer/services`;
  const documentsHref = `/${locale}/admin/case-Executer/documents`;
  const notificationsHref = `/${locale}/admin/${isCaseExecutor ? "case-Executer" : "assessor"}/notifications`;
  const profileHref = `/${locale}/admin/${isCaseExecutor ? "case-Executer" : "assessor"}/profile`;
  const dashboardHref = `/${locale}/admin/${isCaseExecutor ? "case-Executer" : "dashboard"}`;
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return assignedServices
      .filter((service) => !query || serviceSearchText(service).includes(query))
      .slice(0, 6);
  }, [assignedServices, searchQuery]);
  const userName = [displayUser?.firstName, displayUser?.lastName].filter(Boolean).join(" ") || displayUser?.username || displayUser?.email?.split("@")[0] || roleLabel;
  const userInitials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AS";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchUnreadCount(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/auth/login`);
  };

  const openSearch = () => {
    setSearchOpen(true);
    if (isCaseExecutor && assignedServices.length === 0) {
      void fetchAssignedServices();
    }
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`${servicesHref}?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  const openServiceSearch = (service: CaseExecutorServiceRecord) => {
    const value = readServiceValue(service, "serviceNumber", "trackingNumber", "caseNumber", "id", "serviceId", "shipmentId");
    if (typeof value !== "string" && typeof value !== "number") return;
    router.push(`${servicesHref}?search=${encodeURIComponent(String(value))}`);
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (!isCaseExecutor) return;
        event.preventDefault();
        setSearchOpen(true);
        const state = useCaseExecutorStore.getState();
        if (state.assignedServices.length === 0) {
          void state.fetchAssignedServices();
        }
      } else if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isCaseExecutor]);

  const renderSearchResults = () => (
    <div className="max-h-[min(24rem,60vh)] overflow-y-auto py-1">
      {assignedServicesLoading && assignedServices.length === 0 ? (
        <p role="status" className="px-4 py-5 text-sm text-slate-500">Loading assigned services…</p>
      ) : assignedServicesError && assignedServices.length === 0 ? (
        <div className="px-4 py-4">
          <p role="alert" className="text-sm text-rose-700">{assignedServicesError}</p>
          <button
            type="button"
            onClick={() => void fetchAssignedServices()}
            className="mt-2 text-xs font-semibold text-blue-700 hover:underline"
          >
            Retry search
          </button>
        </div>
      ) : searchResults.length ? (
        searchResults.map((service, index) => {
          const identifier = readServiceValue(service, "serviceNumber", "trackingNumber", "caseNumber", "id", "serviceId", "shipmentId");
          const title = readServiceValue(service, "itemDescription", "description", "title");
          const importer = readServiceValue(service, "importerName", "customerName", "businessName");
          const identifierText = typeof identifier === "string" || typeof identifier === "number"
            ? String(identifier)
            : `Assigned service ${index + 1}`;
          return (
            <button
              key={`${identifierText}-${index}`}
              type="button"
              onClick={() => openServiceSearch(service)}
              className="block w-full px-4 py-2.5 text-left hover:bg-slate-50"
            >
              <span className="block truncate text-sm font-semibold text-slate-800">{identifierText}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {[title, importer].filter((value): value is string | number => typeof value === "string" || typeof value === "number").join(" · ") || "View assigned service"}
              </span>
            </button>
          );
        })
      ) : (
        <p className="px-4 py-5 text-sm text-slate-500">
          {searchQuery.trim() ? "No assigned service matches your search." : "No assigned services are available."}
        </p>
      )}
      <div className="border-t border-slate-100 px-3 py-2">
        <Link
          href={servicesHref}
          onClick={() => setSearchOpen(false)}
          className="block rounded-md px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        >
          Open case register
        </Link>
        <Link
          href={`${documentsHref}${searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : ""}`}
          onClick={() => setSearchOpen(false)}
          className="block rounded-md px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Search case documents
        </Link>
      </div>
    </div>
  );

  return (
    <header
      className={`fixed left-0 right-0 top-0 ${searchOpen && isCaseExecutor ? "z-[60]" : "z-30"} h-[76px] border-b border-slate-200 bg-white transition-all duration-300 ${
        sidebarCollapsed ? "lg:left-[76px]" : "lg:left-[270px]"
      }`}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>{roleLabel}</span>

            <span className="text-slate-300">/</span>

            <span className="font-medium text-slate-900">
              {portalLabel}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <button
            type="button"
            onClick={openSearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Search assigned services"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden w-[min(40vw,420px)] md:block">
            <div className="relative">
              {isCaseExecutor ? (
                <>
                  <form onSubmit={submitSearch}>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onFocus={openSearch}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setSearchOpen(false);
                      }}
                      placeholder="Search services, importers…"
                      aria-label="Search assigned services"
                      className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</kbd>
                  </form>
                  {searchOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                      {renderSearchResults()}
                    </div>
                  )}
                </>
              ) : (
                <>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
                </>
              )}
            </div>
          </div>

          {isCaseExecutor && searchOpen && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-4 pt-[15vh] md:hidden"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSearchOpen(false);
              }}
            >
              <section role="dialog" aria-modal="true" aria-label="Search assigned services" className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                <form onSubmit={submitSearch} className="relative border-b border-slate-100">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search services, importers…"
                    aria-label="Search assigned services"
                    className="h-12 w-full pl-11 pr-4 text-sm outline-none"
                  />
                </form>
                {renderSearchResults()}
              </section>
            </div>
          )}

          <Link
            href={dashboardHref}
            aria-label="Help and guidance"
            title="Help and guidance"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:flex"
          >
            <CircleHelp className="h-[19px] w-[19px]" />
          </Link>

          {/* Notifications */}
          <details
            className="relative"
            onToggle={(event) => {
              if (event.currentTarget.open) {
                void fetchNotifications();
                void fetchUnreadCount();
              }
            }}
          >
            <summary
              aria-label="Notifications"
              className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 [&::-webkit-details-marker]:hidden"
            >
              <Bell className="h-[19px] w-[19px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                <span className="text-xs text-slate-500">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {loadingNotifications ? (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">Loading notifications...</p>
                ) : notificationError ? (
                  <p role="alert" className="px-4 py-5 text-xs text-rose-700">{notificationError}</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications available.</p>
                ) : notifications.slice(0, 4).map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (!notification.isRead) void markAsRead(notification.id);
                      router.push(notificationsHref);
                    }}
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
              <Link href={notificationsHref} className="block border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Open notification centre
              </Link>
            </div>
          </details>

          {/* Divider */}
          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          {/* User */}
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-xs font-semibold text-blue-700">
                {userInitials || <UserCircle className="h-5 w-5" />}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block max-w-[120px] truncate text-xs font-semibold text-slate-900">{userName}</span>
                <span className="block text-[11px] text-slate-500">{roleLabel}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="truncate text-xs font-semibold text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">{displayUser?.email || displayUser?.username || roleLabel}</p>
              </div>
              <Link href={profileHref} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
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
  );
}