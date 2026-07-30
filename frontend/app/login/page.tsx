"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { signIn } from "@/lib/auth";

function getRedirectTarget(): Route {
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
    return requestedPath as Route;
  }
  return "/profile";
}

export default function LoginPage() {
  const router = useRouter();
  const { tr } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const session = await signIn(email, password);
      if (!session.authenticated) throw new Error("Session was not created.");
      router.replace(getRedirectTarget());
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : tr("Could not sign in. Please try again.", "Не удалось войти. Попробуйте ещё раз."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background)] px-4 sm:px-6">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_24px_rgba(16,27,56,0.08)] sm:p-7">
        <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">{tr("SIGN IN", "ВХОД")}</p>
        <h1 className="mt-2 font-geist text-[28px] font-[650]">{tr("Welcome back", "С возвращением")}</h1>
        <p className="mt-2 font-inter text-sm text-[var(--color-muted)]">{tr("Use the email and password for your Talents Hub account.", "Используйте e-mail и пароль от аккаунта Talents Hub.")}</p>
        {error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 font-inter text-sm text-red-700">{error}</p> : null}
        <SocialLoginButtons />
        <label className="mt-5 block font-inter text-[13px] font-semibold">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" autoComplete="email" /></label>
        <label className="mt-4 block font-inter text-[13px] font-semibold">{tr("Password", "Пароль")}<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] px-3 font-normal outline-none focus:border-[var(--color-primary)]" autoComplete="current-password" /></label>
        <p className="mt-3 text-right font-inter text-xs"><Link className="font-semibold text-[var(--color-primary)]" href="/forgot-password">{tr("Forgot password?", "Забыли пароль?")}</Link></p>
        <Button type="submit" className="mt-6 w-full" disabled={submitting}>{submitting ? tr("Signing in…", "Входим…") : tr("Sign in", "Войти")}</Button>
        <p className="mt-5 text-center font-inter text-xs text-[var(--color-muted)]">{tr("Need an account?", "Нет аккаунта?")} <Link className="font-semibold text-[var(--color-primary)]" href="/signup">{tr("Create your profile", "Создать профиль")}</Link></p>
      </form>
    </main>
  );
}
