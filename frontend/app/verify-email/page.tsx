"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { ApiError } from "@/lib/api";
import { verifyEmail } from "@/lib/auth";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { tr } = useLocale();
  const [message, setMessage] = useState(() => tr("Confirming your email…", "Подтверждаем e-mail…"));

  useEffect(() => {
    const uid = params.get("uid");
    const token = params.get("token");
    if (!uid || !token) {
      setMessage(tr("This confirmation link is incomplete.", "Ссылка для подтверждения неполная."));
      return;
    }
    void verifyEmail(uid, token)
      .then(() => {
        setMessage(tr("Email confirmed. Redirecting to your profile…", "E-mail подтверждён. Перенаправляем в профиль…"));
        window.setTimeout(() => router.replace("/profile/settings"), 800);
      })
      .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : tr("This confirmation link is invalid or has expired.", "Ссылка недействительна или устарела.")));
  }, [params, router, tr]);

  return <p className="mt-4 font-inter text-sm text-[var(--color-muted)]">{message}</p>;
}

export default function VerifyEmailPage() {
  const { tr } = useLocale();
  return <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background)] px-6"><section className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-white p-7 text-center shadow-[0_8px_24px_rgba(16,27,56,0.08)]"><h1 className="font-geist text-[28px] font-[650]">{tr("Email confirmation", "Подтверждение e-mail")}</h1><Suspense fallback={<p className="mt-4 font-inter text-sm text-[var(--color-muted)]">{tr("Opening confirmation link…", "Открываем ссылку…")}</p>}><VerifyEmailContent /></Suspense><Link className="mt-6 inline-block font-inter text-sm font-semibold text-[var(--color-primary)]" href="/login">{tr("Go to sign in", "Перейти ко входу")}</Link></section></main>;
}
