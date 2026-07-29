import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SessionGuard } from "@/components/auth/session-guard";
import { defaultLocale, localeConfig } from "@/components/i18n/locales";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { FlashMessagesProvider } from "@/components/ui/flash-messages";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "ШОС",
    "таланты ШОС",
    "международное сотрудничество",
    "эксперты",
    "международные проекты",
    "профессиональная сеть",
    "Shanghai Cooperation Organisation",
    "SCO",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "ru_RU",
    alternateLocale: ["en_US", "zh_CN"],
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
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0f4c81",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icons/icon-512.png"),
      description: DEFAULT_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${absoluteUrl("/")}#website`,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: DEFAULT_DESCRIPTION,
      inLanguage: ["ru", "en", "zh-Hans"],
      publisher: { "@id": `${absoluteUrl("/")}#organization` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={defaultLocale}
      dir={localeConfig[defaultLocale].direction}
      className="h-full"
    >
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} min-h-full antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <LocaleProvider>
          <FlashMessagesProvider>
            <UnifiedHeader />
            <SessionGuard>{children}</SessionGuard>
            <CookieConsent />
          </FlashMessagesProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
