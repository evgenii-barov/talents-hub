"use client";

import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const { tr } = useLocale();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await requestPasswordReset(email);
      setMessage(tr("If this account exists, we sent a reset link. In local development it appears in the backend console.", "Если такой аккаунт существует, мы отправили ссылку для сброса пароля. В локальной среде она выводится в консоль backend."));
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : tr("Could not request a reset link.", "Не удалось запросить ссылку для сброса."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background)] px-6">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-white p-7 shadow-[0_8px_24px_rgba(16,27,56,0.08)]">
        <h1 className="font-geist text-[28px] font-[650]">{tr("Reset password", "Сброс пароля")}</h1>
        <p className="mt-2 font-inter text-sm text-[var(--color-muted)]">{tr("Enter the email used for Talents Hub.", "Введите e-mail, указанный при регистрации в Talents Hub.")}</p>
        {message ? <p className="mt-5 rounded-md bg-[var(--color-soft-blue)] p-3 font-inter text-sm text-[var(--color-primary)]">{message}</p> : null}
        <label className="mt-5 block font-inter text-[13px] font-semibold">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <Button type="submit" className="mt-6 w-full" disabled={submitting}>{submitting ? tr("Sending…", "Отправляем…") : tr("Send reset link", "Отправить ссылку")}</Button>
        <p className="mt-5 text-center font-inter text-xs"><Link className="font-semibold text-[var(--color-primary)]" href="/login">{tr("Back to sign in", "Вернуться ко входу")}</Link></p>
      </form>
    </main>
  );
}
