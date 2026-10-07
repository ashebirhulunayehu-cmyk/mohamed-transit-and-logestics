"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  ClipboardCheck,
  BriefcaseBusiness,
  FileText,
  History,
  MessageSquare,
  Bell,
  UserCircle,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAssessorStore } from "@/store/assessorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthService } from "@/services/auth.service";

export type PrototypeRole = 
  | "customer" 
  | "manager" 
  | "case_executor" 
  | "assessor" 
  | "data_encoder";

const assessmentItems = [
  {
    label: "Customer Approvals",
    href: "/admin/assessor/customer-approvals",
    icon: UserCheck,
  },
  {
    label: "Service Reviews",
    href: "/admin/assessor/service-reviews",
    icon: ClipboardCheck,
  },
  {
    label: "Services",
    href: "/admin/assessor/services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Documents",
    href: "/admin/assessor/documents",
    icon: FileText,
  },
  {
    label: "Assessment Logs",
    href: "/admin/assessor/assessment-logs",
    icon: History,
  },
];

const communicationItems = [
  {
    label: "Messages",
    href: "/admin/assessor/messages",
    icon: MessageSquare,
  },
  {
    label: "Notifications",
    href: "/admin/assessor/notifications",
    icon: Bell,
  },
];

const accountItems = [
  {
    label: "Profile",
    href: "/admin/assessor/profile",
    icon: UserCircle,
  },
];

const caseExecutorItems = [
  {
    label: "Assigned Services",
    href: "/admin/case-Executer#assigned-service",
    icon: BriefcaseBusiness,
  },
  {
    label: "Today's Tasks",
    href: "/admin/case-Executer#todays-tasks",
    icon: ClipboardCheck,
  },
  {
    label: "Urgent Notifications",
    href: "/admin/case-Executer#urgent-notifications",
    icon: Bell,
  },
];

const roles: {
  value: PrototypeRole;
  label: string;
}[] = [
  {
    value: "customer",
    label: "Customer / Importer",
  },
  {
    value: "manager",
    label: "Manager / Administrator",
  },
  {
    value: "case_executor",
    label: "Case Executor",
  },
  {
    value: "assessor",
    label: "Assessor",
  },
  {
    value: "data_encoder",
    label: "Data Encoder",
  },
];

export default function AssessorSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const router = useRouter();

  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    closeMobileSidebar,
    selectedRole,
    setSelectedRole,
  } = useAssessorStore();

  const { logout } = useAuthStore();
  const activeRole = pathname.includes("/admin/case-Executer")
    ? "case_executor"
    : selectedRole;
  const dashboardHref = activeRole === "case_executor"
    ? "/admin/case-Executer"
    : "/admin/dashboard";

  const [roleOpen, setRoleOpen] = useState(false);

  const isActive = (href: string) => {
    const fullHref = `/${lang}${href}`;
    if (href === "/admin/dashboard") {
      return pathname === fullHref;
    }
    return pathname.startsWith(fullHref);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    logout();
    router.push(`/${lang}/auth/login`);
  };

  const renderNavItem = (item: {
    label: string;
    href: string;
    icon: React.ElementType;
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const fullHref = `/${lang}${item.href}`;

    return (
      <Link
        key={item.href}
        href={fullHref}
        onClick={closeMobileSidebar}
        title={sidebarCollapsed ? item.label : undefined}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon
          className={`h-[19px] w-[19px] shrink-0 ${
            active
              ? "text-white"
              : "text-slate-500 group-hover:text-slate-700"
          }`}
          strokeWidth={1.9}
        />

        {!sidebarCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-dvh w-[270px] flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:h-screen ${sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[270px]"} ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
      {/* Brand */}
      <div className="flex h-[76px] items-center border-b border-slate-200 px-4">
        <Link
          href={`/${lang}${dashboardHref}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <span className="text-sm font-bold">M</span>
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                MOT Import Services
              </p>

              <p className="text-xs text-slate-500">
                {activeRole === "case_executor" ? "Case Operations" : "Assessment Portal"}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {/* Overview */}
        <div className="mb-6">
          {!sidebarCollapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Overview
            </p>
          )}

          {renderNavItem({
            label: "Dashboard",
            href: dashboardHref,
            icon: LayoutDashboard,
          })}
        </div>

        {activeRole === "case_executor" ? (
          <div className="mb-6">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Case Execution
              </p>
            )}
            <div className="space-y-1">
              {caseExecutorItems.map(renderNavItem)}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              {!sidebarCollapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Assessment
                </p>
              )}
              <div className="space-y-1">
                {assessmentItems.map(renderNavItem)}
              </div>
            </div>

            <div className="mb-6">
              {!sidebarCollapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Communication
                </p>
              )}
              <div className="space-y-1">
                {communicationItems.map(renderNavItem)}
              </div>
            </div>
          </>
        )}

        {/* Account */}
        {activeRole !== "case_executor" && (
          <div>
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Account
              </p>
            )}
            <div className="space-y-1">
              {accountItems.map(renderNavItem)}
            </div>
          </div>
        )}
      </div>

      {/* Role Selector and Sign out */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        <div className="relative">
          {/* Main Trigger Button */}
          <button
            type="button"
            onClick={() => setRoleOpen((open) => !open)}
            title={sidebarCollapsed ? "Prototype role" : undefined}
            className={`flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:bg-slate-100 ${
                  sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {!sidebarCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Prototype Role
                  </p>
                  <p className="truncate text-sm font-bold text-slate-900">
                    {roles.find((role) => role.value === activeRole)?.label || "Assessor"}
                  </p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  roleOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Dropdown Menu */}
          {roleOpen && !sidebarCollapsed && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">Switch demonstration role</p>
              </div>

              <div className="py-1 space-y-0.5">
                {roles.map((role) => {
                  const selected = activeRole === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.value);
                        setRoleOpen(false);
                        if (role.value === "case_executor") {
                          router.push(`/${lang}/admin/case-Executer`);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        selected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{role.label}</span>
                      {selected && (
                        <span className="text-xs text-slate-400 font-normal">current</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sign out option inside dropdown */}
              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}