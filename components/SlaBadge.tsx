import { getSLAStatus } from "@/lib/utils";

type SlaBadgeProps = {
  dueDate: string | Date | null | undefined;
  status?: string;
};

const appearanceByVariant = {
  safe: "bg-emerald-100 text-emerald-800",
  urgent: "bg-amber-100 text-amber-800",
  overdue: "bg-rose-100 text-rose-800",
  closed: "bg-slate-100 text-slate-600",
} as const;

export default function SlaBadge({ dueDate, status }: SlaBadgeProps) {
  const sla = getSLAStatus(dueDate, status);

  if (sla.label === "No due date") {
    return <span className="font-semibold text-amber-700">{sla.label}</span>;
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${appearanceByVariant[sla.variant]}`}>
      {sla.label}
    </span>
  );
}
