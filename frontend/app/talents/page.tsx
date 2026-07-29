"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Languages,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  rememberDirectoryContext,
  useDirectoryReturnContext,
} from "@/components/navigation/directory-navigation";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type {
  Country,
  Language,
  Profile,
  TaxonomyReference,
} from "@/lib/contracts";
import { loadCataloguePages } from "@/lib/pagination";
import { getProfilesPage } from "@/lib/profiles";
import { getTaxonomy } from "@/lib/taxonomy";

const selectClass =
  "mt-2 h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 font-inter text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100";

type TalentDirectoryState = {
  search: string;
  availability: string;
  country: string;
  skill: string;
  language: string;
  workFormat: string;
  loadedPages?: number;
};

function location(
  profile: Profile,
  fallback: string,
  taxonomyName: (item: { name: string; slug?: string; code?: string }) => string,
): string {
  return (
    [
      profile.city ? taxonomyName(profile.city) : undefined,
      profile.country ? taxonomyName(profile.country) : undefined,
      profile.remote_preference
        ? taxonomyName(profile.remote_preference)
        : undefined,
    ]
      .filter(Boolean)
      .join(" · ") || fallback
  );
}

function TalentCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[258px] rounded-[10px] border border-[var(--color-border)] bg-white p-[18px]"
    >
      <div className="size-11 rounded-full bg-neutral-100" />
      <div className="mt-5 h-5 w-1/2 rounded bg-neutral-100" />
      <div className="mt-3 h-3 w-3/4 rounded bg-neutral-100" />
      <div className="mt-20 h-8 w-full rounded bg-neutral-100" />
    </div>
  );
}

export default function TalentsPage() {
  const { taxonomyName, tr } = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [skills, setSkills] = useState<TaxonomyReference[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [workFormats, setWorkFormats] = useState<TaxonomyReference[]>([]);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [country, setCountry] = useState("");
  const [skill, setSkill] = useState("");
  const [language, setLanguage] = useState("");
  const [workFormat, setWorkFormat] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loadedPages, setLoadedPages] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [error, setError] = useState("");
  const restoredPageCountRef = useRef(1);
  const requestSequenceRef = useRef(0);
  const navigationReady = useDirectoryReturnContext<TalentDirectoryState>(
    "talents",
    (state) => {
      setSearch(state.search);
      setAvailability(state.availability);
      setCountry(state.country ?? "");
      setSkill(state.skill ?? "");
      setLanguage(state.language ?? "");
      setWorkFormat(state.workFormat ?? "");
      restoredPageCountRef.current = Math.max(1, state.loadedPages ?? 1);
    },
    !loading,
  );

  const load = useCallback(async () => {
    const requestId = ++requestSequenceRef.current;
    const targetPages = restoredPageCountRef.current;
    restoredPageCountRef.current = 1;
    setLoading(true);
    setLoadingMore(false);
    setError("");
    setLoadMoreError("");
    try {
      const loaded = await loadCataloguePages(
        (page) => getProfilesPage({
          search,
          availability: availability || undefined,
          country: country || undefined,
          skill: skill || undefined,
          language: language || undefined,
          workFormat: workFormat || undefined,
          page,
        }),
        targetPages,
      );
      if (requestId !== requestSequenceRef.current) return;
      setProfiles(loaded.results);
      setTotalCount(loaded.response.count);
      setLoadedPages(loaded.pagesLoaded);
      setNextPage(loaded.response.next ? loaded.pagesLoaded + 1 : null);
    } catch {
      if (requestId !== requestSequenceRef.current) return;
      setError(
        tr(
          "Could not load the talent directory. Please try again.",
          "Не удалось загрузить каталог талантов. Попробуйте ещё раз.",
        ),
      );
    } finally {
      if (requestId === requestSequenceRef.current) setLoading(false);
    }
  }, [availability, country, language, search, skill, tr, workFormat]);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    const requestId = ++requestSequenceRef.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const response = await getProfilesPage({
        search,
        availability: availability || undefined,
        country: country || undefined,
        skill: skill || undefined,
        language: language || undefined,
        workFormat: workFormat || undefined,
        page: nextPage,
      });
      if (requestId !== requestSequenceRef.current) return;
      setProfiles((current) => [...current, ...response.results]);
      setTotalCount(response.count);
      setLoadedPages(nextPage);
      setNextPage(response.next ? nextPage + 1 : null);
    } catch {
      if (requestId !== requestSequenceRef.current) return;
      setLoadMoreError(tr("Could not load more talent.", "Не удалось загрузить ещё таланты."));
    } finally {
      if (requestId === requestSequenceRef.current) setLoadingMore(false);
    }
  }, [availability, country, language, loadingMore, nextPage, search, skill, tr, workFormat]);

  useEffect(() => {
    if (navigationReady) void load();
  }, [load, navigationReady]);
  useEffect(() => {
    void Promise.all([
      getTaxonomy<Country>("countries"),
      getTaxonomy<TaxonomyReference>("skills"),
      getTaxonomy<Language>("languages"),
      getTaxonomy<TaxonomyReference>("work-formats"),
    ]).then(([nextCountries, nextSkills, nextLanguages, nextWorkFormats]) => {
      setCountries(nextCountries);
      setSkills(nextSkills);
      setLanguages(nextLanguages);
      setWorkFormats(nextWorkFormats);
    });
  }, []);

  function clearFilters() {
    setSearch("");
    setAvailability("");
    setCountry("");
    setSkill("");
    setLanguage("");
    setWorkFormat("");
  }

  const hasFilters = Boolean(
    search || availability || country || skill || language || workFormat,
  );

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
        <p className="font-inter text-[11px] font-bold text-[var(--color-primary)]">
          {tr("TALENT DIRECTORY", "КАТАЛОГ ТАЛАНТОВ")}
        </p>
        <h1 className="mt-2 text-balance font-geist text-[28px] font-[650]">
          {tr(
            "Find people to build with.",
            "Найдите людей для совместной работы",
          )}
        </h1>
        <p className="mt-2 text-pretty font-inter text-sm text-[var(--color-muted)]">
          {tr(
            "Discover people with the skills, availability and shared direction to make work move forward.",
            "Находите специалистов с подходящими навыками, доступностью и общими целями.",
          )}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
          className="mt-6 flex max-w-[730px] flex-col gap-2 sm:flex-row"
        >
          <label
            htmlFor="talent-search"
            className="flex h-11 min-w-0 flex-1 items-center rounded-md border border-[var(--color-border)] bg-white px-3 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-blue-100"
          >
            <span className="sr-only">
              {tr("Search talent", "Поиск талантов")}
            </span>
            <Search
              aria-hidden="true"
              size={18}
              className="text-[var(--color-muted)]"
            />
            <input
              id="talent-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="ml-3 min-w-0 flex-1 bg-transparent font-inter text-sm outline-none placeholder:text-[var(--color-muted)]"
              placeholder={tr(
                "Name, skill, country, language, or work format",
                "Имя, навык, страна, язык или формат работы",
              )}
            />
          </label>
          <Button type="submit" variant="outline" className="h-11 sm:w-auto">
            {tr("Search", "Найти")}
          </Button>
        </form>

        <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="self-start rounded-[10px] border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-balance font-geist text-lg font-[650]">
                {tr("Filters", "Фильтры")}
              </h2>
              <SlidersHorizontal
                aria-hidden="true"
                size={17}
                className="text-[var(--color-primary)]"
              />
            </div>
            <div className="mt-5 space-y-4">
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Skill", "Навык")}
                <select
                  value={skill}
                  onChange={(event) => setSkill(event.target.value)}
                  className={selectClass}
                >
                  <option value="">{tr("Any skill", "Любой навык")}</option>
                  {skills.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Availability", "Доступность")}
                <select
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                  className={selectClass}
                >
                  <option value="">{tr("Any availability", "Любая")}</option>
                  <option value="available">
                    {tr("Available now", "Доступен сейчас")}
                  </option>
                  <option value="limited">
                    {tr("Limited availability", "Ограниченная доступность")}
                  </option>
                  <option value="unavailable">
                    {tr("Not available", "Недоступен")}
                  </option>
                </select>
              </label>
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Country", "Страна")}
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className={selectClass}
                >
                  <option value="">{tr("Any country", "Любая страна")}</option>
                  {countries.map((item) => (
                    <option key={item.id} value={item.code}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Participation format", "Формат участия")}
                <select
                  value={workFormat}
                  onChange={(event) => setWorkFormat(event.target.value)}
                  className={selectClass}
                >
                  <option value="">{tr("Any format", "Любой формат")}</option>
                  {workFormats.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Language", "Язык")}
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className={selectClass}
                >
                  <option value="">{tr("Any language", "Любой язык")}</option>
                  {languages.map((item) => (
                    <option key={item.id} value={item.code}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded font-inter text-xs font-bold text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              {tr("Clear filters", "Сбросить фильтры")}
            </button>
          </aside>

          <section aria-busy={loading || loadingMore}>
            {loading ? (
              <div role="status" aria-live="polite">
                <h2 className="text-balance font-geist text-lg font-[650]">
                  {tr("Loading talent…", "Загружаем таланты…")}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <TalentCardSkeleton />
                  <TalentCardSkeleton />
                  <TalentCardSkeleton />
                </div>
              </div>
            ) : error ? (
              <div role="alert">
                <h2 className="text-balance font-geist text-lg font-[650]">
                  {tr(
                    "Talent directory is temporarily unavailable",
                    "Каталог талантов временно недоступен",
                  )}
                </h2>
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-pretty font-inter text-sm text-red-700">
                    {error}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => void load()}
                  >
                    {tr("Try again", "Повторить")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-balance font-geist text-lg font-[650] tabular-nums">
                  {tr({
                    en: `${totalCount} talented ${totalCount === 1 ? "person" : "people"}`,
                    ru: `Талантов найдено: ${totalCount}`,
                    "zh-Hans": `找到 ${totalCount} 位人才`,
                  })}
                </h2>
                {profiles.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white p-5">
                    <p className="text-pretty font-inter text-sm text-[var(--color-muted)]">
                      {tr(
                        "No public profiles match these filters yet.",
                        "По этим фильтрам пока нет публичных профилей.",
                      )}
                    </p>
                    {hasFilters ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={clearFilters}
                      >
                        {tr("Clear filters", "Сбросить фильтры")}
                      </Button>
                    ) : (
                      <Button asChild className="mt-4">
                        <Link href="/signup">
                          {tr("Create your profile", "Создать профиль")}
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                  <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {profiles.map((profile) => (
                      <article
                        key={profile.id}
                        id={`directory-item-${profile.id}`}
                        className="flex min-h-[258px] flex-col justify-between rounded-[10px] border border-[var(--color-border)] bg-white p-[18px] shadow-sm"
                      >
                        <div>
                          <div className="flex justify-between">
                            <ProfileAvatar profile={profile} />
                            {profile.is_verified ? (
                              <span className="flex size-[26px] items-center justify-center rounded-full bg-[var(--color-soft-green)] text-[var(--color-green)]">
                                <Sparkles aria-hidden="true" size={14} />
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-4 text-balance font-geist text-base font-[650]">
                            {profile.display_name}
                          </h3>
                          <p className="mt-1 text-pretty font-inter text-[13px] leading-[1.4] text-[var(--color-muted)]">
                            {profile.headline ||
                              tr("Talents Hub member", "Участник Talents Hub")}
                          </p>
                          <p className="mt-3 flex items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]">
                            <MapPin
                              aria-hidden="true"
                              size={14}
                              className="text-[var(--color-primary)]"
                            />
                            {location(
                              profile,
                              tr(
                                "Location not specified",
                                "Местоположение не указано",
                              ),
                              taxonomyName,
                            )}
                          </p>
                          {profile.languages.length > 0 ? (
                            <div
                              className="mt-3 flex flex-wrap items-center gap-1.5"
                              role="group"
                              aria-label={tr({
                                en: "Languages spoken",
                                ru: "Языки участника",
                                "zh-Hans": "掌握的语言",
                              })}
                            >
                              <Languages
                                aria-hidden="true"
                                size={14}
                                className="mr-0.5 shrink-0 text-[var(--color-primary)]"
                              />
                              {profile.languages
                                .slice(0, 3)
                                .map(({ id, language: spokenLanguage }) => (
                                  <span
                                    key={id}
                                    className="rounded-full border border-blue-100 bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[11px] font-medium leading-none text-blue-700"
                                  >
                                    {taxonomyName(spokenLanguage)}
                                  </span>
                                ))}
                              {profile.languages.length > 3 ? (
                                <span className="font-inter text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
                                  +{profile.languages.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills.slice(0, 3).map(({ skill }) => (
                              <span
                                key={skill.id}
                                className="rounded-full bg-neutral-100 px-2 py-1 font-inter text-[11px] font-medium"
                              >
                                {taxonomyName(skill)}
                              </span>
                            ))}
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                          >
                            <Link
                              href={`/talents/${profile.slug}`}
                              onClick={(event) =>
                                rememberDirectoryContext(
                                  event,
                                  "talents",
                                  {
                                    search,
                                    availability,
                                    country,
                                    skill,
                                    language,
                                    workFormat,
                                    loadedPages,
                                  },
                                  `directory-item-${profile.id}`,
                                )
                              }
                            >
                              {tr("View profile", "Открыть профиль")}
                            </Link>
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="font-inter text-xs tabular-nums text-[var(--color-muted)]">
                      {tr({
                        en: `Showing ${profiles.length} of ${totalCount}`,
                        ru: `Показано ${profiles.length} из ${totalCount}`,
                        "zh-Hans": `已显示 ${profiles.length} / ${totalCount}`,
                      })}
                    </p>
                    {loadMoreError ? (
                      <p role="alert" className="font-inter text-xs text-red-700">
                        {loadMoreError}
                      </p>
                    ) : null}
                    {nextPage ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void loadMore()}
                        disabled={loadingMore}
                      >
                        {loadingMore
                          ? tr("Loading…", "Загружаем…")
                          : tr("Show more", "Показать ещё")}
                      </Button>
                    ) : null}
                  </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
