"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

const consentCookieName = "talents-hub-cookie-consent";
const consentCookieValue = "accepted-v1";
const consentMaxAge = 60 * 60 * 24 * 365;

function hasConsentCookie() {
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim() === `${consentCookieName}=${consentCookieValue}`);
}

export function CookieConsent() {
  const { tr } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasConsentCookie());
  }, []);

  function acceptCookies() {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${consentCookieName}=${consentCookieValue}; Path=/; Max-Age=${consentMaxAge}; SameSite=Lax${secure}`;
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
            {tr(
              "We use cookies required for secure sign-in and stable operation of the service. By selecting “Accept”, you agree to their use.",
              "Мы используем cookies, необходимые для безопасного входа и стабильной работы сервиса. Нажимая «Принять», вы соглашаетесь с их использованием.",
            )}{" "}
            <Link
              href="/cookies"
              className="font-semibold text-[var(--color-primary)] underline decoration-blue-300 underline-offset-2 hover:decoration-[var(--color-primary)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              {tr("Cookie policy", "Подробнее о cookies")}
            </Link>
          </p>
        </div>
        <Button type="button" onClick={acceptCookies} className="hidden shrink-0 sm:inline-flex">
          {tr("Accept", "Принять")}
        </Button>
      </div>
      <Button type="button" onClick={acceptCookies} className="mt-3 w-full sm:hidden">
        {tr("Accept", "Принять")}
      </Button>
    </aside>
  );
}
