"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AUTH_REQUIRED_EVENT } from "@/lib/api";
import { getSession } from "@/lib/auth";

const PROTECTED_ROUTES = [
  "/applications",
  "/chat",
  "/moderation",
  "/profile",
  "/projects/new",
] as const;

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function SessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const protectedRoute = isProtectedRoute(pathname);
  const [access, setAccess] = useState({ pathname, allowed: !protectedRoute });

  useEffect(() => {
    if (!protectedRoute) return;

    let active = true;
    let validation: Promise<void> | undefined;

    function redirectToLogin(): void {
      if (!active) return;
      setAccess({ pathname, allowed: false });
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}` as Route);
    }

    function validateSession(): Promise<void> {
      if (validation) return validation;
      validation = getSession()
        .then((session) => {
          if (!active) return;
          if (!session.authenticated) {
            redirectToLogin();
            return;
          }
          setAccess({ pathname, allowed: true });
        })
        .catch(() => {
          // A temporary API outage must not be mistaken for an expired session.
          if (active) setAccess({ pathname, allowed: true });
        })
        .finally(() => {
          validation = undefined;
        });
      return validation;
    }

    function validateVisiblePage(): void {
      if (document.visibilityState === "visible") void validateSession();
    }

    setAccess({ pathname, allowed: false });
    void validateSession();
    window.addEventListener(AUTH_REQUIRED_EVENT, validateSession);
    window.addEventListener("focus", validateVisiblePage);
    document.addEventListener("visibilitychange", validateVisiblePage);
    const timer = window.setInterval(() => void validateSession(), 60_000);

    return () => {
      active = false;
      window.removeEventListener(AUTH_REQUIRED_EVENT, validateSession);
      window.removeEventListener("focus", validateVisiblePage);
      document.removeEventListener("visibilitychange", validateVisiblePage);
      window.clearInterval(timer);
    };
  }, [pathname, protectedRoute, router]);

  if (protectedRoute && (access.pathname !== pathname || !access.allowed)) return null;
  return children;
}
