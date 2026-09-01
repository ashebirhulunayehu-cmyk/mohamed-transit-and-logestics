"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Bell,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PackageSearch,
  Plus,
  Search,
  Truck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { ReactNode } from "react";
import { useCustomerStore } from "../customer.store";

const groups = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/customer", LayoutDashboard],
      ["My Services", "/customer/services", PackageSearch],
      ["Request New Service", "/component/request-service", Plus],
    ],
  },
  {
    label: "Records",
    items: [["Tax Information", "/customer/tax-information", WalletCards], ["Documents", "/customer/documents", FileText]],
  },
  {
    label: "Communication",
    items: [["Notifications", "/customer/notifications", Bell], ["Messages", "/customer/messages", MessageSquare], ["Contact Us", "/customer/contact", CircleHelp]],
  },
  { label: "Account", items: [["Profile", "/customer/profile", UserRound]] },
] as const;

export function CustomerShell({ children }: { children: ReactNode }) {
  const { lang = "en" } = useParams<{ lang: string }>();
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar, toggleSidebar } = useCustomerStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200 bg-white text-slate-600 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><Truck className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p><p className="text-xs text-slate-500">Ministry of Transport</p></div>
          <button className="ml-auto text-slate-500 lg:hidden" onClick={closeSidebar} aria-label="Close navigation"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groups.map((group) => <div key={group.label}><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p><div className="space-y-1">{group.items.map(([label, href, Icon]) => { const active = pathname === `/${lang}${href}`; return <Link key={href} href={`/${lang}${href}`} onClick={closeSidebar} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon className={`h-[19px] w-[19px] shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} strokeWidth={1.9} /><span className="truncate">{label}</span>{label === "My Services" && <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>4</span>}{label === "Notifications" && <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>3</span>}{label === "Messages" && <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>1</span>}</Link>; })}</div></div>)}
        </nav>
        <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prototype role</p><p className="mt-1 text-xs font-semibold text-slate-900">Customer / Importer</p></div>
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={closeSidebar} aria-label="Close navigation" />}
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden" onClick={toggleSidebar} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><div className="relative hidden w-[220px] md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" placeholder="Search..." /></div></div><div className="flex items-center gap-2 sm:gap-3"><button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Notifications"><Bell className="h-[19px] w-[19px]" /><span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /></button><CircleHelp className="hidden h-5 w-5 text-slate-500 sm:block" /><div className="hidden h-7 w-px bg-slate-200 sm:block" /><div className="flex items-center gap-2 rounded-lg px-1.5 py-1.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">SB</div><div className="hidden text-left sm:block"><p className="max-w-[120px] truncate text-xs font-semibold text-slate-900">Selamawit Bekele</p><p className="text-[11px] text-slate-500">Customer / Importer</p></div></div></div></header>
        {children}
      </div>
    </div>
  );
}
