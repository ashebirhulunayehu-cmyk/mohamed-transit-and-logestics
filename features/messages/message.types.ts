export interface Message {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  attachment?: {
    name: string;
    size: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  unreadCount: number;
  type: "All" | "Groups" | "Direct";
  participants: string[];
  messages: Message[];
}