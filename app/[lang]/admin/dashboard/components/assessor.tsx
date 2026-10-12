'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, Modal, Row, Skeleton, Statistic, message } from 'antd';
import { useAssessorStore } from '@/modules/assessor/assessor.store';
import type { AssessorItem } from '@/modules/assessor/assessor.type';
import { useServiceReviewStore } from '@/features/service-reviews/serviceReview.store';
import type { ServiceCase } from '@/features/service-reviews/serviceReview.types';
import { useAuditStore } from '@/features/audit-logs/audit-logs-store';

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

  if (name === 'x') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
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

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
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

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
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

  if (name === 'layers') {
    return (
      <svg {...common}>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </svg>
    );
  }

  if (name === 'alert') {
    return (
      <svg {...common}>
        <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4m0 4h.01" />
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

const getRecordText = (record: AssessorItem, ...keys: string[]): string => {
  const value = Object.entries(record).find(([key, entry]) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()) &&
    (typeof entry === 'string' || typeof entry === 'number'),
  )?.[1];
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
};

const getRecordId = (record: AssessorItem): number | null => {
  const value = getRecordText(record, 'customerId', 'id');
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const countComplianceIssues = (issues: AssessorItem[]): number =>
  issues.reduce((total, issue) => {
    const rawCount = getRecordText(issue, 'count');
    const count = Number(rawCount);
    return total + (rawCount !== '' && Number.isFinite(count) && count >= 0 ? count : 1);
  }, 0);

const formatDate = (value?: string | null): string => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCity = (value?: string | null): string => {
  const city = value?.trim();
  if (!city) return 'Location unavailable';
  return city.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
};

export default function AssessorDashboardPage() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const {
    dashboardData,
    fetchDashboard,
    dashboardLoading,
    dashboardError,
    complianceIssues,
    fetchComplianceIssues,
    complianceIssuesLoading,
    complianceIssuesError,
    pendingCustomers,
    pendingCustomersLoading,
    pendingCustomersError,
    fetchPendingCustomers,
    approveCustomer,
  } = useAssessorStore();
  const {
    cases: pendingReviewCases,
    fetchCases: fetchPendingReviewCases,
    reviewCase,
    loading: reviewLoading,
    error: reviewError,
  } = useServiceReviewStore();
  const {
    logs: assessmentLogs,
    loading: assessmentLogsLoading,
    error: assessmentLogsError,
    fetchLogs: fetchAssessmentLogs,
  } = useAuditStore();
  const [approvingCustomerId, setApprovingCustomerId] = useState<number | null>(null);
  const [selectedReviewCase, setSelectedReviewCase] = useState<ServiceCase | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    void fetchDashboard();
    void fetchComplianceIssues();
    void fetchPendingCustomers();
    void fetchPendingReviewCases();
    void fetchAssessmentLogs();
  }, [fetchDashboard, fetchComplianceIssues, fetchPendingCustomers, fetchPendingReviewCases, fetchAssessmentLogs]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentTime(Date.now()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (dashboardError) messageApi.error(dashboardError);
  }, [dashboardError, messageApi]);

  useEffect(() => {
    if (complianceIssuesError) messageApi.error(complianceIssuesError);
  }, [complianceIssuesError, messageApi]);

  useEffect(() => {
    if (pendingCustomersError) messageApi.error(pendingCustomersError);
  }, [pendingCustomersError, messageApi]);

  useEffect(() => {
    if (reviewError) messageApi.error(reviewError);
  }, [reviewError, messageApi]);

  useEffect(() => {
    if (assessmentLogsError) messageApi.error(assessmentLogsError);
  }, [assessmentLogsError, messageApi]);

  const totalComplianceIssues =
    dashboardData?.totalComplianceIssues ??
    dashboardData?.complianceIssues ??
    countComplianceIssues(complianceIssues);
  const dueWithin48Hours = dashboardData?.dueWithin48Hours ?? undefined;
  const clearedThisMonth = assessmentLogsLoading || currentTime === null
    ? undefined
    : assessmentLogs.filter((log) => {
        const timestamp = Date.parse(log.timestamp);
        if (Number.isNaN(timestamp)) return false;
        const date = new Date(timestamp);
        const today = new Date(currentTime);
        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          /\b(approve|approved|clear|cleared|complete|completed|signed.?off)\b/i.test(log.type)
        );
      }).length;
  const openCases = dashboardData?.servicesUnderOversight ?? pendingReviewCases.length;
  const attentionCount =
    (dashboardData?.pendingServiceReviews ?? pendingReviewCases.length) + totalComplianceIssues;
  const stats = [
    {
      title: 'Open cases',
      value: openCases,
      description: 'Active cases under assessment',
      icon: 'layers',
      tone: 'blue',
      loading: dashboardLoading || reviewLoading,
    },
    {
      title: 'Needs attention',
      value: attentionCount,
      description: 'Risk or review',
      icon: 'alert',
      tone: 'amber',
      loading: dashboardLoading || reviewLoading || complianceIssuesLoading,
    },
    {
      title: 'Due within 48h',
      value: dueWithin48Hours,
      description: 'Pending service reviews',
      icon: 'clock',
      tone: 'slate',
      loading: dashboardLoading,
    },
    {
      title: 'Cleared this month',
      value: clearedThisMonth,
      description: 'Approved assessment log records',
      icon: 'check',
      tone: 'green',
      loading: assessmentLogsLoading || currentTime === null,
    },
  ];
  const latestActivities = useMemo(
    () =>
      [...assessmentLogs]
        .sort((first, second) => Date.parse(second.timestamp) - Date.parse(first.timestamp))
        .slice(0, 5),
    [assessmentLogs],
  );

  const handleApproveCustomer = async (customer: AssessorItem) => {
    const customerId = getRecordId(customer);
    if (customerId === null) {
      messageApi.error('This customer record does not have a valid ID.');
      return;
    }

    setApprovingCustomerId(customerId);
    try {
      await approveCustomer({ customerId, isApproved: true, notes: null });
      messageApi.success('Customer approved.');
    } catch (error: unknown) {
      messageApi.error(error instanceof Error ? error.message : 'Customer approval failed.');
    } finally {
      setApprovingCustomerId(null);
    }
  };

  const handleReviewService = async (isApproved: boolean) => {
    if (!selectedReviewCase?.shipmentId) {
      messageApi.error('This service does not have a valid shipment ID.');
      return;
    }
    if (!isApproved && !reviewNotes.trim()) {
      messageApi.error('A review note is required when rejecting a shipment.');
      return;
    }

    try {
      const result = await reviewCase({
        shipmentId: selectedReviewCase.shipmentId,
        isApproved,
        reviewNotes: reviewNotes.trim() || null,
      });
      await Promise.all([fetchDashboard(), fetchAssessmentLogs()]);
      messageApi.success(
        `${result.trackingNumber || selectedReviewCase.id} ${isApproved ? 'approved' : 'rejected'}.`,
      );
      setSelectedReviewCase(null);
      setReviewNotes('');
    } catch {
      // The review store error is surfaced by the effect above.
    }
  };

  return (
    <>
    {messageContextHolder}
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* TOP HEADER */}
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <span>Ministry of Transport</span>
                <span className="text-slate-300">/</span>
                <span>Assessment Directorate</span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Assessment queue
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Records awaiting your approval decision.
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
                href="#priority-queue"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Open case register
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section>
          <Row gutter={[16, 16]}>
            {stats.map((stat) => (
              <Col key={stat.title} xs={24} sm={12} xl={6}>
                <Card
                  loading={stat.loading}
                  className={`group h-full rounded-xl border border-slate-200 border-l-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md [&_.ant-card-body]:!p-5 ${
                    stat.tone === 'amber'
                      ? 'border-l-amber-600'
                      : stat.tone === 'green'
                        ? 'border-l-emerald-700'
                        : stat.tone === 'slate'
                          ? 'border-l-slate-300'
                          : 'border-l-blue-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      stat.tone === 'amber'
                        ? 'bg-amber-50 text-amber-700'
                        : stat.tone === 'green'
                          ? 'bg-emerald-50 text-emerald-700'
                          : stat.tone === 'slate'
                            ? 'bg-slate-50 text-slate-600'
                            : 'bg-blue-50 text-blue-700'
                    }`}>
                      <Icon name={stat.icon} size={21} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Statistic
                      title={<span className="text-xs font-semibold text-slate-500">{stat.title}</span>}
                      value={stat.value ?? '—'}
                      styles={{ content: { color: '#020617', fontSize: 28, fontWeight: 600, lineHeight: 1.2 } }}
                    />
                    <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* PRIORITY QUEUE + LATEST ACTIVITY */}
        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div id="priority-queue" className="scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Service reviews
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Priority queue</h2>
                  <p className="mt-1 text-sm text-slate-500">Prioritized by the recorded risk channel.</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-400">
                  {pendingReviewCases.length} record{pendingReviewCases.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {reviewLoading && pendingReviewCases.length === 0 ? (
                <div className="p-5"><Skeleton active title={false} paragraph={{ rows: 3 }} /></div>
              ) : pendingReviewCases.length ? [...pendingReviewCases]
                .sort((first, second) => {
                  const priority = (item: ServiceCase) =>
                    item.channel === 'Red channel' ? 0 : item.channel === 'Yellow channel' ? 1 : 2;
                  return priority(first) - priority(second);
                })
                .slice(0, 6)
                .map((serviceCase) => {
                  const statusTone = 'border-amber-200 bg-amber-50 text-amber-800';
                  const channelTone = serviceCase.channel === 'Red channel'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : serviceCase.channel === 'Yellow channel'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : serviceCase.channel === 'Green channel'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600';
                  const updatedAt = Date.parse(serviceCase.updatedAt);
                  const updatedLabel = Number.isNaN(updatedAt)
                    ? 'Updated time unavailable'
                    : currentTime === null
                      ? 'Updated time unavailable'
                      : `Updated ${new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
                          Math.round((updatedAt - currentTime) / 3_600_000),
                          'hour',
                        )}`;
                  return (
                    <article key={serviceCase.id} className="px-5 py-4 transition hover:bg-slate-50/70">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-sky-800">{serviceCase.trackingNumber}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusTone}`}>{serviceCase.status}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${channelTone}`}>{serviceCase.channel}</span>
                        <span className="ml-auto text-[11px] text-slate-400">{updatedLabel}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-slate-900">
                        {serviceCase.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {serviceCase.importer} · {serviceCase.route}
                      </p>
                    </article>
                  );
                }) : (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  No pending service review records returned by the Assessor API.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Audit trail</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Latest activity</h2>
              </div>
              <Icon name="activity" size={18} />
            </div>
            <div className="divide-y divide-slate-100">
              {assessmentLogsLoading && assessmentLogs.length === 0 ? (
                <div className="p-5"><Skeleton active title={false} paragraph={{ rows: 3 }} /></div>
              ) : latestActivities.length ? latestActivities.map((activity) => (
                <article key={activity.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.type}{activity.reference !== '—' ? ` · ${activity.reference}` : ''}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</p>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                    {activity.stage ? `${activity.stage} · ` : ''}{formatDate(activity.timestamp)}
                  </p>
                </article>
              )) : (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  No assessment activity returned by the audit log API.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* PENDING ASSESSMENT QUEUES */}
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Customer onboarding
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Pending customer approvals</h2>
                <span className="text-xs font-medium text-slate-400">
                  {pendingCustomers.length} record{pendingCustomers.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3.5">Business name</th>
                    <th className="px-5 py-3.5">TIN number</th>
                    <th className="px-5 py-3.5">City</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingCustomersLoading ? (
                    <tr>
                      <td colSpan={4} className="p-5">
                        <Skeleton active title={false} paragraph={{ rows: 3 }} />
                      </td>
                    </tr>
                  ) : pendingCustomers.length ? pendingCustomers.map((customer, index) => {
                    const customerId = getRecordId(customer);
                    return (
                      <tr key={customerId ?? `customer-${index}`} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {getRecordText(customer, 'businessName', 'name') || 'Unnamed business'}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {getRecordText(customer, 'tinNumber', 'tin') || 'Unavailable'}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatCity(getRecordText(customer, 'city', 'state') || null)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            type="primary"
                            size="small"
                            loading={customerId !== null && approvingCustomerId === customerId}
                            disabled={customerId === null || approvingCustomerId !== null}
                            onClick={() => void handleApproveCustomer(customer)}
                          >
                            Approve
                          </Button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                        No pending customer approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Service assessment
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Pending service reviews</h2>
                <span className="text-xs font-medium text-slate-400">
                  {pendingReviewCases.length} record{pendingReviewCases.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3.5">Service</th>
                    <th className="px-5 py-3.5">Tracking number</th>
                    <th className="px-5 py-3.5">Route</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviewLoading && pendingReviewCases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-5">
                        <Skeleton active title={false} paragraph={{ rows: 3 }} />
                      </td>
                    </tr>
                  ) : pendingReviewCases.length ? pendingReviewCases.map((serviceCase) => (
                    <tr key={serviceCase.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{serviceCase.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{serviceCase.importer}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {serviceCase.trackingNumber}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{serviceCase.route}</td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="small"
                          disabled={!serviceCase.shipmentId || reviewLoading}
                          onClick={() => {
                            setSelectedReviewCase(serviceCase);
                            setReviewNotes('');
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                        No pending service reviews.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FOOTER INFO */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-400 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon name="shield" size={13} />
            </span>
            <span>Activity shown here is limited to records returned by the assessment log API.</span>
          </div>

          <span>MOT Import Services · Assessment Directorate</span>
        </section>
      </div>
    </main>
    <Modal
      title="Review service"
      open={selectedReviewCase !== null}
      onCancel={() => {
        if (!reviewLoading) setSelectedReviewCase(null);
      }}
      footer={[
        <Button key="cancel" disabled={reviewLoading} onClick={() => setSelectedReviewCase(null)}>
          Cancel
        </Button>,
        <Button
          key="return"
          disabled={reviewLoading}
          loading={reviewLoading}
          onClick={() => void handleReviewService(false)}
        >
          Reject shipment
        </Button>,
        <Button
          key="approve"
          type="primary"
          disabled={reviewLoading}
          loading={reviewLoading}
          onClick={() => void handleReviewService(true)}
        >
          Approve shipment
        </Button>,
      ]}
    >
      {selectedReviewCase && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{selectedReviewCase.title}</p>
            <p className="text-xs text-slate-500">
              Shipment #{selectedReviewCase.shipmentId} · {selectedReviewCase.trackingNumber} · {selectedReviewCase.importer}
            </p>
          </div>
          <Input.TextArea
            value={reviewNotes}
            onChange={(event) => setReviewNotes(event.target.value)}
            rows={4}
            placeholder="Documentary findings, approval basis, or required reason for rejection."
          />
        </div>
      )}
    </Modal>
    </>
  );
}