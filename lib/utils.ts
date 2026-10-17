const millisecondsPerDay = 24 * 60 * 60 * 1000;

type DateInput = string | Date | null | undefined;

const parseDate = (value: DateInput): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  if (typeof value !== "string" || !value.trim()) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      parsed.getFullYear() !== Number(year) ||
      parsed.getMonth() !== Number(month) - 1 ||
      parsed.getDate() !== Number(day)
    ) {
      return null;
    }
    return parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const calculateETA = (
  departureDate: string | Date | null | undefined,
  transitDays: number,
): string => {
  const departure = parseDate(departureDate);
  if (!departure || !Number.isFinite(transitDays) || transitDays < 0) return "—";

  departure.setTime(departure.getTime() + transitDays * millisecondsPerDay);
  return departure.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export type SLAStatus = {
  label: string;
  variant: "safe" | "urgent" | "overdue" | "closed";
};

export const getSLAStatus = (
  dueDate: string | Date | null | undefined,
  status?: string,
): SLAStatus => {
  const normalizedStatus = status?.trim().toLowerCase();
  if (normalizedStatus === "completed" || normalizedStatus === "delivered") {
    return { label: "Closed", variant: "closed" };
  }

  const due = parseDate(dueDate);
  if (!due) return { label: "No due date", variant: "safe" };

  const now = new Date();
  const isDateOnly = typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim());
  if (isDateOnly) due.setHours(23, 59, 59, 999);

  const remaining = due.getTime() - now.getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const daysUntilDue = Math.round((dueDay - today) / millisecondsPerDay);

  if (remaining < 0) {
    const daysOverdue = isDateOnly
      ? Math.max(1, Math.abs(daysUntilDue))
      : Math.max(1, Math.ceil(Math.abs(remaining) / millisecondsPerDay));
    return { label: `${daysOverdue}d overdue`, variant: "overdue" };
  }

  if (daysUntilDue === 0) {
    return { label: "Due Today", variant: "urgent" };
  }

  const withinTwoDays = isDateOnly
    ? daysUntilDue <= 2
    : remaining <= 2 * millisecondsPerDay;
  const daysLeft = isDateOnly
    ? daysUntilDue
    : Math.ceil(remaining / millisecondsPerDay);

  return {
    label: `${daysLeft}d left`,
    variant: withinTwoDays ? "urgent" : "safe",
  };
};
