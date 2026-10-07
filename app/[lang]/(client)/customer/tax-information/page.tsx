import { redirect } from "next/navigation";

export default async function CustomerTaxInformationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/customer/dashboard?view=tax-records`);
}
