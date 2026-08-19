import { Conversation } from './message.types';

export const initialConversations: Conversation[] = [
  {
    id: "SVC-2026-0392",
    title: "SVC-2026-0392 — Red channel task force",
    subtitle: "I've spoken to Nile Steel — the supplier is...",
    time: "58m ago",
    unreadCount: 3,
    type: "Groups",
    participants: ["DA", "RM", "HW", "MT"],
    messages: [
      {
        id: "1",
        senderName: "Rahel Mekonnen",
        text: "Mill test certificate heat numbers don't match the certificate of origin. I've flagged both documents and paused the inspection.",
        timestamp: "2d ago",
        isMe: false,
      },
      {
        id: "2",
        senderName: "Hanna Wolde",
        text: "Agreed. Under the valuation directive we can't proceed with a documentary mismatch on a red channel case.",
        timestamp: "2d ago",
        isMe: true,
      },
      {
        id: "3",
        senderName: "Daniel Aregawi",
        text: "I've spoken to Nile Steel — the supplier is reissuing today. Keep the case blocked but log the demurrage exposure, we're 6 days past SLA.",
        timestamp: "58m ago",
        isMe: false,
        attachment: { name: "Demurrage-Exposure-0392.xlsx", size: "48 KB" }
      }
    ]
  },
  {
    id: "SE-102",
    title: "Selamawit Bekele",
    subtitle: "Reminder — the storage free period at Modjo...",
    time: "18h ago",
    unreadCount: 1,
    type: "Direct",
    participants: ["SE"],
    messages: [
      { id: "1", senderName: "Selamawit Bekele", text: "Reminder — the storage free period at Modjo is expiring soon.", timestamp: "18h ago", isMe: false }
    ]
  },
  {
    id: "HA-103",
    title: "Hanna Wolde",
    subtitle: "SVC-2025-0431 unit price is 12% under the ref...",
    time: "17h ago",
    unreadCount: 0,
    type: "Direct",
    participants: ["HW"],
    messages: [
      { id: "1", senderName: "Hanna Wolde", text: "SVC-2025-0431 unit price is 12% under the reference value.", timestamp: "17h ago", isMe: true }
    ]
  },
  {
    id: "MD-104",
    title: "Modjo Dry Port desk",
    subtitle: "Block C-14 is at 86% capacity. Any case past th...",
    time: "3h ago",
    unreadCount: 0,
    type: "Groups",
    participants: ["MD", "HW"],
    messages: [
      { id: "1", senderName: "Modjo Dry Port desk", text: "Block C-14 is at 86% capacity. Any case past threshold needs immediate clearance.", timestamp: "3h ago", isMe: false }
    ]
  },
  {
    id: "AB-105",
    title: "Abel Tesfaye",
    subtitle: "Abyssinia Pharmaceuticals KYC pack is co...",
    time: "2h ago",
    unreadCount: 2,
    type: "Direct",
    participants: ["AT"],
    messages: [
      { id: "1", senderName: "Abel Tesfaye", text: "Abyssinia Pharmaceuticals KYC pack is complete and ready for review.", timestamp: "2h ago", isMe: false }
    ]
  }
];