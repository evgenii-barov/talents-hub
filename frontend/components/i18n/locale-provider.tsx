"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  defaultLocale,
  isLocale,
  localeConfig,
  type Locale,
} from "@/components/i18n/locales";
import { messages, type MessageKey } from "@/components/i18n/messages";
import {
  resolveTaxonomyLabel,
  type TaxonomyLabelSource,
} from "@/components/i18n/taxonomy";
import {
  resolveLegacyText,
  resolveLocalizedValue,
  type LocalizedValue,
} from "@/components/i18n/translator";

export { supportedLocales, type Locale } from "@/components/i18n/locales";

const storageKey = "talents-hub-locale";

type InlineTranslator = {
  (values: LocalizedValue<string>): string;
  /** @deprecated Prefer a named message key or a localized values object. */
  (english: string, russian: string): string;
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  formatDate: (
    value: string | Date,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  localize: <T>(values: LocalizedValue<T>) => T;
  taxonomyName: (item: TaxonomyLabelSource) => string;
  tr: InlineTranslator;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(storageKey);
    if (isLocale(savedLocale)) setLocaleState(savedLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeConfig[locale].direction;
    window.localStorage.setItem(storageKey, locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => {
      const localize = <T,>(values: LocalizedValue<T>) =>
        resolveLocalizedValue(locale, values);

      const tr: InlineTranslator = (
        englishOrValues: string | LocalizedValue<string>,
        russian?: string,
      ) => {
        if (typeof englishOrValues !== "string")
          return localize(englishOrValues);
        return resolveLegacyText(locale, englishOrValues, russian ?? englishOrValues);
      };

      return {
        locale,
        setLocale: setLocaleState,
        t: (key) => messages[locale][key],
        formatDate: (dateValue, options = { dateStyle: "medium" }) => {
          const value =
            typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
              ? new Date(`${dateValue}T00:00:00`)
              : new Date(dateValue);
          return new Intl.DateTimeFormat(
            localeConfig[locale].intlLocale,
            options,
          ).format(value);
        },
        localize,
        taxonomyName: (item) => resolveTaxonomyLabel(locale, item),
        tr,
      };
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error("useLocale must be used within LocaleProvider.");
  return context;
}
