"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import type { NotificationCategory } from "@/features/notifications/notification.types";
import { useManagerStore } from "@/modules/manager/manager.store";

const categories: Array<"All" | NotificationCategory> = [
  "All",
  "Service Updates",
  "Documents",
  "Approvals",
  "Payments",
  "Inspection",
  "Risk",
  "Messages",
  "System",
];

export default function NotificationsPage() {
  const notifications = useManagerStore((state) => state.notifications);
  const loading = useManagerStore((state) => state.notificationsLoading);
  const error = useManagerStore((state) => state.notificationsError);
  const fetchNotifications = useManagerStore((state) => state.fetchNotifications);
  const [category, setCategory] = useState<"All" | NotificationCategory>("All");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const filteredNotifications = useMemo(
    () => notifications.filter((notification) =>
      (!unreadOnly || !notification.isRead) &&
      (category === "All" || notification.category === category),
    ),
    [category, notifications, unreadOnly],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Manager</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">Updates returned by the manager notification service.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">Notification centre</h2>
                <p className="text-sm text-slate-500">
                  {unreadCount} unread of {notifications.length} total
                </p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              Unread only
            </label>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
                  category === item
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <p className="px-5 py-14 text-center text-sm text-slate-500">Loading notifications...</p>
            ) : filteredNotifications.length === 0 ? (
              <p className="px-5 py-14 text-center text-sm text-slate-500">
                {notifications.length === 0 ? "No notifications available." : "No notifications match this filter."}
              </p>
            ) : filteredNotifications.map((notification) => (
              <article key={notification.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        Unread
                      </span>
                    )}
                    {notification.priority && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        {notification.priority}
                      </span>
                    )}
                  </div>
                  {notification.description && (
                    <p className="mt-1 text-sm text-slate-600">{notification.description}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {notification.category} · {notification.time}
                    {notification.referenceId && ` · ${notification.referenceId}`}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
