"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  rememberDirectoryContext,
  useDirectoryReturnContext,
} from "@/components/navigation/directory-navigation";
import { Button } from "@/components/ui/button";
import type { Project, TaxonomyReference } from "@/lib/contracts";
import { loadCataloguePages } from "@/lib/pagination";
import { getProjectsPage } from "@/lib/projects";
import { getTaxonomy } from "@/lib/taxonomy";

const selectClass =
  "mt-2 h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 font-inter text-[13px] font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100";

type ProjectDirectoryState = {
  search: string;
  category: string;
  stage: string;
  format: string;
  loadedPages?: number;
};

function openSeats(project: Project): number {
  return project.roles
    .filter((role) => role.status === "open")
    .reduce((total, role) => total + role.seats_total - role.seats_filled, 0);
}

function ProjectCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[280px] rounded-[10px] border border-[var(--color-border)] bg-white p-5"
    >
      <div className="h-5 w-24 rounded bg-neutral-100" />
      <div className="mt-6 h-5 w-3/4 rounded bg-neutral-100" />
      <div className="mt-4 h-3 w-full rounded bg-neutral-100" />
      <div className="mt-2 h-3 w-5/6 rounded bg-neutral-100" />
      <div className="mt-20 h-9 w-full rounded bg-neutral-100" />
    </div>
  );
}

export default function ProjectsPage() {
  const { formatDate, taxonomyName, tr } = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<TaxonomyReference[]>([]);
  const [formats, setFormats] = useState<TaxonomyReference[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loadedPages, setLoadedPages] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [error, setError] = useState("");
  const restoredPageCountRef = useRef(1);
  const requestSequenceRef = useRef(0);
  const navigationReady = useDirectoryReturnContext<ProjectDirectoryState>(
    "projects",
    (state) => {
      setSearch(state.search);
      setCategory(state.category);
      setStage(state.stage);
      setFormat(state.format);
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
        (page) => getProjectsPage({
          search,
          category,
          stage,
          workFormat: format,
          roleStatus: "open",
          page,
        }),
        targetPages,
      );
      if (requestId !== requestSequenceRef.current) return;
      setProjects(loaded.results);
      setTotalCount(loaded.response.count);
      setLoadedPages(loaded.pagesLoaded);
      setNextPage(loaded.response.next ? loaded.pagesLoaded + 1 : null);
    } catch {
      if (requestId !== requestSequenceRef.current) return;
      setError(
        tr(
          "Could not load projects. Please try again.",
          "Не удалось загрузить проекты. Попробуйте ещё раз.",
        ),
      );
    } finally {
      if (requestId === requestSequenceRef.current) setLoading(false);
    }
  }, [category, format, search, stage, tr]);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    const requestId = ++requestSequenceRef.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const response = await getProjectsPage({
        search,
        category,
        stage,
        workFormat: format,
        roleStatus: "open",
        page: nextPage,
      });
      if (requestId !== requestSequenceRef.current) return;
      setProjects((current) => [...current, ...response.results]);
      setTotalCount(response.count);
      setLoadedPages(nextPage);
      setNextPage(response.next ? nextPage + 1 : null);
    } catch {
      if (requestId !== requestSequenceRef.current) return;
      setLoadMoreError(tr("Could not load more projects.", "Не удалось загрузить ещё проекты."));
    } finally {
      if (requestId === requestSequenceRef.current) setLoadingMore(false);
    }
  }, [category, format, loadingMore, nextPage, search, stage, tr]);

  useEffect(() => {
    if (navigationReady) void load();
  }, [load, navigationReady]);
  useEffect(() => {
    void Promise.all([
      getTaxonomy<TaxonomyReference>("categories"),
      getTaxonomy<TaxonomyReference>("work-formats"),
    ]).then(([nextCategories, nextFormats]) => {
      setCategories(nextCategories);
      setFormats(nextFormats);
    });
  }, []);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setStage("");
    setFormat("");
  }

  const hasFilters = Boolean(search || category || stage || format);

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-inter text-[11px] font-bold text-[var(--color-primary)]">
              {tr("PROJECT DIRECTORY", "КАТАЛОГ ПРОЕКТОВ")}
            </p>
            <h1 className="mt-2 text-balance font-geist text-[28px] font-[650]">
              {tr(
                "Find a project worth contributing to",
                "Найдите проект, в который хочется внести вклад",
              )}
            </h1>
            <p className="mt-2 text-pretty font-inter text-sm text-[var(--color-muted)]">
              {tr(
                "Explore open briefs, understand the work and join a team where your skills can make a difference.",
                "Изучайте открытые задачи, знакомьтесь с командами и находите проекты, где ваши навыки принесут пользу.",
              )}
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">
              <Plus aria-hidden="true" size={16} />
              {tr("Post a project", "Создать проект")}
            </Link>
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
          className="mt-6 flex max-w-[730px] flex-col gap-2 sm:flex-row"
        >
          <label
            htmlFor="project-search"
            className="flex h-11 min-w-0 flex-1 items-center rounded-md border border-[var(--color-border)] bg-white px-3 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-blue-100"
          >
            <span className="sr-only">
              {tr("Search projects", "Поиск проектов")}
            </span>
            <Search
              aria-hidden="true"
              size={18}
              className="text-[var(--color-muted)]"
            />
            <input
              id="project-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="ml-3 min-w-0 flex-1 bg-transparent font-inter text-sm outline-none placeholder:text-[var(--color-muted)]"
              placeholder={tr(
                "Title, role, skill, organisation, or work format",
                "Название, роль, навык, организация или формат работы",
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
                {tr("Category", "Категория")}
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {tr("All categories", "Все категории")}
                  </option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Project stage", "Стадия проекта")}
                <select
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                  className={selectClass}
                >
                  <option value="">{tr("All stages", "Все стадии")}</option>
                  <option value="idea">{tr("Idea", "Идея")}</option>
                  <option value="team_formation">
                    {tr("Team formation", "Формирование команды")}
                  </option>
                  <option value="prototype">
                    {tr("Prototype", "Прототип")}
                  </option>
                  <option value="pilot">{tr("Pilot", "Пилот")}</option>
                  <option value="active">{tr("Active", "Активный")}</option>
                </select>
              </label>
              <label className="block font-inter text-xs font-bold text-[var(--color-muted)]">
                {tr("Work format", "Формат работы")}
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {tr("Any work format", "Любой формат")}
                  </option>
                  {formats.map((item) => (
                    <option key={item.id} value={item.slug}>
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
                  {tr("Loading projects…", "Загружаем проекты…")}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <ProjectCardSkeleton />
                  <ProjectCardSkeleton />
                </div>
              </div>
            ) : error ? (
              <div role="alert">
                <h2 className="text-balance font-geist text-lg font-[650]">
                  {tr(
                    "Projects are temporarily unavailable",
                    "Проекты временно недоступны",
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
                    en: `${totalCount} open ${totalCount === 1 ? "project" : "projects"}`,
                    ru: `Открытых проектов: ${totalCount}`,
                    "zh-Hans": `开放项目：${totalCount}`,
                  })}
                </h2>
                {projects.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white p-5">
                    <p className="text-pretty font-inter text-sm text-[var(--color-muted)]">
                      {tr(
                        "No public projects match these filters yet.",
                        "По этим фильтрам пока нет публичных проектов.",
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
                        <Link href="/projects/new">
                          {tr("Post a project", "Создать проект")}
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                  <div className="mt-4 grid gap-5 md:grid-cols-2">
                    {projects.map((project) => {
                      const seats = openSeats(project);
                      return (
                        <article
                          key={project.id}
                          id={`directory-item-${project.id}`}
                          className="flex min-h-[280px] flex-col justify-between rounded-[10px] border border-[var(--color-border)] bg-white p-5"
                        >
                          <div>
                            <div className="flex justify-between gap-3">
                              <span className="rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-bold text-[var(--color-primary)]">
                                {taxonomyName(project.category)}
                              </span>
                              <span className="font-inter text-[11px] font-bold text-[var(--color-muted)]">
                                {project.application_deadline
                                  ? tr({
                                      en: `Closes ${formatDate(project.application_deadline)}`,
                                      ru: `Приём до ${formatDate(project.application_deadline)}`,
                                      "zh-Hans": `截止日期：${formatDate(project.application_deadline)}`,
                                    })
                                  : tr("Open deadline", "Без срока")}
                              </span>
                            </div>
                            <h3 className="mt-4 text-balance font-geist text-lg font-[650]">
                              {project.title}
                            </h3>
                            <p className="mt-3 text-pretty font-inter text-xs leading-[1.4] text-[var(--color-muted)]">
                              {project.short_description}
                            </p>
                            <p className="mt-4 text-pretty font-inter text-xs font-semibold text-[var(--color-primary)]">
                              {tr("Seeking", "Ищем")}:{" "}
                              {project.roles
                                .filter((role) => role.status === "open")
                                .map((role) => role.title)
                                .join(", ") || tr("contributors", "участников")}
                            </p>
                            <div className="mt-3 flex justify-between font-inter text-[11px] tabular-nums">
                              <span className="text-[var(--color-muted)]">
                                <CalendarDays
                                  aria-hidden="true"
                                  size={13}
                                  className="mr-1 inline"
                                />
                                {[project.starts_on, project.ends_on]
                                  .filter((value): value is string => Boolean(value))
                                  .map((value) => formatDate(value))
                                  .join(" – ") || taxonomyName(project.work_format)}
                              </span>
                              <span className="font-bold text-[var(--color-green)]">
                                {tr({
                                  en: `${seats} seats open`,
                                  ru: `Свободных мест: ${seats}`,
                                  "zh-Hans": `开放名额：${seats}`,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-5 flex items-center justify-between">
                            <span className="font-inter text-xs font-semibold text-[var(--color-muted)]">
                              {project.organization?.display_name ||
                                project.owner_profile?.display_name ||
                                tr("Personal project", "Личный проект")}
                            </span>
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={`/projects/${project.slug}`}
                                onClick={(event) =>
                                  rememberDirectoryContext(
                                    event,
                                    "projects",
                                    { search, category, stage, format, loadedPages },
                                    `directory-item-${project.id}`,
                                  )
                                }
                              >
                                {tr("View project", "Открыть проект")}{" "}
                                <ArrowRight aria-hidden="true" size={14} />
                              </Link>
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="font-inter text-xs tabular-nums text-[var(--color-muted)]">
                      {tr({
                        en: `Showing ${projects.length} of ${totalCount}`,
                        ru: `Показано ${projects.length} из ${totalCount}`,
                        "zh-Hans": `已显示 ${projects.length} / ${totalCount}`,
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
