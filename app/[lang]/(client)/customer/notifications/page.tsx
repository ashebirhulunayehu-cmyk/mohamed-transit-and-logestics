import { NotificationsList } from "@/features/notifications/components/NotificationsList";
import { CustomerShell } from "@/features/customer/components/CustomerShell";

export default function CustomerNotificationsPage() {
  return (
    <CustomerShell>
      <main className="min-h-[calc(100vh-70px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
        <NotificationsList />
      </main>
    </CustomerShell>
  );
}