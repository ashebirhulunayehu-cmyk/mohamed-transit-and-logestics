import { NotificationItem } from './notification.types';

export const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Red channel block on SVC-2026-0392",
    description: "Certificate of origin mismatch. Inspection halted pending corrected mill test certificate.",
    category: "Risk",
    time: "1h ago",
    referenceId: "SVC-2026-0392",
    isRead: false,
    isNew: true,
    priority: "CRITICAL"
  },
  {
    id: "2",
    title: "KYC awaiting your review",
    description: "Abyssinia Pharmaceuticals Import submitted 5 KYC documents for verification.",
    category: "Approvals",
    time: "2h ago",
    referenceId: "CUS-10455",
    isRead: false,
    isNew: true,
    priority: "HIGH"
  },
  {
    id: "3",
    title: "Assessment submitted for review",
    description: "SVC-2026-0431 moved to Needs review — valuation query raised.",
    category: "Service Updates",
    time: "17h ago",
    referenceId: "SVC-2026-0431",
    isRead: false,
    isNew: false,
    priority: "HIGH"
  },
  {
    id: "4",
    title: "Scheduled maintenance",
    description: "Platform will be read-only on 03 Aug 2026, 22:00–23:30 EAT.",
    category: "System",
    time: "2d ago",
    referenceId: "SYS-01",
    isRead: true,
    isNew: false
  },
  {
    id: "5",
    title: "Customer returned for revision",
    description: "Rift Valley Machinery Import — trade licence is expired. Revision requested.",
    category: "Approvals",
    time: "23h ago",
    referenceId: "CUS-10502",
    isRead: true,
    isNew: false,
    priority: "HIGH"
  }
];