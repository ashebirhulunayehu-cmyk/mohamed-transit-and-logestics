"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import useAuthStore from "@/modules/auth/auth.store";
import { resolveApiAssetUrl } from "@/modules/utils/asset-url";

const roles = [
	{ id: "customer", label: "Customer / Importer", href: (locale: string) => `/${locale}/customer/dashboard` },
	{ id: "manager", label: "Manager / Administrator", href: (locale: string) => `/${locale}/admin/manager/dashboard` },
	{ id: "case-executor", label: "Case Executor", href: (locale: string) => `/${locale}/admin/case-Executer` },
	{ id: "assessor", label: "Assessor", href: (locale: string) => `/${locale}/admin/assessor` },
	{ id: "data-encoder", label: "Data Encoder", href: (locale: string) => `/${locale}/admin/data-encoder/dashboard` },
] as const;

interface EncoderRoleSwitcherProps {
	collapsed?: boolean;
	profilePhotoUrl?: string;
}

export default function EncoderRoleSwitcher({
	collapsed = false,
	profilePhotoUrl: profilePhotoUrlOverride,
}: EncoderRoleSwitcherProps) {
	const pathname = usePathname();
	const router = useRouter();
	const logout = useAuthStore((state) => state.logout);
	const user = useAuthStore((state) => state.user);
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
	const displayName =
		[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
		user?.username ||
		user?.email?.split("@")[0] ||
		"Data Encoder";
	const initials =
		displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "DE";
	const profilePhotoValue =
		profilePhotoUrlOverride || user?.profilePictureUrl || user?.profilePhoto;
	const profilePhotoUrl = resolveApiAssetUrl(profilePhotoValue);
	const avatar = (
		<span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-blue-100 text-xs font-bold text-blue-700">
			{initials}
			{profilePhotoUrl && (
				// Direct img rendering supports blob URLs used to preview a newly saved photo.
				// eslint-disable-next-line @next/next/no-img-element
				<img
					key={profilePhotoUrl}
					src={profilePhotoUrl}
					alt=""
					aria-hidden="true"
					onError={(event) => {
						event.currentTarget.style.display = "none";
					}}
					className="absolute inset-0 z-10 block h-full w-full object-cover"
				/>
			)}
		</span>
	);

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
					avatar
				) : (
					<span className="flex min-w-0 items-center gap-2">
						{avatar}
						<span className="min-w-0">
							<span className="block truncate text-xs font-semibold text-slate-900">{displayName}</span>
							<span className="block truncate text-[10px] text-slate-500">{currentRole.label}</span>
						</span>
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
