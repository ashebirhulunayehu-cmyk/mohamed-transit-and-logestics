import { redirect } from "next/navigation";

interface ResetPasswordAliasProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordAlias({
  searchParams,
}: ResetPasswordAliasProps) {
  const values = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(`/en/auth/reset-password${queryString ? `?${queryString}` : ""}`);
}