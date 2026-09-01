"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  browserRequestsDoNotTrack,
  flushAnalyticsQueue,
  getAnalyticsPreference,
  isAnalyticsConfigured,
  trackAnalyticsPage,
  type AnalyticsPreference,
} from "@/lib/analytics";

const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

function trackedDomain(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return undefined;
  }
}

export function UmamiAnalytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    function updatePreference(event?: Event) {
      const preference = (event as CustomEvent<AnalyticsPreference> | undefined)
        ?.detail;
      setEnabled(
        (preference ?? getAnalyticsPreference()) === "analytics" &&
          !browserRequestsDoNotTrack(),
      );
    }

    updatePreference();
    window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, updatePreference);
    return () =>
      window.removeEventListener(
        ANALYTICS_CONSENT_CHANGED_EVENT,
        updatePreference,
      );
  }, []);

  const trackCurrentPath = useCallback(() => {
    if (!ready || lastTrackedPath.current === pathname) return;
    trackAnalyticsPage(pathname);
    lastTrackedPath.current = pathname;
  }, [pathname, ready]);

  useEffect(() => {
    trackCurrentPath();
  }, [trackCurrentPath]);

  if (!enabled || !isAnalyticsConfigured(scriptUrl, websiteId)) return null;

  return (
    <Script
      id="umami-analytics"
      src={scriptUrl}
      strategy="afterInteractive"
      data-website-id={websiteId}
      data-domains={trackedDomain()}
      data-auto-track="false"
      data-exclude-search="true"
      data-exclude-hash="true"
      data-do-not-track="true"
      onLoad={() => {
        flushAnalyticsQueue();
        setReady(true);
      }}
    />
  );
}
