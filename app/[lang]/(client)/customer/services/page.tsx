import { redirect } from "next/navigation";

export default async function CustomerServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/customer/dashboard?view=shipments`);
}
