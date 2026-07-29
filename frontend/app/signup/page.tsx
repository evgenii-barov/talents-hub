"use client";

import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { signUp } from "@/lib/auth";

export default function SignupPage() {
  const { tr } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
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
    setSubmitting(true);
    try {
      await signUp(email, password);
      setSent(true);
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : tr("Could not create your account.", "Не удалось создать аккаунт."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background)] px-6">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-white p-7 shadow-[0_8px_24px_rgba(16,27,56,0.08)]">
        <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">{tr("CREATE PROFILE", "СОЗДАНИЕ ПРОФИЛЯ")}</p>
        <h1 className="mt-2 font-geist text-[28px] font-[650]">{tr("Join Talents Hub", "Присоединяйтесь к Talents Hub")}</h1>
        <p className="mt-2 font-inter text-sm text-[var(--color-muted)]">{tr("Confirm your email to activate your account and start building a profile.", "Подтвердите e-mail, чтобы активировать аккаунт и начать создавать профиль.")}</p>
        {sent ? <p className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 font-inter text-sm text-green-800">{tr({ en: `We sent a confirmation link to ${email}. The local setup writes this email to the backend console until SMTP is connected.`, ru: `Мы отправили ссылку для подтверждения на ${email}. В локальной среде письмо пока выводится в консоль backend.`, "zh-Hans": `我们已向 ${email} 发送验证链接。在本地开发环境中，该邮件会显示在后端控制台。` })}</p> : null}
        {error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 font-inter text-sm text-red-700">{error}</p> : null}
        {!sent ? <SocialLoginButtons /> : null}
        {!sent ? <>
          <label className="mt-5 block font-inter text-[13px] font-semibold">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" autoComplete="email" /></label>
          <label className="mt-4 block font-inter text-[13px] font-semibold">{tr("Password", "Пароль")}<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" autoComplete="new-password" /></label>
          <label className="mt-4 block font-inter text-[13px] font-semibold">{tr("Repeat password", "Повторите пароль")}<input required type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" autoComplete="new-password" /></label>
          <Button type="submit" className="mt-6 w-full" disabled={submitting}>{submitting ? tr("Creating account…", "Создаём аккаунт…") : tr("Create account", "Создать аккаунт")}</Button>
        </> : null}
        <p className="mt-5 text-center font-inter text-xs text-[var(--color-muted)]">{tr("Already registered?", "Уже зарегистрированы?")} <Link className="font-semibold text-[var(--color-primary)]" href="/login">{tr("Sign in", "Войти")}</Link></p>
      </form>
    </main>
  );
}
