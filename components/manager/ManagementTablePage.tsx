import { Bell, Inbox, Search, UserCircle } from "lucide-react";

interface ManagementTablePageProps {
  title: string;
  searchPlaceholder: string;
  columns: string[];
  emptyMessage?: string;
}

export function ManagementTablePage({
  title,
  searchPlaceholder,
  columns,
  emptyMessage = "No data",
}: ManagementTablePageProps) {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="h-[68px] bg-[#0d3d3e] px-6 text-white shadow-sm">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[15px] font-medium text-slate-100">
            <span>Manager</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-200">Operations Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden w-[260px] md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search cases..."
                className="h-10 w-full rounded-lg border border-slate-300/80 bg-white/90 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-sky-400"
              />
            </div>

            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/20">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0d3d3e]" />
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5 ring-1 ring-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-semibold text-white">Manager</p>
                <p className="text-[11px] text-slate-200">MOT Import Services</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-[18px] border border-slate-200 bg-[#f2f4f7] p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
              <UserCircle className="h-4 w-4" />
            </span>
            <h1 className="text-[30px] font-bold tracking-[-0.03em] text-slate-800">
              {title}
            </h1>
          </div>

          <div className="rounded-[14px] border border-slate-200 bg-[#f6f7f9] p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="relative w-full max-w-[700px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1.5fr_1fr_0.9fr_0.7fr] border-b border-slate-200 bg-slate-50 text-sm font-medium text-slate-600">
                {columns.map((column) => (
                  <div key={column} className="px-4 py-4">
                    {column}
                  </div>
                ))}
              </div>

              <div className="flex min-h-[360px] items-center justify-center bg-white">
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-slate-500">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Inbox className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">{emptyMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
