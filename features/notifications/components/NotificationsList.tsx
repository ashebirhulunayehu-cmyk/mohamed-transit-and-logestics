'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  FileText,
  Inbox,
  MessageSquare,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useNotificationStore } from '../notification.store';
import { NotificationCategory } from '../notification.types';

const categoryIcons: Record<NotificationCategory, typeof Bell> = {
  'Service Updates': Bell,
  Documents: FileText,
  Approvals: ClipboardCheck,
  Payments: CreditCard,
  Inspection: ClipboardCheck,
  Risk: ShieldAlert,
  Messages: MessageSquare,
  System: Settings,
};

export const NotificationsList = () => {
  const params = useParams();
  const pathname = usePathname();
  const lang = typeof params.lang === 'string' ? params.lang : 'en';
  const { 
    notifications, 
    unreadCount,
    filterTab, 
    setFilterTab, 
    showUnreadOnly, 
    toggleShowUnreadOnly, 
    markAsRead, 
    markAllAsRead,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
  } = useNotificationStore();

  useEffect(() => {
    void fetchNotifications();
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const tabs: ("All" | NotificationCategory)[] = [
    "All", "Service Updates", "Documents", "Approvals", "Payments", "Inspection", "Risk", "Messages", "System"
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (showUnreadOnly && n.isRead) return false;
    if (filterTab !== "All" && n.category !== filterTab) return false;
    return true;
  });
  const signInRequired = error?.includes('user ID is unavailable') ?? false;

  return (
    <div className="mx-auto max-w-7xl space-y-0">
      <header className="space-y-5 px-1 pb-6 pt-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
            Notification centre
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Everything that changed on your cases, documents, approvals and payments.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            {loading
              ? 'Loading notifications…'
              : error
                ? signInRequired
                  ? 'Sign-in required to load notifications'
                  : 'Notifications unavailable'
                : <><span className="font-medium text-slate-900">{unreadCount} unread</span> of {notifications.length}</>}
          </p>
          {error && (
            <p className="mt-1 text-xs text-slate-500">
              Sign in to load your updates.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleShowUnreadOnly}
            aria-pressed={showUnreadOnly}
            className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition ${
              showUnreadOnly
                ? 'border-blue-300 bg-blue-50 text-blue-800'
                : 'border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50'
            }`}
          >
            <Inbox className="h-4 w-4" />
            Show unread only
          </button>
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={loading || Boolean(error) || notifications.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      </header>

      <nav
        aria-label="Filter notifications by category"
        className="-mx-4 flex flex-wrap gap-2 border-y border-slate-200 bg-slate-100 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {tabs.map((tab) => {
          const count = tab === 'All'
            ? notifications.length
            : notifications.filter((notification) => notification.category === tab).length;
          const selected = filterTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              aria-pressed={selected}
              className={`inline-flex items-center gap-2 border px-3 py-2 text-sm transition ${
                selected
                  ? 'border-blue-700 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab}</span>
              <span className={selected ? 'font-medium text-blue-800' : 'text-slate-500'}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="divide-y divide-slate-100 overflow-hidden border-x border-b border-slate-200 bg-white">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm font-medium">
            Loading notifications...
          </div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-red-700">{error}</p>
            {signInRequired ? (
              <Link
                href={`/${lang}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void fetchNotifications()}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Try again
              </button>
            )}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            No notifications available in this category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <article
              key={notif.id}
              className={`flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6 ${
                !notif.isRead ? 'border-l-4 border-l-blue-700 bg-blue-50/20' : ''
              }`}
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                  notif.priority === 'CRITICAL'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  {React.createElement(
                    notif.priority === 'CRITICAL' ? AlertTriangle : categoryIcons[notif.category],
                    { className: 'h-5 w-5', 'aria-hidden': true },
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">{notif.title}</h2>
                    {notif.priority && (
                      <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        notif.priority === 'CRITICAL'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {notif.priority === 'CRITICAL' ? 'Critical' : 'High'}
                      </span>
                    )}
                    {notif.isNew && (
                      <span className="rounded bg-blue-700 px-2 py-0.5 text-[11px] font-medium text-white">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {notif.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-slate-500">
                    <span className="text-blue-800">{notif.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{notif.time}</span>
                    {notif.referenceId && notif.referenceId !== 'N/A' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{notif.referenceId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void markAsRead(notif.id);
                  }}
                  className="ml-2 shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50"
                >
                  Mark read
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsList;