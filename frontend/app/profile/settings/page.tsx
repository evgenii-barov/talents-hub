"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Eye,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { ProfileBreadcrumbs } from "@/components/profile/profile-breadcrumbs";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  Language,
  Profile,
  ProfileExperience,
  TaxonomyReference,
} from "@/lib/contracts";
import {
  createEducation,
  createExperience,
  createLanguage,
  createSkill,
  deleteEducation,
  deleteExperience,
  deleteLanguage,
  deleteSkill,
  updateExperience,
  updateLanguage,
  updateSkill,
} from "@/lib/profile-editor";
import { notifyProfileUpdated } from "@/lib/profile-events";
import { getTaxonomy } from "@/lib/taxonomy";

type ProfileForm = {
  displayName: string;
  headline: string;
  bio: string;
  availability: string;
  availabilityNote: string;
  remotePreference: string;
  timezone: string;
};
type ExperienceForm = {
  organization_name: string;
  title: string;
  location_text: string;
  work_format: string;
  started_on: string;
  ended_on: string;
  is_current: boolean;
  description: string;
};
type EducationForm = {
  institution_name: string;
  degree: string;
  field_of_study: string;
  education_level: string;
  started_on: string;
  ended_on: string;
  credential_url: string;
};

const emptyProfile: ProfileForm = {
  displayName: "",
  headline: "",
  bio: "",
  availability: "unavailable",
  availabilityNote: "",
  remotePreference: "",
  timezone: "Europe/Moscow",
};
const emptyExperience: ExperienceForm = {
  organization_name: "",
  title: "",
  location_text: "",
  work_format: "",
  started_on: "",
  ended_on: "",
  is_current: false,
  description: "",
};
const emptyEducation: EducationForm = {
  institution_name: "",
  degree: "",
  field_of_study: "",
  education_level: "",
  started_on: "",
  ended_on: "",
  credential_url: "",
};
const inputClass =
  "mt-2 h-[42px] w-full rounded-md border border-[var(--color-border)] bg-white px-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100";

const profileSectionIds = [
  "basics",
  "participation",
  "skills",
  "languages",
  "experience",
  "education",
] as const;
type ProfileSectionId = (typeof profileSectionIds)[number];

function Card({ children, id }: { children: React.ReactNode; id?: string }) {
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

export default function ProfileSettingsPage() {
  const { formatDate, taxonomyName, tr } = useLocale();
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [profile, setProfile] = useState<Profile>();
  const [formats, setFormats] = useState<TaxonomyReference[]>([]);
  const [allSkills, setAllSkills] = useState<TaxonomyReference[]>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [educationLevels, setEducationLevels] = useState<
    TaxonomyReference[]
  >([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [proficiency, setProficiency] = useState("b2");
  const [experience, setExperience] = useState<ExperienceForm>(emptyExperience);
  const [education, setEducation] =
    useState<EducationForm>(emptyEducation);
  const [editingExperienceId, setEditingExperienceId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] =
    useState<ProfileSectionId>("basics");

  const loadProfile = useCallback(async () => {
    try {
      const nextProfile = await apiFetch<Profile>("/v1/me/profile/");
      setProfile(nextProfile);
      setForm({
        displayName: nextProfile.display_name,
        headline: nextProfile.headline,
        bio: nextProfile.bio,
        availability: nextProfile.availability,
        availabilityNote: nextProfile.availability_note,
        remotePreference: nextProfile.remote_preference?.id || "",
        timezone: nextProfile.timezone,
      });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404))
        setMessage(
          tr(
            "Sign in before editing your profile.",
            "Войдите, чтобы редактировать профиль.",
          ),
        );
    }
  }, [tr]);

  useEffect(() => {
    void Promise.all([
      getTaxonomy<TaxonomyReference>("work-formats"),
      getTaxonomy<TaxonomyReference>("skills"),
      getTaxonomy<Language>("languages"),
      getTaxonomy<TaxonomyReference>("education-levels"),
    ])
      .then(
        ([nextFormats, nextSkills, nextLanguages, nextEducationLevels]) => {
        setFormats(nextFormats);
        setAllSkills(nextSkills);
        setAllLanguages(nextLanguages);
          setEducationLevels(nextEducationLevels);
        },
      )
      .catch(() =>
        setMessage(
          tr(
            "Could not load all profile options.",
            "Не удалось загрузить все параметры профиля.",
          ),
        ),
      );
    void loadProfile().finally(() => setLoading(false));
  }, [loadProfile, tr]);

  useEffect(() => {
    const sections = profileSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const updateActiveSection = () => {
      const nextSection = sections.reduce<ProfileSectionId>(
        (current, section) =>
          section.getBoundingClientRect().top <= 140
            ? (section.id as ProfileSectionId)
            : current,
        profileSectionIds[0],
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

  function updateForm(name: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  function updateExperienceForm(
    name: keyof ExperienceForm,
    value: string | boolean,
  ) {
    setExperience((current) => ({ ...current, [name]: value }));
  }
  function requireProfile(): boolean {
    if (profile) return true;
    setMessage(
      tr(
        "Save your profile basics before adding these details.",
        "Сохраните основную информацию профиля, прежде чем добавлять эти данные.",
      ),
    );
    return false;
  }
  async function mutate(
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    try {
      await action();
      await loadProfile();
      setMessage(successMessage);
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr(
              "Could not save this change.",
              "Не удалось сохранить изменение.",
            ),
      );
    }
  }

  async function saveBasics(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.displayName.trim()) {
      setMessage(
        tr(
          "Enter a display name before saving.",
          "Перед сохранением укажите отображаемое имя.",
        ),
      );
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const body = {
        slug: profile?.slug || `member-${Date.now()}`,
        display_name: form.displayName,
        headline: form.headline,
        bio: form.bio,
        availability: form.availability,
        availability_note: form.availabilityNote,
        remote_preference: form.remotePreference || null,
        timezone: form.timezone,
      };
      const nextProfile = await apiFetch<Profile>("/v1/me/profile/", {
        method: profile ? "PATCH" : "POST",
        body,
      });
      setProfile(nextProfile);
      notifyProfileUpdated(nextProfile);
      setMessage(
        profile
          ? tr(
              "Profile basics saved.",
              "Основная информация профиля сохранена.",
            )
          : tr(
              "Profile created. Add skills, languages and experience below.",
              "Профиль создан. Ниже можно добавить навыки, языки и опыт.",
            ),
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 403
          ? tr(
              "Sign in before editing your profile.",
              "Войдите, чтобы редактировать профиль.",
            )
          : tr("Could not save your profile.", "Не удалось сохранить профиль."),
      );
    } finally {
      setSaving(false);
    }
  }

  function addSkill() {
    if (requireProfile() && selectedSkill)
      void mutate(
        () =>
          createSkill({
            skill: selectedSkill,
            level: skillLevel,
            is_primary: profile?.skills.length === 0,
          }),
        tr("Skill added.", "Навык добавлен."),
      ).then(() => setSelectedSkill(""));
  }
  function addLanguage() {
    if (requireProfile() && selectedLanguage)
      void mutate(
        () =>
          createLanguage({
            language: selectedLanguage,
            proficiency,
            is_primary: profile?.languages.length === 0,
          }),
        tr("Language added.", "Язык добавлен."),
      ).then(() => setSelectedLanguage(""));
  }
  function editExperience(item: ProfileExperience) {
    setEditingExperienceId(item.id);
    setExperience({
      organization_name: item.organization_name,
      title: item.title,
      location_text: item.location_text,
      work_format: item.work_format?.id || "",
      started_on: item.started_on,
      ended_on: item.ended_on || "",
      is_current: item.is_current,
      description: item.description,
    });
  }
  function saveExperience() {
    if (
      !requireProfile() ||
      !experience.organization_name ||
      !experience.title ||
      !experience.started_on
    ) {
      setMessage(
        tr(
          "Enter organisation, title and start date.",
          "Укажите организацию, роль и дату начала.",
        ),
      );
      return;
    }
    const input = {
      ...experience,
      work_format: experience.work_format || null,
      ended_on: experience.ended_on || null,
    };
    const action = editingExperienceId
      ? () => updateExperience(editingExperienceId, input)
      : () => createExperience(input);
    void mutate(
      action,
      editingExperienceId
        ? tr("Experience updated.", "Опыт обновлён.")
        : tr("Experience added.", "Опыт добавлен."),
    ).then(() => {
      setExperience(emptyExperience);
      setEditingExperienceId(undefined);
    });
  }

  async function addEducation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireProfile()) return;

    try {
      await createEducation({
        ...education,
        education_level: education.education_level || null,
        ended_on: education.ended_on || null,
        credential_url: education.credential_url || "",
      });
      setEducation(emptyEducation);
      await loadProfile();
      setMessage(tr("Education added.", "Образование добавлено."));
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr(
              "Could not add education.",
              "Не удалось добавить образование.",
            ),
      );
    }
  }

  const sectionItems: Array<{
    id: ProfileSectionId;
    label: string;
    complete: boolean;
  }> = [
    {
      id: "basics",
      label: tr("Basic information", "Основная информация"),
      complete: Boolean(
        profile?.display_name.trim() &&
          profile.headline.trim() &&
          profile.bio.trim(),
      ),
    },
    {
      id: "participation",
      label: tr("Participation", "Участие"),
      complete: Boolean(
        profile?.availability &&
          profile.remote_preference &&
          profile.timezone.trim(),
      ),
    },
    {
      id: "skills",
      label: tr("Skills", "Навыки"),
      complete: Boolean(profile?.skills.length),
    },
    {
      id: "languages",
      label: tr("Languages", "Языки"),
      complete: Boolean(profile?.languages.length),
    },
    {
      id: "experience",
      label: tr("Work experience", "Опыт работы"),
      complete: Boolean(profile?.experiences.length),
    },
    {
      id: "education",
      label: tr("Education", "Образование"),
      complete: Boolean(profile?.education.length),
    },
  ];
  const completedSections = sectionItems.filter((item) => item.complete).length;

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1200px] px-6 py-7 md:py-9">
        <ProfileBreadcrumbs
          items={[
            { label: tr("Overview", "Обзор"), href: "/" },
            { label: tr("My profile", "Мой профиль"), href: "/profile" },
            { label: tr("Editing", "Редактирование") },
          ]}
        />

        <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="font-geist text-[28px] font-[650] tracking-[-0.02em]">
              {tr("Profile settings", "Настройки профиля")}
            </h1>
            <p className="mt-2 max-w-[680px] font-inter text-sm text-[var(--color-muted)]">
              {tr(
                "Manage the information collaborators use to find and understand your work.",
                "Управляйте информацией, по которой другие участники находят вас и знакомятся с вашей работой.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/profile">
                <Eye size={16} />
                {tr("View profile", "Просмотреть профиль")}
              </Link>
            </Button>
            <Button
              type="submit"
              form="profile-basics-form"
              disabled={loading || saving}
            >
              <Save size={16} />
              {saving
                ? tr("Saving…", "Сохранение…")
                : tr("Save basics", "Сохранить основное")}
            </Button>
          </div>
        </div>

        {message ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--color-soft-blue)] p-4">
            <p className="font-inter text-sm font-medium text-[var(--color-primary)]">
              {message}
            </p>
            {profile ? (
              <Link
                href="/profile"
                className="font-inter text-xs font-bold text-[var(--color-primary)] underline-offset-4 hover:underline"
              >
                {tr("Finish editing", "Завершить редактирование")}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[88px] lg:max-h-[calc(100dvh-104px)] lg:overflow-y-auto">
            <nav
              aria-label={tr("Profile sections", "Разделы профиля")}
              className="rounded-[10px] border border-[var(--color-border)] bg-white p-3"
            >
              <div className="border-b border-[var(--color-border)] px-2 pb-3 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-geist text-sm font-[650]">
                    {tr("Profile sections", "Разделы профиля")}
                  </p>
                  <span className="font-inter text-[11px] font-semibold text-[var(--color-muted)]">
                    {completedSections}/{sectionItems.length}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100"
                  role="progressbar"
                  aria-label={tr("Profile completion", "Заполнение профиля")}
                  aria-valuemin={0}
                  aria-valuemax={sectionItems.length}
                  aria-valuenow={completedSections}
                >
                  <span
                    className="block h-full rounded-full bg-[var(--color-green)] transition-[width]"
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
                            className={active ? "text-[var(--color-primary)]" : "text-[var(--color-green)]"}
                          />
                        ) : (
                          <Circle aria-hidden="true" size={16} className="text-neutral-300" />
                        )}
                        <span>{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            <form id="profile-basics-form" onSubmit={saveBasics}>
              <div className="space-y-[18px]">
            <Card id="basics">
              <h2 className="font-geist text-lg font-[650]">
                {tr("Identity and summary", "Основная информация")}
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label={tr("Display name", "Отображаемое имя")}>
                  <input
                    required
                    value={form.displayName}
                    onChange={(event) =>
                      updateForm("displayName", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={tr(
                    "Professional headline",
                    "Профессиональный заголовок",
                  )}
                >
                  <input
                    value={form.headline}
                    onChange={(event) =>
                      updateForm("headline", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label={tr("About you", "О себе")}>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateForm("bio", event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal leading-[1.45] outline-none focus:border-[var(--color-primary)]"
                />
              </Field>
            </Card>
            <Card id="participation">
              <h2 className="font-geist text-lg font-[650]">
                {tr("Participation", "Участие")}
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label={tr("Availability", "Доступность")}>
                  <select
                    value={form.availability}
                    onChange={(event) =>
                      updateForm("availability", event.target.value)
                    }
                    className={inputClass}
                  >
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
                </Field>
                <Field label={tr("Work format", "Формат работы")}>
                  <select
                    value={form.remotePreference}
                    onChange={(event) =>
                      updateForm("remotePreference", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">{tr("Not specified", "Не указан")}</option>
                    {formats.map((format) => (
                      <option key={format.id} value={format.id}>
                        {taxonomyName(format)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("Time zone", "Часовой пояс")}>
                  <input
                    value={form.timezone}
                    onChange={(event) =>
                      updateForm("timezone", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field
                label={tr("Availability note", "Комментарий о доступности")}
              >
                <input
                  value={form.availabilityNote}
                  onChange={(event) =>
                    updateForm("availabilityNote", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
            </Card>
              </div>
            </form>
            <div className="mt-[18px] space-y-[18px]">
          <Card id="skills">
            <h2 className="font-geist text-lg font-[650]">
              {tr("Skills", "Навыки")}
            </h2>
            <div className="mt-4 space-y-2">
              {profile?.skills.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-neutral-100 p-3"
                >
                  <span className="min-w-[140px] font-inter text-sm font-bold">
                    {taxonomyName(item.skill)}
                  </span>
                  <select
                    defaultValue={item.level || ""}
                    onChange={(event) =>
                      void mutate(
                        () =>
                          updateSkill(item.id, { level: event.target.value }),
                        tr("Skill updated.", "Навык обновлён."),
                      )
                    }
                    className="h-8 rounded border border-[var(--color-border)] bg-white px-2 font-inter text-xs"
                  >
                    <option value="">{tr("No level", "Без уровня")}</option>
                    <option value="beginner">
                      {tr("Beginner", "Начальный")}
                    </option>
                    <option value="intermediate">
                      {tr("Intermediate", "Средний")}
                    </option>
                    <option value="advanced">
                      {tr("Advanced", "Продвинутый")}
                    </option>
                    <option value="expert">{tr("Expert", "Экспертный")}</option>
                  </select>
                  {item.is_primary ? (
                    <span className="font-inter text-xs font-bold text-[var(--color-primary)]">
                      {tr("Primary", "Основной")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void mutate(
                          () => updateSkill(item.id, { is_primary: true }),
                          tr(
                            "Primary skill updated.",
                            "Основной навык обновлён.",
                          ),
                        )
                      }
                      className="font-inter text-xs font-bold text-[var(--color-primary)]"
                    >
                      {tr("Make primary", "Сделать основным")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      void mutate(
                        () => deleteSkill(item.id),
                        tr("Skill removed.", "Навык удалён."),
                      )
                    }
                    className="ml-auto text-[var(--color-muted)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {profile?.skills.length === 0 ? (
                <p className="font-inter text-sm text-[var(--color-muted)]">
                  {tr("No skills yet.", "Навыков пока нет.")}
                </p>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <select
                value={selectedSkill}
                onChange={(event) => setSelectedSkill(event.target.value)}
                className={inputClass}
              >
                <option value="">
                  {tr("Choose a skill", "Выберите навык")}
                </option>
                {allSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {taxonomyName(skill)}
                  </option>
                ))}
              </select>
              <select
                value={skillLevel}
                onChange={(event) => setSkillLevel(event.target.value)}
                className={inputClass}
              >
                <option value="beginner">{tr("Beginner", "Начальный")}</option>
                <option value="intermediate">
                  {tr("Intermediate", "Средний")}
                </option>
                <option value="advanced">
                  {tr("Advanced", "Продвинутый")}
                </option>
                <option value="expert">{tr("Expert", "Экспертный")}</option>
              </select>
              <Button
                type="button"
                className="mt-2"
                variant="outline"
                onClick={addSkill}
              >
                <Plus size={15} />
                {tr("Add", "Добавить")}
              </Button>
            </div>
          </Card>
          <Card id="languages">
            <h2 className="font-geist text-lg font-[650]">
              {tr("Languages", "Языки")}
            </h2>
            <div className="mt-4 space-y-2">
              {profile?.languages.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-neutral-100 p-3"
                >
                  <span className="min-w-[140px] font-inter text-sm font-bold">
                    {taxonomyName(item.language)}
                  </span>
                  <select
                    defaultValue={item.proficiency}
                    onChange={(event) =>
                      void mutate(
                        () =>
                          updateLanguage(item.id, {
                            proficiency: event.target.value,
                          }),
                        tr("Language updated.", "Язык обновлён."),
                      )
                    }
                    className="h-8 rounded border border-[var(--color-border)] bg-white px-2 font-inter text-xs"
                  >
                    <option value="native">{tr("Native", "Родной")}</option>
                    <option value="a1">A1</option>
                    <option value="a2">A2</option>
                    <option value="b1">B1</option>
                    <option value="b2">B2</option>
                    <option value="c1">C1</option>
                    <option value="c2">C2</option>
                  </select>
                  {item.is_primary ? (
                    <span className="font-inter text-xs font-bold text-[var(--color-primary)]">
                      {tr("Primary", "Основной")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void mutate(
                          () => updateLanguage(item.id, { is_primary: true }),
                          tr(
                            "Primary language updated.",
                            "Основной язык обновлён.",
                          ),
                        )
                      }
                      className="font-inter text-xs font-bold text-[var(--color-primary)]"
                    >
                      {tr("Make primary", "Сделать основным")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      void mutate(
                        () => deleteLanguage(item.id),
                        tr("Language removed.", "Язык удалён."),
                      )
                    }
                    className="ml-auto text-[var(--color-muted)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {profile?.languages.length === 0 ? (
                <p className="font-inter text-sm text-[var(--color-muted)]">
                  {tr("No languages yet.", "Языков пока нет.")}
                </p>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className={inputClass}
              >
                <option value="">
                  {tr("Choose a language", "Выберите язык")}
                </option>
                {allLanguages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {taxonomyName(language)}
                  </option>
                ))}
              </select>
              <select
                value={proficiency}
                onChange={(event) => setProficiency(event.target.value)}
                className={inputClass}
              >
                <option value="native">{tr("Native", "Родной")}</option>
                <option value="a1">A1</option>
                <option value="a2">A2</option>
                <option value="b1">B1</option>
                <option value="b2">B2</option>
                <option value="c1">C1</option>
                <option value="c2">C2</option>
              </select>
              <Button
                type="button"
                className="mt-2"
                variant="outline"
                onClick={addLanguage}
              >
                <Plus size={15} />
                {tr("Add", "Добавить")}
              </Button>
            </div>
          </Card>
          <Card id="experience">
            <div className="flex items-center justify-between">
              <h2 className="font-geist text-lg font-[650]">
                {tr("Work experience", "Опыт работы")}
              </h2>
              {editingExperienceId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingExperienceId(undefined);
                    setExperience(emptyExperience);
                  }}
                  className="font-inter text-xs font-bold text-[var(--color-primary)]"
                >
                  {tr("Cancel edit", "Отменить редактирование")}
                </button>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {profile?.experiences.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-lg bg-neutral-100 p-4"
                >
                  <div>
                    <p className="font-inter text-sm font-bold">{item.title}</p>
                    <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                      {item.organization_name} · {formatDate(item.started_on)}
                      {item.ended_on
                        ? ` – ${formatDate(item.ended_on)}`
                        : item.is_current
                          ? tr(" – present", " – настоящее время")
                          : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editExperience(item)}
                      className="text-[var(--color-primary)]"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void mutate(
                          () => deleteExperience(item.id),
                          tr("Experience removed.", "Опыт удалён."),
                        )
                      }
                      className="text-[var(--color-muted)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {profile?.experiences.length === 0 ? (
                <p className="font-inter text-sm text-[var(--color-muted)]">
                  {tr("No experience yet.", "Опыта пока нет.")}
                </p>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={tr("Organisation", "Организация")}>
                <input
                  value={experience.organization_name}
                  onChange={(event) =>
                    updateExperienceForm(
                      "organization_name",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("Role", "Роль")}>
                <input
                  value={experience.title}
                  onChange={(event) =>
                    updateExperienceForm("title", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("Start date", "Дата начала")}>
                <input
                  type="date"
                  value={experience.started_on}
                  onChange={(event) =>
                    updateExperienceForm("started_on", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("End date", "Дата окончания")}>
                <input
                  type="date"
                  disabled={experience.is_current}
                  value={experience.ended_on}
                  onChange={(event) =>
                    updateExperienceForm("ended_on", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("Work format", "Формат работы")}>
                <select
                  value={experience.work_format}
                  onChange={(event) =>
                    updateExperienceForm("work_format", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">{tr("Not specified", "Не указан")}</option>
                  {formats.map((format) => (
                    <option key={format.id} value={format.id}>
                      {taxonomyName(format)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tr("Location", "Местоположение")}>
                <input
                  value={experience.location_text}
                  onChange={(event) =>
                    updateExperienceForm("location_text", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 font-inter text-sm font-semibold">
              <input
                checked={experience.is_current}
                onChange={(event) =>
                  updateExperienceForm("is_current", event.target.checked)
                }
                type="checkbox"
                className="size-4 accent-[var(--color-primary)]"
              />
              {tr("This is my current role", "Это моя текущая роль")}
            </label>
            <Field label={tr("Description", "Описание")}>
              <textarea
                value={experience.description}
                onChange={(event) =>
                  updateExperienceForm("description", event.target.value)
                }
                className="mt-2 min-h-[90px] w-full rounded-md border border-[var(--color-border)] p-3 font-inter text-sm font-normal outline-none focus:border-[var(--color-primary)]"
              />
            </Field>
            <Button
              type="button"
              className="mt-4"
              variant="outline"
              onClick={saveExperience}
            >
              {editingExperienceId ? (
                <>
                  <Save size={15} />
                  {tr("Save experience", "Сохранить опыт")}
                </>
              ) : (
                <>
                  <Plus size={15} />
                  {tr("Add experience", "Добавить опыт")}
                </>
              )}
            </Button>
          </Card>
          <Card id="education">
            <h2 className="font-geist text-lg font-[650]">
              {tr("Education", "Образование")}
            </h2>
            <div className="mt-4 space-y-3">
              {profile?.education.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-lg bg-neutral-100 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-inter text-sm font-bold">
                      {item.institution_name}
                    </p>
                    <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                      {[item.degree, item.field_of_study]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                      {item.started_on ? formatDate(item.started_on) : ""}
                      {item.ended_on
                        ? ` – ${formatDate(item.ended_on)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void mutate(
                        () => deleteEducation(item.id),
                        tr("Education removed.", "Образование удалено."),
                      )
                    }
                    aria-label={tr(
                      "Delete education",
                      "Удалить образование",
                    )}
                    className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {profile?.education.length === 0 ? (
                <p className="font-inter text-sm text-[var(--color-muted)]">
                  {tr("No education yet.", "Образование пока не добавлено.")}
                </p>
              ) : null}
            </div>
            <form
              onSubmit={addEducation}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <Field label={tr("Institution", "Учебное заведение")}>
                <input
                  required
                  value={education.institution_name}
                  onChange={(event) =>
                    setEducation({
                      ...education,
                      institution_name: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("Degree", "Степень")}>
                <input
                  value={education.degree}
                  onChange={(event) =>
                    setEducation({ ...education, degree: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("Field of study", "Направление обучения")}>
                <input
                  value={education.field_of_study}
                  onChange={(event) =>
                    setEducation({
                      ...education,
                      field_of_study: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("Education level", "Уровень образования")}>
                <select
                  value={education.education_level}
                  onChange={(event) =>
                    setEducation({
                      ...education,
                      education_level: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">
                    {tr("Not specified", "Не указан")}
                  </option>
                  {educationLevels.map((item) => (
                    <option key={item.id} value={item.id}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tr("Start date", "Дата начала")}>
                <input
                  required
                  type="date"
                  value={education.started_on}
                  onChange={(event) =>
                    setEducation({
                      ...education,
                      started_on: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={tr("End date", "Дата окончания")}>
                <input
                  type="date"
                  value={education.ended_on}
                  onChange={(event) =>
                    setEducation({
                      ...education,
                      ended_on: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <div className="md:col-span-2">
                <Field
                  label={tr(
                    "Credential URL (optional)",
                    "Ссылка на документ (необязательно)",
                  )}
                >
                  <input
                    type="url"
                    placeholder="https://"
                    value={education.credential_url}
                    onChange={(event) =>
                      setEducation({
                        ...education,
                        credential_url: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={!profile}
                className="md:col-span-2 md:justify-self-start"
              >
                <Plus size={15} />
                {tr("Add education", "Добавить образование")}
              </Button>
            </form>
          </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
