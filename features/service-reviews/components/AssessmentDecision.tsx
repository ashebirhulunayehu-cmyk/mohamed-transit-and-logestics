"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, MessageSquare, Send, XCircle } from "lucide-react";
import { useServiceReviewStore } from "../serviceReview.store";
import { isServiceSubmitted } from "../serviceReview.utils";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import type {
  AssessorServiceStage,
  RecordAssessmentDecision,
} from "@/modules/assessor/assessor.type";
import { useAuditStore } from "@/features/audit-logs/audit-logs-store";

const EMPTY_SERVICE_STAGES: AssessorServiceStage[] = [];
const ASSESSMENT_DECISIONS: RecordAssessmentDecision[] = [
  "Approved",
  "Rejected",
  "Requires customer action",
];

const getRequestErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

export function AssessmentDecision({
  shipmentId,
  serviceStatus,
  showDiscussion = true,
}: {
  shipmentId?: number;
  serviceStatus?: string;
  showDiscussion?: boolean;
}) {
  const [note, setNote] = useState("");
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [stageComment, setStageComment] = useState("");
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stagesError, setStagesError] = useState<string | null>(null);
  const [discussionFeedback, setDiscussionFeedback] = useState<string | null>(null);
  const [discussionFeedbackError, setDiscussionFeedbackError] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationNotes, setEscalationNotes] = useState("");
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [notificationSubject, setNotificationSubject] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationUrgent, setNotificationUrgent] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [assessmentDecision, setAssessmentDecision] = useState<RecordAssessmentDecision | "">("");
  const [assessmentTaxAmount, setAssessmentTaxAmount] = useState("");
  const [assessmentDutyAmount, setAssessmentDutyAmount] = useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [assessmentFeedback, setAssessmentFeedback] = useState<string | null>(null);
  const [assessmentFeedbackError, setAssessmentFeedbackError] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  const [escalationFeedback, setEscalationFeedback] = useState<string | null>(null);
  const [escalationFeedbackError, setEscalationFeedbackError] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);
  const [notificationFeedbackError, setNotificationFeedbackError] = useState(false);
  const reviewCase = useServiceReviewStore((state) => state.reviewCase);
  const fetchCases = useServiceReviewStore((state) => state.fetchCases);
  const loading = useServiceReviewStore((state) => state.loading);
  const canReviewService = isServiceSubmitted(serviceStatus);
  const escalateService = useAssessorStore((state) => state.escalateService);
  const escalatingServiceId = useAssessorStore((state) => state.escalatingServiceId);
  const notifyImporter = useAssessorStore((state) => state.notifyImporter);
  const notifyingImporterServiceId = useAssessorStore((state) => state.notifyingImporterServiceId);
  const recordAssessment = useAssessorStore((state) => state.recordAssessment);
  const recordingAssessmentServiceId = useAssessorStore(
    (state) => state.recordingAssessmentServiceId,
  );
  const storedServiceStages = useAssessorStore((state) =>
    shipmentId ? state.serviceStagesByServiceId[String(shipmentId)] : undefined,
  );
  const serviceStages = storedServiceStages ?? EMPTY_SERVICE_STAGES;
  const stageDiscussionsByKey = useAssessorStore((state) => state.stageDiscussionsByKey);
  const stageDiscussionsLoading = useAssessorStore((state) => state.stageDiscussionsLoading);
  const stageDiscussionsError = useAssessorStore((state) => state.stageDiscussionsError);
  const stageDiscussionSubmitting = useAssessorStore((state) => state.stageDiscussionSubmitting);
  const fetchServiceStages = useAssessorStore((state) => state.fetchServiceStages);
  const fetchStageDiscussions = useAssessorStore((state) => state.fetchStageDiscussions);
  const addStageDiscussion = useAssessorStore((state) => state.addStageDiscussion);
  const fetchDashboard = useAssessorStore((state) => state.fetchDashboard);
  const fetchLogs = useAuditStore((state) => state.fetchLogs);
  const discussionKey = shipmentId && selectedStageId !== null
    ? `${shipmentId}:${selectedStageId}`
    : "";
  const stageDiscussions = discussionKey ? stageDiscussionsByKey[discussionKey] ?? [] : [];

  const submitAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentId) {
      setAssessmentFeedback("This case does not have a backend service ID.");
      setAssessmentFeedbackError(true);
      return;
    }

    const taxAmount = Number(assessmentTaxAmount);
    const dutyAmount = Number(assessmentDutyAmount);
    if (!assessmentDecision) {
      setAssessmentFeedback("Enter an assessment decision.");
      setAssessmentFeedbackError(true);
      return;
    }
    if (
      !assessmentTaxAmount.trim() ||
      !Number.isFinite(taxAmount) ||
      taxAmount < 0
    ) {
      setAssessmentFeedback("Enter a valid non-negative tax amount.");
      setAssessmentFeedbackError(true);
      return;
    }
    if (
      !assessmentDutyAmount.trim() ||
      !Number.isFinite(dutyAmount) ||
      dutyAmount < 0
    ) {
      setAssessmentFeedback("Enter a valid non-negative duty amount.");
      setAssessmentFeedbackError(true);
      return;
    }

    setAssessmentFeedback(null);
    setAssessmentFeedbackError(false);
    try {
      await recordAssessment({
        serviceId: shipmentId,
        decision: assessmentDecision,
        taxAmount,
        dutyAmount,
        notes: assessmentNotes.trim() || null,
      });
      setAssessmentFeedback(`Assessment recorded for service ${shipmentId}.`);
      setAssessmentDecision("");
      setAssessmentTaxAmount("");
      setAssessmentDutyAmount("");
      setAssessmentNotes("");
      void Promise.allSettled([
        fetchCases(),
        fetchDashboard(),
        fetchLogs(),
        fetchServiceStages(shipmentId),
      ]);
    } catch (error: unknown) {
      setAssessmentFeedback(
        getRequestErrorMessage(error, "Failed to record assessment."),
      );
      setAssessmentFeedbackError(true);
    }
  };

  useEffect(() => {
    if (!shipmentId || !showDiscussion) return;

    let active = true;
    const timer = window.setTimeout(() => {
      setStagesLoading(true);
      setStagesError(null);
      setSelectedStageId(null);
      setDiscussionFeedback(null);
      void fetchServiceStages(shipmentId)
        .then((stages) => {
          if (active) setSelectedStageId(stages[0]?.id ?? null);
        })
        .catch((error: unknown) => {
          if (active) {
            setStagesError(error instanceof Error ? error.message : "Unable to load service stages.");
          }
        })
        .finally(() => {
          if (active) setStagesLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [fetchServiceStages, shipmentId, showDiscussion]);

  useEffect(() => {
    if (!shipmentId || !showDiscussion || selectedStageId === null) return;
    void fetchStageDiscussions(shipmentId, selectedStageId).catch(() => undefined);
  }, [fetchStageDiscussions, selectedStageId, shipmentId, showDiscussion]);

  const submitReview = async (isApproved: boolean) => {
    if (!shipmentId) {
      setFeedback("This case does not have a backend shipment ID.");
      setFeedbackError(true);
      return;
    }
    if (!canReviewService) {
      setFeedback("Only submitted services can be reviewed. Refresh the service to check its latest status.");
      setFeedbackError(true);
      return;
    }
    if (!isApproved && !note.trim()) {
      setFeedback("A review note is required when rejecting a shipment.");
      setFeedbackError(true);
      return;
    }

    setFeedback(null);
    setFeedbackError(false);
    try {
      const result = await reviewCase({
        shipmentId,
        isApproved,
        reviewNotes: note.trim() || null,
      });
      setFeedback(
        `${result.trackingNumber || `Service ${shipmentId}`} ${isApproved ? "approved" : "rejected"}.`
      );
      setNote("");
      void Promise.allSettled([fetchDashboard(), fetchLogs()]);
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Service review failed.");
      setFeedback(message);
      setFeedbackError(true);
      if (message.toLowerCase().includes("only submitted services can be reviewed")) {
        void fetchCases();
      }
    }
  };

  const submitEscalation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentId) {
      setEscalationFeedback("This case does not have a backend shipment ID.");
      setEscalationFeedbackError(true);
      return;
    }
    if (!escalationReason.trim()) {
      setEscalationFeedback("Enter a reason for escalating this service.");
      setEscalationFeedbackError(true);
      return;
    }

    setEscalationFeedback(null);
    setEscalationFeedbackError(false);
    try {
      await escalateService({
        serviceId: shipmentId,
        reason: escalationReason.trim(),
        notes: escalationNotes.trim() || null,
      });
      setEscalationFeedback(`Service ${shipmentId} escalated successfully.`);
      setEscalationReason("");
      setEscalationNotes("");
      setEscalationOpen(false);
      void Promise.allSettled([fetchCases(), fetchDashboard(), fetchLogs()]);
    } catch (error: unknown) {
      setEscalationFeedback(
        error instanceof Error ? error.message : "Service escalation failed.",
      );
      setEscalationFeedbackError(true);
    }
  };

  const submitImporterNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentId) {
      setNotificationFeedback("This case does not have a backend shipment ID.");
      setNotificationFeedbackError(true);
      return;
    }
    if (!notificationSubject.trim() || !notificationMessage.trim()) {
      setNotificationFeedback("A subject and message are required.");
      setNotificationFeedbackError(true);
      return;
    }

    setNotificationFeedback(null);
    setNotificationFeedbackError(false);
    try {
      await notifyImporter({
        serviceId: shipmentId,
        subject: notificationSubject.trim(),
        message: notificationMessage.trim(),
        isUrgent: notificationUrgent,
      });
      setNotificationFeedback(`Importer notified about service ${shipmentId}.`);
      setNotificationSubject("");
      setNotificationMessage("");
      setNotificationUrgent(false);
      setNotificationOpen(false);
      void Promise.allSettled([fetchCases(), fetchDashboard(), fetchLogs()]);
    } catch (error: unknown) {
      setNotificationFeedback(
        error instanceof Error ? error.message : "Importer notification failed.",
      );
      setNotificationFeedbackError(true);
    }
  };

  const submitStageComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentId || selectedStageId === null) {
      setDiscussionFeedback("Select a valid service stage before posting a discussion comment.");
      setDiscussionFeedbackError(true);
      return;
    }
    if (!stageComment.trim()) {
      setDiscussionFeedback("Enter a comment before posting.");
      setDiscussionFeedbackError(true);
      return;
    }

    setDiscussionFeedback(null);
    setDiscussionFeedbackError(false);
    try {
      await addStageDiscussion({
        serviceId: shipmentId,
        stageId: selectedStageId,
        comment: stageComment.trim(),
      });
      setStageComment("");
      setDiscussionFeedback("Your stage discussion comment was posted.");
      void Promise.allSettled([fetchLogs()]);
    } catch (error: unknown) {
      setDiscussionFeedback(
        error instanceof Error ? error.message : "Failed to post stage discussion comment.",
      );
      setDiscussionFeedbackError(true);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => void submitAssessment(event)}
        className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
      >
        <div>
          <h4 className="text-sm font-bold text-slate-900">Record assessment</h4>
          <p className="mt-1 text-xs text-slate-500">
            Submit the assessment decision and calculated tax and duty for this service.
          </p>
        </div>
        <label className="block text-xs font-medium text-slate-700">
          Decision <span className="text-red-600">*</span>
          <select
            required
            value={assessmentDecision}
            onChange={(event) => {
              const selectedDecision = ASSESSMENT_DECISIONS.find(
                (decision) => decision === event.target.value,
              );
              setAssessmentDecision(selectedDecision ?? "");
            }}
            className="mt-1 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Select an assessment decision</option>
            {ASSESSMENT_DECISIONS.map((decision) => (
              <option key={decision} value={decision}>{decision}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Tax amount <span className="text-red-600">*</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={assessmentTaxAmount}
              onChange={(event) => setAssessmentTaxAmount(event.target.value)}
              placeholder="0.00"
              className="mt-1 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Duty amount <span className="text-red-600">*</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={assessmentDutyAmount}
              onChange={(event) => setAssessmentDutyAmount(event.target.value)}
              placeholder="0.00"
              className="mt-1 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>
        </div>
        <label className="block text-xs font-medium text-slate-700">
          Notes <span className="font-normal text-slate-500">(optional)</span>
          <textarea
            maxLength={2000}
            rows={3}
            value={assessmentNotes}
            onChange={(event) => setAssessmentNotes(event.target.value)}
            placeholder="Add supporting assessment notes."
            className="mt-1 w-full resize-y rounded border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        {assessmentFeedback && (
          <p
            role={assessmentFeedbackError ? "alert" : "status"}
            className={`text-xs ${assessmentFeedbackError ? "text-red-700" : "text-emerald-700"}`}
          >
            {assessmentFeedback}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              !shipmentId ||
              recordingAssessmentServiceId !== null ||
              !assessmentDecision.trim() ||
              !assessmentTaxAmount.trim() ||
              !assessmentDutyAmount.trim()
            }
            className="inline-flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {recordingAssessmentServiceId === shipmentId
              ? "Recording..."
              : "Record assessment"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-sm font-bold text-slate-900">Assessment decision</h3>
        <p className="mt-1 text-xs text-slate-500">Review notes are recorded with this shipment decision.</p>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Documentary findings, approval basis, or required reason for rejection."
        className="h-24 w-full resize-none rounded border border-slate-200 p-3 text-xs placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      {!canReviewService && (
        <p role="status" className="text-xs text-amber-700">
          {serviceStatus
            ? `Only submitted services can be reviewed. Current status: ${serviceStatus}.`
            : "The service status is unavailable. Refresh the service before reviewing it."}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={loading || !shipmentId || !canReviewService} onClick={() => void submitReview(true)} className="flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">
          <CheckCircle2 className="w-4 h-4" />
          Approve shipment
        </button>
        <button disabled={loading || !shipmentId || !canReviewService} onClick={() => void submitReview(false)} className="flex items-center gap-2 rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <XCircle className="w-4 h-4" />
          Reject shipment
        </button>
      </div>
      {loading && <p role="status" className="text-xs text-slate-500">Submitting review...</p>}
      {feedback && <p role={feedbackError ? "alert" : "status"} className={feedbackError ? "text-xs text-red-700" : "text-xs text-emerald-700"}>{feedback}</p>}
      <p className="text-xs text-slate-500">A review note is required to reject a shipment.</p>

      {showDiscussion && <section className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">Stage discussion</h4>
            <p className="mt-0.5 text-xs text-slate-500">Read and add comments for a service workflow stage.</p>
          </div>
        </div>

        {stagesLoading ? (
          <p role="status" className="text-xs text-slate-500">Loading service stages...</p>
        ) : stagesError ? (
          <p role="alert" className="text-xs text-red-700">{stagesError}</p>
        ) : serviceStages.length === 0 ? (
          <p className="rounded border border-dashed border-slate-200 p-3 text-xs text-slate-500">
            No stages were returned for this service.
          </p>
        ) : (
          <>
            <label className="block text-xs font-medium text-slate-700">
              Workflow stage
              <select
                value={selectedStageId ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setSelectedStageId(Number.isSafeInteger(value) && value > 0 ? value : null);
                  setDiscussionFeedback(null);
                  setDiscussionFeedbackError(false);
                }}
                className="mt-1 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {serviceStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}{stage.status ? ` · ${stage.status}` : ""}
                  </option>
                ))}
              </select>
            </label>

            {stageDiscussionsLoading ? (
              <p role="status" className="text-xs text-slate-500">Loading stage discussion...</p>
            ) : stageDiscussionsError ? (
              <p role="alert" className="text-xs text-red-700">{stageDiscussionsError}</p>
            ) : stageDiscussions.length ? (
              <ol className="max-h-72 space-y-2 overflow-y-auto rounded border border-slate-200 p-3">
                {stageDiscussions.map((discussion) => (
                  <li key={discussion.id} className="rounded bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{discussion.author || "Assessor discussion"}</p>
                      {discussion.createdAt && (
                        <time className="text-[11px] text-slate-500">
                          {new Date(discussion.createdAt).toLocaleString()}
                        </time>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{discussion.comment}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No discussion comments have been returned for this stage.
              </p>
            )}

            <form onSubmit={(event) => void submitStageComment(event)} className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Add a comment
                <textarea
                  required
                  maxLength={2000}
                  rows={3}
                  value={stageComment}
                  onChange={(event) => setStageComment(event.target.value)}
                  placeholder="Write a comment for this stage."
                  className="mt-1 w-full resize-y rounded border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </label>
              {discussionFeedback && (
                <p
                  role={discussionFeedbackError ? "alert" : "status"}
                  className={`text-xs ${discussionFeedbackError ? "text-red-700" : "text-emerald-700"}`}
                >
                  {discussionFeedback}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!stageComment.trim() || stageDiscussionSubmitting || stageDiscussionsLoading}
                  className="inline-flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {stageDiscussionSubmitting ? "Posting..." : "Post comment"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>}

      <div className="border-t border-slate-100 pt-4">
        {!notificationOpen ? (
          <button
            type="button"
            disabled={!shipmentId || notifyingImporterServiceId !== null}
            onClick={() => {
              setNotificationFeedback(null);
              setNotificationFeedbackError(false);
              setNotificationOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            Notify importer
          </button>
        ) : (
          <form onSubmit={(event) => void submitImporterNotification(event)} className="space-y-3 rounded-lg border border-sky-200 bg-sky-50/50 p-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Notify importer</h4>
              <p className="mt-1 text-xs text-slate-600">
                Send a service-related message to the importer.
              </p>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              Subject <span className="text-red-600">*</span>
              <input
                required
                maxLength={200}
                value={notificationSubject}
                onChange={(event) => setNotificationSubject(event.target.value)}
                placeholder="Notification subject"
                className="mt-1 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Message <span className="text-red-600">*</span>
              <textarea
                required
                maxLength={4000}
                rows={4}
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                placeholder="Write the message to send to the importer."
                className="mt-1 w-full resize-y rounded border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={notificationUrgent}
                onChange={(event) => setNotificationUrgent(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
              />
              Mark as urgent
            </label>
            {notificationFeedbackError && (
              <p role="alert" className="text-xs text-red-700">{notificationFeedback}</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={notifyingImporterServiceId !== null}
                onClick={() => setNotificationOpen(false)}
                className="rounded border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  notifyingImporterServiceId !== null ||
                  !notificationSubject.trim() ||
                  !notificationMessage.trim()
                }
                className="inline-flex items-center gap-2 rounded bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Bell className="h-4 w-4" />
                {notifyingImporterServiceId === shipmentId ? "Sending..." : "Send notification"}
              </button>
            </div>
          </form>
        )}
        {!notificationFeedbackError && notificationFeedback && (
          <p role="status" className="mt-2 text-xs text-emerald-700">{notificationFeedback}</p>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        {!escalationOpen ? (
          <button
            type="button"
            disabled={!shipmentId || escalatingServiceId !== null}
            onClick={() => {
              setEscalationFeedback(null);
              setEscalationFeedbackError(false);
              setEscalationOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" />
            Escalate service
          </button>
        ) : (
          <form onSubmit={(event) => void submitEscalation(event)} className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Escalate service</h4>
              <p className="mt-1 text-xs text-slate-600">
                Provide a reason for the assessor escalation. The service ID and details will be sent to the Assessor API.
              </p>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              Reason <span className="text-red-600">*</span>
              <input
                required
                maxLength={500}
                value={escalationReason}
                onChange={(event) => setEscalationReason(event.target.value)}
                placeholder="Why does this service need escalation?"
                className="mt-1 h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Notes <span className="font-normal text-slate-500">(optional)</span>
              <textarea
                maxLength={2000}
                rows={3}
                value={escalationNotes}
                onChange={(event) => setEscalationNotes(event.target.value)}
                placeholder="Add any supporting details for the assessor."
                className="mt-1 w-full resize-y rounded border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </label>
            {escalationFeedbackError && (
              <p role="alert" className="text-xs text-red-700">
                {escalationFeedback}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={escalatingServiceId !== null}
                onClick={() => setEscalationOpen(false)}
                className="rounded border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={escalatingServiceId !== null || !escalationReason.trim()}
                className="inline-flex items-center gap-2 rounded bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" />
                {escalatingServiceId === shipmentId ? "Escalating..." : "Confirm escalation"}
              </button>
            </div>
          </form>
        )}
        {!escalationFeedbackError && escalationFeedback && (
          <p role="status" className="mt-2 text-xs text-emerald-700">{escalationFeedback}</p>
        )}
      </div>
    </div>
  );
}