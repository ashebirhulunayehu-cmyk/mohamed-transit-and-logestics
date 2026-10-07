import { redirect } from "next/navigation";

export default async function CustomerHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/customer/dashboard`);
}
