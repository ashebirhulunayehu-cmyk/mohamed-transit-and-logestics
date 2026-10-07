import { redirect } from "next/navigation";

export default async function CustomerDocumentsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/customer/dashboard?view=documents`);
}
