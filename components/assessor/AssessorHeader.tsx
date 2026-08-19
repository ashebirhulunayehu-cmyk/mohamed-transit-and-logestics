"use client";

import {
  Bell,
  Menu,
  Search,
  UserCircle,
} from "lucide-react";
import { useAssessorStore } from "@/store/assessorStore";

export default function AssessorHeader() {
  const {
    sidebarCollapsed,
    toggleSidebar,
  } = useAssessorStore();

  return (
    <header
      className={`fixed right-0 top-0 z-30 h-[76px] border-b border-slate-200 bg-white transition-all duration-300 ${
        sidebarCollapsed ? "left-[76px]" : "left-[270px]"
      }`}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>Assessor</span>

            <span className="text-slate-300">/</span>

            <span className="font-medium text-slate-900">
              Assessment Portal
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden w-[220px] md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-[19px] w-[19px]" />

            <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          {/* User */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <UserCircle className="h-5 w-5" />
            </div>

            <div className="hidden text-left lg:block">
              <p className="max-w-[120px] truncate text-xs font-semibold text-slate-900">
                Assessor
              </p>

              <p className="text-[11px] text-slate-500">
                MOT Import Services
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}