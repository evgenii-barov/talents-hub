"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Compass,
  FolderKanban,
  Info,
  Languages,
  LogOut,
  Menu,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "@/components/branding/brand-mark";
import { HeaderActivity } from "@/components/layout/header-activity";
import {
  supportedLocales,
  useLocale,
  type Locale,
} from "@/components/i18n/locale-provider";
import { localeConfig } from "@/components/i18n/locales";
import { Button } from "@/components/ui/button";
import { API_URL, apiFetch } from "@/lib/api";
import { getSession, signOut, type Session } from "@/lib/auth";
import type { Profile } from "@/lib/contracts";
import { PROFILE_UPDATED_EVENT } from "@/lib/profile-events";
import { cn } from "@/lib/utils";

type HeaderProfile = Pick<Profile, "display_name" | "avatar">;

function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

function resolveAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http")
    ? url
    : `${API_URL.replace(/\/api$/, "")}${url}`;
}

function NavigationLink({
  href,
  icon: Icon,
  label,
  className,
  onClick,
}: {
  href: Route;
  icon: typeof Compass;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        active
          ? "font-semibold text-[var(--color-ink)]"
          : "font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)]",
        className,
      )}
      onClick={onClick}
    >
      <Icon
        aria-hidden="true"
        size={15}
        className={active ? "text-[var(--color-primary)]" : undefined}
      />
      {label}
    </Link>
  );
}

function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initialFocusRef = useRef<Locale | undefined>(undefined);
  const optionRefs = useRef<Partial<Record<Locale, HTMLButtonElement | null>>>({});
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = initialFocusRef.current ?? locale;
    initialFocusRef.current = undefined;
    window.requestAnimationFrame(() => optionRefs.current[target]?.focus());
  }, [locale, open]);

  function openFromKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const target =
      event.key === "ArrowUp" || event.key === "End"
        ? supportedLocales.at(-1)
        : supportedLocales[0];
    if (!target) return;
    initialFocusRef.current = target;
    setOpen(true);
  }

  function moveOptionFocus(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = supportedLocales.findIndex(
      (language) => optionRefs.current[language] === document.activeElement,
    );
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown")
      nextIndex = (currentIndex + 1) % supportedLocales.length;
    else if (event.key === "ArrowUp")
      nextIndex =
        (currentIndex - 1 + supportedLocales.length) % supportedLocales.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = supportedLocales.length - 1;
    else return;

    event.preventDefault();
    const nextLanguage = supportedLocales[nextIndex];
    if (nextLanguage) optionRefs.current[nextLanguage]?.focus();
  }

  function selectLanguage(language: Locale) {
    setLocale(language);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${t("language")}: ${localeConfig[locale].label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={openFromKeyboard}
        className={cn(
          "flex h-10 w-full min-w-[76px] items-center justify-center gap-2 rounded-[9px] border bg-white px-3 font-inter text-xs font-bold text-[var(--color-ink)] shadow-sm transition-[border-color,box-shadow,background-color] motion-reduce:transition-none",
          "hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          open
            ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
            : "border-[var(--color-border)]",
        )}
      >
        <Languages
          aria-hidden="true"
          size={15}
          className="text-[var(--color-muted)]"
        />
        <span>{localeConfig[locale].shortLabel}</span>
        <ChevronDown
          aria-hidden="true"
          size={14}
          className={cn(
            "text-[var(--color-muted)] transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("language")}
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-32 overflow-hidden rounded-[9px] border border-[var(--color-border)] bg-white p-1 shadow-[0_12px_28px_rgba(16,27,56,0.16)]"
          onKeyDown={moveOptionFocus}
        >
          {supportedLocales.map((language) => (
            <button
              key={language}
              ref={(node) => {
                optionRefs.current[language] = node;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={locale === language}
              onClick={() => selectLanguage(language)}
              className={cn(
                "flex h-9 w-full items-center justify-between gap-3 rounded-md px-2.5 font-inter text-xs font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]",
                locale === language
                  ? "bg-[var(--color-soft-blue)] text-[var(--color-primary)]"
                  : "text-[var(--color-ink)] hover:bg-neutral-100",
              )}
            >
              {localeConfig[language].label}
              <Check
                aria-hidden="true"
                size={14}
                className={locale === language ? "opacity-100" : "opacity-0"}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu({
  email,
  profile,
  logout,
}: {
  email: string;
  profile?: HeaderProfile;
  logout: () => Promise<void>;
}) {
  const { t, tr } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const initialItemRef = useRef(0);
  const menuId = useId();
  const displayName = profile?.display_name.trim() || email;
  const avatarUrl = resolveAvatarUrl(profile?.avatar?.url);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.requestAnimationFrame(() => {
      const items = menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]',
      );
      items?.[initialItemRef.current]?.focus();
    });
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function openFromKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    initialItemRef.current = event.key === "ArrowUp" || event.key === "End" ? 3 : 0;
    setOpen(true);
  }

  function moveMenuFocus(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === "ArrowUp")
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    items[nextIndex]?.focus();
  }

  const itemClassName =
    "flex h-10 w-full items-center gap-2.5 rounded-md px-3 font-inter text-sm font-semibold text-[var(--color-ink)] hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={tr("Open profile menu", "Открыть меню профиля")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          initialItemRef.current = 0;
          setOpen((current) => !current);
        }}
        onKeyDown={openFromKeyboard}
        className={cn(
          "flex h-10 max-w-[220px] items-center gap-2 rounded-[9px] border px-1.5 pr-2 transition-colors motion-reduce:transition-none",
          "hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          open
            ? "border-[var(--color-primary)] bg-neutral-50"
            : "border-transparent",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-geist text-xs font-bold text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            initials(displayName)
          )}
        </span>
        <span
          className="hidden min-w-0 max-w-[150px] truncate font-inter text-[13px] font-bold text-[var(--color-ink)] xl:block"
          title={displayName}
        >
          {displayName}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={14}
          className={cn(
            "hidden shrink-0 text-[var(--color-muted)] transition-transform motion-reduce:transition-none xl:block",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={tr("Profile navigation", "Навигация по профилю")}
          onKeyDown={moveMenuFocus}
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-[10px] border border-[var(--color-border)] bg-white p-1.5 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate font-inter text-sm font-bold text-[var(--color-ink)]">
              {displayName}
            </p>
            <p className="mt-0.5 truncate font-inter text-xs text-[var(--color-muted)]">
              {email}
            </p>
          </div>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClassName}
          >
            <UserRound aria-hidden="true" size={16} />
            {tr("My profile", "Мой профиль")}
          </Link>
          <Link
            href="/profile/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClassName}
          >
            <Settings aria-hidden="true" size={16} />
            {tr("Profile settings", "Настройки профиля")}
          </Link>
          <Link
            href="/profile/complete"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClassName}
          >
            <ClipboardList aria-hidden="true" size={16} />
            {tr("Additional details", "Дополнительные сведения")}
          </Link>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className={cn(itemClassName, "text-[var(--color-muted)]")}
          >
            <LogOut aria-hidden="true" size={16} />
            {t("signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MobileNavigation({
  session,
  logout,
}: {
  session: Session;
  logout: () => Promise<void>;
}) {
  const { t, tr } = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function closeOnEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    closeMenu();
    triggerRef.current?.focus();
  }

  return (
    <div className="relative xl:hidden" onKeyDown={closeOnEscape}>
      <button
        ref={triggerRef}
        type="button"
        aria-controls="mobile-primary-navigation"
        aria-expanded={open}
        aria-label={t("menu")}
        className="flex size-10 items-center justify-center rounded-md text-[var(--color-ink)] hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        onClick={() => setOpen((current) => !current)}
      >
        <Menu aria-hidden="true" size={20} />
      </button>
      {open ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label={tr("Close menu", "Закрыть меню")}
            className="fixed inset-0 z-40 bg-slate-950/20 sm:hidden"
            onClick={() => {
              closeMenu();
              triggerRef.current?.focus();
            }}
          />
          <div className="fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-6rem)] w-auto overflow-y-auto overscroll-contain rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:max-h-[calc(100dvh-5rem)] sm:w-72">
          <nav
            id="mobile-primary-navigation"
            aria-label={t("mainNavigation")}
            className="space-y-1 font-inter text-sm"
          >
            <NavigationLink
              href="/"
              icon={Compass}
              label={t("explore")}
              className="px-3 py-2.5"
              onClick={closeMenu}
            />
            <NavigationLink
              href="/projects"
              icon={FolderKanban}
              label={t("projects")}
              className="px-3 py-2.5"
              onClick={closeMenu}
            />
            <NavigationLink
              href="/talents"
              icon={UsersRound}
              label={t("talent")}
              className="px-3 py-2.5"
              onClick={closeMenu}
            />
            <NavigationLink
              href="/organizations"
              icon={Building2}
              label={t("forOrganisations")}
              className="px-3 py-2.5"
              onClick={closeMenu}
            />
            <NavigationLink
              href="/about"
              icon={Info}
              label={t("aboutProject")}
              className="px-3 py-2.5"
              onClick={closeMenu}
            />
          </nav>
          <div className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3 md:hidden">
            <LanguageSelector className="flex w-full" />
            {session.authenticated ? (
              <>
                <Link
                  href="/applications"
                  onClick={closeMenu}
                  className="flex rounded-md px-3 py-2.5 font-inter text-sm font-semibold text-[var(--color-ink)] hover:bg-neutral-100"
                >
                  {t("applications")}
                </Link>
                <Link
                  href="/chat"
                  onClick={closeMenu}
                  className="flex rounded-md px-3 py-2.5 font-inter text-sm font-semibold text-[var(--color-ink)] hover:bg-neutral-100"
                >
                  {t("chat")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    void logout();
                  }}
                  className="flex w-full rounded-md px-3 py-2.5 font-inter text-sm font-semibold text-[var(--color-muted)] hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex rounded-md px-3 py-2.5 font-inter text-sm font-semibold text-[var(--color-ink)] hover:bg-neutral-100 sm:hidden"
              >
                {t("signIn")}
              </Link>
            )}
          </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function UnifiedHeader() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [session, setSession] = useState<Session>({ authenticated: false });
  const [profile, setProfile] = useState<HeaderProfile>();

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const nextSession = await getSession();
        if (!active) return;
        setSession(nextSession);
        if (!nextSession.authenticated) return;
        try {
          const nextProfile = await apiFetch<Profile>("/v1/me/profile/");
          if (active) setProfile(nextProfile);
        } catch {
          if (active) setProfile(undefined);
        }
      } catch {
        if (active) setSession({ authenticated: false });
      }
    }

    function updateProfile(event: Event) {
      setProfile((event as CustomEvent<Profile>).detail);
    }

    void loadAccount();
    window.addEventListener(PROFILE_UPDATED_EVENT, updateProfile);
    return () => {
      active = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, updateProfile);
    };
  }, [pathname]);

  async function logout() {
    await signOut().catch(() => undefined);
    setSession({ authenticated: false });
    setProfile(undefined);
    window.location.assign("/");
  }

  const email = session.authenticated ? session.user.email : "";
  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[72px] border-b border-[var(--color-border)] bg-white/90 shadow-[0_6px_24px_rgba(16,27,56,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/80",
        pathname === "/" && "home-header-intro",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center px-4 sm:px-6 lg:px-12">
        <Link
          href="/"
          aria-label={t("brand")}
          className="flex shrink-0 items-center gap-2.5 rounded-md font-inter text-base font-bold text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <BrandMark />
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>
        <nav
          aria-label={t("mainNavigation")}
          className="ml-8 hidden items-center gap-6 font-inter text-[13px] xl:flex"
        >
          <NavigationLink href="/" icon={Compass} label={t("explore")} />
          <NavigationLink
            href="/projects"
            icon={FolderKanban}
            label={t("projects")}
          />
          <NavigationLink
            href="/talents"
            icon={UsersRound}
            label={t("talent")}
          />
          <NavigationLink
            href="/organizations"
            icon={Building2}
            label={t("forOrganisations")}
          />
          <NavigationLink
            href="/about"
            icon={Info}
            label={t("aboutProject")}
          />
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <LanguageSelector className="hidden md:flex" />
          <MobileNavigation session={session} logout={logout} />
          {session.authenticated ? (
            <>
              <Link
                href="/applications"
                className="hidden rounded-[7px] bg-neutral-100 px-2.5 py-2 font-inter text-[13px] font-bold text-[var(--color-ink)] hover:bg-neutral-200 md:block"
              >
                {t("applications")}
              </Link>
              <HeaderActivity />
              <AccountMenu email={email} profile={profile} logout={logout} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden px-2 font-inter text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)] sm:block"
              >
                {t("signIn")}
              </Link>
              <Button asChild>
                <Link href="/signup">{t("createProfile")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
