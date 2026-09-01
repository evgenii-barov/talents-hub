"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsPreference,
  setAnalyticsPreference,
  type AnalyticsPreference,
} from "@/lib/analytics";

export function AnalyticsPreferences() {
  const { tr } = useLocale();
  const [preference, setPreference] = useState<AnalyticsPreference | null>(null);
  const [saved, setSaved] = useState(false);
  const preferenceStatus =
    preference === "analytics"
      ? tr({
          en: "Anonymous analytics is currently allowed.",
          ru: "Анонимная аналитика сейчас разрешена.",
          "zh-Hans": "当前已允许匿名分析。",
        })
      : tr({
          en: "Anonymous analytics is currently disabled.",
          ru: "Анонимная аналитика сейчас отключена.",
          "zh-Hans": "当前已禁用匿名分析。",
        });

  useEffect(() => {
    setPreference(getAnalyticsPreference());
  }, []);

  function save(nextPreference: AnalyticsPreference) {
    setAnalyticsPreference(nextPreference);
    setPreference(nextPreference);
    setSaved(true);
  }

  return (
    <div>
      <p>{preferenceStatus}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={() => save("analytics")}>
          {tr({ en: "Allow analytics", ru: "Разрешить аналитику", "zh-Hans": "允许匿名分析" })}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => save("necessary")}
        >
          {tr({ en: "Disable analytics", ru: "Отключить аналитику", "zh-Hans": "禁用匿名分析" })}
        </Button>
      </div>
      <p className="mt-3 text-xs" role="status" aria-live="polite">
        {saved
          ? tr({ en: "Preference saved.", ru: "Настройка сохранена.", "zh-Hans": "设置已保存。" })
          : ""}
      </p>
    </div>
  );
}
