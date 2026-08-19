import { create } from 'zustand';
import { initialConversations } from './message.data';
import { Conversation, Message } from './message.types';

interface MessageState {
  conversations: Conversation[];
  activeConversationId: string;
  filterTab: "All" | "Groups" | "Direct";
  setActiveConversation: (id: string) => void;
  setFilterTab: (tab: "All" | "Groups" | "Direct") => void;
  sendMessage: (text: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: initialConversations,
  activeConversationId: "SVC-2026-0392",
  filterTab: "All",

  setActiveConversation: (id) => set({ activeConversationId: id }),
  setFilterTab: (tab) => set({ filterTab: tab }),

  sendMessage: (text) => set((state) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderName: "Hanna Wolde",
      text,
      timestamp: "Just now",
      isMe: true,
    };

    return {
      conversations: state.conversations.map((conv) => {
        if (conv.id === state.activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            subtitle: text,
          };
        }
        return conv;
      }),
    };
  }),
}));