import {
  fallbackLocale,
  type Locale,
} from "@/components/i18n/locales";
import { simplifiedChineseLegacyMessages } from "@/components/i18n/catalogs/zh-hans";

type FallbackValue<T> = { [Key in typeof fallbackLocale]: T };

export type LocalizedValue<T> = Readonly<
  Partial<Record<Locale, T>> & FallbackValue<T>
>;

export function resolveLocalizedValue<T>(
  locale: Locale,
  values: LocalizedValue<T>,
): T {
  return values[locale] ?? values[fallbackLocale];
}

// Existing screens use English copy as the stable source text and pass Russian
// inline. Additional locales can be populated centrally while those screens are
// migrated to named message keys.
const legacyMessageCatalogs: Readonly<
  Partial<Record<Locale, Readonly<Record<string, string>>>>
> = {
  "zh-Hans": simplifiedChineseLegacyMessages,
};

export function resolveLegacyText(
  locale: Locale,
  english: string,
  russian: string,
): string {
  const inlineTranslations: Partial<Record<Locale, string>> = {
    en: english,
    ru: russian,
  };

  return (
    inlineTranslations[locale] ??
    legacyMessageCatalogs[locale]?.[english] ??
    english
  );
}
