export function CustomerPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="border-b border-slate-200 bg-white px-6 py-7 lg:px-8"><p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></section>;
}
