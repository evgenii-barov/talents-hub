"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  rememberDirectoryContext,
  useDirectoryReturnContext,
} from "@/components/navigation/directory-navigation";
import { Button } from "@/components/ui/button";
import type { Country, Organization, TaxonomyReference } from "@/lib/contracts";
import { getOrganizationsPage } from "@/lib/organizations";
import { loadCataloguePages } from "@/lib/pagination";
import { getTaxonomy } from "@/lib/taxonomy";

const selectClass =
  "mt-2 h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 font-inter text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100";

type OrganizationDirectoryState = {
  search: string;
  focus: string;
  country: string;
  verified: boolean;
  loadedPages?: number;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function OrganizationCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[258px] rounded-[10px] border border-[var(--color-border)] bg-white p-[18px]"
    >
      <div className="size-11 rounded-md bg-neutral-100" />
      <div className="mt-5 h-5 w-1/2 rounded bg-neutral-100" />
      <div className="mt-3 h-3 w-3/4 rounded bg-neutral-100" />
      <div className="mt-20 h-8 w-full rounded bg-neutral-100" />
    </div>
  );
}

export default function OrganizationsPage() {
  const { taxonomyName, tr } = useLocale();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [focusAreas, setFocusAreas] = useState<TaxonomyReference[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState("");
  const [country, setCountry] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loadedPages, setLoadedPages] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [error, setError] = useState("");
  const restoredPageCountRef = useRef(1);
  const requestSequenceRef = useRef(0);
  const navigationReady = useDirectoryReturnContext<OrganizationDirectoryState>(
    "organizations",
    (state) => {
      setSearch(state.search);
      setFocus(state.focus);
      setCountry(state.country);
      setVerified(state.verified);
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
        (page) => getOrganizationsPage({
          search,
          focus,
          country,
          verified: verified || undefined,
          page,
        }),
        targetPages,
      );
      if (requestId !== requestSequenceRef.current) return;
      setOrganizations(loaded.results);
      setTotalCount(loaded.response.count);
      setLoadedPages(loaded.pagesLoaded);
      setNextPage(loaded.response.next ? loaded.pagesLoaded + 1 : null);
    } catch {
      if (requestId !== requestSequenceRef.current) return;
      setError(
        tr(
          "Could not load organisations. Please try again.",
          "Не удалось загрузить организации. Попробуйте ещё раз.",
        ),
      );
    } finally {
      if (requestId === requestSequenceRef.current) setLoading(false);
    }
  }, [country, focus, search, tr, verified]);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    const requestId = ++requestSequenceRef.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const response = await getOrganizationsPage({
        search,
        focus,
        country,
        verified: verified || undefined,
        page: nextPage,
      });
      if (requestId !== requestSequenceRef.current) return;
      setOrganizations((current) => [...current, ...response.results]);
      setTotalCount(response.count);
      setLoadedPages(nextPage);
      setNextPage(response.next ? nextPage + 1 : null);
    } catch {
      if (requestId !== requestSequenceRef.current) return;
      setLoadMoreError(
        tr("Could not load more organisations.", "Не удалось загрузить ещё организации."),
      );
    } finally {
      if (requestId === requestSequenceRef.current) setLoadingMore(false);
    }
  }, [country, focus, loadingMore, nextPage, search, tr, verified]);

  useEffect(() => {
    if (navigationReady) void load();
  }, [load, navigationReady]);
  useEffect(() => {
    void Promise.all([
      getTaxonomy<TaxonomyReference>("focus-areas"),
      getTaxonomy<Country>("countries"),
    ]).then(([nextFocusAreas, nextCountries]) => {
      setFocusAreas(nextFocusAreas);
      setCountries(nextCountries);
    });
  }, []);

  function clearFilters() {
    setSearch("");
    setFocus("");
    setCountry("");
    setVerified(false);
  }

  const hasFilters = Boolean(search || focus || country || verified);

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
        <p className="font-inter text-[11px] font-bold text-[var(--color-primary)]">
          {tr("ORGANISATION DIRECTORY", "КАТАЛОГ ОРГАНИЗАЦИЙ")}
        </p>
        <h1 className="mt-2 text-balance font-geist text-[28px] font-[650]">
          {tr(
            "Find organisations shaping the future.",
            "Найдите организации, которые формируют будущее",
          )}
        </h1>
        <p className="mt-2 text-pretty font-inter text-sm text-[var(--color-muted)]">
          {tr(
            "Explore trusted partners, discover their focus and connect your talent with meaningful work.",
            "Знакомьтесь с проверенными партнёрами, их направлениями работы и проектами.",
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
            htmlFor="organization-search"
            className="flex h-11 min-w-0 flex-1 items-center rounded-md border border-[var(--color-border)] bg-white px-3 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-blue-100"
          >
            <span className="sr-only">
              {tr("Search organisations", "Поиск организаций")}
            </span>
            <Search
              aria-hidden="true"
              size={18}
              className="text-[var(--color-muted)]"
            />
            <input
              id="organization-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="ml-3 min-w-0 flex-1 bg-transparent font-inter text-sm outline-none placeholder:text-[var(--color-muted)]"
              placeholder={tr(
                "Name, focus area, country, or organisation type",
                "Название, направление, страна или тип организации",
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
                {tr("Focus area", "Направление")}
                <select
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {tr("All focus areas", "Все направления")}
                  </option>
                  {focusAreas.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {taxonomyName(item)}
                    </option>
                  ))}
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
              <label className="flex items-center gap-2.5 font-inter text-xs font-bold text-[var(--color-muted)]">
                <input
                  checked={verified}
                  onChange={(event) => setVerified(event.target.checked)}
                  type="checkbox"
                  className="size-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                />
                {tr("Verified partners only", "Только проверенные партнёры")}
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
                  {tr("Loading organisations…", "Загружаем организации…")}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <OrganizationCardSkeleton />
                  <OrganizationCardSkeleton />
                  <OrganizationCardSkeleton />
                </div>
              </div>
            ) : error ? (
              <div role="alert">
                <h2 className="text-balance font-geist text-lg font-[650]">
                  {tr(
                    "Organisation directory is temporarily unavailable",
                    "Каталог организаций временно недоступен",
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
                    en: `${totalCount} ${totalCount === 1 ? "organisation" : "organisations"}`,
                    ru: `Организаций найдено: ${totalCount}`,
                    "zh-Hans": `找到 ${totalCount} 个机构`,
                  })}
                </h2>
                {organizations.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white p-5">
                    <p className="text-pretty font-inter text-sm text-[var(--color-muted)]">
                      {tr(
                        "No public organisations match these filters yet.",
                        "По этим фильтрам пока нет публичных организаций.",
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={hasFilters ? clearFilters : () => void load()}
                    >
                      {hasFilters
                        ? tr("Clear filters", "Сбросить фильтры")
                        : tr("Try again", "Повторить")}
                    </Button>
                  </div>
                ) : (
                  <>
                  <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {organizations.map((organization) => (
                      <article
                        key={organization.id}
                        id={`directory-item-${organization.id}`}
                        className="flex min-h-[258px] flex-col justify-between rounded-[10px] border border-[var(--color-border)] bg-white p-[18px] shadow-sm"
                      >
                        <div>
                          <div className="flex justify-between">
                            <span className="flex size-11 items-center justify-center rounded-md bg-[var(--color-primary)] font-geist text-xs font-bold text-white">
                              {initials(organization.display_name)}
                            </span>
                            {organization.is_verified ? (
                              <span className="flex size-[26px] items-center justify-center rounded-full bg-[var(--color-soft-green)] text-[var(--color-green)]">
                                <BadgeCheck aria-hidden="true" size={14} />
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-4 text-balance font-geist text-base font-[650]">
                            {organization.display_name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-pretty font-inter text-[13px] leading-[1.4] text-[var(--color-muted)]">
                            {organization.tagline ||
                              organization.description ||
                              organization.organization_type.replaceAll(
                                "_",
                                " ",
                              )}
                          </p>
                          <p className="mt-3 flex items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]">
                            <MapPin
                              aria-hidden="true"
                              size={14}
                              className="text-[var(--color-primary)]"
                            />
                            {organization.location_text ||
                              (organization.country
                                ? taxonomyName(organization.country)
                                : undefined) ||
                              tr(
                                "Location not specified",
                                "Местоположение не указано",
                              )}
                          </p>
                        </div>
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1.5">
                            {organization.focuses
                              .slice(0, 3)
                              .map(({ focus_area }) => (
                                <span
                                  key={focus_area.id}
                                  className="rounded-full bg-neutral-100 px-2 py-1 font-inter text-[11px] font-medium"
                                >
                                  {taxonomyName(focus_area)}
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
                              href={`/organizations/${organization.slug}`}
                              onClick={(event) =>
                                rememberDirectoryContext(
                                  event,
                                  "organizations",
                                  { search, focus, country, verified, loadedPages },
                                  `directory-item-${organization.id}`,
                                )
                              }
                            >
                              {tr("View organisation", "Открыть организацию")}
                            </Link>
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="font-inter text-xs tabular-nums text-[var(--color-muted)]">
                      {tr({
                        en: `Showing ${organizations.length} of ${totalCount}`,
                        ru: `Показано ${organizations.length} из ${totalCount}`,
                        "zh-Hans": `已显示 ${organizations.length} / ${totalCount}`,
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
