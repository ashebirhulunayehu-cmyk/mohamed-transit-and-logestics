"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ClipboardCheck, FileText, Plus, Truck } from "lucide-react";
import { CustomerPageHeader } from "@/features/customer/components/CustomerPageHeader";
import { CustomerShell } from "@/features/customer/components/CustomerShell";
import { customerServices } from "@/features/customer/customer.data";
import useAuthStore from "@/modules/auth/auth.store";

export default function CustomerDashboardPage() {
  const { lang = "am" } = useParams<{ lang: string }>();
  const isAm = lang === "am";

  // Zustand Store-ኡ የተጠቃሚውን ስም ለመውሰድ
  const { user } = useAuthStore();

  const summary = [
    {
      label: isAm ? "ንቁ አገልግሎቶች" : "Active services",
      value: "4",
      icon: Truck,
    },
    {
      label: isAm ? "ሰነዶች" : "Documents",
      value: "18",
      icon: FileText,
    },
    {
      label: isAm ? "የሚጠበቁ ተግባራት" : "Pending actions",
      value: "2",
      icon: ClipboardCheck,
    },
  ];

  return (
    <CustomerShell>
      <CustomerPageHeader
        eyebrow={isAm ? "አጠቃላይ እይታ" : "Overview"}
        title={
          isAm
            ? `እንኳን ደህና መጡ፣ ${user?.firstName || user?.username || "ተጠቃሚ"}`
            : `Welcome back, ${user?.firstName || user?.username || "Customer"}`
        }
        description={
          isAm
            ? "የኢምፖርት አገልግሎቶችዎን፣ ሰነዶችዎን እና የሚቀጥሉ እርምጃዎችን እዚህ ይከታተሉ።"
            : "Keep track of your import services, documents, and next steps."
        }
      />
      <main className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-7">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {summary.map(({ label, value, icon: Icon }) => (
            <section
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </section>
          ))}
        </div>

        {/* Recent Services List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAm ? "የቅርብ ጊዜ አገልግሎቶች" : "Recent services"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {isAm
                  ? "የቅርብ ጊዜ የኢምፖርት ሂደቶችዎ እና ወቅታዊ ሁኔታቸው።"
                  : "Your latest import cases and their current status."}
              </p>
            </div>
            <Link
              href={`/${lang}/customer/services`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800 transition"
            >
              {isAm ? "ሁሉንም ይመልከቱ" : "View all"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {customerServices.slice(0, 4).map((service) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-slate-50/80 transition"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-blue-700">
                    {service.id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{service.title}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href={`/${lang}/component/request-service`}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition"
          >
            <Plus className="h-4 w-4" />{" "}
            {isAm ? "አዲስ አገልግሎት ይጠይቁ" : "Request a new service"}
          </Link>
        </div>
      </main>
    </CustomerShell>
  );
}