"use client";

import Link from "next/link";

import { useLocale } from "@/components/i18n/locale-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

type SectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
}: SectionPlaceholderProps) {
  const { tr } = useLocale();
  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1440px] items-center px-6 py-16 lg:px-12">
        <section className="max-w-2xl rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
          <p className="font-inter text-xs font-bold tracking-[0.08em] text-[var(--color-primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-geist text-4xl font-bold tracking-[-0.03em] text-[var(--color-ink)]">
            {title}
          </h1>
          <p className="mt-4 font-inter text-base leading-6 text-[var(--color-muted)]">
            {description}
          </p>
          <Button asChild className="mt-7">
            <Link href="/">{tr("Back to home", "На главную")}</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
