import {
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FolderOpen,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const metrics = [
  {
    title: "Open cases",
    value: 5,
    tone: "default",
    icon: FolderOpen,
    meta: "",
  },
  {
    title: "Needs attention",
    value: 4,
    tone: "warning",
    icon: CircleAlert,
    meta: "risk or review",
  },
  {
    title: "Due within 48h",
    value: 3,
    tone: "default",
    icon: Clock3,
    meta: "",
  },
  {
    title: "Cleared this month",
    value: 1,
    tone: "success",
    icon: ShieldCheck,
    meta: "",
  },
];

const queueItems = [
  {
    caseId: "SVC-2026-0448",
    status: "In progress",
    statusTone: "success",
    channel: "Green channel",
    channelTone: "success",
    title: "Cold-chain pharmaceutical airfreight",
    subtitle: "Abyssinia Pharmaceuticals Import · Brussels, Belgium → Bole International Airport Cargo Terminal",
    updated: "Updated 2h ago",
  },
  {
    caseId: "SVC-2026-0431",
    status: "Needs review",
    statusTone: "warning",
    channel: "Yellow channel",
    channelTone: "warning",
    title: "Circular knitting machinery — 3 × 40ft OT",
    subtitle: "Blue Nile Textile Sourcing · Shanghai, China → Djibouti → Modjo Dry Port",
    updated: "Updated 17h ago",
  },
  {
    caseId: "SVC-2026-0460",
    status: "Pending",
    statusTone: "info",
    channel: "Blue channel",
    channelTone: "info",
    title: "Excavator & attachments — local permission",
    subtitle: "Rift Valley Machinery Import · Nagoya, Japan → Djibouti → Adama",
    updated: "Updated 1d ago",
  },
];

const activityItems = [
  {
    title: "Scheduled maintenance",
    description: "Platform will be read-only on 03 Aug 2026, 22:00-23:30 EAT.",
    meta: "System · 2d ago",
  },
  {
    title: "Customer returned for revision",
    description: "Rift Valley Machinery Import — trade licence is expired. Revision requested.",
    meta: "Approvals · 23h ago",
  },
];

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const palette = {
    success:
      "border border-[#a6d8b2] bg-[#dff4e5] text-[#2d7b45]",
    warning:
      "border border-[#f0d9a6] bg-[#f6ebc9] text-[#8f6f16]",
    info: "border border-[#bfd9f1] bg-[#dfeefb] text-[#2d5ea8]",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${palette[tone as keyof typeof palette] ?? palette.info}`}
    >
      {label}
    </span>
  );
}

export default function DataEncoderDashboard() {
  return (
    <main className="min-h-screen bg-[#eef1f4] px-3 py-3 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="rounded-[16px] border border-[#dfe3e8] bg-[#f5f6f7] p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <section className="flex min-h-[calc(100vh-24px)] flex-col rounded-[14px] border border-[#dfe3e8] bg-[#f5f6f7]">
            <div className="flex flex-col gap-4 border-b border-[#dfe3e8] bg-[#f8f9fb] px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-[780px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value="Search services, customers, documents..."
                  readOnly
                  className="h-11 w-full rounded-xl border border-[#d5dbe2] bg-[#f0f3f6] pl-10 pr-12 text-base text-slate-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#d5dbe2] bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  ⌘K
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 sm:gap-4">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d5dbe2] bg-white text-slate-500 transition hover:bg-slate-50"
                >
                  <Bell className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Help"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d5dbe2] bg-white text-slate-500 transition hover:bg-slate-50"
                >
                  <Sparkles className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3 rounded-full border border-[#d5dbe2] bg-white px-2 py-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f1ff] text-[11px] font-bold text-[#2e5aa8]">
                    AT
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-slate-800">Abel Tesfaye</p>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 text-slate-400 sm:block" />
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
              <div className="rounded-[18px] border border-[#dfe3e8] bg-[#f4f5f6] p-4 sm:p-5">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Import directory
                    </p>
                    <h1 className="mt-2 text-4xl font-light tracking-[-0.05em] text-slate-800 sm:text-[3.25rem]">
                      Data capture desk
                    </h1>
                    <p className="mt-2 text-base text-slate-500">
                      Records you have created and their approval state.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d2d8df] bg-white px-5 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open case register
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {metrics.map(({ title, value, tone, icon: Icon, meta }) => (
                    <div
                      key={title}
                      className={`flex min-h-[180px] flex-col justify-between rounded-[16px] border border-[#dfe3e8] bg-[#f7f8f9] p-4 sm:p-5 ${
                        tone === "warning" ? "border-[#e5d7a6]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[18px] font-medium text-slate-700">{title}</p>
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            tone === "warning"
                              ? "bg-[#f4e4ac] text-[#8c6a11]"
                              : tone === "success"
                                ? "bg-[#dff4e5] text-[#2d7b45]"
                                : "bg-[#edf0f3] text-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="text-[42px] font-light leading-none tracking-[-0.06em] text-slate-800">
                          {value}
                        </div>
                        {meta && (
                          <div className="mt-3 text-[14px] text-slate-500">{meta}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 overflow-hidden rounded-[18px] border border-[#dfe3e8] bg-white">
                  <div className="flex items-center justify-between border-b border-[#dfe3e8] px-4 py-4 sm:px-5">
                    <div>
                      <p className="text-[18px] font-medium text-slate-800">Priority queue</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Sorted by risk channel and time in stage
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#e5e7eb]">
                    {queueItems.map((item) => (
                      <div
                        key={item.caseId}
                        className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-semibold text-[#1d6fc2]">
                              {item.caseId}
                            </span>
                            <StatusBadge label={item.status} tone={item.statusTone} />
                            <StatusBadge label={item.channel} tone={item.channelTone} />
                          </div>

                          <div className="mt-3 text-[15px] font-medium text-slate-800">
                            {item.title}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">{item.subtitle}</div>
                        </div>

                        <div className="flex items-center justify-between gap-4 lg:min-w-[175px] lg:justify-end">
                          <span className="text-sm text-slate-500">{item.updated}</span>
                          <button
                            type="button"
                            className="rounded-xl border border-[#d5dbe2] bg-[#f4f6f8] px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#edf0f3]"
                          >
                            Edit with <span className="font-semibold text-slate-900">Lovable</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[18px] border border-[#dfe3e8] bg-white">
                  <div className="border-b border-[#dfe3e8] px-4 py-4 sm:px-5">
                    <p className="text-[18px] font-medium text-slate-800">Latest activity</p>
                  </div>

                  <div className="divide-y divide-[#e5e7eb]">
                    {activityItems.map((item) => (
                      <div key={item.title} className="px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#edf0f3] text-slate-600">
                            <Check className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[16px] font-medium text-slate-800">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                            <p className="mt-2 text-xs text-slate-400">{item.meta}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
