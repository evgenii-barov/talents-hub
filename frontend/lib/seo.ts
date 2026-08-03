import type { Metadata } from "next";

export const SITE_NAME = "Talents Hub";
export const DEFAULT_TITLE =
  "Talents Hub — международное молодёжное профессиональное сообщество";
export const DEFAULT_DESCRIPTION =
  "Международное молодёжное профессиональное сообщество для специалистов, лидеров проектов и организаций: находите таланты, проекты и партнёров для сотрудничества.";

const fallbackSiteUrl = "http://localhost:3000";

function resolveSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || fallbackSiteUrl);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const siteUrl = resolveSiteUrl();

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, siteUrl).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ru_RU",
      alternateLocale: ["en_US", "zh_CN"],
      url: path,
      title,
      description,
      images: [
        {
          url: "/icons/icon-512.png",
          width: 512,
          height: 512,
          alt: `Логотип ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/icons/icon-512.png"],
    },
  };
}

export function buildPrivatePageMetadata(
  title: string,
  path: string,
): Metadata {
  return buildPageMetadata({
    title,
    path,
    index: false,
    description: `${title} — служебный раздел ${SITE_NAME}.`,
  });
}

export function trimDescription(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 160
    ? `${normalized.slice(0, 157).trimEnd()}…`
    : normalized;
}

export function humanizeSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
