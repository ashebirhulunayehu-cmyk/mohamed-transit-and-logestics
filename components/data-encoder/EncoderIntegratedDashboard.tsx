'use client';

import { useEffect, useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  LayoutDashboard,
  FileText,
  UsersRound,
  BriefcaseBusiness,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import EncoderSidebar from './EncoderSidebar';
import { useDataEncoderStore } from '@/modules/dataencoder/data-encoder.store';

export default function EncoderIntegratedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { dashboardData, loading, error, fetchDashboard } = useDataEncoderStore();

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const metrics = [
    {
      id: 'services-created',
      title: 'Services Created',
      value: dashboardData.totalServicesCreated || 0,
      caption: 'Total service records',
      icon: BriefcaseBusiness,
      tone: 'text-blue-700 bg-blue-50',
      border: 'border-l-blue-600',
    },
    {
      id: 'needs-attention',
      title: 'Needs Attention',
      value: dashboardData.pendingServiceApprovals || 0,
      caption: 'Awaiting service review',
      icon: AlertTriangle,
      tone: 'text-amber-800 bg-amber-50',
      border: 'border-l-amber-600',
    },
    {
      id: 'customer-approvals',
      title: 'Customer Approvals',
      value: dashboardData.pendingCustomerApprovals || 0,
      caption: 'Waiting for review',
      icon: UsersRound,
      tone: 'text-violet-700 bg-violet-50',
      border: 'border-l-violet-600',
    },
    {
      id: 'draft-services',
      title: 'Draft Services',
      value: dashboardData.draftServices || 0,
      caption: 'Saved, not submitted',
      icon: FileText,
      tone: 'text-emerald-700 bg-emerald-50',
      border: 'border-l-emerald-600',
    },
  ];

  const features = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'Main encoder dashboard with real-time metrics',
      icon: LayoutDashboard,
      href: '/encoder',
      color: 'bg-sky-500',
    },
    {
      id: 'drafts',
      title: 'Draft Services',
      description: 'Manage draft service records before submission',
      icon: FileText,
      href: '/encoder/drafts',
      color: 'bg-emerald-500',
    },
    {
      id: 'create-customer',
      title: 'Create Customer',
      description: 'Register a new customer in the system',
      icon: UsersRound,
      section: 'customer-registration',
      color: 'bg-violet-500',
    },
    {
      id: 'customers',
      title: 'Customer List',
      description: 'View all registered customers',
      icon: UsersRound,
      section: 'recent-customers',
      color: 'bg-indigo-500',
    },
    {
      id: 'create-service',
      title: 'Create Service',
      description: 'Create a new shipment service record',
      icon: BriefcaseBusiness,
      section: 'service-registration',
      color: 'bg-blue-500',
    },
    {
      id: 'services',
      title: 'Services',
      description: 'View all service records and their status',
      icon: BriefcaseBusiness,
      section: 'priority-queue',
      color: 'bg-cyan-500',
    },
    {
      id: 'activity',
      title: 'Latest Activity',
      description: 'Recent customer and service records',
      icon: Activity,
      section: 'latest-activity',
      color: 'bg-orange-500',
    },
  ];

  const filteredFeatures = features.filter(feature =>
    feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <EncoderSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onSectionClick={handleSectionClick}
        activeSection={activeSection}
        stats={{
          draftServices: dashboardData.draftServices,
          pendingApprovals: dashboardData.pendingServiceApprovals,
          recentCustomers: dashboardData.recentCustomers.length,
          recentServices: dashboardData.recentServices.length,
        }}
      />

      {/* Main Content */}
      <div className="min-h-screen lg:ml-[270px]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 hover:bg-slate-100 lg:hidden transition"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              <div className="hidden md:flex flex-col">
                <h1 className="text-lg font-bold text-slate-900">Encoder Dashboard</h1>
                <p className="text-xs text-slate-500">Integrated data entry system</p>
              </div>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-md hidden sm:flex">
              <label className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search features..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 hover:bg-slate-100 transition relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="rounded-lg p-2 hover:bg-slate-100 transition">
                <HelpCircle className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Section */}
          <section className="mb-8">
            <div className="rounded-lg bg-white shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome to MAME Transit Encoder</h2>
              <p className="mt-2 text-slate-600">
                Click on any feature below to navigate through the encoder system. All functions are fully integrated and ready to use.
              </p>
              {error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">⚠️ Dashboard sync error: {error}</p>
                </div>
              )}
            </div>
          </section>

          {/* Metrics */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map(({ id, title, value, caption, icon: Icon, tone, border }) => (
                <div
                  key={id}
                  onClick={() => handleSectionClick(id)}
                  className={`rounded-lg border border-slate-200 border-l-4 ${border} ${tone} p-5 cursor-pointer transition hover:shadow-md hover:scale-105 duration-200`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="mt-3 text-3xl font-bold">
                    {loading ? '—' : value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs opacity-75">{caption}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-8">
            <h3 className="mb-4 text-lg font-bold text-slate-900">All Encoder Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => {
                      handleSectionClick(feature.id);
                      if (feature.href) {
                        window.location.href = feature.href;
                      } else if (feature.section) {
                        const element = document.getElementById(feature.section);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-slate-300 transition cursor-pointer"
                  >
                    <div className={`inline-flex rounded-lg ${feature.color} p-3 text-white mb-3 group-hover:scale-110 transition`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-900">{feature.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-sky-600 font-semibold text-sm group-hover:gap-3 transition">
                      Navigate <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredFeatures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No features match your search.</p>
              </div>
            )}
          </section>

          {/* Recent Services Preview */}
          <section className="mb-8">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
                  Recent Services ({dashboardData.recentServices.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-200">
                {dashboardData.recentServices.slice(0, 5).map((service, idx) => (
                  <div key={service.id ?? service.trackingNumber ?? idx} className="px-6 py-4 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {service.itemDescription ?? service.description ?? 'Service Record'}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {service.trackingNumber ? `#${service.trackingNumber}` : 'No tracking number'}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
                {dashboardData.recentServices.length === 0 && (
                  <div className="px-6 py-12 text-center text-slate-500">
                    No recent services yet
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 shadow-lg p-8 text-white">
              <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="mb-6 opacity-90">
                Use the sidebar to navigate between different sections or click on any feature card above.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/encoder"
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-blue-600 px-6 py-3 font-semibold hover:bg-slate-100 transition"
                >
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/encoder/drafts"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 px-6 py-3 font-semibold transition"
                >
                  View Drafts <FileText className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
