"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { mockServiceCases } from "@/features/service-reviews/serviceReview.data";
import {
  ArrowLeft,
  Check,
  Circle,
  FileText,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { StageEvidence } from "@/features/service-reviews/components/StageEvidence";
import { AssessmentDecision } from "@/features/service-reviews/components/AssessmentDecision";

export default function SingleServiceCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const currentCase = mockServiceCases.find((c) => c.id === caseId) || mockServiceCases[0];
  const workflowStages = [
    "Prepayment Invoice",
    "Transit Permission",
    "Amendment",
    "Drop Risk",
    "Delivery Order",
    "Warehouse Status",
    "Inspection",
    "Assessment & Tax Payment",
    "Emergency / Spot",
    "Exit & Storage Payment",
    "Transportation",
    "Clearance",
  ];
  const activeStageIndex = workflowStages.indexOf(currentCase.currentStage);
  const currentStageIndex = activeStageIndex === -1 ? 7 : activeStageIndex;

  return (
    <div className="-mx-5 -mt-5 space-y-0 bg-white text-slate-800 sm:-mx-7 sm:-mt-7">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to services
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-slate-900">{currentCase.id}</h1>
              <span className="text-sm text-slate-400">·</span>
              <span className="text-sm text-slate-500">MT/MM/2026/0417</span>
              <span className="inline-flex items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700"><span>✋</span>{currentCase.statusTag}</span>
              <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"><ShieldAlert className="h-3.5 w-3.5" />{currentCase.channel}</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">{currentCase.mode}</span>
            </div>
            <h2 className="mt-2 text-sm font-medium text-slate-900">{currentCase.title} — {currentCase.containerCount}</h2>
            <p className="mt-1 text-xs text-slate-500">{currentCase.importer} · {currentCase.route} · ETA 2026-08-04</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800"><FileText className="h-4 w-4" /> Record assessment</button>
        </div>
        <div className="mt-5 flex items-center justify-between text-[11px] text-slate-500"><span>Stage {currentStageIndex + 1} of 12</span><span className="font-semibold text-slate-900">{Math.round(((currentStageIndex + 1) / 12) * 100)}% complete</span></div>
        <div className="mt-2 grid grid-cols-12 gap-1">
          {workflowStages.map((stage, index) => <span key={stage} title={stage} className={`h-1.5 rounded-full ${index < currentStageIndex ? "bg-emerald-700" : index === currentStageIndex ? "bg-violet-700" : "bg-slate-200"}`} />)}
        </div>
      </div>

      <section className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{currentCase.mode} workflow</p>
        <div className="max-w-[760px] space-y-1">
          {workflowStages.map((stage, index) => {
            const completed = index < currentStageIndex;
            const active = index === currentStageIndex;
            return <div key={stage} className={`flex items-center gap-3 px-2 py-2 ${active ? "bg-blue-50" : ""}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${completed ? "border-emerald-200 bg-emerald-100 text-emerald-700" : active ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-300 bg-slate-50 text-slate-400"}`}>{completed ? <Check className="h-4 w-4" /> : active ? <span className="text-sm">✋</span> : <Circle className="h-4 w-4" />}</span><span className="w-5 text-xs font-medium text-slate-400">{String(index + 1).padStart(2, "0")}</span><div><p className="text-sm font-semibold text-slate-800">{stage}</p><p className={`text-xs ${completed ? "text-emerald-700" : active ? "text-violet-700" : "text-slate-500"}`}>{completed ? "Completed" : active ? "Requires customer action" : "Not started"}</p></div></div>;
          })}
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Stage workspace</p><h2 className="mt-1 text-lg font-bold text-slate-900">{currentCase.currentStage}</h2></div><span className="rounded border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">✋ Requires customer action</span></div>
        <div className="mt-5 max-w-[940px] space-y-5">
          <div className="rounded border border-violet-200 bg-violet-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Requires customer action</p><p className="mt-1 text-sm text-violet-800">Settle duty & tax assessment of ETB 486,214.00 and upload the bank payment confirmation.</p></div>
          <div className="rounded border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-900">Previous stage summary</h3><p className="mt-1 text-xs text-slate-500">Carried forward context</p></div><div className="p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-emerald-700" /> Inspection <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">Completed</span></div><p className="mt-2 text-sm text-slate-600">Physical + documentary inspection completed. No discrepancy in weight or classification.</p><p className="mt-2 text-xs text-slate-500">Completed 24 Jul 2026, 19:10 · took 88h · Meron Tadesse</p></div></div>
          <div className="rounded border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-900">Required documents for this stage</h3><p className="mt-1 text-xs text-slate-500">1 of 3 received</p></div><div className="space-y-2 p-4">{[...currentCase.evidenceFiles.map((file) => file.name), "Tax payment receipt", "Bank transfer confirmation"].map((name, index) => <div key={name} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2.5 text-sm"><span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-emerald-700" : "bg-amber-600"}`} />{name}</span><span className={`text-xs font-semibold ${index === 0 ? "text-emerald-700" : "text-amber-700"}`}>{index === 0 ? "Received" : "Outstanding"}</span></div>)}</div></div>
          <div className="grid gap-5 lg:grid-cols-2"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Importer</p><h3 className="mt-2 text-sm font-bold text-slate-900">{currentCase.importer}</h3><p className="mt-1 text-xs text-slate-500">CUS-10241 · TIN 0012457893</p><p className="mt-1 text-xs text-slate-500">Selamawit Bekele · +251 911 204 118</p><button className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"><MessageSquare className="h-4 w-4" /> Message importer</button></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assigned staff</p><p className="mt-2 text-sm font-semibold text-slate-900">Meron Tadesse</p><p className="text-xs text-slate-500">Senior Case Executor</p><p className="mt-3 text-sm font-semibold text-slate-900">Hanna Wolde</p><p className="text-xs text-slate-500">Valuation & Compliance Assessor</p></div></div>
          <div className="border-t border-slate-200 pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Risk & compliance</p><span className="mt-2 inline-flex rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">◉ Yellow channel</span><p className="mt-2 text-xs text-slate-500">Documentary review required before release. Assessor sign-off is mandatory.</p></div>
          <div className="border-t border-slate-200 pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recent activity</p><div className="mt-3 space-y-3 text-xs text-slate-600"><p>› <strong className="text-slate-900">{currentCase.currentStage}</strong> requires customer action <span className="block pl-3 text-slate-500">5d ago</span></p><p>› <strong className="text-slate-900">Inspection</strong> completed <span className="block pl-3 text-slate-500">6d ago</span></p><p>› <strong className="text-slate-900">Warehouse Status</strong> completed <span className="block pl-3 text-slate-500">15d ago</span></p></div></div>
          <StageEvidence files={currentCase.evidenceFiles} currentStage={currentCase.currentStage} />
          <AssessmentDecision />
        </div>
      </section>
    </div>
  );
}