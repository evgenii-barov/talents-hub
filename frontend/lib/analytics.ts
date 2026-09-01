export const ANALYTICS_CONSENT_CHANGED_EVENT =
  "talents-hub:analytics-consent-changed";

const consentCookieName = "talents-hub-cookie-consent";
const consentMaxAge = 60 * 60 * 24 * 365;
const analyticsConsentValue = "analytics-v2";
const necessaryConsentValue = "necessary-v2";
const maxQueuedEvents = 20;

export type AnalyticsPreference = "analytics" | "necessary";
export type AnalyticsValue = string | number | boolean;

export type AnalyticsEventMap = {
  "account signup completed": { method: "email" | "social" };
  "account sign in completed": { method: "email" | "social" };
  "email verification completed": Record<string, never>;
  "profile moderation requested": Record<string, never>;
  "project created": {
    role_count: number;
    submission: "draft" | "moderation";
  };
  "application submitted": {
    project_id: string;
    role_id: string;
  };
  "application status changed": {
    status:
      | "in_review"
      | "shortlisted"
      | "accepted"
      | "rejected"
      | "withdrawn"
      | "cancelled";
  };
  "conversation created": {
    kind: "direct" | "organization" | "group";
    project_context: boolean;
  };
};

type UmamiProperties = Record<string, unknown>;
type UmamiTracker = {
  track: {
    (): void;
    (eventName: string, data?: Record<string, AnalyticsValue>): void;
    (payload: (properties: UmamiProperties) => UmamiProperties): void;
  };
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

type QueuedEvent = {
  name: keyof AnalyticsEventMap;
  data: Record<string, AnalyticsValue>;
};

const queuedEvents: QueuedEvent[] = [];

function cookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

export function getAnalyticsPreference(): AnalyticsPreference | null {
  const value = cookieValue(consentCookieName);
  if (value === analyticsConsentValue) return "analytics";
  if (value === necessaryConsentValue) return "necessary";
  return null;
}

export function setAnalyticsPreference(preference: AnalyticsPreference): void {
  if (typeof document === "undefined") return;
  const value =
    preference === "analytics" ? analyticsConsentValue : necessaryConsentValue;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${consentCookieName}=${value}; Path=/; Max-Age=${consentMaxAge}; SameSite=Lax${secure}`;
  if (preference === "necessary") queuedEvents.length = 0;
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_CHANGED_EVENT, { detail: preference }),
  );
}

export function browserRequestsDoNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.doNotTrack === "1";
}

export function isAnalyticsConfigured(
  scriptUrl: string | undefined,
  websiteId: string | undefined,
): boolean {
  if (!scriptUrl || !websiteId) return false;
  try {
    const parsed = new URL(scriptUrl);
    return (
      parsed.protocol === "https:" ||
      (parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname))
    ) && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(websiteId);
  } catch {
    return false;
  }
}

const sensitiveProperty =
  /(address|body|content|description|email|file|letter|message|name|note|password|phone|query|search|secret|slug|text|title|token|url)/i;

export function sanitizeAnalyticsData(
  data: Record<string, AnalyticsValue>,
): Record<string, AnalyticsValue> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([key]) => !sensitiveProperty.test(key))
      .slice(0, 50)
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 500) : value,
      ]),
  );
}

export function trackAnalytics<Name extends keyof AnalyticsEventMap>(
  name: Name,
  ...args: AnalyticsEventMap[Name] extends Record<string, never>
    ? [data?: AnalyticsEventMap[Name]]
    : [data: AnalyticsEventMap[Name]]
): void {
  if (
    typeof window === "undefined" ||
    getAnalyticsPreference() !== "analytics" ||
    browserRequestsDoNotTrack()
  ) {
    return;
  }

  const data = sanitizeAnalyticsData(
    (args[0] ?? {}) as Record<string, AnalyticsValue>,
  );
  if (window.umami) {
    window.umami.track(name, data);
    return;
  }
  if (queuedEvents.length < maxQueuedEvents) queuedEvents.push({ name, data });
}

export function flushAnalyticsQueue(): void {
  if (!window.umami || getAnalyticsPreference() !== "analytics") return;
  for (const event of queuedEvents.splice(0)) {
    window.umami.track(event.name, event.data);
  }
}

export function trackAnalyticsPage(pathname: string): void {
  if (
    !window.umami ||
    getAnalyticsPreference() !== "analytics" ||
    browserRequestsDoNotTrack()
  ) {
    return;
  }
  window.umami.track((properties) => ({ ...properties, url: pathname }));
}
