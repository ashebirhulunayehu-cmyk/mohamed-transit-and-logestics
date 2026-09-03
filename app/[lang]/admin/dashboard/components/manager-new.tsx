'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

const stats = [
  {
    title: 'Total Cases',
    value: '48',
    change: '+8.2%',
    description: 'All active cases',
    icon: 'briefcase',
  },
  {
    title: 'Pending Review',
    value: '12',
    change: '+2.4%',
    description: 'Awaiting assessment',
    icon: 'clock',
  },
  {
    title: 'In Progress',
    value: '24',
    change: '+5.1%',
    description: 'Currently processing',
    icon: 'activity',
  },
  {
    title: 'Completed',
    value: '12',
    change: '+12.8%',
    description: 'Successfully cleared',
    icon: 'check',
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
    status: 'In Progress',
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
    status: 'Completed',
    updated: '1 hr ago',
  },
];

const teamStats = [
  { name: 'John Okonkwo', cases: 8, completed: 5, pending: 3 },
  { name: 'Sarah Mensah', cases: 12, completed: 9, pending: 3 },
  { name: 'Ahmed Hassan', cases: 10, completed: 7, pending: 3 },
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

  if (name === 'briefcase') {
    return (
      <svg {...common}>
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
        <path d="M9 3h6v4H9z" />
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

  if (name === 'document') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
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

  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  return null;
}

export default function ManagerDashboardPage() {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params.lang as string) || 'en';

  const managerBase = `/${lang}/manager`;

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
                <span>Import Operations</span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Operations Dashboard
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor import cases, manage team performance, and track operational KPIs across all corridors and channels.
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
                href={`${managerBase}/reports`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <Icon name="document" size={17} />
                View reports
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

        {/* CASES + TEAM */}
        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          {/* Cases */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Case Management
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Active Cases
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current cases across the import service lifecycle.
                </p>
              </div>

              <Link
                href={`${managerBase}/cases`}
                className="flex items-center justify-center gap-1 rounded-lg text-slate-500 transition hover:text-slate-700"
              >
                <span className="text-xs font-semibold uppercase">View all</span>
                <Icon name="arrow" size={18} />
              </Link>
            </div>

            <div className="mt-6 divide-y divide-slate-200">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="flex flex-col gap-3 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-950">
                        {caseItem.id}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          caseItem.risk === 'Low'
                            ? 'bg-emerald-100 text-emerald-700'
                            : caseItem.risk === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {caseItem.risk} risk
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{caseItem.importer}</p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {caseItem.service} • {caseItem.mode}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        caseItem.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : caseItem.status === 'Escalated'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {caseItem.status}
                    </span>

                    <span className="text-xs text-slate-400">{caseItem.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Team Performance
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Team Members
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Processing capacity and progress.
                </p>
              </div>

              <Link
                href={`${managerBase}/team`}
                className="flex items-center justify-center gap-1 rounded-lg text-slate-500 transition hover:text-slate-700"
              >
                <span className="text-xs font-semibold uppercase">Manage</span>
                <Icon name="arrow" size={18} />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {teamStats.map((member) => (
                <div key={member.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-950">
                      {member.name}
                    </p>

                    <span className="text-xs text-slate-500">
                      {member.completed}/{member.cases} cases
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{
                        width: `${(member.completed / member.cases) * 100}%`,
                      }}
                      className="h-full bg-emerald-500 transition"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
