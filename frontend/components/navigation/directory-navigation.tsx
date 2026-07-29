"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

type DirectoryId = "projects" | "talents" | "organizations";

type DirectoryReturnContext<State> = {
  state: State;
  scrollY: number;
  itemId: string;
  itemViewportTop: number;
  savedAt: number;
};

const contextLifetime = 30 * 60 * 1000;

function storageKey(directory: DirectoryId) {
  return `talents-hub:directory-return:${directory}`;
}

function readContext<State>(directory: DirectoryId) {
  try {
    const raw = window.sessionStorage.getItem(storageKey(directory));
    if (!raw) return null;

    const context = JSON.parse(raw) as DirectoryReturnContext<State>;
    if (Date.now() - context.savedAt > contextLifetime) {
      window.sessionStorage.removeItem(storageKey(directory));
      return null;
    }
    return context;
  } catch {
    window.sessionStorage.removeItem(storageKey(directory));
    return null;
  }
}

export function rememberDirectoryContext<State>(
  event: MouseEvent<HTMLAnchorElement>,
  directory: DirectoryId,
  state: State,
  itemId: string,
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const context: DirectoryReturnContext<State> = {
    state,
    scrollY: window.scrollY,
    itemId,
    itemViewportTop:
      document.getElementById(itemId)?.getBoundingClientRect().top ?? 0,
    savedAt: Date.now(),
  };
  window.sessionStorage.setItem(storageKey(directory), JSON.stringify(context));
}

export function useDirectoryReturnContext<State>(
  directory: DirectoryId,
  restoreState: (state: State) => void,
  contentReady: boolean,
) {
  const restoreStateRef = useRef(restoreState);
  const pendingContextRef = useRef<DirectoryReturnContext<State> | null>(null);
  const [navigationReady, setNavigationReady] = useState(false);
  const [hasPendingScroll, setHasPendingScroll] = useState(false);

  restoreStateRef.current = restoreState;

  useEffect(() => {
    const context = readContext<State>(directory);
    if (context) {
      pendingContextRef.current = context;
      restoreStateRef.current(context.state);
      setHasPendingScroll(true);
    }
    setNavigationReady(true);
  }, [directory]);

  useEffect(() => {
    const context = pendingContextRef.current;
    if (!navigationReady || !contentReady || !hasPendingScroll || !context) {
      return;
    }

    let secondFrame: number | undefined;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const item = document.getElementById(context.itemId);
        const restoredTop = item && Number.isFinite(context.itemViewportTop)
          ? item.getBoundingClientRect().top +
            window.scrollY -
            context.itemViewportTop
          : context.scrollY;
        window.scrollTo({ top: restoredTop, behavior: "auto" });
        window.sessionStorage.removeItem(storageKey(directory));
        pendingContextRef.current = null;
        setHasPendingScroll(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);
    };
  }, [contentReady, directory, hasPendingScroll, navigationReady]);

  return navigationReady;
}

export function DirectoryBreadcrumbs({
  directoryHref,
  directoryLabel,
  currentLabel,
}: {
  directoryHref: Route;
  directoryLabel: string;
  currentLabel: string;
}) {
  return (
    <nav aria-label="Breadcrumbs">
      <ol className="flex min-w-0 items-center gap-2 font-inter text-xs">
        <li className="shrink-0">
          <Link
            href={directoryHref}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-[var(--color-soft-blue)] px-2.5 font-semibold text-[var(--color-primary)] transition-colors hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" size={14} strokeWidth={2} />
            {directoryLabel}
          </Link>
        </li>
        <li
          aria-hidden="true"
          className="flex h-8 shrink-0 items-center text-neutral-400"
        >
          <ChevronRight size={13} />
        </li>
        <li
          aria-current="page"
          className="flex h-8 min-w-0 items-center truncate font-medium text-[var(--color-muted)]"
          title={currentLabel}
        >
          {currentLabel}
        </li>
      </ol>
    </nav>
  );
}
