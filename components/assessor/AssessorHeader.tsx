"use client";

import { useSyncExternalStore } from "react";
import { useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  UserCircle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAssessorStore } from "@/store/assessorStore";
import useAuthStore from "@/modules/auth/auth.store";
import { useNotificationStore } from "@/features/notifications/notification.store";

const subscribeToHydration = () => () => {};

export default function AssessorHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const roleLabel = pathname.includes("/admin/case-Executer")
    ? "Case Executor"
    : "Assessor";
  const portalLabel = roleLabel === "Case Executor" ? "Case Operations" : "Assessment Portal";
  const locale = pathname.split("/").filter(Boolean)[0] || "en";
  const {
    sidebarCollapsed,
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

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 h-[76px] border-b border-slate-200 bg-white transition-all duration-300 ${
        sidebarCollapsed ? "lg:left-[76px]" : "lg:left-[270px]"
      }`}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden w-[220px] md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

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
              <Link href={`/${locale}/admin/assessor/notifications`} className="block border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100">
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
              <Link href={`/${locale}/admin/assessor/profile`} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
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