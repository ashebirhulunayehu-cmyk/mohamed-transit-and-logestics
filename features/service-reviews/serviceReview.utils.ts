export const isServiceSubmitted = (status: string | null | undefined): boolean =>
  typeof status === "string" &&
  status.trim().toLowerCase().replace(/[\s_-]+/g, "") === "submitted";
