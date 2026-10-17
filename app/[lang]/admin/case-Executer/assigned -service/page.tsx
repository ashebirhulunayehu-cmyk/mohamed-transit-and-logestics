import { redirect } from "next/navigation";

type AssignedServicesAliasPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function AssignedServicesAliasPage({
  params,
}: AssignedServicesAliasPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/admin/case-Executer/services`);
}