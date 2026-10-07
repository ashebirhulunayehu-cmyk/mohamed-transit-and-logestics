import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import { ChatSidebar } from "@/features/messages/components/ChatSidebar";
import { ChatWindow } from "@/features/messages/components/ChatWindow";

export default function DataEncoderMessagesPage() {
  return (
    <EncoderSectionLayout
      activeSection="messages"
      title="Messages"
      description="Review threads, follow-up with teams, and track communication around customer and service records."
    >
      <div className="mx-auto flex h-[calc(100dvh-15rem)] min-h-[420px] w-full max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ChatSidebar />
        <ChatWindow />
      </div>
    </EncoderSectionLayout>
  );
}
