"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  UserCheck,
  ClipboardCheck,
  BriefcaseBusiness,
  FileText,
  History,
  Layers,
  ShieldAlert,
  MessageSquare,
  Bell,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useAssessorStore } from "@/store/assessorStore";
import { useAuthStore as useLegacyAuthStore } from "@/store/useAuthStore";
import useAuthStore from "@/modules/auth/auth.store";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import { useMessagingStore } from "@/modules/message/message.store";
import { useNotificationStore } from "@/features/notifications/notification.store";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;
const subscribeToHashChange = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
const getClientHash = () => window.location.hash;
const getServerHash = () => "";

const reviewQueueItems = [
  {
    label: "Customer Approvals",
    href: "/admin/assessor/customer-approvals",
    icon: UserCheck,
  },
  {
    label: "Service Reviews",
    href: "/admin/assessor/service-reviews",
    icon: ClipboardCheck,
  },
];

const recordsItems = [
  {
    label: "Services",
    href: "/admin/assessor/services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Documents",
    href: "/admin/assessor/documents",
    icon: FileText,
  },
  {
    label: "Assessment Logs",
    href: "/admin/assessor/assessment-logs",
    icon: History,
  },
];

const communicationItems = [
  {
    label: "Messages",
    href: "/admin/assessor/messages",
    icon: MessageSquare,
  },
  {
    label: "Notifications",
    href: "/admin/assessor/notifications",
    icon: Bell,
  },
];

const accountItems = [
  {
    label: "Profile",
    href: "/admin/assessor/profile",
    icon: UserCircle,
  },
];

const caseExecutorItems = [
  {
    label: "Assigned Services",
    href: "/admin/case-Executer/services",
    icon: BriefcaseBusiness,
    group: "today",
  },
  {
    label: "Service Categories",
    href: "/admin/case-Executer/service-catagory",
    icon: Layers,
    group: "today",
  },
  {
    label: "Documents",
    href: "/admin/case-Executer/documents",
    icon: FileText,
    group: "work",
  },
  {
    label: "Risk & Compliance",
    href: "/admin/case-Executer/risk&compliance",
    icon: ShieldAlert,
    group: "work",
  },
  {
    label: "Activity Log",
    href: "/admin/case-Executer/activity",
    icon: History,
    group: "work",
  },
  {
    label: "Messages",
    href: "/admin/case-Executer/messages",
    icon: MessageSquare,
    group: "communication",
  },
  {
    label: "Notifications",
    href: "/admin/case-Executer/notifications",
    icon: Bell,
    group: "communication",
  },
  {
    label: "Profile",
    href: "/admin/case-Executer/profile",
    icon: UserCircle,
    group: "account",
  },
];

export default function AssessorSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const router = useRouter();
  const authReady = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const currentHash = useSyncExternalStore(
    subscribeToHashChange,
    getClientHash,
    getServerHash,
  );

  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    closeMobileSidebar,
  } = useAssessorStore();

  const { logout: logoutLegacy } = useLegacyAuthStore();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const assignedServices = useCaseExecutorStore((state) => state.assignedServices);
  const riskServiceCount = assignedServices.filter((service) => {
    const risk = Object.entries(service).find(([key]) =>
      ["risklevel", "riskchannel"].includes(key.toLowerCase()),
    )?.[1];
    const flagged = (value: unknown) => value === true || value === 1 || value === "true";
    const blocked = Object.entries(service).some(([key, value]) =>
      key.toLowerCase() === "isblocked" && flagged(value),
    );
    const needsAction = Object.entries(service).some(([key, value]) =>
      ["requirescustomeraction", "hasneedsreview"].includes(key.toLowerCase()) && flagged(value),
    );
    const elevatedRisk =
      risk === 3 || risk === 4 || risk === "3" || risk === "4" ||
      (typeof risk === "string" && /yellow|red/i.test(risk));
    return blocked || needsAction || elevatedRisk;
  }).length;
  const unreadMessages = useMessagingStore((state) => state.unreadCount);
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const activeRole = pathname.includes("/admin/case-Executer")
    ? "case_executor"
    : "assessor";
  const dashboardHref = activeRole === "case_executor"
    ? "/admin/case-Executer"
    : "/admin/dashboard";
  const userName =
    (authReady && [user?.firstName, user?.lastName].filter(Boolean).join(" ")) ||
    (authReady && user?.username) ||
    (authReady && user?.email) ||
    "Signed in";
  const assignedRoleName = authReady ? user?.roles?.reduce<string>(
    (name, role) =>
      name || (typeof role === "string" ? "" : role.roleName || ""),
    "",
  ) : "";
  const userRole =
    activeRole === "case_executor"
      ? "Case Executor"
      : (authReady && user?.roleName) || assignedRoleName || "Assessor";
  const executorGroups = [
    { label: "Today", key: "today" },
    { label: "Work", key: "work" },
    { label: "Communication", key: "communication" },
    { label: "Account", key: "account" },
  ];

  useEffect(() => {
    if (activeRole === "case_executor") {
      const timeoutId = window.setTimeout(() => {
        void useMessagingStore.getState().fetchUnreadCount();
        void useNotificationStore.getState().fetchUnreadCount();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [activeRole]);

  const isActive = (href: string) => {
    const fullHref = `/${lang}${href}`;
    const hashIndex = fullHref.indexOf("#");
    if (hashIndex >= 0) {
      const routeHref = fullHref.slice(0, hashIndex);
      const targetHash = fullHref.slice(hashIndex);
      return pathname === routeHref && currentHash === targetHash;
    }
    if (href === "/admin/dashboard" || href === dashboardHref) {
      return pathname === fullHref && !currentHash;
    }
    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  };

  const handleLogout = async () => {
    await logout();
    logoutLegacy();
    router.push(`/${lang}/auth/login`);
  };

  const renderNavItem = (item: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const fullHref = `/${lang}${item.href}`;

    return (
      <Link
        key={item.href}
        href={fullHref}
        onClick={closeMobileSidebar}
        title={sidebarCollapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
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

        {!sidebarCollapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold ${
                active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-dvh w-[270px] flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:h-screen ${sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[270px]"} ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
      {/* Brand */}
      <div className="flex h-[76px] items-center border-b border-slate-200 px-4">
        <Link
          href={`/${lang}${dashboardHref}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <span className="text-sm font-bold">M</span>
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                MOT Import Services
              </p>

              <p className="text-xs text-slate-500">
                {activeRole === "case_executor" ? "Case Operations" : "Ministry of Transport"}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label={activeRole === "case_executor" ? "Case Executor navigation" : "Assessor navigation"}
        className="flex-1 overflow-y-auto px-3 py-5"
      >
        {activeRole === "case_executor" ? (
          <>
            {executorGroups.map((group) => {
              const items = caseExecutorItems
                .filter((item) => item.group === group.key)
                .map((item) => ({
                  ...item,
                  badge: item.label === "Assigned Services"
                    ? assignedServices.length
                    : item.label === "Risk & Compliance"
                      ? riskServiceCount
                      : item.label === "Messages"
                        ? unreadMessages
                        : item.label === "Notifications"
                          ? unreadNotifications
                          : undefined,
                }));
              if (group.key === "today") {
                items.unshift({
                  label: "Dashboard",
                  href: dashboardHref,
                  icon: LayoutDashboard,
                  group: "today",
                  badge: undefined,
                });
              }
              return (
                <div key={group.key} className="mb-6">
                  {!sidebarCollapsed && (
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {items.map(renderNavItem)}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="mb-6">
              {!sidebarCollapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Review queue
                </p>
              )}
              {renderNavItem({
                label: "Dashboard",
                href: dashboardHref,
                icon: LayoutDashboard,
              })}
              <div className="space-y-1">
                {reviewQueueItems.map(renderNavItem)}
              </div>
            </div>

            <div className="mb-6">
              {!sidebarCollapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Records
                </p>
              )}
              <div className="space-y-1">
                {recordsItems.map(renderNavItem)}
              </div>
            </div>

            <div className="mb-6">
              {!sidebarCollapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Communication
                </p>
              )}
              <div className="space-y-1">
                {communicationItems.map(renderNavItem)}
              </div>
            </div>
          </>
        )}

        {/* Account */}
        {activeRole !== "case_executor" && (
          <div>
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Account
              </p>
            )}
            <div className="space-y-1">
              {accountItems.map(renderNavItem)}
            </div>
          </div>
        )}
      </nav>

      {/* Signed-in account and sign out */}
      <div className="border-t border-slate-200 p-3">
        <div
          className={`flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {(userName[0] || userRole[0] || "U").toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-xs text-slate-500">{userRole}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title={sidebarCollapsed ? "Sign out" : undefined}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}