"use client";

import { Cookie, ExternalLink, Settings2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useLocale } from "@/components/i18n/locale-provider";

export function CookiePolicyContent() {
  const { tr } = useLocale();

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--color-background)] px-6 py-10 sm:py-14 lg:px-12">
      <article className="mx-auto max-w-[860px]">
        <Link
          href="/"
          className="font-inter text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          {tr("← Back to Talents Hub", "← Вернуться на Talents Hub")}
        </Link>

        <header className="mt-7 rounded-2xl bg-[var(--color-hero)] px-6 py-8 text-white sm:px-9 sm:py-10">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-blue-200">
            <Cookie aria-hidden="true" size={23} />
          </span>
          <h1 className="mt-5 font-geist text-3xl font-[650] tracking-[-0.02em] sm:text-[38px]">
            {tr("Cookie policy", "Политика использования cookies")}
          </h1>
          <p className="mt-3 max-w-[680px] font-inter text-sm leading-6 text-[var(--color-hero-muted)] sm:text-base">
            {tr(
              "This page explains what browser data Talents Hub stores, why it is needed, and how you can manage it.",
              "На этой странице объясняется, какие данные Talents Hub сохраняет в браузере, зачем они нужны и как ими управлять.",
            )}
          </p>
          <p className="mt-5 font-inter text-xs font-semibold text-blue-200">
            {tr("Last updated: July 28, 2026", "Обновлено: 28 июля 2026 года")}
          </p>
        </header>

        <div className="mt-6 space-y-5">
          <PolicySection
            icon={ShieldCheck}
            title={tr("Why we use cookies", "Зачем мы используем cookies")}
          >
            <p>
              {tr(
                "Cookies are small text records saved by your browser. Talents Hub currently uses only the records needed to authenticate users, protect forms from malicious requests, remember cookie acknowledgement, and keep the service working correctly.",
                "Cookies — это небольшие текстовые записи, которые сохраняет браузер. Сейчас Talents Hub использует только записи, необходимые для авторизации пользователей, защиты форм от вредоносных запросов, запоминания согласия и корректной работы сервиса.",
              )}
            </p>
            <p>
              {tr(
                "We do not currently use advertising or cross-site tracking cookies.",
                "Сейчас мы не используем рекламные cookies и cookies для отслеживания действий на других сайтах.",
              )}
            </p>
          </PolicySection>

          <PolicySection
            icon={Cookie}
            title={tr("What is stored", "Какие данные сохраняются")}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left font-inter text-sm">
                <thead>
                  <tr className="text-[var(--color-ink)]">
                    <th scope="col" className="border-b border-[var(--color-border)] px-3 py-3 font-semibold">
                      {tr("Name", "Название")}
                    </th>
                    <th scope="col" className="border-b border-[var(--color-border)] px-3 py-3 font-semibold">
                      {tr("Purpose", "Назначение")}
                    </th>
                    <th scope="col" className="border-b border-[var(--color-border)] px-3 py-3 font-semibold">
                      {tr("Lifetime", "Срок")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <CookieRow
                    name="sessionid"
                    purpose={tr("Keeps you signed in securely", "Поддерживает безопасный вход в аккаунт")}
                    lifetime={tr("Until the session expires", "До завершения сессии")}
                  />
                  <CookieRow
                    name="csrftoken"
                    purpose={tr("Protects forms and requests from forgery", "Защищает формы и запросы от подделки")}
                    lifetime={tr("Set by the service", "Устанавливается сервисом")}
                  />
                  <CookieRow
                    name="talents-hub-cookie-consent"
                    purpose={tr("Remembers that you accepted this policy", "Запоминает принятие этой политики")}
                    lifetime={tr("1 year", "1 год")}
                  />
                </tbody>
              </table>
            </div>
            <p>
              {tr(
                "The interface language is saved separately in your browser’s local storage under talents-hub-locale; it is not a cookie and stays on your device until removed.",
                "Язык интерфейса сохраняется отдельно в локальном хранилище браузера под именем talents-hub-locale; это не cookie, и запись остаётся на устройстве до удаления.",
              )}
            </p>
          </PolicySection>

          <PolicySection
            icon={Settings2}
            title={tr("How to manage cookies", "Как управлять cookies")}
          >
            <p>
              {tr(
                "You can view, block, or delete cookies in your browser settings. Blocking session or security cookies may prevent sign-in, form submission, and other parts of Talents Hub from working correctly.",
                "Просматривать, блокировать и удалять cookies можно в настройках браузера. Если заблокировать сессионные или защитные cookies, вход, отправка форм и другие функции Talents Hub могут работать некорректно.",
              )}
            </p>
            <p>
              {tr(
                "Browser help usually lists these controls under Privacy, Site data, or Cookies.",
                "Обычно эти настройки находятся в разделах «Конфиденциальность», «Данные сайтов» или «Файлы cookie».",
              )}
            </p>
          </PolicySection>

          <section className="rounded-xl border border-[var(--color-card-blue-border)] bg-[var(--color-soft-blue)] p-6">
            <div className="flex items-start gap-3">
              <ExternalLink aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-primary)]" size={20} />
              <div>
                <h2 className="font-geist text-lg font-[650] text-[var(--color-ink)]">
                  {tr("Policy changes", "Изменения политики")}
                </h2>
                <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-muted)]">
                  {tr(
                    "If the set or purpose of cookies changes, we will update this page and, where required, request your consent again.",
                    "Если набор или назначение cookies изменится, мы обновим эту страницу и при необходимости запросим согласие повторно.",
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}

function PolicySection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Cookie;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[0_5px_18px_rgba(16,27,56,0.05)] sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
          <Icon aria-hidden="true" size={18} />
        </span>
        <h2 className="font-geist text-xl font-[650] text-[var(--color-ink)]">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 font-inter text-sm leading-6 text-[var(--color-muted)]">{children}</div>
    </section>
  );
}

function CookieRow({ name, purpose, lifetime }: { name: string; purpose: string; lifetime: string }) {
  return (
    <tr>
      <th scope="row" className="border-b border-[var(--color-border)] px-3 py-3 font-geist-mono text-xs font-semibold text-[var(--color-ink)]">
        {name}
      </th>
      <td className="border-b border-[var(--color-border)] px-3 py-3">{purpose}</td>
      <td className="border-b border-[var(--color-border)] px-3 py-3">{lifetime}</td>
    </tr>
  );
}
