"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, FileUp, LoaderCircle, Trash2, Truck } from "lucide-react";
import { useShipmentStore } from "@/modules/shipment/shipment.store";

const inputClassName = "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const actionClassName = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

const statusOptions = ["NotStarted", "Pending", "InProgress", "Completed", "Blocked", "NeedsReview"];

export function ShipmentOperations() {
  const {
    shipments,
    selectedShipment,
    loading,
    error,
    fetchShipments,
    fetchShipmentById,
    fetchShipmentsByImporter,
    fetchShipmentStages,
    createShipmentAction,
    assignShipmentAction,
    updateShipmentAction,
    updateShipmentServiceStageAction,
    updateShipmentStageStatusAction,
    uploadShipmentDocumentAction,
    deleteShipmentAction,
  } = useShipmentStore();

  const [createForm, setCreateForm] = useState({
    customerId: "1",
    itemDescription: "Imported cargo",
    routeCategory: "Ocean",
    declaredValue: "450000",
    taxCategory: "Standard",
    countryOfOrigin: "China",
    serviceType: "Multimodal",
  });

  const [updateForm, setUpdateForm] = useState({
    id: "1",
    itemDescription: "Updated cargo description",
    routeCategory: "Air",
    declaredValue: "520000",
    taxCategory: "Priority",
    countryOfOrigin: "United States",
    riskLevel: "Green",
  });

  const [assignForm, setAssignForm] = useState({
    shipmentId: "1",
    assignedCaseExecutorId: "10",
    assignedAssessorId: "20",
    assignmentNotes: "Assign to processing team.",
  });

  const [detailId, setDetailId] = useState("1");
  const [importerId, setImporterId] = useState("1");
  const [stageShipmentId, setStageShipmentId] = useState("1");
  const [serviceStageForm, setServiceStageForm] = useState({
    shipmentStageId: "1",
    shipmentId: "1",
    status: "InProgress",
    notes: "Shipment is in transit",
  });
  const [stageStatusForm, setStageStatusForm] = useState({
    shipmentId: "1",
    stageId: "1",
    status: "Pending",
    comments: "Awaiting customer confirmation",
  });

  const [documentForm, setDocumentForm] = useState({
    shipmentId: "1",
    stageId: "1",
    filePath: "shipment-documents/contract",
    documentType: "Invoice",
    description: "Commercial invoice",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState("1");
  const [stageList, setStageList] = useState<Array<Record<string, unknown>>>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    void fetchShipments();
  }, [fetchShipments]);

  const clearFeedback = () => {
    setResultMessage(null);
    setResultError(null);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create");

    try {
      const payload = {
        customerId: Number(createForm.customerId),
        itemDescription: createForm.itemDescription,
        routeCategory: createForm.routeCategory,
        declaredValue: Number(createForm.declaredValue),
        taxCategory: createForm.taxCategory,
        countryOfOrigin: createForm.countryOfOrigin,
        serviceType: createForm.serviceType,
      };

      const created = await createShipmentAction(payload);
      setResultMessage(created ? `Shipment created successfully: #${created.id ?? "new"}` : "Shipment created.");
      await fetchShipments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to create shipment.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setPendingAction("update");

    try {
      const payload = {
        id: Number(updateForm.id),
        itemDescription: updateForm.itemDescription,
        routeCategory: updateForm.routeCategory,
        declaredValue: Number(updateForm.declaredValue),
        taxCategory: updateForm.taxCategory,
        countryOfOrigin: updateForm.countryOfOrigin,
        riskLevel: updateForm.riskLevel,
      };

      const updated = await updateShipmentAction(payload);
      setResultMessage(updated ? `Shipment updated successfully: #${updated.id}` : "Shipment updated.");
      await fetchShipments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update shipment.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleAssignSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setPendingAction("assign");

    try {
      const payload = {
        shipmentId: Number(assignForm.shipmentId),
        assignedCaseExecutorId: Number(assignForm.assignedCaseExecutorId),
        assignedAssessorId: Number(assignForm.assignedAssessorId),
        assignmentNotes: assignForm.assignmentNotes,
      };

      const assigned = await assignShipmentAction(payload);
      setResultMessage(assigned ? `Shipment assigned successfully: #${assigned.id}` : "Shipment assigned.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to assign shipment.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleLoadDetail = async () => {
    clearFeedback();
    setPendingAction("detail");

    try {
      const shipment = await fetchShipmentById(detailId);
      if (!shipment) {
        setResultError(useShipmentStore.getState().error ?? `Shipment #${detailId} was not returned by the API.`);
        return;
      }
      setResultMessage(`Loaded shipment #${shipment.id ?? detailId}.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to load shipment details.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleLoadImporter = async () => {
    clearFeedback();
    setPendingAction("importer");

    try {
      await fetchShipmentsByImporter(importerId);
      setResultMessage(`Loaded shipments for importer #${importerId}.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to load importer shipments.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleLoadStages = async () => {
    clearFeedback();
    setPendingAction("stages");

    try {
      const stages = await fetchShipmentStages({ shipmentId: stageShipmentId });
      setStageList(Array.isArray(stages) ? (stages as Array<Record<string, unknown>>) : []);
      setResultMessage(`Loaded stages for shipment #${stageShipmentId}.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to load shipment stages.";
      setResultError(message);
      setStageList([]);
    } finally {
      setPendingAction(null);
    }
  };

  const handleServiceStageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setPendingAction("service-stage");

    try {
      const payload = {
        shipmentStageId: Number(serviceStageForm.shipmentStageId),
        shipmentId: Number(serviceStageForm.shipmentId),
        status: serviceStageForm.status,
        notes: serviceStageForm.notes,
      };

      await updateShipmentServiceStageAction(payload);
      setResultMessage("Service stage updated successfully.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update service stage.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleStageStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setPendingAction("stage-status");

    try {
      const payload = {
        shipmentId: Number(stageStatusForm.shipmentId),
        stageId: Number(stageStatusForm.stageId),
        status: stageStatusForm.status,
        comments: stageStatusForm.comments,
      };

      await updateShipmentStageStatusAction(Number(stageStatusForm.shipmentId), payload);
      setResultMessage("Stage status updated successfully.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update stage status.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setPendingAction("upload");

    try {
      const formData = new FormData();
      formData.append("ShipmentId", String(documentForm.shipmentId));
      formData.append("StageId", String(documentForm.stageId));
      formData.append("FilePath", documentForm.filePath);
      formData.append("DocumentType", documentForm.documentType);
      formData.append("Description", documentForm.description);
      if (selectedFile) {
        formData.append("File", selectedFile, selectedFile.name);
      }

      await uploadShipmentDocumentAction(formData);
      setResultMessage("Shipment document uploaded successfully.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to upload shipment document.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteShipment = async () => {
    clearFeedback();
    setPendingAction("delete");

    try {
      const success = await deleteShipmentAction(deleteId);
      if (success) {
        setResultMessage(`Shipment #${deleteId} deleted successfully.`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to delete shipment.";
      setResultError(message);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shipment Suite</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Integrated shipment endpoints</h1>
          </div>
        </div>
      </header>

      {resultMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {resultMessage}
        </div>
      )}
      {resultError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {resultError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Get all shipments</h2>
          <button type="button" onClick={() => void fetchShipments()} className={actionClassName}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading shipments...</div>
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : shipments.length === 0 ? (
          <p className="text-sm text-slate-500">No shipments available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold">Description</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Origin</th>
                  <th className="px-3 py-3 font-semibold">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shipments.map((shipment, index) => (
                  <tr key={String(shipment.id ?? shipment.trackingNumber ?? `shipment-${index}`)} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{shipment.id ?? "-"}</td>
                    <td className="px-3 py-3">{shipment.description ?? shipment.itemDescription ?? "-"}</td>
                    <td className="px-3 py-3">{shipment.status ?? shipment.stageName ?? "-"}</td>
                    <td className="px-3 py-3">{shipment.origin ?? shipment.countryOfOrigin ?? "-"}</td>
                    <td className="px-3 py-3">{shipment.destination ?? shipment.routeCategory ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Create shipment</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Customer ID<input className={inputClassName} value={createForm.customerId} onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700">Declared value<input className={inputClassName} value={createForm.declaredValue} onChange={(e) => setCreateForm({ ...createForm, declaredValue: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Item description<input className={inputClassName} value={createForm.itemDescription} onChange={(e) => setCreateForm({ ...createForm, itemDescription: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700">Route category<input className={inputClassName} value={createForm.routeCategory} onChange={(e) => setCreateForm({ ...createForm, routeCategory: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700">Tax category<input className={inputClassName} value={createForm.taxCategory} onChange={(e) => setCreateForm({ ...createForm, taxCategory: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700">Country of origin<input className={inputClassName} value={createForm.countryOfOrigin} onChange={(e) => setCreateForm({ ...createForm, countryOfOrigin: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700">Service type<select className={inputClassName} value={createForm.serviceType} onChange={(e) => setCreateForm({ ...createForm, serviceType: e.target.value })} required><option>Multimodal</option><option>Unimodal</option></select></label>
            </div>
            <button type="submit" className={actionClassName} disabled={pendingAction === "create"}>{pendingAction === "create" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Create</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Update shipment</h2>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Shipment ID<input className={inputClassName} value={updateForm.id} onChange={(e) => setUpdateForm({ ...updateForm, id: e.target.value })} required /></label>
              <label className="text-xs font-semibold text-slate-700">Risk level<select className={inputClassName} value={updateForm.riskLevel} onChange={(e) => setUpdateForm({ ...updateForm, riskLevel: e.target.value })}><option value="Blue">Blue</option><option value="Green">Green</option><option value="Yellow">Yellow</option><option value="Red">Red</option></select></label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Item description<input className={inputClassName} value={updateForm.itemDescription} onChange={(e) => setUpdateForm({ ...updateForm, itemDescription: e.target.value })} /></label>
              <label className="text-xs font-semibold text-slate-700">Route category<input className={inputClassName} value={updateForm.routeCategory} onChange={(e) => setUpdateForm({ ...updateForm, routeCategory: e.target.value })} /></label>
              <label className="text-xs font-semibold text-slate-700">Declared value<input className={inputClassName} value={updateForm.declaredValue} onChange={(e) => setUpdateForm({ ...updateForm, declaredValue: e.target.value })} /></label>
              <label className="text-xs font-semibold text-slate-700">Tax category<input className={inputClassName} value={updateForm.taxCategory} onChange={(e) => setUpdateForm({ ...updateForm, taxCategory: e.target.value })} /></label>
              <label className="text-xs font-semibold text-slate-700">Country of origin<input className={inputClassName} value={updateForm.countryOfOrigin} onChange={(e) => setUpdateForm({ ...updateForm, countryOfOrigin: e.target.value })} /></label>
            </div>
            <button type="submit" className={actionClassName} disabled={pendingAction === "update"}>{pendingAction === "update" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Update</button>
          </form>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Assign shipment</h2>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Shipment ID<input className={inputClassName} value={assignForm.shipmentId} onChange={(e) => setAssignForm({ ...assignForm, shipmentId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Executor ID<input className={inputClassName} value={assignForm.assignedCaseExecutorId} onChange={(e) => setAssignForm({ ...assignForm, assignedCaseExecutorId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Assessor ID<input className={inputClassName} value={assignForm.assignedAssessorId} onChange={(e) => setAssignForm({ ...assignForm, assignedAssessorId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Assignment notes<textarea className={`${inputClassName} min-h-[110px]`} value={assignForm.assignmentNotes} onChange={(e) => setAssignForm({ ...assignForm, assignmentNotes: e.target.value })} /></label>
            <button type="submit" className={actionClassName} disabled={pendingAction === "assign"}>{pendingAction === "assign" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />} Assign</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Get shipment by ID</h2>
          <div className="flex gap-3">
            <input className={inputClassName} type="number" min="1" step="1" value={detailId} onChange={(e) => setDetailId(e.target.value)} placeholder="Shipment ID" />
            <button type="button" onClick={() => void handleLoadDetail()} className={actionClassName} disabled={pendingAction === "detail"}>{pendingAction === "detail" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Load"}</button>
          </div>
          {selectedShipment ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div><dt className="font-semibold">ID</dt><dd>{selectedShipment.id ?? "—"}</dd></div>
                <div><dt className="font-semibold">Tracking number</dt><dd className="break-all">{selectedShipment.trackingNumber ?? "—"}</dd></div>
                <div><dt className="font-semibold">Importer ID</dt><dd>{selectedShipment.importerId ?? "—"}</dd></div>
                <div><dt className="font-semibold">Mode</dt><dd>{selectedShipment.mode ?? "—"}</dd></div>
                <div><dt className="font-semibold">Assigned hub</dt><dd>{selectedShipment.assignedHub ?? "—"}</dd></div>
                <div><dt className="font-semibold">Status</dt><dd>{selectedShipment.status ?? "—"}</dd></div>
                <div><dt className="font-semibold">Origin</dt><dd>{selectedShipment.origin ?? "—"}</dd></div>
                <div><dt className="font-semibold">Destination</dt><dd>{selectedShipment.destination ?? "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold">Description</dt><dd>{selectedShipment.description ?? selectedShipment.itemDescription ?? "—"}</dd></div>
                <div><dt className="font-semibold">Created</dt><dd>{selectedShipment.createAt ?? selectedShipment.createdAt ?? "—"}</dd></div>
                <div><dt className="font-semibold">Updated</dt><dd>{selectedShipment.updatedAt ?? "—"}</dd></div>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No shipment selected yet.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Get shipments by importer</h2>
          <div className="flex gap-3">
            <input className={inputClassName} value={importerId} onChange={(e) => setImporterId(e.target.value)} placeholder="Importer ID" />
            <button type="button" onClick={() => void handleLoadImporter()} className={actionClassName} disabled={pendingAction === "importer"}>{pendingAction === "importer" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Load"}</button>
          </div>
          {shipments.length > 0 && (
            <div className="mt-4 space-y-2">
              {shipments.map((shipment) => (
                <div key={String(shipment.id ?? shipment.trackingNumber)} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p><span className="font-semibold">#{shipment.id}</span> — {shipment.description ?? shipment.itemDescription ?? "-"}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Get shipment stages</h2>
          <div className="flex gap-3">
            <input className={inputClassName} value={stageShipmentId} onChange={(e) => setStageShipmentId(e.target.value)} placeholder="Shipment ID" />
            <button type="button" onClick={() => void handleLoadStages()} className={actionClassName} disabled={pendingAction === "stages"}>{pendingAction === "stages" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Load"}</button>
          </div>
          <div className="mt-4 space-y-2">
            {stageList.length > 0 ? (
              stageList.map((stage, index) => (
                <div key={String(stage.id ?? `${stageShipmentId}-${index}`)} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p><span className="font-semibold">Stage:</span> {String(stage.stageName ?? stage.name ?? `Stage ${index + 1}`)}</p>
                  <p><span className="font-semibold">Status:</span> {String(stage.status ?? stage.currentStatus ?? "-")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No stages loaded yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Update service stage</h2>
          <form onSubmit={handleServiceStageSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Shipment ID<input className={inputClassName} value={serviceStageForm.shipmentId} onChange={(e) => setServiceStageForm({ ...serviceStageForm, shipmentId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Shipment stage ID<input className={inputClassName} value={serviceStageForm.shipmentStageId} onChange={(e) => setServiceStageForm({ ...serviceStageForm, shipmentStageId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Status<select className={inputClassName} value={serviceStageForm.status} onChange={(e) => setServiceStageForm({ ...serviceStageForm, status: e.target.value })}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            <label className="block text-xs font-semibold text-slate-700">Notes<textarea className={`${inputClassName} min-h-[110px]`} value={serviceStageForm.notes} onChange={(e) => setServiceStageForm({ ...serviceStageForm, notes: e.target.value })} /></label>
            <button type="submit" className={actionClassName} disabled={pendingAction === "service-stage"}>{pendingAction === "service-stage" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Save stage</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Update stage status</h2>
          <form onSubmit={handleStageStatusSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Shipment ID<input className={inputClassName} value={stageStatusForm.shipmentId} onChange={(e) => setStageStatusForm({ ...stageStatusForm, shipmentId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Stage ID<input className={inputClassName} value={stageStatusForm.stageId} onChange={(e) => setStageStatusForm({ ...stageStatusForm, stageId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Status<select className={inputClassName} value={stageStatusForm.status} onChange={(e) => setStageStatusForm({ ...stageStatusForm, status: e.target.value })}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            <label className="block text-xs font-semibold text-slate-700">Comments<textarea className={`${inputClassName} min-h-[110px]`} value={stageStatusForm.comments} onChange={(e) => setStageStatusForm({ ...stageStatusForm, comments: e.target.value })} /></label>
            <div className="flex gap-3">
              <button type="submit" className={actionClassName} disabled={pendingAction === "stage-status"}>{pendingAction === "stage-status" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save status"}</button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Upload shipment document</h2>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Shipment ID<input className={inputClassName} value={documentForm.shipmentId} onChange={(e) => setDocumentForm({ ...documentForm, shipmentId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Stage ID<input className={inputClassName} value={documentForm.stageId} onChange={(e) => setDocumentForm({ ...documentForm, stageId: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">File<input type="file" className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /></label>
            <label className="block text-xs font-semibold text-slate-700">File path<input className={inputClassName} value={documentForm.filePath} onChange={(e) => setDocumentForm({ ...documentForm, filePath: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Document type<input className={inputClassName} value={documentForm.documentType} onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })} required /></label>
            <label className="block text-xs font-semibold text-slate-700">Description<input className={inputClassName} value={documentForm.description} onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} required /></label>
            <button type="submit" className={actionClassName} disabled={pendingAction === "upload"}>{pendingAction === "upload" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Upload</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Delete shipment</h2>
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Shipment ID<input className={inputClassName} value={deleteId} onChange={(e) => setDeleteId(e.target.value)} /></label>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => {
              const confirmed = window.confirm(`Are you sure you want to delete shipment #${deleteId}?`);
              if (confirmed) {
                void handleDeleteShipment();
              }
            }} disabled={pendingAction === "delete"}>{pendingAction === "delete" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete</button>
          </div>
        </section>
      </div>
    </div>
  );
}
