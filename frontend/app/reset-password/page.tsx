"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { confirmPasswordReset } from "@/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { tr } = useLocale();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const uid = params.get("uid");
    const token = params.get("token");
    if (!uid || !token) {
      setMessage(tr("This reset link is incomplete.", "Ссылка для сброса неполная."));
      return;
    }
    if (password !== confirmation) {
      setMessage(tr("Passwords do not match.", "Пароли не совпадают."));
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, password);
      router.replace("/profile/settings");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : tr("Could not reset password.", "Не удалось сбросить пароль."));
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-white p-7 shadow-[0_8px_24px_rgba(16,27,56,0.08)]"><h1 className="font-geist text-[28px] font-[650]">{tr("Choose a new password", "Новый пароль")}</h1>{message ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 font-inter text-sm text-red-700">{message}</p> : null}<label className="mt-5 block font-inter text-[13px] font-semibold">{tr("New password", "Новый пароль")}<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" /></label><label className="mt-4 block font-inter text-[13px] font-semibold">{tr("Repeat password", "Повторите пароль")}<input required type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" /></label><Button type="submit" className="mt-6 w-full" disabled={submitting}>{submitting ? tr("Saving…", "Сохраняем…") : tr("Save new password", "Сохранить пароль")}</Button><p className="mt-5 text-center font-inter text-xs"><Link className="font-semibold text-[var(--color-primary)]" href="/login">{tr("Back to sign in", "Вернуться ко входу")}</Link></p></form>;
}

export default function ResetPasswordPage() {
  const { tr } = useLocale();
  return <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background)] px-6"><Suspense fallback={<p className="font-inter text-sm text-[var(--color-muted)]">{tr("Opening reset form…", "Открываем форму…")}</p>}><ResetPasswordForm /></Suspense></main>;
}
