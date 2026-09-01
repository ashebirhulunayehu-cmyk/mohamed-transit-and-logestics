'use client';
import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNotificationStore } from '../notification.store';
import { NotificationItem } from '../notification.types';
import Link from 'next/link';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead } = useNotificationStore();
  const unreadCount = notifications.filter((n: NotificationItem) => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-3 w-96 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {unreadCount} unread
        </span>
      </div>

      {/* Notifications List with scroll */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {notifications.map((item: NotificationItem) => {
          const isCritical = item.priority === "CRITICAL";

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isRead) {
                  markAsRead(item.id);
                }
              }}
              className={`p-4 transition hover:bg-slate-50/80 flex items-start gap-3 cursor-pointer ${
                !item.isRead ? "bg-blue-50/20" : ""
              }`}
            >
              <div className="mt-1 shrink-0">
                {isCritical ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <span
                    className={`block h-2 w-2 rounded-full ${
                      !item.isRead ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {item.time}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {item.category}
                  </span>
                  {item.referenceId && (
                    <span className="text-[10px] font-mono text-blue-600">
                      {item.referenceId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <Link
          href="/admin/assessor/notifications"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <span>Open notification centre</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}