"use client";

import { Cookie, ExternalLink, Settings2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useLocale } from "@/components/i18n/locale-provider";
import { AnalyticsPreferences } from "@/components/privacy/analytics-preferences";

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
            {tr({ en: "Last updated: September 1, 2026", ru: "Обновлено: 1 сентября 2026 года", "zh-Hans": "更新日期：2026年9月1日" })}
          </p>
        </header>

        <div className="mt-6 space-y-5">
          <PolicySection
            icon={ShieldCheck}
            title={tr("Why we use cookies", "Зачем мы используем cookies")}
          >
            <p>
              {tr({
                en: "Cookies are small text records saved by your browser. Talents Hub uses the records needed to authenticate users, protect forms from malicious requests, remember privacy preferences, and keep the service working correctly.",
                ru: "Cookies — это небольшие текстовые записи, которые сохраняет браузер. Talents Hub использует записи, необходимые для авторизации пользователей, защиты форм от вредоносных запросов, запоминания настроек конфиденциальности и корректной работы сервиса.",
                "zh-Hans": "Cookie 是浏览器保存的小型文本记录。Talents Hub 使用这些记录来验证用户身份、防止恶意请求、记住隐私偏好并确保服务正常运行。",
              })}
            </p>
            <p>
              {tr({
                en: "We do not use advertising or cross-site tracking cookies. Optional self-hosted Umami analytics does not set tracking cookies and loads only after you allow it.",
                ru: "Мы не используем рекламные cookies и cookies для отслеживания действий на других сайтах. Опциональная self-hosted аналитика Umami не устанавливает отслеживающие cookies и загружается только после вашего разрешения.",
                "zh-Hans": "我们不使用广告 Cookie 或跨站跟踪 Cookie。可选的自托管 Umami 分析不会设置跟踪 Cookie，并且只会在您允许后加载。",
              })}
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
                    purpose={tr({ en: "Remembers your analytics preference", ru: "Запоминает выбранную настройку аналитики", "zh-Hans": "记住您的分析偏好" })}
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
            icon={ShieldCheck}
            title={tr({ en: "Anonymous product analytics", ru: "Анонимная продуктовая аналитика", "zh-Hans": "匿名产品分析" })}
          >
            <p>
              {tr({
                en: "With permission, our self-hosted Umami instance records page paths, referrers, browser language, device information, approximate country, and selected product events. URL query strings, URL fragments, form contents, profile data, searches, files, and chat messages are excluded.",
                ru: "С разрешения наша self-hosted система Umami сохраняет пути страниц, источники переходов, язык браузера, сведения об устройстве, приблизительную страну и выбранные продуктовые события. Параметры и фрагменты URL, содержимое форм, данные профилей, поисковые запросы, файлы и сообщения чата исключены.",
                "zh-Hans": "经您允许，我们的自托管 Umami 会记录页面路径、来源页面、浏览器语言、设备信息、大致国家/地区以及选定的产品事件。URL 查询参数和片段、表单内容、个人资料数据、搜索内容、文件及聊天消息均不会收集。",
              })}
            </p>
            <p>
              {tr({
                en: "The tracker respects the browser Do Not Track setting. We do not assign account IDs or send names and email addresses to Umami.",
                ru: "Tracker учитывает настройку браузера Do Not Track. Мы не передаём в Umami идентификаторы аккаунтов, имена и адреса электронной почты.",
                "zh-Hans": "跟踪器遵循浏览器的“请勿跟踪”设置。我们不会向 Umami 分配账户 ID，也不会发送姓名或电子邮箱地址。",
              })}
            </p>
            <p>
              {tr({
                en: "Umami processes the IP address and browser user agent to derive a rotating anonymous session identifier; Talents Hub configures that salt to rotate monthly.",
                ru: "Umami обрабатывает IP-адрес и сведения о браузере, чтобы получить сменяемый анонимный идентификатор сессии; в Talents Hub соль для него меняется ежемесячно.",
                "zh-Hans": "Umami 会处理 IP 地址和浏览器 User-Agent，以生成定期轮换的匿名会话标识符；Talents Hub 将其盐值设置为每月轮换。",
              })}
            </p>
            <AnalyticsPreferences />
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
