"use client";

import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { signUp } from "@/lib/auth";
import { trackAnalytics } from "@/lib/analytics";

export default function SignupPage() {
  const { tr } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError(tr("Passwords do not match.", "Пароли не совпадают."));
      return;
    }
    if (!termsAccepted || !personalDataConsent || !ageConfirmed) {
      setError(
        tr({
          en: "Accept all required legal terms and confirm your age.",
          ru: "Примите обязательные условия и подтвердите, что вам исполнилось 18 лет.",
          "zh-Hans": "请接受所有必需的法律条款并确认您的年龄。",
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, {
        terms_accepted: termsAccepted,
        personal_data_consent: personalDataConsent,
        age_confirmed: ageConfirmed,
      });
      trackAnalytics("account signup completed", { method: "email" });
      setSent(true);
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : tr("Could not create your account.", "Не удалось создать аккаунт."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background)] px-4 sm:px-6">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_24px_rgba(16,27,56,0.08)] sm:p-7">
        <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">{tr("CREATE PROFILE", "СОЗДАНИЕ ПРОФИЛЯ")}</p>
        <h1 className="mt-2 font-geist text-[28px] font-[650]">{tr("Join Talents Hub", "Присоединяйтесь к Talents Hub")}</h1>
        <p className="mt-2 font-inter text-sm text-[var(--color-muted)]">{tr("Confirm your email to activate your account and start building a profile.", "Подтвердите e-mail, чтобы активировать аккаунт и начать создавать профиль.")}</p>
        {sent ? <p className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 font-inter text-sm text-green-800">{tr({ en: `We sent a confirmation link to ${email}. The local setup writes this email to the backend console until SMTP is connected.`, ru: `Мы отправили ссылку для подтверждения на ${email}. В локальной среде письмо пока выводится в консоль backend.`, "zh-Hans": `我们已向 ${email} 发送验证链接。在本地开发环境中，该邮件会显示在后端控制台。` })}</p> : null}
        {error ? <p id="signup-error" role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 font-inter text-sm text-red-700">{error}</p> : null}
        {!sent ? <>
          <label className="mt-5 block font-inter text-[13px] font-semibold">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "signup-error" : undefined} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1" autoComplete="email" /></label>
          <label className="mt-4 block font-inter text-[13px] font-semibold">{tr("Password", "Пароль")}<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "signup-error" : undefined} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1" autoComplete="new-password" /></label>
          <label className="mt-4 block font-inter text-[13px] font-semibold">{tr("Repeat password", "Повторите пароль")}<input required type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "signup-error" : undefined} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1" autoComplete="new-password" /></label>

          <fieldset className="mt-5 space-y-3 border-0 p-0">
            <legend className="font-inter text-[13px] font-semibold text-[var(--color-ink)]">
              {tr({ en: "Required confirmations", ru: "Обязательные подтверждения", "zh-Hans": "必需确认" })}
            </legend>
            <ConsentCheckbox checked={termsAccepted} onChange={setTermsAccepted} error={Boolean(error)}>
              {tr({ en: "I accept the", ru: "Я принимаю", "zh-Hans": "我接受" })} <LegalLink href="/legal/terms">{tr({ en: "User Agreement", ru: "Пользовательское соглашение", "zh-Hans": "用户协议" })}</LegalLink>.
            </ConsentCheckbox>
            <ConsentCheckbox checked={personalDataConsent} onChange={setPersonalDataConsent} error={Boolean(error)}>
              {tr({ en: "I give separate consent to", ru: "Я даю отдельное", "zh-Hans": "我单独同意" })} <LegalLink href="/legal/personal-data-consent">{tr({ en: "personal data processing", ru: "согласие на обработку персональных данных", "zh-Hans": "处理个人数据" })}</LegalLink> {tr({ en: "under the", ru: "на условиях", "zh-Hans": "并遵守" })} <LegalLink href="/legal/privacy">{tr({ en: "Privacy Policy", ru: "Политики обработки ПД", "zh-Hans": "个人数据处理政策" })}</LegalLink>.
            </ConsentCheckbox>
            <ConsentCheckbox checked={ageConfirmed} onChange={setAgeConfirmed} error={Boolean(error)}>
              {tr({ en: "I confirm that I am at least 18 years old and accept the", ru: "Я подтверждаю, что мне исполнилось 18 лет, и принимаю", "zh-Hans": "我确认已年满18周岁，并接受" })} <LegalLink href="/legal/minors">{tr({ en: "rules for minors", ru: "правила для несовершеннолетних", "zh-Hans": "未成年人规则" })}</LegalLink>.
            </ConsentCheckbox>
          </fieldset>
          <Button type="submit" className="mt-6 w-full" disabled={submitting}>{submitting ? tr("Creating account…", "Создаём аккаунт…") : tr("Create account", "Создать аккаунт")}</Button>
        </> : null}
        <p className="mt-5 text-center font-inter text-xs text-[var(--color-muted)]">{tr("Already registered?", "Уже зарегистрированы?")} <Link className="font-semibold text-[var(--color-primary)]" href="/login">{tr("Sign in", "Войти")}</Link></p>
      </form>
    </main>
  );
}

function LegalLink({
  href,
  children,
}: {
  href:
    | "/legal/terms"
    | "/legal/personal-data-consent"
    | "/legal/privacy"
    | "/legal/minors";
  children: React.ReactNode;
}) {
  return <Link href={href} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-primary)] underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{children}</Link>;
}

function ConsentCheckbox({ checked, onChange, error, children }: { checked: boolean; onChange: (checked: boolean) => void; error: boolean; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 font-inter text-xs leading-5 text-[var(--color-muted)]">
      <input
        required
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={error && !checked ? true : undefined}
        aria-describedby={error && !checked ? "signup-error" : undefined}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      />
      <span>{children}</span>
    </label>
  );
}
