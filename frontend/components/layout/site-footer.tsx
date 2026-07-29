"use client";

import Link from "next/link";

import { BrandMark } from "@/components/branding/brand-mark";
import { useLocale } from "@/components/i18n/locale-provider";

export function SiteFooter() {
  const { tr } = useLocale();

  return (
    <footer
      data-reveal="up"
      className="scroll-reveal bg-[var(--color-hero)] py-9 text-white"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-inter text-base font-bold"
          >
            <BrandMark />
            Talents Hub
          </Link>
          <nav
            aria-label={tr("Footer navigation", "Навигация в подвале")}
            className="flex flex-wrap justify-end gap-x-6 gap-y-3 font-inter text-sm text-blue-200"
          >
            <Link href="/projects">{tr("Projects", "Проекты")}</Link>
            <Link href="/talents">{tr("Talent", "Таланты")}</Link>
            <Link href="/organizations">
              {tr("Organisations", "Организации")}
            </Link>
            <Link href="/about">
              {tr({
                en: "About the project",
                ru: "О проекте",
                "zh-Hans": "关于项目",
              })}
            </Link>
            <Link href="/cookies">{tr("Cookies", "Cookies")}</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-white/15 pt-5 font-inter text-xs text-[var(--color-footer-muted)]">
          <p>
            {tr({
              en: "© 2026 Talents Hub · Connecting expertise across borders.",
              ru: "© 2026 Talents Hub · Соединяем экспертизу разных стран.",
              "zh-Hans": "© 2026 Talents Hub · 连接跨国专业能力。",
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
