"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import useAuthStore from "@/modules/auth/auth.store";

const roles = [
	{ id: "customer", label: "Customer / Importer", href: (locale: string) => `/${locale}/customer/dashboard` },
	{ id: "manager", label: "Manager / Administrator", href: (locale: string) => `/${locale}/admin/manager/dashboard` },
	{ id: "case-executor", label: "Case Executor", href: (locale: string) => `/${locale}/admin/case-Executer` },
	{ id: "assessor", label: "Assessor", href: (locale: string) => `/${locale}/admin/assessor` },
	{ id: "data-encoder", label: "Data Encoder", href: (locale: string) => `/${locale}/admin/data-encoder/dashboard` },
] as const;

interface EncoderRoleSwitcherProps {
	collapsed?: boolean;
}

export default function EncoderRoleSwitcher({ collapsed = false }: EncoderRoleSwitcherProps) {
	const pathname = usePathname();
	const router = useRouter();
	const logout = useAuthStore((state) => state.logout);
	const [open, setOpen] = useState(false);
	const firstSegment = pathname.split("/").filter(Boolean)[0];
	const locale = firstSegment === "am" || firstSegment === "en" ? firstSegment : "en";
	const activeRole = pathname.includes("/customer")
		? "customer"
		: pathname.includes("/admin/manager")
			? "manager"
			: pathname.includes("/admin/case-Executer")
				? "case-executor"
				: pathname.includes("/admin/assessor")
					? "assessor"
					: "data-encoder";
	const currentRole = roles.find((role) => role.id === activeRole) ?? roles[4];

	const handleLogout = async () => {
		setOpen(false);
		await logout();
		router.push(`/${locale}/auth/login`);
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((isOpen) => !isOpen)}
				aria-expanded={open}
				aria-haspopup="menu"
				title={collapsed ? "Switch demonstration role" : undefined}
				className={`flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
					collapsed ? "justify-center" : "justify-between"
				}`}
			>
				{collapsed ? (
					<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">DE</span>
				) : (
					<span className="min-w-0">
						<span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prototype role</span>
						<span className="block truncate text-sm font-bold text-slate-900">{currentRole.label}</span>
					</span>
				)}
				{!collapsed && (
					<ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
				)}
			</button>

			{open && (
				<div
					role="menu"
					aria-label="Switch demonstration role"
					className={`absolute bottom-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${
						collapsed ? "left-0 w-64" : "left-0 right-0"
					}`}
				>
					<div className="border-b border-slate-100 px-3 py-2">
						<p className="text-xs font-bold text-slate-800">Switch demonstration role</p>
					</div>
					<div className="space-y-0.5 py-1">
						{roles.map((role) => {
							const selected = activeRole === role.id;
							return (
								<button
									key={role.id}
									type="button"
									role="menuitem"
									onClick={() => {
										setOpen(false);
										router.push(role.href(locale));
									}}
									className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
										selected ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-50"
									}`}
								>
									<span>{role.label}</span>
									{selected && <span className="text-xs font-normal text-slate-400">current</span>}
								</button>
							);
						})}
					</div>
					<div className="mt-1 border-t border-slate-100 pt-1">
						<button
							type="button"
							role="menuitem"
							onClick={() => void handleLogout()}
							className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 transition hover:bg-rose-50"
						>
							<LogOut className="h-4 w-4" />
							<span>Sign out</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
