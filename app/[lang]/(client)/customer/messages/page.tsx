import { ChatSidebar } from "@/features/messages/components/ChatSidebar";
import { ChatWindow } from "@/features/messages/components/ChatWindow";

export default function CustomerMessagesPage() {
  return (
      <main className="min-h-[calc(100dvh-76px)] bg-slate-50 p-2 sm:p-6 lg:p-8">
        <div className="mx-auto flex h-[calc(100dvh-100px)] min-h-[360px] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ChatSidebar />
          <ChatWindow />
        </div>
      </main>
  );
}