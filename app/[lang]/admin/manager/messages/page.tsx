import { ChatSidebar } from "@/features/messages/components/ChatSidebar";
import { ChatWindow } from "@/features/messages/components/ChatWindow";

export default function ManagerMessagesPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[360px] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
