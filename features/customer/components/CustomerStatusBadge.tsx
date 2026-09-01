import { CustomerServiceStatus } from "../customer.types";

export function CustomerStatusBadge({ status }: { status: CustomerServiceStatus }) {
  const classes = status === "Completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "Requires customer action" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-blue-200 bg-blue-50 text-blue-700";
  return <span className={`inline-flex rounded border px-2 py-1 text-[11px] font-semibold ${classes}`}>{status}</span>;
}
