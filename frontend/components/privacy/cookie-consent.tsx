"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsPreference,
  setAnalyticsPreference,
  type AnalyticsPreference,
} from "@/lib/analytics";

export function CookieConsent() {
  const { tr } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getAnalyticsPreference() === null);
  }, []);

  function choosePreference(preference: AnalyticsPreference) {
    setAnalyticsPreference(preference);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label={tr("Cookie notice", "Уведомление об использовании cookies")}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-[720px] overflow-y-auto rounded-xl border border-[var(--color-card-blue-border)] bg-white p-3 shadow-[0_18px_50px_rgba(16,27,56,0.2)] sm:inset-x-4 sm:bottom-4 sm:p-5"
    >
      <div className="flex items-start gap-3.5">
        <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-soft-blue)] text-[var(--color-primary)] min-[360px]:flex">
          <Cookie aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-geist text-base font-[650] text-[var(--color-ink)]">
            {tr("Cookies on Talents Hub", "Cookies на Talents Hub")}
          </h2>
          <p className="mt-1.5 font-inter text-[13px] leading-5 text-[var(--color-muted)] sm:text-sm sm:leading-6">
            {tr({
              en: "Required cookies keep sign-in secure. With your permission, privacy-friendly Umami analytics also helps us improve Talents Hub without advertising cookies or collecting form contents.",
              ru: "Необходимые cookies обеспечивают безопасный вход. С вашего разрешения минимизированная аналитика Umami также помогает улучшать Talents Hub без рекламных cookies и сбора содержимого форм.",
              "zh-Hans": "必要 Cookie 用于保障安全登录。经您允许，注重隐私的 Umami 匿名分析还会帮助我们改进 Talents Hub，不使用广告 Cookie，也不收集表单内容。",
            })}{" "}
            <Link
              href="/cookies"
              className="font-semibold text-[var(--color-primary)] underline decoration-blue-300 underline-offset-2 hover:decoration-[var(--color-primary)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              {tr("Cookie policy", "Подробнее о cookies")}
            </Link>
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            onClick={() => choosePreference("necessary")}
          >
            {tr({ en: "Necessary only", ru: "Только необходимые", "zh-Hans": "仅必要 Cookie" })}
          </Button>
          <Button
            type="button"
            onClick={() => choosePreference("analytics")}
          >
            {tr({ en: "Allow analytics", ru: "Разрешить аналитику", "zh-Hans": "允许分析" })}
          </Button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:hidden">
        <Button
          type="button"
          onClick={() => choosePreference("analytics")}
        >
          {tr({ en: "Allow analytics", ru: "Разрешить аналитику", "zh-Hans": "允许分析" })}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => choosePreference("necessary")}
        >
          {tr({ en: "Necessary only", ru: "Только необходимые", "zh-Hans": "仅必要 Cookie" })}
        </Button>
      </div>
    </aside>
  );
}
