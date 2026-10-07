"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, Save, Send, Truck } from "lucide-react";
import { CustomerPageHeader } from "@/features/customer/components/CustomerPageHeader";
import { CustomerShell } from "@/features/customer/components/CustomerShell";
import { useCustomerServiceStore } from "@/modules/customer/customer.store";
import type { CustomerCreateServicePayload } from "@/modules/customer/customer.type";

interface ServiceRequestForm {
  description: string;
  mode: string;
  origin: string;
  destination: string;
}

const DRAFT_KEY = "mot-customer-service-request-draft";
const initialForm: ServiceRequestForm = {
  description: "",
  mode: "MultiModalSeaRail",
  origin: "",
  destination: "Addis Ababa",
};

const readDraft = (): ServiceRequestForm => {
  if (typeof window === "undefined") return initialForm;
  try {
    const draft: unknown = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    if (typeof draft !== "object" || draft === null || Array.isArray(draft)) {
      return initialForm;
    }
    const value = draft as Partial<ServiceRequestForm>;
    return {
      description: typeof value.description === "string" ? value.description : "",
      mode: value.mode === "UniModalRoad" ? value.mode : "MultiModalSeaRail",
      origin: typeof value.origin === "string" ? value.origin : "",
      destination:
        typeof value.destination === "string" ? value.destination : "Addis Ababa",
    };
  } catch {
    return initialForm;
  }
};

export default function RequestServicePage() {
  const { lang = "en" } = useParams<{ lang: string }>();
  const router = useRouter();
  const createService = useCustomerServiceStore((state) => state.createService);
  const [form, setForm] = useState<ServiceRequestForm>(readDraft);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = (field: keyof ServiceRequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setSavingDraft(true);
      setError(null);
      window.setTimeout(() => setSavingDraft(false), 1200);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? `Unable to save this draft: ${saveError.message}`
          : "Unable to save this draft in this browser.",
      );
    }
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const payload: CustomerCreateServicePayload = {
      description: form.description.trim(),
      mode: form.mode === "UniModalRoad" ? "UniModalRoad" : "MultiModalSeaRail",
      origin: form.origin.trim(),
      destination: form.destination.trim(),
    };

    setSubmitting(true);
    try {
      const created = await createService(payload);
      if (!created) {
        setError(
          useCustomerServiceStore.getState().error ||
            "The backend did not confirm the service request.",
        );
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      setSuccess(true);
      router.push(`/${lang}/customer/dashboard?view=shipments`);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the service request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerShell>
      <CustomerPageHeader
        eyebrow="New request"
        title="Request a new service"
        description="Enter your consignment details to submit a service request to MOT Import Services."
      />
      <main className="mx-auto max-w-[900px] space-y-5 p-5 sm:p-7">
        <section className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-950">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Consignment details</p>
            <p className="mt-1 text-xs text-blue-800">
              Fields are sent to the authenticated Customer/CreateService endpoint.
            </p>
          </div>
        </section>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Service request submitted successfully.
          </div>
        )}
        {savingDraft && (
          <p role="status" className="text-xs font-medium text-emerald-700">
            Draft saved in this browser.
          </p>
        )}

        <form onSubmit={submitRequest} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Goods / service description
              <textarea
                required
                maxLength={1000}
                rows={4}
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Describe the imported goods"
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Transport mode
              <select
                required
                value={form.mode}
                onChange={(event) => updateForm("mode", event.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="MultiModalSeaRail">Multimodal sea / rail</option>
                <option value="UniModalRoad">Unimodal road</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Origin
              <input
                required
                maxLength={160}
                value={form.origin}
                onChange={(event) => updateForm("origin", event.target.value)}
                placeholder="e.g. Shanghai Port"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Destination
              <input
                required
                maxLength={160}
                value={form.destination}
                onChange={(event) => updateForm("destination", event.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4">
            <Link
              href={`/${lang}/customer/dashboard?view=shipments`}
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Save className="h-4 w-4" />
                Save draft
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </CustomerShell>
  );
}
