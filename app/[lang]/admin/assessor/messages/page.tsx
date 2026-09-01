import { ChatSidebar } from "@/features/messages/components/ChatSidebar";
import { ChatWindow } from "@/features/messages/components/ChatWindow";

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
      {/* የግራ በኩል የቻት ዝርዝር እና ፍለጋ */}
      <ChatSidebar />

      {/* በቀኝ በኩል የሚታየው ዋናው የውይይት መስኮት */}
      <ChatWindow />
    </div>
  );
}