"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Plus, Save, Send } from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from "@/lib/api";
import { trackAnalytics } from "@/lib/analytics";
import type { Language, TaxonomyReference } from "@/lib/contracts";
import { getTaxonomy } from "@/lib/taxonomy";

type RoleDraft = {
  title: string;
  firstResponsibility: string;
  commitment: string;
  seats: string;
};

const emptyRole = (): RoleDraft => ({
  title: "",
  firstResponsibility: "",
  commitment: "",
  seats: "1",
});

const projectSectionIds = [
  "basics",
  "project-brief",
  "team-and-roles",
  "dates-and-format",
  "review-and-publish",
] as const;
type ProjectSectionId = (typeof projectSectionIds)[number];

function FormCard({
  children,
  id,
}: {
  children: React.ReactNode;
  id: ProjectSectionId;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[10px] border border-[var(--color-border)] bg-white p-6"
    >
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block font-inter text-[13px] font-semibold">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-2 h-[42px] w-full rounded-md border border-[var(--color-border)] bg-white px-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100";

export default function CreateProjectPage() {
  const { taxonomyName, tr } = useLocale();
  const [categories, setCategories] = useState<TaxonomyReference[]>([]);
  const [formats, setFormats] = useState<TaxonomyReference[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [roles, setRoles] = useState<RoleDraft[]>([emptyRole()]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    stage: "team_formation",
    scope: "international",
    language: "",
    workFormat: "",
    shortDescription: "",
    description: "",
    problem: "",
    goal: "",
    outcome: "",
    timeline: "",
    startsOn: "",
    endsOn: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState<"draft" | "moderation">();
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] =
    useState<ProjectSectionId>("basics");

  useEffect(() => {
    void Promise.all([
      getTaxonomy<TaxonomyReference>("categories"),
      getTaxonomy<TaxonomyReference>("work-formats"),
      getTaxonomy<Language>("languages"),
    ])
      .then(([nextCategories, nextFormats, nextLanguages]) => {
        setCategories(nextCategories);
        setFormats(nextFormats);
        setLanguages(nextLanguages);
      })
      .catch(() =>
        setMessage(
          tr(
            "Could not load the project form options. Refresh the page and try again.",
            "Не удалось загрузить параметры формы. Обновите страницу и попробуйте снова.",
          ),
        ),
      );
  }, [tr]);

  useEffect(() => {
    const sections = projectSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const updateActiveSection = () => {
      const nextSection = sections.reduce<ProjectSectionId>(
        (current, section) =>
          section.getBoundingClientRect().top <= 140
            ? (section.id as ProjectSectionId)
            : current,
        projectSectionIds[0],
      );
      setActiveSection(nextSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  function updateRole(index: number, name: keyof RoleDraft, value: string) {
    setRoles((current) =>
      current.map((role, roleIndex) =>
        roleIndex === index ? { ...role, [name]: value } : role,
      ),
    );
  }

  async function save(sendToModeration: boolean) {
    setMessage("");
    if (
      !form.title ||
      !form.shortDescription ||
      !form.description ||
      !form.category ||
      !form.workFormat ||
      !form.language
    ) {
      setMessage(
        tr(
          "Fill in the title, descriptions, category, format and working language before saving.",
          "Перед сохранением укажите название, описание, категорию, формат и рабочий язык.",
        ),
      );
      return;
    }
    const validRoles = roles.filter((role) => role.title.trim());
    if (sendToModeration && validRoles.length === 0) {
      setMessage(
        tr(
          "Add at least one open role before requesting moderation.",
          "Добавьте хотя бы одну открытую роль перед отправкой на модерацию.",
        ),
      );
      return;
    }

    setSubmitting(sendToModeration ? "moderation" : "draft");
    try {
      const project = await apiFetch<{ id: string }>("/v1/me/projects/", {
        method: "POST",
        body: {
          slug: `project-${Date.now()}`,
          title: form.title,
          short_description: form.shortDescription,
          description: form.description,
          category: form.category,
          stage: form.stage,
          scope: form.scope,
          work_format: form.workFormat,
          working_language: form.language,
          problem_statement: form.problem,
          goal_statement: form.goal,
          expected_outcome: form.outcome,
          timeline_text: form.timeline,
          starts_on: form.startsOn || null,
          ends_on: form.endsOn || null,
          application_deadline: form.deadline || null,
        },
      });
      await Promise.all(
        validRoles.map((role, index) =>
          apiFetch(`/v1/me/projects/${project.id}/roles/`, {
            method: "POST",
            body: {
              title: role.title,
              first_responsibility: role.firstResponsibility,
              commitment_hours_per_week: role.commitment
                ? Number(role.commitment)
                : null,
              seats_total: Number(role.seats) || 1,
              status: "open",
              sort_order: index,
            },
          }),
        ),
      );
      if (sendToModeration) {
        await apiFetch("/v1/moderation/submit/", {
          method: "POST",
          body: {
            target_type: "project",
            target_id: project.id,
            reason_code: "publication_review",
          },
        });
        setMessage(
          tr(
            "The project draft and its roles were saved and sent for manual moderation.",
            "Черновик проекта и роли сохранены и отправлены на ручную модерацию.",
          ),
        );
      } else {
        setMessage(
          tr(
            "The project draft and its roles were saved. You can return later to request moderation.",
            "Черновик проекта и роли сохранены. Вы сможете отправить их на модерацию позже.",
          ),
        );
      }
      trackAnalytics("project created", {
        role_count: validRoles.length,
        submission: sendToModeration ? "moderation" : "draft",
      });
    } catch (error) {
      const detail =
        error instanceof ApiError && error.status === 403
          ? tr(
              "Sign in before creating a project.",
              "Войдите в аккаунт, чтобы создать проект.",
            )
          : tr(
              "The project could not be saved. Check the form values and try again.",
              "Не удалось сохранить проект. Проверьте данные формы и попробуйте снова.",
            );
      setMessage(detail);
    } finally {
      setSubmitting(undefined);
    }
  }

  const basicsComplete = Boolean(
    form.title && form.category && form.language && form.workFormat,
  );
  const briefComplete = Boolean(form.shortDescription && form.description);
  const rolesComplete = roles.some((role) => role.title.trim());
  const datesComplete = Boolean(
    form.startsOn ||
      form.endsOn ||
      form.deadline ||
      form.timeline ||
      form.outcome,
  );
  const readyToPublish = basicsComplete && briefComplete && rolesComplete;
  const sectionItems: Array<{
    id: ProjectSectionId;
    label: string;
    complete: boolean;
  }> = [
    {
      id: "basics",
      label: tr("Basic information", "Основная информация"),
      complete: basicsComplete,
    },
    {
      id: "project-brief",
      label: tr("Project brief", "Описание проекта"),
      complete: briefComplete,
    },
    {
      id: "team-and-roles",
      label: tr("Team & roles", "Команда и роли"),
      complete: rolesComplete,
    },
    {
      id: "dates-and-format",
      label: tr("Dates & outcome", "Сроки и результат"),
      complete: datesComplete,
    },
    {
      id: "review-and-publish",
      label: tr("Review & publish", "Проверка и публикация"),
      complete: readyToPublish,
    },
  ];
  const completedSections = sectionItems.filter((item) => item.complete).length;

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1200px] px-6 py-7 md:py-9">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save(false);
          }}
          className="min-w-0"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-balance font-geist text-[28px] font-[650]">
                {tr("Create a new project", "Создать новый проект")}
              </h1>
              <p className="mt-2 max-w-[680px] text-pretty font-inter text-sm text-[var(--color-muted)]">
                {tr(
                  "Create a draft first, then submit it for manual moderation when it is ready.",
                  "Сначала сохраните черновик, а когда всё будет готово — отправьте его на ручную модерацию.",
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={Boolean(submitting)}
              >
                <Save size={16} />
                {submitting === "draft"
                  ? tr("Saving…", "Сохранение…")
                  : tr("Save draft", "Сохранить черновик")}
              </Button>
              <Button
                type="button"
                disabled={Boolean(submitting)}
                onClick={() => void save(true)}
              >
                <Send size={16} />
                {submitting === "moderation"
                  ? tr("Submitting…", "Отправка…")
                  : tr("Review & publish", "Проверить и опубликовать")}
              </Button>
            </div>
          </div>
          {message ? (
            <p className="mt-5 rounded-lg bg-[var(--color-soft-blue)] p-4 font-inter text-sm font-medium text-[var(--color-primary)]">
              {message}
            </p>
          ) : null}
          {!message ? (
            <p className="mt-5 rounded-lg bg-[var(--color-soft-blue)] p-4 font-inter text-sm font-medium text-[var(--color-primary)]">
              {tr(
                "This project will be owned by your account. Creating it keeps your talent profile active and adds project leadership.",
                "Проект будет принадлежать вашему аккаунту. Его создание сохраняет ваш профиль таланта активным и добавляет опыт руководства проектом.",
              )}
            </p>
          ) : null}
          <div className="mt-6 grid min-w-0 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="min-w-0 lg:sticky lg:top-[88px] lg:max-h-[calc(100dvh-104px)] lg:overflow-y-auto">
              <nav
                aria-label={tr("Project sections", "Разделы проекта")}
                className="rounded-[10px] border border-[var(--color-border)] bg-white p-3"
              >
                <div className="border-b border-[var(--color-border)] px-2 pb-3 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-geist text-sm font-[650]">
                      {tr("Project sections", "Разделы проекта")}
                    </p>
                    <span className="font-inter text-[11px] font-semibold text-[var(--color-muted)]">
                      {completedSections}/{sectionItems.length}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100"
                    role="progressbar"
                    aria-label={tr(
                      "Project completion",
                      "Заполнение проекта",
                    )}
                    aria-valuemin={0}
                    aria-valuemax={sectionItems.length}
                    aria-valuenow={completedSections}
                  >
                    <span
                      className="block h-full rounded-full bg-[var(--color-green)]"
                      style={{
                        width: `${(completedSections / sectionItems.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <ul className="mt-2 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
                  {sectionItems.map((item) => {
                    const active = activeSection === item.id;
                    return (
                      <li key={item.id} className="shrink-0 lg:shrink">
                        <a
                          href={`#${item.id}`}
                          aria-current={active ? "location" : undefined}
                          onClick={() => setActiveSection(item.id)}
                          className={`flex min-w-[190px] items-center gap-2.5 rounded-md px-2.5 py-2 font-inter text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 lg:min-w-0 ${
                            active
                              ? "bg-[var(--color-soft-blue)] text-[var(--color-primary)]"
                              : item.complete
                                ? "bg-[var(--color-soft-green)] text-emerald-800 hover:bg-emerald-100"
                                : "text-[var(--color-muted)] hover:bg-neutral-100 hover:text-[var(--color-ink)]"
                          }`}
                        >
                          {item.complete ? (
                            <CheckCircle2
                              aria-hidden="true"
                              size={16}
                              className={
                                active
                                  ? "text-[var(--color-primary)]"
                                  : "text-[var(--color-green)]"
                              }
                            />
                          ) : (
                            <Circle
                              aria-hidden="true"
                              size={16}
                              className="text-neutral-300"
                            />
                          )}
                          <span>{item.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            <div className="min-w-0 space-y-[18px]">
            <FormCard id="basics">
              <h2 className="text-balance font-geist text-lg font-[650]">
                {tr("Project basics", "Основная информация")}
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label={tr("Project name", "Название проекта")}>
                  <input
                    required
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    className={inputClass}
                    placeholder={tr(
                      "e.g. Digital Career Map",
                      "Например, «Карта цифровой карьеры»",
                    )}
                  />
                </Field>
                <Field label={tr("Category", "Категория")}>
                  <select
                    required
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">
                      {tr("Choose a category", "Выберите категорию")}
                    </option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {taxonomyName(item)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("Scope", "Масштаб")}>
                  <select
                    value={form.scope}
                    onChange={(event) => update("scope", event.target.value)}
                    className={inputClass}
                  >
                    <option value="local">{tr("Local", "Локальный")}</option>
                    <option value="national">
                      {tr("National", "Национальный")}
                    </option>
                    <option value="international">
                      {tr("International", "Международный")}
                    </option>
                  </select>
                </Field>
                <Field label={tr("Current stage", "Текущий этап")}>
                  <select
                    value={form.stage}
                    onChange={(event) => update("stage", event.target.value)}
                    className={inputClass}
                  >
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
                </Field>
                <Field label={tr("Working language", "Рабочий язык")}>
                  <select
                    required
                    value={form.language}
                    onChange={(event) => update("language", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">
                      {tr("Choose a language", "Выберите язык")}
                    </option>
                    {languages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {taxonomyName(item)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("Work format", "Формат работы")}>
                  <select
                    required
                    value={form.workFormat}
                    onChange={(event) =>
                      update("workFormat", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {tr("Choose a format", "Выберите формат")}
                    </option>
                    {formats.map((item) => (
                      <option key={item.id} value={item.id}>
                        {taxonomyName(item)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </FormCard>
            <FormCard id="project-brief">
              <h2 className="text-balance font-geist text-lg font-[650]">
                {tr("Project brief", "Описание проекта")}
              </h2>
              <Field label={tr("Short description", "Краткое описание")}>
                <textarea
                  required
                  value={form.shortDescription}
                  onChange={(event) =>
                    update("shortDescription", event.target.value)
                  }
                  className="mt-2 min-h-[86px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)]"
                  placeholder={tr(
                    "Describe what you are building and why it matters.",
                    "Расскажите, что вы создаёте и почему это важно.",
                  )}
                />
              </Field>
              <Field label={tr("Full description", "Полное описание")}>
                <textarea
                  required
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  className="mt-4 min-h-[120px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)]"
                  placeholder={tr(
                    "Give potential contributors enough context to decide whether to join.",
                    "Дайте будущим участникам достаточно контекста, чтобы принять решение об участии.",
                  )}
                />
              </Field>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label={tr("Problem to solve", "Решаемая проблема")}>
                  <textarea
                    value={form.problem}
                    onChange={(event) => update("problem", event.target.value)}
                    className="mt-2 min-h-[80px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)]"
                    placeholder={tr(
                      "What needs to change?",
                      "Что необходимо изменить?",
                    )}
                  />
                </Field>
                <Field label={tr("Project goal", "Цель проекта")}>
                  <textarea
                    value={form.goal}
                    onChange={(event) => update("goal", event.target.value)}
                    className="mt-2 min-h-[80px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)]"
                    placeholder={tr(
                      "What will success look like?",
                      "Как будет выглядеть успех?",
                    )}
                  />
                </Field>
              </div>
            </FormCard>
            <FormCard id="team-and-roles">
              <h2 className="text-balance font-geist text-lg font-[650]">
                {tr("Team & open roles", "Команда и открытые роли")}
              </h2>
              <p className="mt-2 font-inter text-[13px] text-[var(--color-muted)]">
                {tr(
                  "Roles are saved with the draft. At least one is required for moderation.",
                  "Роли сохраняются вместе с черновиком. Для модерации нужна хотя бы одна роль.",
                )}
              </p>
              {roles.map((role, index) => (
                <div
                  key={index}
                  className="mt-5 rounded-[9px] bg-neutral-100 p-[18px]"
                >
                  <p className="font-geist-mono text-xs font-bold text-[var(--color-primary)]">
                    {String(index + 1).padStart(2, "0")}{" "}
                    <span className="ml-3 font-inter text-[13px] text-[var(--color-ink)]">
                      {tr("Open role", "Открытая роль")}
                    </span>
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label={tr("Role title", "Название роли")}>
                      <input
                        value={role.title}
                        onChange={(event) =>
                          updateRole(index, "title", event.target.value)
                        }
                        className={inputClass}
                        placeholder={tr(
                          "e.g. UX designer",
                          "Например, UX-дизайнер",
                        )}
                      />
                    </Field>
                    <Field
                      label={tr(
                        "Commitment (hours per week)",
                        "Занятость (часов в неделю)",
                      )}
                    >
                      <input
                        value={role.commitment}
                        onChange={(event) =>
                          updateRole(index, "commitment", event.target.value)
                        }
                        className={inputClass}
                        type="number"
                        min="1"
                        placeholder="e.g. 6"
                      />
                    </Field>
                    <Field label={tr("First responsibility", "Первая задача")}>
                      <input
                        value={role.firstResponsibility}
                        onChange={(event) =>
                          updateRole(
                            index,
                            "firstResponsibility",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder={tr(
                          "Shape the prototype journey",
                          "Продумать путь пользователя в прототипе",
                        )}
                      />
                    </Field>
                    <Field label={tr("Open seats", "Количество мест")}>
                      <input
                        value={role.seats}
                        onChange={(event) =>
                          updateRole(index, "seats", event.target.value)
                        }
                        className={inputClass}
                        type="number"
                        min="1"
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setRoles((current) => [...current, emptyRole()])}
              >
                <Plus size={14} />
                {tr("Add another role", "Добавить ещё одну роль")}
              </Button>
            </FormCard>
            <FormCard id="dates-and-format">
              <h2 className="text-balance font-geist text-lg font-[650]">
                {tr("Dates & publishing", "Сроки и публикация")}
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Field label={tr("Start date", "Дата начала")}>
                  <input
                    value={form.startsOn}
                    onChange={(event) => update("startsOn", event.target.value)}
                    className={inputClass}
                    type="date"
                  />
                </Field>
                <Field label={tr("End date", "Дата окончания")}>
                  <input
                    value={form.endsOn}
                    onChange={(event) => update("endsOn", event.target.value)}
                    className={inputClass}
                    type="date"
                  />
                </Field>
                <Field label={tr("Application deadline", "Срок подачи заявок")}>
                  <input
                    value={form.deadline}
                    onChange={(event) => update("deadline", event.target.value)}
                    className={inputClass}
                    type="date"
                  />
                </Field>
              </div>
              <Field label={tr("Project timeline", "Этапы проекта")}>
                <input
                  value={form.timeline}
                  onChange={(event) => update("timeline", event.target.value)}
                  className={inputClass}
                  placeholder={tr(
                    "Discovery → Prototype → Partner pilots",
                    "Исследование → Прототип → Пилоты с партнёрами",
                  )}
                />
              </Field>
              <Field label={tr("Expected outcome", "Ожидаемый результат")}>
                <textarea
                  value={form.outcome}
                  onChange={(event) => update("outcome", event.target.value)}
                  className="mt-2 min-h-[80px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)]"
                  placeholder={tr(
                    "What should this project achieve?",
                    "Какого результата должен достичь проект?",
                  )}
                />
              </Field>
            </FormCard>
            <FormCard id="review-and-publish">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-[620px]">
                  <h2 className="text-balance font-geist text-lg font-[650]">
                    {tr("Review & publish", "Проверка и публикация")}
                  </h2>
                  <p className="mt-2 text-pretty font-inter text-[13px] text-[var(--color-muted)]">
                {tr(
                  "“Review & publish” saves the project and submits it for manual moderation. It will appear in the public catalogue only after approval.",
                  "«Проверить и опубликовать» сохраняет проект и отправляет его на ручную модерацию. В открытом каталоге он появится только после одобрения.",
                )}
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={Boolean(submitting)}
                  onClick={() => void save(true)}
                >
                  <Send size={16} />
                  {submitting === "moderation"
                    ? tr("Submitting…", "Отправка…")
                    : tr("Submit for review", "Отправить на проверку")}
                </Button>
              </div>
            </FormCard>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
