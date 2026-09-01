"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ClipboardCheck, FileText, Plus, Truck } from "lucide-react";
import { CustomerPageHeader } from "@/features/customer/components/CustomerPageHeader";
import { CustomerShell } from "@/features/customer/components/CustomerShell";
import { customerServices } from "@/features/customer/customer.data";

const summary = [
  { label: "Active services", value: "4", icon: Truck },
  { label: "Documents", value: "18", icon: FileText },
  { label: "Pending actions", value: "2", icon: ClipboardCheck },
];

export default function CustomerDashboardPage() {
  const { lang = "en" } = useParams<{ lang: string }>();

  return (
    <CustomerShell>
      <CustomerPageHeader
        eyebrow="Overview"
        title="Customer dashboard"
        description="Keep track of your import services, documents, and next steps."
      />
      <main className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          {summary.map(({ label, value, icon: Icon }) => (
            <section key={label} className="flex items-center gap-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-cyan-50 text-cyan-700">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </section>
          ))}
        </div>
        <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent services</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest import cases and their current status.</p>
            </div>
            <Link href={`/${lang}/customer/services`} className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {customerServices.slice(0, 4).map((service) => (
              <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-mono text-sm font-semibold text-blue-700">{service.id}</p>
                  <p className="mt-1 text-xs text-slate-500">{service.title}</p>
                </div>
                <p className="text-xs font-semibold text-slate-700">{service.status}</p>
              </div>
            ))}
          </div>
        </section>
        <Link href={`/${lang}/component/request-service`} className="inline-flex items-center gap-2 rounded bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">
          <Plus className="h-4 w-4" /> Request a new service
        </Link>
      </main>
    </CustomerShell>
  );
}