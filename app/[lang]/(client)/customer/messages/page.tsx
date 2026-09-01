import { ChatSidebar } from "@/features/messages/components/ChatSidebar";
import { ChatWindow } from "@/features/messages/components/ChatWindow";
import { CustomerShell } from "@/features/customer/components/CustomerShell";

export default function CustomerMessagesPage() {
  return (
    <CustomerShell>
      <main className="min-h-[calc(100vh-70px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ChatSidebar />
          <ChatWindow />
        </div>
      </main>
    </CustomerShell>
  );
}