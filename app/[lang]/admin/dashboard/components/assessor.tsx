'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const stats = [
  {
    title: 'Pending Reviews',
    value: '18',
    change: '+4.6%',
    description: 'Waiting for assessment',
    icon: 'clock',
  },
  {
    title: 'Approved Cases',
    value: '42',
    change: '+12.8%',
    description: 'Successfully approved',
    icon: 'check',
  },
  {
    title: 'Rejected Cases',
    value: '07',
    change: '-2.4%',
    description: 'Returned for correction',
    icon: 'x',
  },
  {
    title: 'Documents',
    value: '126',
    change: '+8.2%',
    description: 'Reviewed this month',
    icon: 'document',
  },
];

const cases = [
  {
    id: 'MTG-2026-00128',
    importer: 'ABC Import & Export PLC',
    service: 'Commercial Import',
    mode: 'Multimodal',
    risk: 'Medium',
    status: 'Pending Review',
    updated: '8 min ago',
  },
  {
    id: 'MTG-2026-00124',
    importer: 'Ethiopian Trading House',
    service: 'Vehicle Import',
    mode: 'Unimodal',
    risk: 'Low',
    status: 'Pending Review',
    updated: '24 min ago',
  },
  {
    id: 'MTG-2026-00119',
    importer: 'Blue Nile General Trading',
    service: 'General Cargo',
    mode: 'Multimodal',
    risk: 'High',
    status: 'Escalated',
    updated: '42 min ago',
  },
  {
    id: 'MTG-2026-00115',
    importer: 'East Africa Logistics',
    service: 'Container Import',
    mode: 'Multimodal',
    risk: 'Low',
    status: 'Approved',
    updated: '1 hr ago',
  },
];

const activities = [
  {
    title: 'Document reviewed',
    description: 'Commercial Invoice approved for MTG-2026-00124',
    time: '8 minutes ago',
    type: 'document',
  },
  {
    title: 'Case assigned',
    description: 'MTG-2026-00128 assigned to your review queue',
    time: '24 minutes ago',
    type: 'case',
  },
  {
    title: 'Risk alert',
    description: 'High-risk channel detected on MTG-2026-00119',
    time: '42 minutes ago',
    type: 'risk',
  },
  {
    title: 'Case approved',
    description: 'MTG-2026-00115 completed successfully',
    time: '1 hour ago',
    type: 'approved',
  },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (name === 'x') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    );
  }

  if (name === 'document') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === 'activity') {
    return (
      <svg {...common}>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    );
  }

  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  return null;
}

export default function AssessorDashboardPage() {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'en';

  const assessorBase = `/${locale}/assessor`;

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* TOP HEADER */}
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <span>Ministry of Transport</span>
                <span className="text-slate-300">/</span>
                <span>Assessment Directorate</span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Assessor Dashboard
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Review import cases, verify supporting documents and manage assessment decisions from one centralized workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span className="text-sm font-medium text-slate-600">
                  System operational
                </span>
              </div>

              <Link
                href={`${assessorBase}/document`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <Icon name="document" size={17} />
                Review documents
              </Link>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon name={stat.icon} size={21} />
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {stat.change}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>

                <div className="mt-1 flex items-end gap-2">
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* WORKFLOW + RISK */}
        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          {/* Workflow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Case workflow
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Assessment progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current cases across the import service lifecycle.
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                12 stages
              </span>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Overall completion</span>
                <span className="font-semibold text-slate-950">68%</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[68%] rounded-full bg-slate-900" />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Submitted', '24'],
                ['Under Review', '18'],
                ['Approved', '42'],
                ['Escalated', '07'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Risk monitoring
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Risk channels
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Active assessment risk indicators.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Icon name="shield" size={20} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ['Document risk', '12', 'bg-red-500', 'w-[72%]'],
                ['Value risk', '08', 'bg-amber-500', 'w-[48%]'],
                ['Route risk', '05', 'bg-blue-500', 'w-[32%]'],
                ['Compliance', '03', 'bg-emerald-500', 'w-[20%]'],
              ].map(([label, value, color, width]) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">{label}</span>
                    <span className="text-sm font-semibold text-slate-900">{value}</span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${color} ${width}`} />
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={`${assessorBase}/case-review/MTG-2026-00119`}
              className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View flagged case
              <Icon name="arrow" size={17} />
            </Link>
          </div>
        </section>

        {/* CASES + ACTIVITY */}
        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          {/* Cases */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Review queue
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    Recent cases
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                    <Icon name="search" size={17} />
                    <input
                      placeholder="Search cases..."
                      className="w-28 bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-40"
                    />
                  </div>

                  <Link
                    href={`${assessorBase}/case-review/MTG-2026-00128`}
                    className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3.5">Case</th>
                    <th className="px-6 py-3.5">Importer</th>
                    <th className="px-6 py-3.5">Mode</th>
                    <th className="px-6 py-3.5">Risk</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {cases.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{item.id}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{item.updated}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="max-w-[190px] truncate text-sm font-medium text-slate-700">
                          {item.importer}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{item.service}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {item.mode}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.risk === 'High'
                              ? 'bg-red-50 text-red-700'
                              : item.risk === 'Medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.risk}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'Escalated'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`${assessorBase}/case-review/${item.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Icon name="chevron" size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Audit trail
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Recent activity
                </h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon name="activity" size={18} />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {activities.map((activity, index) => (
                <div key={`${activity.title}-${index}`} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Icon
                        name={
                          activity.type === 'approved'
                            ? 'check'
                            : activity.type === 'risk'
                            ? 'shield'
                            : activity.type === 'document'
                            ? 'document'
                            : 'clock'
                        }
                        size={15}
                      />
                    </div>

                    {index !== activities.length - 1 && (
                      <div className="mt-1 h-full w-px bg-slate-200" />
                    )}
                  </div>

                  <div className="pb-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {activity.title}
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {activity.description}
                    </p>

                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER INFO */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-400 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon name="shield" size={13} />
            </span>
            <span>All assessment activity is logged and auditable.</span>
          </div>

          <span>MOT Import Services · Assessment Directorate</span>
        </section>
      </div>
    </main>
  );
}