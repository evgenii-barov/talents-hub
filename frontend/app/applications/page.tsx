"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  Inbox,
  Plus,
  UserRoundSearch,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from "@/lib/api";
import { trackAnalytics } from "@/lib/analytics";
import {
  getMyApplications,
  getProjectApplications,
  transitionApplication,
  type ApplicationStatus,
  type ProjectApplication,
} from "@/lib/applications";
import type { Project } from "@/lib/contracts";
import { cn } from "@/lib/utils";

type ApplicationsView = "mine" | "candidates";

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  cancelled: "Cancelled",
};

const statusLabelsRu: Record<ApplicationStatus, string> = {
  submitted: "Отправлен",
  in_review: "На рассмотрении",
  shortlisted: "В шорт-листе",
  accepted: "Принят",
  rejected: "Отклонён",
  withdrawn: "Отозван",
  cancelled: "Отменён",
};

const statusLabelsZhHans: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  in_review: "审核中",
  shortlisted: "已入围",
  accepted: "已接受",
  rejected: "已拒绝",
  withdrawn: "已撤回",
  cancelled: "已取消",
};

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "bg-neutral-100 text-neutral-700",
  in_review: "bg-[var(--color-soft-blue)] text-[var(--color-primary)]",
  shortlisted: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  withdrawn: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-neutral-100 text-neutral-600",
};

const nextStates: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  submitted: ["in_review"],
  in_review: ["shortlisted", "accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
};

function StatusBadge({
  status,
  label,
}: {
  status: ApplicationStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 max-w-full shrink-0 items-center rounded-full px-2.5 py-1 text-center font-inter text-[11px] font-bold leading-4",
        statusStyles[status],
      )}
    >
      {label}
    </span>
  );
}

function ApplicationCard({
  application,
  owner = false,
  busy = false,
  onTransition,
}: {
  application: ProjectApplication;
  owner?: boolean;
  busy?: boolean;
  onTransition?: (
    application: ProjectApplication,
    status: ApplicationStatus,
    note?: string,
  ) => void;
}) {
  const { formatDate, localize, tr } = useLocale();
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const [note, setNote] = useState("");
  const statusLabel = (status: ApplicationStatus) =>
    localize({
      en: statusLabels[status],
      ru: statusLabelsRu[status],
      "zh-Hans": statusLabelsZhHans[status],
    });
  const title = owner ? application.applicant_name : application.project_title;
  const destination = (owner
    ? application.applicant_profile_slug
      ? `/talents/${application.applicant_profile_slug}`
      : null
    : `/projects/${application.project_slug}`) as Route | null;

  function chooseStatus(status: ApplicationStatus) {
    if (status === "rejected" || status === "shortlisted") {
      setPendingStatus(status);
      setNote("");
      return;
    }
    onTransition?.(application, status);
  }

  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {destination ? (
            <Link
              href={destination}
              className="text-balance font-geist text-base font-[650] text-[var(--color-ink)] hover:text-[var(--color-primary)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              {title}
            </Link>
          ) : (
            <h3 className="text-balance font-geist text-base font-[650]">
              {title}
            </h3>
          )}
          <p className="mt-1 text-pretty font-inter text-xs font-semibold text-[var(--color-muted)]">
            {application.role_title}
          </p>
        </div>
        <StatusBadge
          status={application.status}
          label={statusLabel(application.status)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-neutral-100 py-3 font-inter text-xs text-[var(--color-muted)]">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Clock3 aria-hidden="true" size={14} />
          {tr("Applied", "Отклик отправлен")} {formatDate(application.submitted_at)}
        </span>
        {owner ? (
          <span className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness aria-hidden="true" size={14} />
            {application.project_title}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex-1">
        <p className="flex items-center gap-2 font-inter text-xs font-bold text-[var(--color-ink)]">
          <FileText aria-hidden="true" size={14} />
          {tr("Cover letter", "Сопроводительное письмо")}
        </p>
        <p
          className={cn(
            "mt-2 whitespace-pre-line text-pretty font-inter text-sm leading-6",
            application.cover_letter
              ? "text-[var(--color-muted)]"
              : "text-neutral-400",
          )}
        >
          {application.cover_letter ||
            tr("No cover letter.", "Сопроводительного письма нет.")}
        </p>
      </div>

      {application.review_note ? (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 font-inter text-xs leading-5">
          <strong>{tr("Review note:", "Комментарий:")}</strong>{" "}
          {application.review_note}
        </div>
      ) : null}

      {pendingStatus ? (
        <form
          className="mt-4 rounded-lg border border-[var(--color-card-blue-border)] bg-blue-50/50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            onTransition?.(application, pendingStatus, note);
            setPendingStatus(null);
          }}
        >
          <label
            htmlFor={`application-note-${application.id}`}
            className="block font-inter text-xs font-bold text-[var(--color-ink)]"
          >
            {tr(
              "Note for the applicant (optional)",
              "Комментарий для кандидата (необязательно)",
            )}
          </label>
          <textarea
            autoFocus
            id={`application-note-${application.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-2 w-full resize-y rounded-md border border-[var(--color-border)] bg-white px-3 py-2 font-inter text-sm leading-5 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            placeholder={tr(
              "Add useful context for the candidate",
              "Добавьте полезный контекст для кандидата",
            )}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {tr("Confirm status", "Подтвердить статус")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPendingStatus(null)}
            >
              {tr("Cancel", "Отмена")}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
        {destination ? (
          <Button asChild size="sm" variant="outline">
            <Link href={destination}>
              {owner
                ? tr("View talent", "Открыть профиль")
                : tr("View project", "Открыть проект")}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </Button>
        ) : null}
        {owner && onTransition && nextStates[application.status]
          ? nextStates[application.status]?.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={status === "rejected" ? "outline" : "default"}
                disabled={busy}
                onClick={() => chooseStatus(status)}
              >
                {status === "in_review"
                  ? tr("Start review", "Начать рассмотрение")
                  : statusLabel(status)}
              </Button>
            ))
          : null}
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="mt-6">
      <span className="sr-only">Loading applications…</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 rounded-lg border border-[var(--color-border)] bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="mt-5 h-7 w-12 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2" aria-hidden="true">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-64 rounded-lg border border-[var(--color-border)] bg-white p-5"
          >
            <div className="h-5 w-2/3 rounded bg-neutral-100" />
            <div className="mt-4 h-3 w-1/3 rounded bg-neutral-100" />
            <div className="mt-8 h-3 w-full rounded bg-neutral-100" />
            <div className="mt-2 h-3 w-5/6 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const { localize, tr } = useLocale();
  const [mine, setMine] = useState<ProjectApplication[]>([]);
  const [owned, setOwned] = useState<
    Array<{ project: Project; applications: ProjectApplication[] }>
  >([]);
  const [view, setView] = useState<ApplicationsView>("mine");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const statusLabel = (status: ApplicationStatus) =>
    localize({
      en: statusLabels[status],
      ru: statusLabelsRu[status],
      "zh-Hans": statusLabelsZhHans[status],
    });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [myApplications, projects] = await Promise.all([
        getMyApplications(),
        apiFetch<Project[]>("/v1/me/projects/"),
      ]);
      const ownerApplications = await Promise.all(
        projects.map(async (project) => ({
          project,
          applications: await getProjectApplications(project.id),
        })),
      );
      setMine(myApplications);
      setOwned(ownerApplications);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError && loadError.status === 403
          ? tr(
              "Sign in to view applications.",
              "Войдите, чтобы просматривать отклики.",
            )
          : tr("Could not load applications.", "Не удалось загрузить отклики."),
      );
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(
    application: ProjectApplication,
    status: ApplicationStatus,
    note = "",
  ) {
    setUpdatingId(application.id);
    setNotice("");
    try {
      await transitionApplication(application.id, status, note);
      if (status !== "submitted") {
        trackAnalytics("application status changed", { status });
      }
      setNotice(
        tr({
          en: `Application marked as ${statusLabels[status].toLowerCase()}.`,
          ru: `Статус отклика изменён: ${statusLabel(status).toLowerCase()}.`,
          "zh-Hans": `申请状态已更新为：${statusLabel(status)}。`,
        }),
      );
      await load();
    } catch (updateError) {
      setError(
        updateError instanceof ApiError
          ? updateError.message
          : tr("Could not update application.", "Не удалось обновить отклик."),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const receivedApplications = owned.flatMap((item) => item.applications);
  const newCandidates = receivedApplications.filter(
    (item) => item.status === "submitted",
  ).length;
  const activeApplications = mine.filter((item) =>
    ["submitted", "in_review", "shortlisted"].includes(item.status),
  ).length;

  const metrics = [
    {
      label: tr("My applications", "Мои отклики"),
      value: mine.length,
      detail: tr({
        en: `${activeApplications} active`,
        ru: `Активных: ${activeApplications}`,
        "zh-Hans": `${activeApplications} 个进行中`,
      }),
      icon: BriefcaseBusiness,
      target: "mine" as const,
    },
    {
      label: tr("New candidates", "Новые кандидаты"),
      value: newCandidates,
      detail: tr("Waiting for review", "Ожидают рассмотрения"),
      icon: Inbox,
      target: "candidates" as const,
    },
    {
      label: tr("Applications received", "Получено откликов"),
      value: receivedApplications.length,
      detail: tr("Across all projects", "По всем проектам"),
      icon: UserRoundSearch,
      target: "candidates" as const,
    },
    {
      label: tr("My projects", "Мои проекты"),
      value: owned.length,
      detail: tr("Projects under your management", "Проекты под вашим управлением"),
      icon: FolderKanban,
      target: "candidates" as const,
    },
  ];

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="font-inter text-[11px] font-bold text-[var(--color-primary)]">
              {tr("APPLICATION CENTER", "ЦЕНТР ОТКЛИКОВ")}
            </p>
            <h1 className="mt-2 text-balance font-geist text-[32px] font-[650]">
              {tr("Applications and candidates", "Отклики и кандидаты")}
            </h1>
            <p className="mt-2 max-w-2xl text-pretty font-inter text-sm leading-6 text-[var(--color-muted)]">
              {tr(
                "Track your applications, review candidates and keep the next step for every project in view.",
                "Следите за своими откликами, рассматривайте кандидатов и держите в поле зрения следующий шаг по каждому проекту.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/projects">
                {tr("Browse projects", "Найти проект")}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/projects/new">
                <Plus aria-hidden="true" size={16} />
                {tr("Post a project", "Создать проект")}
              </Link>
            </Button>
          </div>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-inter text-sm text-emerald-800"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
            <span>{notice}</span>
          </div>
        ) : null}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5"
          >
            <h2 className="text-balance font-geist text-lg font-[650]">
              {tr("Applications are unavailable", "Отклики временно недоступны")}
            </h2>
            <p className="mt-2 text-pretty font-inter text-sm text-red-700">
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
        ) : (
          <>
            <section aria-label={tr("Application summary", "Сводка по откликам")} className="mt-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <button
                      key={metric.label}
                      type="button"
                      onClick={() => setView(metric.target)}
                      className="group min-w-0 rounded-lg border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-colors hover:border-[var(--color-card-blue-border)] hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-pretty font-inter text-xs font-semibold text-[var(--color-muted)]">
                            {metric.label}
                          </p>
                          <p className="mt-2 font-geist text-2xl font-[650] tabular-nums">
                            {metric.value}
                          </p>
                        </div>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
                          <Icon aria-hidden="true" size={18} />
                        </span>
                      </div>
                      <p className="mt-3 text-pretty font-inter text-[11px] text-[var(--color-muted)]">
                        {metric.detail}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)]">
              <nav
                aria-label={tr("Applications sections", "Разделы откликов")}
                className="flex min-w-0 gap-1 overflow-x-auto"
              >
                <button
                  type="button"
                  aria-pressed={view === "mine"}
                  aria-controls="my-applications-panel"
                  onClick={() => setView("mine")}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 font-inter text-sm font-semibold focus-visible:rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset",
                    view === "mine"
                      ? "border-[var(--color-primary)] text-[var(--color-ink)]"
                      : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]",
                  )}
                >
                  {tr("My applications", "Мои отклики")}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] tabular-nums">
                    {mine.length}
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={view === "candidates"}
                  aria-controls="project-candidates-panel"
                  onClick={() => setView("candidates")}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 font-inter text-sm font-semibold focus-visible:rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset",
                    view === "candidates"
                      ? "border-[var(--color-primary)] text-[var(--color-ink)]"
                      : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]",
                  )}
                >
                  {tr("Candidates for my projects", "Кандидаты в мои проекты")}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] tabular-nums">
                    {receivedApplications.length}
                  </span>
                </button>
              </nav>
              <p className="hidden pb-3 font-inter text-xs text-[var(--color-muted)] md:block">
                {view === "mine"
                  ? tr(
                      "Your responses to open project roles",
                      "Ваши отклики на открытые роли в проектах",
                    )
                  : tr(
                      "Applications grouped by the projects you manage",
                      "Отклики сгруппированы по проектам под вашим управлением",
                    )}
              </p>
            </div>

            {view === "mine" ? (
              <section id="my-applications-panel" className="py-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-balance font-geist text-xl font-[650]">
                      {tr("My applications", "Мои отклики")}
                    </h2>
                    <p className="mt-1 text-pretty font-inter text-sm text-[var(--color-muted)]">
                      {tr(
                        "See the latest status and feedback from project owners.",
                        "Проверяйте актуальный статус и обратную связь от владельцев проектов.",
                      )}
                    </p>
                  </div>
                  <p className="font-inter text-xs font-semibold text-[var(--color-muted)] tabular-nums">
                    {tr({
                      en: `${mine.length} total`,
                      ru: `Всего: ${mine.length}`,
                      "zh-Hans": `共 ${mine.length} 个`,
                    })}
                  </p>
                </div>
                {mine.length > 0 ? (
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    {mine.map((item) => (
                      <ApplicationCard key={item.id} application={item} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-white px-6 py-10 text-center">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
                      <Inbox aria-hidden="true" size={21} />
                    </span>
                    <h3 className="mt-4 text-balance font-geist text-lg font-[650]">
                      {tr("No applications yet", "Откликов пока нет")}
                    </h3>
                    <p className="mt-2 max-w-md text-pretty font-inter text-sm leading-6 text-[var(--color-muted)]">
                      {tr(
                        "Choose an open role in the project directory and tell the team how you can help.",
                        "Выберите открытую роль в каталоге проектов и расскажите команде, чем вы можете быть полезны.",
                      )}
                    </p>
                    <Button asChild className="mt-5">
                      <Link href="/projects">
                        {tr("Browse projects", "Найти проект")}
                        <ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
            ) : (
              <section id="project-candidates-panel" className="py-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-balance font-geist text-xl font-[650]">
                      {tr("Candidates for my projects", "Кандидаты в мои проекты")}
                    </h2>
                    <p className="mt-1 text-pretty font-inter text-sm text-[var(--color-muted)]">
                      {tr(
                        "Review applications and move promising candidates through the selection process.",
                        "Рассматривайте отклики и переводите подходящих кандидатов по этапам отбора.",
                      )}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/projects/new">
                      <Plus aria-hidden="true" size={14} />
                      {tr("Post a project", "Создать проект")}
                    </Link>
                  </Button>
                </div>

                {owned.length > 0 ? (
                  <div className="mt-5 space-y-5">
                    {owned.map(({ project, applications }) => {
                      const projectNewCandidates = applications.filter(
                        (item) => item.status === "submitted",
                      ).length;
                      return (
                        <section
                          key={project.id}
                          className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-5">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-balance font-geist text-lg font-[650]">
                                  {project.title}
                                </h3>
                                <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-inter text-[11px] font-bold text-neutral-700 tabular-nums">
                                  {tr({
                                    en: `${applications.length} applications`,
                                    ru: `Откликов: ${applications.length}`,
                                    "zh-Hans": `${applications.length} 个申请`,
                                  })}
                                </span>
                                {projectNewCandidates > 0 ? (
                                  <span className="rounded-full bg-[var(--color-soft-blue)] px-2.5 py-1 font-inter text-[11px] font-bold text-[var(--color-primary)] tabular-nums">
                                    {tr({
                                      en: `${projectNewCandidates} new`,
                                      ru: `Новых: ${projectNewCandidates}`,
                                      "zh-Hans": `${projectNewCandidates} 个新申请`,
                                    })}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 line-clamp-2 text-pretty font-inter text-xs leading-5 text-[var(--color-muted)]">
                                {project.short_description}
                              </p>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/projects/${project.slug}`}>
                                {tr("View project", "Открыть проект")}
                                <ArrowRight aria-hidden="true" size={14} />
                              </Link>
                            </Button>
                          </div>
                          {applications.length > 0 ? (
                            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                              {applications.map((item) => (
                                <ApplicationCard
                                  key={item.id}
                                  application={item}
                                  owner
                                  busy={updatingId === item.id}
                                  onTransition={(candidate, status, note) =>
                                    void update(candidate, status, note)
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-neutral-50 p-4">
                              <div>
                                <p className="font-inter text-sm font-semibold">
                                  {tr("No applications yet.", "Откликов пока нет.")}
                                </p>
                                <p className="mt-1 text-pretty font-inter text-xs text-[var(--color-muted)]">
                                  {tr(
                                    "Applications will appear here when candidates respond to an open role.",
                                    "Здесь появятся кандидаты, когда они откликнутся на открытую роль.",
                                  )}
                                </p>
                              </div>
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/projects/${project.slug}`}>
                                  {tr("Check project", "Проверить проект")}
                                  <ArrowRight aria-hidden="true" size={14} />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-white px-6 py-10 text-center">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
                      <FolderKanban aria-hidden="true" size={21} />
                    </span>
                    <h3 className="mt-4 text-balance font-geist text-lg font-[650]">
                      {tr("No projects to manage yet", "Пока нет проектов для управления")}
                    </h3>
                    <p className="mt-2 max-w-md text-pretty font-inter text-sm leading-6 text-[var(--color-muted)]">
                      {tr(
                        "Create a project with an open role to start receiving applications from talents.",
                        "Создайте проект с открытой ролью, чтобы начать получать отклики от талантов.",
                      )}
                    </p>
                    <Button asChild className="mt-5">
                      <Link href="/projects/new">
                        <Plus aria-hidden="true" size={16} />
                        {tr("Post a project", "Создать проект")}
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
