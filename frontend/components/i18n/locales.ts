export const localeConfig = {
  ru: {
    direction: "ltr",
    intlLocale: "ru-RU",
    label: "Русский",
    shortLabel: "RU",
  },
  en: {
    direction: "ltr",
    intlLocale: "en-US",
    label: "English",
    shortLabel: "EN",
  },
  "zh-Hans": {
    direction: "ltr",
    intlLocale: "zh-CN",
    label: "简体中文",
    shortLabel: "中文",
  },
} as const;

export type Locale = keyof typeof localeConfig;

export const defaultLocale = "ru" satisfies Locale;
export const fallbackLocale = "en" satisfies Locale;
export const supportedLocales: ReadonlyArray<Locale> = Object.freeze(
  Object.keys(localeConfig) as Locale[],
);

export function isLocale(value: string | null): value is Locale {
  return value !== null && Object.hasOwn(localeConfig, value);
}
