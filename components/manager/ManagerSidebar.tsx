"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  History,
  MessageSquare,
  Bell,
  UserCircle,
  ChevronDown,
  LogOut,
  BriefcaseBusiness,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useManagerStore } from "@/store/managerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthService } from "@/services/auth.service";

export type ManagerRoleType = "manager" | "administrator" | "supervisor";

const overviewItems = [
  { label: "Dashboard", href: "/admin/manager/dashboard", icon: LayoutDashboard, badge: null },
  { label: "Reports & Analytics", href: "/admin/manager/reports", icon: BarChart3, badge: null },
];

const operationsItems = [
  { label: "Services", href: "/admin/manager/services", icon: BriefcaseBusiness, badge: "6" },
  { label: "Shipments", href: "/admin/manager/shipments", icon: Truck, badge: null },
  { label: "Stage Transport", href: "/admin/manager/cases", icon: Truck, badge: null },
  { label: "Customers", href: "/admin/manager/customers", icon: Users, badge: null },
  { label: "Staff Management", href: "/admin/manager/team", icon: Users, badge: null },
  { label: "Documents", href: "/admin/manager/documents", icon: FileText, badge: null },
];

const governanceItems = [
  { label: "Activity Logs", href: "/admin/manager/activity-logs", icon: History, badge: null },
  { label: "Support Requests", href: "/admin/manager/support-requests", icon: Bell, badge: "2" },
];

const communicationItems = [
  { label: "Messages", href: "/admin/manager/messages", icon: MessageSquare, badge: "3" },
  { label: "Notifications", href: "/admin/manager/notifications", icon: Bell, badge: "5" },
];

const roles: { value: ManagerRoleType; label: string }[] = [
  { value: "manager", label: "Manager / Administrator" },
  { value: "administrator", label: "Administrator" },
  { value: "supervisor", label: "Supervisor" },
];

export default function ManagerSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const router = useRouter();

  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar, selectedRole, setSelectedRole } = useManagerStore();
  const { logout } = useAuthStore();
  const [roleOpen, setRoleOpen] = useState(false);

  const isActive = (href: string) => {
    const fullHref = `/${lang}${href}`;
    const managerRoot = `/${lang}/admin/manager`;

    if (href === "/admin/manager/dashboard") {
      return pathname === fullHref || pathname === managerRoot;
    }

    return pathname.startsWith(fullHref);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    logout();
    router.push(`/${lang}/auth/login`);
  };

  const renderNavItem = (item: { label: string; href: string; icon: React.ElementType; badge?: string | null }) => {
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
          active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon
          className={`h-[19px] w-[19px] shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`}
          strokeWidth={1.9}
        />

        {!sidebarCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-md bg-[#dfeaf9] px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {item.badge}
              </span>
            )}
          </>
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
      <div className="flex h-[76px] items-center border-b border-slate-200 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            M
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p>
              <p className="text-xs text-slate-500">Operations Portal</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-6">
          {!sidebarCollapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overview</p>
          )}
          <div className="space-y-1">
            {overviewItems.map(renderNavItem)}
          </div>
        </div>

        <div className="mb-6">
          {!sidebarCollapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operations</p>
          )}
          <div className="space-y-1">
            {operationsItems.map(renderNavItem)}
          </div>
        </div>

        <div className="mb-6">
          {!sidebarCollapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Governance</p>
          )}
          <div className="space-y-1">
            {governanceItems.map(renderNavItem)}
          </div>
        </div>

        <div>
          {!sidebarCollapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Communication</p>
          )}
          <div className="space-y-1">
            {communicationItems.map(renderNavItem)}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-3 space-y-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen((open) => !open)}
            title={sidebarCollapsed ? "Prototype role" : undefined}
            className={`flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:bg-slate-100 ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!sidebarCollapsed && (
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prototype role</p>
                <p className="truncate text-sm font-bold text-slate-900">
                  {roles.find((role) => role.value === selectedRole)?.label || "Manager"}
                </p>
              </div>
            )}

            {!sidebarCollapsed && (
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${roleOpen ? "rotate-180" : ""}`} />
            )}
          </button>

          {roleOpen && !sidebarCollapsed && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-800">Switch role</p>
              </div>

              <div className="space-y-0.5 py-1">
                {roles.map((role) => {
                  const selected = selectedRole === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.value as ManagerRoleType);
                        setRoleOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        selected ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{role.label}</span>
                      {selected && <span className="text-xs text-slate-400">current</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
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
