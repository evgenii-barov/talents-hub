"use client";

import { Github } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { getCsrfToken } from "@/lib/api";
import { getSocialLoginProviders, type SocialLoginProvider } from "@/lib/auth";

function GoogleMark() {
  return <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3.2-4.4 3.2-7.3Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17a6 6 0 0 1-8.9-3.1H3.2v2.6A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.5 13.9a6 6 0 0 1 0-3.8V7.5H3.2a10 10 0 0 0 0 9l3.3-2.6Z" /><path fill="#EA4335" d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.9A10 10 0 0 0 3.2 7.5l3.3 2.6A6 6 0 0 1 12 6Z" /></svg>;
}

function ProviderIcon({ id }: { id: SocialLoginProvider["id"] }) {
  return id === "google" ? <GoogleMark /> : <Github size={17} />;
}

export function SocialLoginButtons() {
  const { tr } = useLocale();
  const [providers, setProviders] = useState<SocialLoginProvider[]>([]);
  const [starting, setStarting] = useState<SocialLoginProvider["id"] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getSocialLoginProviders()
      .then(({ providers: availableProviders }) => setProviders(availableProviders))
      .catch(() => setProviders([]));
  }, []);

  async function begin(provider: SocialLoginProvider) {
    setError("");
    setStarting(provider.id);
    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) throw new Error("CSRF token is unavailable.");
      const form = document.createElement("form");
      form.action = provider.login_url;
      form.method = "post";
      form.style.display = "none";
      const csrfInput = document.createElement("input");
      csrfInput.name = "csrfmiddlewaretoken";
      csrfInput.value = csrfToken;
      form.append(csrfInput);
      document.body.append(form);
      form.submit();
    } catch {
      setError(tr("Could not start social sign-in.", "Не удалось начать вход через внешний сервис."));
      setStarting(null);
    }
  }

  if (providers.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-[var(--color-border)]" /><span className="font-inter text-[11px] font-medium text-[var(--color-muted)]">{tr("or", "или")}</span><span className="h-px flex-1 bg-[var(--color-border)]" /></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {providers.map((provider) => <button key={provider.id} type="button" disabled={starting !== null} onClick={() => void begin(provider)} className="flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-white font-inter text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60"><ProviderIcon id={provider.id} />{starting === provider.id ? tr("Opening…", "Открываем…") : `${tr("Continue with", "Продолжить через")} ${provider.id === "google" ? "Google" : "GitHub"}`}</button>)}
      </div>
      {error ? <p className="mt-3 font-inter text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
