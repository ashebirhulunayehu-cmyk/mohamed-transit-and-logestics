"use client";

import { NotificationsList } from "@/features/notifications/components/NotificationsList";

export default function CustomerNotificationsPage() {
  return (
      <main className="min-h-[calc(100vh-70px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
        <NotificationsList />
      </main>
  );
}