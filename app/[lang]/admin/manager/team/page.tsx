"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, LoaderCircle, Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { useManagerStore } from "@/modules/manager/manager.store";
import { ManagerEndpoints } from "@/modules/manager/manager.endpoint";
import type { ManagerStaff } from "@/modules/manager/manager.type";
import { signup, updateUser } from "@/modules/auth/auth.endpoint";
import type { CreateUserRequest } from "@/modules/auth/auth.types";
import { useRolesStore } from "@/modules/roles/roles.store";
import type { RoleDto } from "@/modules/roles/roles.types";

const unwrapRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  for (const key of ["response", "data", "payload", "result"]) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const unwrapped = unwrapRecord(nested);
      if (unwrapped) return unwrapped;
    }
  }

  return record;
};

const roleIdsFromRecord = (record: Record<string, unknown>, roles: RoleDto[]): number[] => {
  const assignments = Array.isArray(record.roles)
    ? record.roles
    : Array.isArray(record.userRoles)
      ? record.userRoles
      : [];

  return [...new Set(assignments.flatMap((assignment) => {
    if (typeof assignment === "number" && Number.isInteger(assignment)) return [assignment];
    if (typeof assignment === "string") {
      const matchingRole = roles.find((role) => role.roleName.toLowerCase() === assignment.toLowerCase());
      return matchingRole?.id === undefined ? [] : [matchingRole.id];
    }
    if (!assignment || typeof assignment !== "object" || Array.isArray(assignment)) return [];

    const item = assignment as Record<string, unknown>;
    const nestedRole = item.role && typeof item.role === "object" && !Array.isArray(item.role)
      ? item.role as Record<string, unknown>
      : null;
    const id = item.roleId ?? nestedRole?.id ?? (
      typeof item.roleName === "string" ? item.id : undefined
    );
    if (typeof id === "number" && Number.isInteger(id)) return [id];

    const name = item.roleName ?? nestedRole?.roleName ?? nestedRole?.name;
    if (typeof name !== "string") return [];
    const matchingRole = roles.find((role) => role.roleName.toLowerCase() === name.toLowerCase());
    return matchingRole?.id === undefined ? [] : [matchingRole.id];
  }))];
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : typeof error === "string" ? error : fallback;

const nameOf = (member: ManagerStaff): string =>
  [member.firstName, member.lastName].filter(Boolean).join(" ").trim() || member.username || "Unnamed staff";

const statusLabel = (member: ManagerStaff): string => {
  if (member.isAccountLocked) return "Locked";
  if (member.availability?.trim()) return member.availability;
  if (member.accountStatus !== null && member.accountStatus !== undefined) {
    return String(member.accountStatus);
  }
  return "Not provided";
};

interface StaffForm {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
}

const emptyStaffForm: StaffForm = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
};

export default function TeamPage() {
  const staff = useManagerStore((state) => state.staff);
  const loading = useManagerStore((state) => state.staffLoading);
  const error = useManagerStore((state) => state.staffError);
  const fetchStaff = useManagerStore((state) => state.fetchStaff);
  const roles = useRolesStore((state) => state.roles);
  const fetchRoles = useRolesStore((state) => state.fetchRoles);
  const [search, setSearch] = useState("");
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<StaffForm>(emptyStaffForm);
  const [selectedStaff, setSelectedStaff] = useState<ManagerStaff | null>(null);
  const [permissionRoleIds, setPermissionRoleIds] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchStaff();
    void fetchRoles()
      .catch((roleError: unknown) => {
        setRolesError(getErrorMessage(roleError, "Unable to load roles."));
      })
      .finally(() => setRolesLoading(false));
  }, [fetchRoles, fetchStaff]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return staff;

    return staff.filter((member) =>
      [
        member.id,
        member.username,
        member.firstName,
        member.lastName,
        member.email,
        member.phone,
        member.branchName,
        ...(member.roleNames ?? []),
      ].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [search, staff]);

  const refreshStaffAndCheck = async () => {
    await fetchStaff();
    const refreshError = useManagerStore.getState().staffError;
    if (refreshError) throw new Error(refreshError);
  };

  const openPermissions = async (member: ManagerStaff) => {
    setSelectedStaff(member);
    setPermissionsLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const record = unwrapRecord(await ManagerEndpoints.getStaffById(member.id));
      if (!record) throw new Error("The user details response did not contain a staff record.");
      const userRecord = unwrapRecord(record.user) ?? record;
      const roleIds = roleIdsFromRecord(userRecord, roles);
      setPermissionRoleIds(roleIds.length ? roleIds : member.roleIds ?? []);
    } catch (permissionError: unknown) {
      setSelectedStaff(null);
      setActionError(getErrorMessage(permissionError, "Unable to load this staff member's roles."));
    } finally {
      setPermissionsLoading(false);
    }
  };

  const submitStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    const payload: CreateUserRequest = {
      username: addForm.username.trim(),
      firstName: addForm.firstName.trim(),
      lastName: addForm.lastName.trim(),
      email: addForm.email.trim(),
      phone: addForm.phone.trim() || undefined,
      password: addForm.password,
      roles: addForm.roleId ? [Number(addForm.roleId)] : [],
    };

    try {
      await signup(payload);
      setAddForm(emptyStaffForm);
      setAddOpen(false);
      try {
        await refreshStaffAndCheck();
        setActionMessage("Staff member added.");
      } catch (refreshError: unknown) {
        setActionError(`Staff member was created, but the staff list could not be refreshed: ${getErrorMessage(refreshError, "Refresh failed.")}`);
      }
    } catch (submitError: unknown) {
      setActionError(getErrorMessage(submitError, "Unable to add this staff member."));
    } finally {
      setSaving(false);
    }
  };

  const savePermissions = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStaff) return;

    setSaving(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await updateUser({ id: selectedStaff.id, roles: permissionRoleIds });
      setSelectedStaff(null);
      try {
        await refreshStaffAndCheck();
        setActionMessage(`Roles updated for ${nameOf(selectedStaff)}.`);
      } catch (refreshError: unknown) {
        setActionError(`Roles were saved, but the staff list could not be refreshed: ${getErrorMessage(refreshError, "Refresh failed.")}`);
      }
    } catch (saveError: unknown) {
      setActionError(getErrorMessage(saveError, "Unable to update staff roles."));
    } finally {
      setSaving(false);
    }
  };

  const staffRoleText = (member: ManagerStaff): string => {
    const names = member.roleNames?.length
      ? member.roleNames
      : (member.roleIds ?? []).flatMap((roleId) => {
          const role = roles.find((item) => item.id === roleId);
          return role ? [role.roleName] : [];
        });
    return names.join(", ") || "Not provided";
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-slate-800">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Staff management</h1>
          <p className="mt-1 text-sm text-slate-500">Roles, workload and availability across the directorate.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setActionMessage(null);
              setAddOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add staff member
          </button>
          <button
            type="button"
            aria-label="Refresh staff list"
            title="Refresh staff list"
            onClick={() => void fetchStaff()}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {(error || rolesError || actionError || actionMessage) && (
        <div
          role={actionError || error || rolesError ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionError || error || rolesError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {actionError || error || rolesError || actionMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-900">Staff members</p>
            <span className="text-xs text-slate-500">{staff.length} accounts</span>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search staff..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Staff member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Open cases</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading staff from the manager service...
                    </span>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    {staff.length ? "No staff match your search." : "No staff accounts were returned by the manager service."}
                  </td>
                </tr>
              ) : filteredStaff.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{nameOf(member)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{member.username || `ID ${member.id}`}</p>
                    {member.email && <p className="text-[11px] text-slate-400">{member.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{staffRoleText(member)}</td>
                  <td className="px-4 py-3 text-slate-600">{member.branchName || "Not provided"}</td>
                  <td className="px-4 py-3 text-slate-700">{member.openCases ?? "Not provided"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <span className={`h-2 w-2 rounded-full ${member.isAccountLocked ? "bg-amber-500" : "bg-slate-300"}`} />
                      {statusLabel(member)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openPermissions(member)}
                      disabled={rolesLoading || permissionsLoading}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Showing {filteredStaff.length} of {staff.length} staff accounts returned by the API.
        </footer>
      </section>

      {(addOpen || selectedStaff) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={addOpen ? "add-staff-title" : "staff-permissions-title"}
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            {addOpen ? (
              <>
                <h2 id="add-staff-title" className="text-lg font-semibold text-slate-900">Add staff member</h2>
                <p className="mt-1 text-sm text-slate-500">Creates a staff account through the user API and assigns a role.</p>
                <form onSubmit={(event) => void submitStaff(event)} className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      ["firstName", "First name"],
                      ["lastName", "Last name"],
                      ["username", "Username"],
                      ["email", "Email"],
                      ["phone", "Phone"],
                      ["password", "Temporary password"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="block text-xs font-medium text-slate-700">
                        {label}
                        <input
                          required={key !== "phone"}
                          type={key === "email" ? "email" : key === "password" ? "password" : "text"}
                          minLength={key === "password" ? 8 : undefined}
                          autoComplete={key === "password" ? "new-password" : undefined}
                          value={addForm[key]}
                          onChange={(event) => setAddForm((form) => ({ ...form, [key]: event.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    ))}
                    <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
                      Role
                      <select
                        required
                        value={addForm.roleId}
                        onChange={(event) => setAddForm((form) => ({ ...form, roleId: event.target.value }))}
                        disabled={rolesLoading || roles.length === 0}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      >
                        <option value="">{rolesLoading ? "Loading roles..." : "Select a role"}</option>
                        {roles.map((role) => (
                          <option key={role.id ?? role.roleName} value={role.id ?? ""} disabled={role.id === undefined}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {rolesError && (
                    <p role="alert" className="flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      {rolesError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || rolesLoading || roles.length === 0}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      {saving ? "Creating..." : "Create staff member"}
                    </button>
                  </div>
                </form>
              </>
            ) : selectedStaff ? (
              <>
                <h2 id="staff-permissions-title" className="text-lg font-semibold text-slate-900">Permissions</h2>
                <p className="mt-1 text-sm text-slate-500">Manage role assignments for {nameOf(selectedStaff)}.</p>
                {permissionsLoading ? (
                  <p role="status" className="mt-6 flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading current permissions...
                  </p>
                ) : roles.length === 0 ? (
                  <p role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    No roles were returned by the roles API. Permissions cannot be edited.
                  </p>
                ) : (
                  <form onSubmit={(event) => void savePermissions(event)} className="mt-5 space-y-2">
                    {roles.map((role) => {
                      const roleId = role.id;
                      const checked = roleId !== undefined && permissionRoleIds.includes(roleId);
                      return (
                        <label key={roleId ?? role.roleName} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={roleId === undefined}
                            onChange={() => {
                              if (roleId === undefined) return;
                              setPermissionRoleIds((current) => checked
                                ? current.filter((id) => id !== roleId)
                                : [...current, roleId]);
                            }}
                            className="mt-0.5 accent-blue-600"
                          />
                          <span>
                            <span className="block text-sm font-medium text-slate-800">{role.roleName}</span>
                            {role.privileges?.length ? (
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {role.privileges
                                  .map((privilege) => privilege.privilegeName || privilege.name)
                                  .filter((name): name is string => Boolean(name))
                                  .join(", ")}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button type="button" onClick={() => setSelectedStaff(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Cancel
                      </button>
                      <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                        {saving ? "Saving..." : "Save permissions"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
