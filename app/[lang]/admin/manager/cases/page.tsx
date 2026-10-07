"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Upload } from "lucide-react";
import { updateShipmentStageTransport } from "@/modules/shipment/shipment.endpoint";
import { useShipmentStore } from "@/modules/shipment/shipment.store";

export default function CasesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { shipments, loading, error, fetchShipments } = useShipmentStore();

  useEffect(() => {
    void fetchShipments();
  }, [fetchShipments]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const image = formData.get("LicenceDocumentImage");

    try {
      await updateShipmentStageTransport({
        id: String(formData.get("Id") ?? "").trim(),
        serviceStageId: String(formData.get("ServiceStageId") ?? "").trim(),
        fullName: String(formData.get("FullName") ?? "").trim(),
        licenceDocument: String(formData.get("LicenceDocument") ?? "").trim(),
        licenceDocumentImage: image instanceof File && image.size > 0 ? image : null,
        phoneNumber: String(formData.get("PhoneNumber") ?? "").trim(),
        plateNumber: String(formData.get("PlateNumber") ?? "").trim(),
        productAmount: String(formData.get("ProductAmount") ?? "").trim(),
      });
      setSuccessMessage("Stage transport updated successfully.");
      event.currentTarget.reset();
    } catch (error: unknown) {
      setErrorMessage(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to update stage transport.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = "mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Case Management</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Update stage transport</h1>
        <p className="mt-1 text-sm text-slate-600">Edit transport details for an existing service stage.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Stage transport ID
              <input className={inputClassName} name="Id" type="number" min="1" required />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Service stage ID
              <input className={inputClassName} name="ServiceStageId" type="number" min="1" required />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Full name
              <input className={inputClassName} name="FullName" autoComplete="name" required />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Licence document
              <input className={inputClassName} name="LicenceDocument" required />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Phone number
              <input className={inputClassName} name="PhoneNumber" type="tel" autoComplete="tel" required />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Plate number
              <input className={inputClassName} name="PlateNumber" required />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:max-w-sm">
              Product amount
              <input className={inputClassName} name="ProductAmount" inputMode="decimal" required />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Licence document image <span className="font-normal text-slate-400">(optional)</span>
              <input className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200" name="LicenceDocumentImage" type="file" accept="image/*,.pdf" />
            </label>
          </div>

          {successMessage && (
            <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}

          <div className="border-t border-slate-100 pt-4">
            <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isSubmitting ? "Updating..." : "Update stage transport"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shipments</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Live shipment list</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {shipments.length} records
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-600">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading shipments...
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-6 text-sm text-rose-700">{error}</div>
        )}

        {!loading && !error && shipments.length === 0 && (
          <div className="px-5 py-6 text-sm text-slate-500">No shipments available yet.</div>
        )}

        {!loading && shipments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tracking</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Mode</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Hub</th>
                  <th className="px-5 py-3 font-semibold">Origin</th>
                  <th className="px-5 py-3 font-semibold">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shipments.map((shipment) => (
                  <tr key={String(shipment.id ?? shipment.trackingNumber ?? Math.random())} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{shipment.trackingNumber ?? `#${shipment.id}`}</td>
                    <td className="px-5 py-3">{shipment.description ?? "-"}</td>
                    <td className="px-5 py-3">{shipment.mode ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {shipment.status ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3">{shipment.assignedHub ?? "-"}</td>
                    <td className="px-5 py-3">{shipment.origin ?? "-"}</td>
                    <td className="px-5 py-3">{shipment.destination ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
