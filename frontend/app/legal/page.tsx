import Link from "next/link";

import { LegalPlaceholderWarning } from "@/components/legal/legal-document";
import { legalDocuments } from "@/lib/legal";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Правовые документы",
  description: "Правила Talents Hub, политика обработки персональных данных и согласия пользователей.",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--color-background)] px-6 py-10 sm:py-14 lg:px-12">
      <div className="mx-auto max-w-[1000px]">
        <header className="rounded-2xl bg-[var(--color-hero)] px-6 py-8 text-white sm:px-9 sm:py-10">
          <p className="font-inter text-xs font-bold uppercase tracking-[0.1em] text-blue-200">Talents Hub</p>
          <h1 className="mt-4 font-geist text-3xl font-[650] tracking-[-0.02em] sm:text-[38px]">Правовые документы</h1>
          <p className="mt-3 max-w-[700px] font-inter text-sm leading-6 text-[var(--color-hero-muted)] sm:text-base">
            Здесь собраны действующие условия платформы, сведения об операторе и документы об обработке персональных данных. Применимой является русскоязычная редакция.
          </p>
        </header>

        <LegalPlaceholderWarning />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {legalDocuments.map((document) => (
            <Link
              key={document.href}
              href={document.href}
              className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[0_5px_18px_rgba(16,27,56,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <h2 className="font-geist text-lg font-[650] text-[var(--color-ink)]">{document.title}</h2>
              <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-muted)]">{document.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
