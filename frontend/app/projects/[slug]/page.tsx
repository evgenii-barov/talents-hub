"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Languages,
  MonitorSmartphone,
  Send,
  UsersRound,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { DirectoryBreadcrumbs } from "@/components/navigation/directory-navigation";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import { useFlashMessages } from "@/components/ui/flash-messages";
import { ApiError, apiFetch } from "@/lib/api";
import type { Project, ProjectRole } from "@/lib/contracts";
import { getProject } from "@/lib/projects";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-[var(--color-border)] bg-white p-6">
      {children}
    </section>
  );
}

function dateRange(
  project: Project,
  fallback: string,
  formatDate: (value: string | Date) => string,
): string {
  return (
    [project.starts_on, project.ends_on]
      .filter((value): value is string => Boolean(value))
      .map((value) => formatDate(value))
      .join(" – ") || fallback
  );
}

export default function ProjectDetailPage() {
  const { formatDate, taxonomyName, tr } = useLocale();
  const { showFlash } = useFlashMessages();
  const stageLabels: Record<string, string> = {
    idea: tr("Idea", "Идея"),
    team_formation: tr("Team formation", "Формирование команды"),
    prototype: tr("Prototype", "Прототип"),
    pilot: tr("Pilot", "Пилот"),
    active: tr("Active", "Активный"),
  };
  const scopeLabels: Record<string, string> = {
    local: tr("Local", "Локальный"),
    national: tr("National", "Национальный"),
    international: tr("International", "Международный"),
  };
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project>();
  const [error, setError] = useState("");
  const [applyingRole, setApplyingRole] = useState<string>();
  const [appliedRoles, setAppliedRoles] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setError("");
    setProject(undefined);
    try {
      setProject(await getProject(slug));
    } catch {
      setError(
        tr(
          "Could not load this project. It may be unavailable or no longer public.",
          "Не удалось загрузить проект. Возможно, он недоступен или больше не является публичным.",
        ),
      );
    }
  }, [slug, tr]);

  useEffect(() => {
    void load();
  }, [load]);

  async function apply(role: ProjectRole) {
    setApplyingRole(role.id);
    try {
      await apiFetch(`/v1/project-roles/${role.id}/applications/`, {
        method: "POST",
        body: { cover_letter: "" },
      });
      setAppliedRoles((current) => new Set(current).add(role.id));
      showFlash({
        tone: "success",
        message: tr({
          en: `Your application for ${role.title} has been submitted.`,
          ru: `Ваш отклик на роль «${role.title}» отправлен.`,
          "zh-Hans": `您对“${role.title}”角色的申请已提交。`,
        }),
      });
    } catch (nextError) {
      if (nextError instanceof ApiError && nextError.status === 409) {
        setAppliedRoles((current) => new Set(current).add(role.id));
        showFlash({
          tone: "info",
          message: tr({
            en: `You have already applied for ${role.title}.`,
            ru: `Вы уже откликнулись на роль «${role.title}».`,
            "zh-Hans": `您已经申请了“${role.title}”角色。`,
          }),
        });
      } else {
        const message =
          nextError instanceof ApiError && nextError.status === 403
            ? tr(
              "Sign in and publish your profile before applying.",
              "Войдите и опубликуйте профиль перед откликом.",
            )
            : tr(
              "Could not submit your application. Please try again.",
              "Не удалось отправить отклик. Попробуйте ещё раз.",
            );
        showFlash({ tone: "error", message, duration: 7000 });
      }
    } finally {
      setApplyingRole(undefined);
    }
  }

  if (error)
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main className="mx-auto max-w-[720px] px-6 py-12">
          <DirectoryBreadcrumbs
            directoryHref="/projects"
            directoryLabel={tr("Back to projects", "Назад к проектам")}
            currentLabel={tr("Project unavailable", "Проект недоступен")}
          />
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5"
          >
            <h1 className="text-balance font-geist text-xl font-[650] text-[var(--color-ink)]">
              {tr("Project unavailable", "Проект недоступен")}
            </h1>
            <p className="mt-2 text-pretty font-inter text-sm text-red-700">
              {error}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void load()}>
                {tr("Try again", "Повторить")}
              </Button>
              <Button asChild variant="outline">
                <Link href="/projects">
                  {tr("Back to projects", "Вернуться к проектам")}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  if (!project)
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main aria-busy="true" className="mx-auto max-w-[720px] px-6 py-12">
          <DirectoryBreadcrumbs
            directoryHref="/projects"
            directoryLabel={tr("Back to projects", "Назад к проектам")}
            currentLabel={tr("Loading project…", "Загружаем проект…")}
          />
          <div role="status" aria-live="polite">
            <p className="mt-5 font-inter text-sm font-semibold text-[var(--color-muted)]">
              {tr("Loading project…", "Загружаем проект…")}
            </p>
            <div
              aria-hidden="true"
              className="mt-5 rounded-[10px] border border-[var(--color-border)] bg-white p-6"
            >
              <div className="h-7 w-2/3 rounded bg-neutral-100" />
              <div className="mt-5 h-3 w-full rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-4/5 rounded bg-neutral-100" />
              <div className="mt-10 h-32 rounded bg-neutral-100" />
            </div>
          </div>
        </main>
      </div>
    );
  const openRoles = project.roles.filter((role) => role.status === "open");
  const seats = openRoles.reduce(
    (total, role) => total + role.seats_total - role.seats_filled,
    0,
  );

  const organiser = project.organization || project.owner_profile;
  const organiserHref = (
    project.organization
      ? `/organizations/${project.organization.slug}`
      : project.owner_profile
        ? `/talents/${project.owner_profile.slug}`
        : undefined
  ) as Route | undefined;
  const organiserChatHref = (() => {
    const chatOrganiser = project.owner_profile || project.organization;
    if (!chatOrganiser) return undefined;
    const search = new URLSearchParams({
      name: chatOrganiser.display_name,
      project: project.id,
      projectName: project.title,
    });
    if (project.owner_profile) {
      search.set("recipient", project.owner_profile.id);
    } else if (project.organization) {
      search.set("organization", project.organization.id);
    } else {
      return undefined;
    }
    return `/chat?${search.toString()}` as Route;
  })();

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-7 lg:px-12">
            <DirectoryBreadcrumbs
              directoryHref="/projects"
              directoryLabel={tr("Back to projects", "Назад к проектам")}
              currentLabel={project.title}
            />
            <span className="mt-5 inline-flex rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-bold text-[var(--color-primary)]">
              {taxonomyName(project.category)}
            </span>
            <div className="mt-3 flex flex-wrap justify-between gap-5">
              <div>
                <h1 className="font-geist text-[38px] font-[650]">
                  {project.title}
                </h1>
                <p className="mt-3 max-w-[720px] font-inter text-base leading-[1.45] text-[var(--color-muted)]">
                  {project.short_description}
                </p>
                <div className="mt-5 flex gap-6 font-inter text-[13px] font-bold">
                  <span className="text-[var(--color-primary)]">
                    {dateRange(
                      project,
                      tr("Dates to be agreed", "Даты уточняются"),
                      formatDate,
                    )}
                  </span>
                  <span className="text-[var(--color-green)]">
                    {tr({
                      en: `${seats} seats open`,
                      ru: `Свободных мест: ${seats}`,
                      "zh-Hans": `开放名额：${seats}`,
                    })}
                  </span>
                </div>
              </div>
              {organiserHref ? (
                <Button asChild variant="outline">
                  <Link href={organiserHref}>
                    {tr("About organiser", "Об организаторе")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-7 lg:grid-cols-[minmax(0,856px)_460px] lg:px-12">
          <div className="space-y-[18px]">
            <Card>
              <h2 className="font-geist text-[19px] font-[650]">
                {tr("Overview", "Обзор")}
              </h2>
              <p className="mt-4 whitespace-pre-line font-inter text-sm leading-[1.5] text-[var(--color-muted)]">
                {project.description}
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="font-inter text-xs font-bold text-[var(--color-muted)]">
                    {tr("SCOPE", "МАСШТАБ")}
                  </p>
                  <p className="mt-2 font-inter text-[13px] font-semibold">
                    {scopeLabels[project.scope] || project.scope} ·{" "}
                    {taxonomyName(project.work_format)} · {taxonomyName(project.working_language)}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-xs font-bold text-[var(--color-muted)]">
                    {tr("STAGE", "СТАДИЯ")}
                  </p>
                  <p className="mt-2 font-inter text-[13px] font-semibold text-[var(--color-primary)]">
                    {stageLabels[project.stage] ||
                      project.stage.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </Card>
            {project.problem_statement || project.goal_statement ? (
              <Card>
                <h2 className="font-geist text-[19px] font-[650]">
                  {tr("The problem & the goal", "Проблема и цель")}
                </h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {project.problem_statement ? (
                    <div>
                      <p className="font-inter text-[10px] font-bold tracking-[0.05em] text-[var(--color-primary)]">
                        {tr("PROBLEM", "ПРОБЛЕМА")}
                      </p>
                      <p className="mt-2 font-inter text-[13px] leading-[1.45] text-[var(--color-muted)]">
                        {project.problem_statement}
                      </p>
                    </div>
                  ) : null}
                  {project.goal_statement ? (
                    <div>
                      <p className="font-inter text-[10px] font-bold tracking-[0.05em] text-[var(--color-green)]">
                        {tr("GOAL", "ЦЕЛЬ")}
                      </p>
                      <p className="mt-2 font-inter text-[13px] leading-[1.45] text-[var(--color-muted)]">
                        {project.goal_statement}
                      </p>
                    </div>
                  ) : null}
                </div>
                {project.timeline_text ? (
                  <>
                    <p className="mt-6 font-inter text-xs font-bold text-[var(--color-muted)]">
                      {tr("PROJECT TIMELINE", "ПЛАН ПРОЕКТА")}
                    </p>
                    <p className="mt-2 font-inter text-[13px] font-semibold">
                      {project.timeline_text}
                    </p>
                  </>
                ) : null}
              </Card>
            ) : null}
            <Card>
              <h2 className="font-geist text-[19px] font-[650]">
                {tr("Open roles", "Открытые роли")}
              </h2>
              <p className="mt-2 font-inter text-[13px] text-[var(--color-muted)]">
                {tr(
                  "Choose a role to submit your application.",
                  "Выберите роль, чтобы отправить отклик.",
                )}
              </p>
              <div className="mt-5 space-y-3">
                {openRoles.map((role, index) => (
                  <div
                    key={role.id}
                    className={`rounded-lg p-4 ${index === 0 ? "bg-neutral-100" : "border border-[var(--color-border)]"}`}
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-inter text-sm font-bold">
                          {role.title}
                        </h3>
                        <p className="mt-2 font-inter text-xs text-[var(--color-muted)]">
                          {role.first_responsibility ||
                            role.description ||
                            tr(
                              "Details to be agreed with the project owner.",
                              "Подробности можно обсудить с владельцем проекта.",
                            )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-right">
                        <span className="whitespace-nowrap font-inter text-xs font-semibold text-[var(--color-primary)] tabular-nums">
                          {role.commitment_hours_per_week
                            ? tr({
                                en: `${role.commitment_hours_per_week} hrs/week`,
                                ru: `${role.commitment_hours_per_week} ч/неделю`,
                                "zh-Hans": `每周 ${role.commitment_hours_per_week} 小时`,
                              })
                            : tr("Flexible", "Гибко")}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={applyingRole === role.id || appliedRoles.has(role.id)}
                          onClick={() => void apply(role)}
                        >
                          {appliedRoles.has(role.id) ? (
                            <CheckCircle2 aria-hidden="true" size={14} />
                          ) : (
                            <Send aria-hidden="true" size={14} />
                          )}
                          {appliedRoles.has(role.id)
                            ? tr({
                                en: "Application sent",
                                ru: "Отклик отправлен",
                                "zh-Hans": "申请已提交",
                              })
                            : applyingRole === role.id
                            ? tr("Applying…", "Отправляем…")
                            : tr("Apply", "Откликнуться")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {openRoles.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr(
                      "There are no open roles at the moment.",
                      "Сейчас открытых ролей нет.",
                    )}
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
          <aside className="space-y-[18px]">
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("Organiser", "Организатор")}
              </h2>
              <p className="mt-4 font-inter text-[15px] font-bold">
                {organiser?.display_name ||
                  tr("Personal project", "Личный проект")}
              </p>
              {organiserHref ? (
                <Link
                  className="mt-3 inline-block font-inter text-xs font-bold text-[var(--color-primary)]"
                  href={organiserHref}
                >
                  {project.organization
                    ? tr("View organisation →", "Открыть организацию →")
                    : tr("View talent profile →", "Открыть профиль таланта →")}
                </Link>
              ) : null}
            </Card>
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("Key details", "Основная информация")}
              </h2>
              <div className="mt-5 space-y-4 font-inter text-[13px] font-semibold">
                <p className="flex gap-3">
                  <CalendarDays
                    size={16}
                    className="shrink-0 text-[var(--color-primary)]"
                  />
                  {tr("Calendar", "Календарь")}:{" "}
                  {dateRange(
                    project,
                    tr("Dates to be agreed", "Даты уточняются"),
                    formatDate,
                  )}
                </p>
                <p className="flex gap-3">
                  <MonitorSmartphone
                    size={16}
                    className="shrink-0 text-[var(--color-primary)]"
                  />
                  {tr("Format", "Формат")}: {taxonomyName(project.work_format)}
                </p>
                <p className="flex gap-3">
                  <Languages
                    size={16}
                    className="shrink-0 text-[var(--color-primary)]"
                  />
                  {tr("Language", "Язык")}: {taxonomyName(project.working_language)}
                </p>
                <p className="flex gap-3">
                  <UsersRound
                    size={16}
                    className="shrink-0 text-[var(--color-primary)]"
                  />
                  {tr({
                    en: `${seats} openings`,
                    ru: `Открытых мест: ${seats}`,
                    "zh-Hans": `开放名额：${seats}`,
                  })}
                </p>
              </div>
            </Card>
            {project.contacts.length || organiserChatHref ? (
              <Card>
                <h2 className="font-geist text-lg font-[650]">
                  {tr("Contact the organiser", "Связаться с организатором")}
                </h2>
                <div className="mt-4 flex items-start gap-3">
                  {project.owner_profile && project.contacts.length ? (
                    <ProfileAvatar
                      profile={project.owner_profile}
                      className="size-12 text-sm"
                    />
                  ) : null}
                  <div className="min-w-0 space-y-3">
                    {project.contacts.map((contact) => (
                      <div key={contact.id}>
                        <p className="font-inter text-sm font-bold">
                          {contact.name}
                        </p>
                        <a
                          className="break-all font-inter text-[13px] font-bold text-[var(--color-primary)]"
                          href={`mailto:${contact.email}`}
                        >
                          {contact.email}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                {organiserChatHref ? (
                  <Button asChild className="mt-5 w-full">
                    <Link href={organiserChatHref}>
                      <Send aria-hidden="true" size={16} />
                      {tr("Message organiser", "Написать организатору")}
                    </Link>
                  </Button>
                ) : null}
              </Card>
            ) : null}
            {project.expected_outcome ? (
              <section className="rounded-[10px] bg-[var(--color-hero)] p-5 text-white">
                <p className="font-inter text-[10px] font-bold tracking-[0.05em] text-blue-200">
                  {tr("EXPECTED OUTCOME", "ОЖИДАЕМЫЙ РЕЗУЛЬТАТ")}
                </p>
                <p className="mt-3 font-inter text-sm leading-[1.45] text-blue-100">
                  {project.expected_outcome}
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
