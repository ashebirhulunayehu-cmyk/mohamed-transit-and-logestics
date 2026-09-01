import { CustomerMessage, CustomerNotification, CustomerService } from "./customer.types";

export const customerServices: CustomerService[] = [
  {
    id: "SVC-2026-0417",
    title: "Bulk fertiliser consignment - 4 x 40ft",
    route: "Jebel Ali, UAE -> Djibouti -> Modjo Dry Port",
    mode: "Multimodal",
    status: "Requires customer action",
    channel: "Yellow channel",
    executor: "Meron Tadesse",
    eta: "04 Aug 2026",
    sla: "3d left",
    updated: "18h ago",
    progress: 58,
  },
  {
    id: "SVC-2026-0288",
    title: "Agricultural spare parts consolidation",
    route: "Shanghai, China -> Djibouti -> Addis Ababa",
    mode: "Multimodal",
    status: "Completed",
    channel: "Green channel",
    executor: "Meron Tadesse",
    eta: "18 May 2026",
    sla: "Closed",
    updated: "22 May 2026",
    progress: 100,
  },
];

export const customerNotifications: CustomerNotification[] = [
  {
    title: "Duty & tax assessment issued",
    description: "ETB 486,214.00 payable on SVC-2026-0417. Settle before 01 Aug to avoid demurrage.",
    meta: "Payments · 48m ago",
  },
  {
    title: "Temperature log uploaded",
    description: "Temperature-Log-ULD-1-6.csv added to the arrival stage of SVC-2026-0448.",
    meta: "Documents · 2h ago",
  },
  {
    title: "Inspection completed",
    description: "No discrepancies found on SVC-2026-0417. Seals intact on all four containers.",
    meta: "Inspection · 6d ago",
  },
];

export const customerMessages: CustomerMessage[] = [
  {
    id: "meron",
    sender: "Meron Tadesse",
    preview: "Reminder - the storage free period at Modjo ends 06 Aug.",
    body: "Reminder - the storage free period at Modjo ends 06 Aug. After that, daily storage charges apply per container.",
    time: "18h ago",
    initials: "MT",
  },
  {
    id: "selamawit",
    sender: "Selamawit Bekele",
    preview: "Received, thank you. Our finance team is processing the transfer this week.",
    body: "Received, thank you. Our finance team is processing the transfer this week.",
    time: "3d ago",
    initials: "SB",
    mine: true,
  },
];
