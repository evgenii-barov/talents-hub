import Link from "next/link";
import type { ReactNode } from "react";

import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSION, legalOperator } from "@/lib/legal";

export function LegalDocument({
  title,
  summary,
  children,
  showPlaceholderWarning = true,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  showPlaceholderWarning?: boolean;
}) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--color-background)] px-6 py-10 sm:py-14 lg:px-12">
      <article className="mx-auto max-w-[900px]">
        <Link
          href="/legal"
          className="font-inter text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          ← Все правовые документы
        </Link>
        <header className="mt-7 rounded-2xl bg-[var(--color-hero)] px-6 py-8 text-white sm:px-9 sm:py-10">
          <p className="font-inter text-xs font-bold uppercase tracking-[0.1em] text-blue-200">
            Talents Hub · версия {LEGAL_VERSION}
          </p>
          <h1 className="mt-4 text-balance font-geist text-3xl font-[650] tracking-[-0.02em] sm:text-[38px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[720px] text-pretty font-inter text-sm leading-6 text-[var(--color-hero-muted)] sm:text-base">
            {summary}
          </p>
          <p className="mt-5 font-inter text-xs font-semibold text-blue-200">
            Действует с {LEGAL_EFFECTIVE_DATE}
          </p>
        </header>

        {showPlaceholderWarning ? <LegalPlaceholderWarning /> : null}

        <div className="mt-6 space-y-5">{children}</div>

        <footer className="mt-8 border-t border-[var(--color-border)] pt-6 font-inter text-sm text-[var(--color-muted)]">
          <p>
            Вопросы по документу: {legalOperator.legalEmail}. Вопросы об обработке персональных данных: {legalOperator.privacyEmail}.
          </p>
        </footer>
      </article>
    </main>
  );
}

export function LegalPlaceholderWarning() {
  return (
    <aside
      role="note"
      className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 font-inter text-sm leading-6 text-amber-950"
    >
      <strong>Перед публикацией:</strong> замените все значения в квадратных скобках на реквизиты владельца сайта и оператора персональных данных. До этого документ является проектом и не должен использоваться как финальная редакция.
    </aside>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[0_5px_18px_rgba(16,27,56,0.04)] sm:p-7">
      <h2 className="font-geist text-xl font-[650] text-[var(--color-ink)]">{title}</h2>
      <div className="mt-4 space-y-3 font-inter text-sm leading-6 text-[var(--color-muted)]">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-[var(--color-primary)]">{children}</ul>;
}

export function OperatorDetails() {
  const rows = [
    ["Полное наименование", legalOperator.fullName],
    ["Сокращённое наименование", legalOperator.shortName],
    ["Статус", legalOperator.legalForm],
    ["ОГРН / ОГРНИП", legalOperator.ogrn],
    ["ИНН", legalOperator.inn],
    ["Адрес места нахождения", legalOperator.legalAddress],
    ["Почтовый адрес", legalOperator.postalAddress],
    ["E-mail", legalOperator.legalEmail],
    ["E-mail по вопросам ПД", legalOperator.privacyEmail],
    ["Телефон", legalOperator.phone],
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="font-semibold text-[var(--color-ink)]">{term}</dt>
          <dd className="break-words rounded-md bg-amber-50 px-3 py-1.5 text-amber-950">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
