"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  Languages,
  MapPin,
  MonitorSmartphone,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { ProfileBreadcrumbs } from "@/components/profile/profile-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { API_URL, ApiError, apiFetch } from "@/lib/api";
import type { Profile } from "@/lib/contracts";

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-[10px] border border-[var(--color-border)] bg-white p-6">
    {children}
  </section>
);

export default function ProfilePage() {
  const { taxonomyName, tr } = useLocale();
  const availabilityLabels: Record<string, string> = {
    available: tr("Available now", "Доступен сейчас"),
    limited: tr("Limited availability", "Ограниченная доступность"),
    unavailable: tr("Not available", "Недоступен"),
  };
  const [profile, setProfile] = useState<Profile>();
  const [message, setMessage] = useState("");
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  useEffect(() => {
    void apiFetch<Profile>("/v1/me/profile/")
      .then((nextProfile) => {
        setProfile(nextProfile);
        setMessage("");
      })
      .catch((error: unknown) => {
        const signIn = !(error instanceof ApiError && error.status === 404);
        setRequiresSignIn(signIn);
        setMessage(
          signIn
            ? tr(
                "Sign in to view and edit your profile.",
                "Войдите, чтобы просматривать и редактировать профиль.",
              )
            : tr(
                "Create your profile to start appearing in Talents Hub.",
                "Создайте профиль, чтобы появиться в каталоге Talents Hub.",
              ),
        );
      });
  }, [tr]);

  if (!profile) {
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main className="mx-auto max-w-[720px] px-6 py-7 md:py-9">
          <ProfileBreadcrumbs
            items={[
              { label: tr("Overview", "Обзор"), href: "/" },
              { label: tr("My profile", "Мой профиль") },
            ]}
          />
          <div className="mt-6">
            <Card>
            <h1 className="font-geist text-2xl font-[650]">
              {tr("Your profile", "Ваш профиль")}
            </h1>
            <p className="mt-3 font-inter text-sm text-[var(--color-muted)]">
              {message || tr("Loading your profile…", "Загружаем ваш профиль…")}
            </p>
            <Button asChild className="mt-5">
              <Link href={requiresSignIn ? "/login" : "/profile/settings"}>
                {requiresSignIn
                  ? tr("Sign in", "Войти")
                  : tr("Create profile", "Создать профиль")}
              </Link>
            </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const location = [
    profile.city ? taxonomyName(profile.city) : undefined,
    profile.country ? taxonomyName(profile.country) : undefined,
    profile.remote_preference
      ? taxonomyName(profile.remote_preference)
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  const portfolioLinks = profile.links.filter((link) => link.kind === "portfolio");
  const otherLinks = profile.links.filter((link) => link.kind !== "portfolio");
  const profileId = profile.id;
  const avatarUrl = profile.avatar?.url
    ? profile.avatar.url.startsWith("http")
      ? profile.avatar.url
      : `${API_URL.replace(/\/api$/, "")}${profile.avatar.url}`
    : "";
  async function submitForModeration() {
    setSubmitting(true);
    try {
      await apiFetch("/v1/moderation/submit/", {
        method: "POST",
        body: {
          target_type: "profile",
          target_id: profileId,
          reason_code: "publication_review",
        },
      });
      setProfile((current) =>
        current ? { ...current, status: "pending_moderation" } : current,
      );
      setMessage(
        tr(
          "Your profile was submitted for manual moderation.",
          "Ваш профиль отправлен на ручную модерацию.",
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr(
              "Could not submit your profile for moderation.",
              "Не удалось отправить профиль на модерацию.",
            ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateVisibility(isVisible: boolean) {
    setVisibilitySaving(true);
    try {
      const nextProfile = await apiFetch<Profile>(
        "/v1/me/profile/visibility/",
        { method: "PATCH", body: { is_visible: isVisible } },
      );
      setProfile(nextProfile);
      setMessage(
        isVisible
          ? tr(
              "Your profile is now visible in the talent feed.",
              "Ваш профиль теперь виден в ленте участников.",
            )
          : tr(
              "Your profile is hidden from the talent feed.",
              "Ваш профиль скрыт из ленты участников.",
            ),
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr(
              "Could not update profile visibility.",
              "Не удалось изменить видимость профиля.",
            ),
      );
    } finally {
      setVisibilitySaving(false);
    }
  }

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-7 md:pt-9">
            <ProfileBreadcrumbs
              items={[
                { label: tr("Overview", "Обзор"), href: "/" },
                { label: tr("My profile", "Мой профиль") },
              ]}
            />
            <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.avatar?.alt_text || profile.display_name}
                  width={104}
                  height={104}
                  unoptimized
                  className="size-[104px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-[104px] shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-geist text-[34px] font-bold text-white">
                  {profile.display_name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-geist text-[32px] font-[650]">
                  {profile.display_name}
                </h1>
                <p className="mt-1 font-inter text-[15px] font-medium text-[var(--color-muted)]">
                  {profile.headline ||
                    tr(
                      "Complete your professional headline",
                      "Добавьте профессиональный заголовок",
                    )}
                </p>
                <p className="mt-3 flex items-center gap-1.5 font-inter text-[13px] text-[var(--color-muted)]">
                  <MapPin size={14} />
                  {location ||
                    tr("Location not specified", "Местоположение не указано")}
                </p>
                <p className="mt-5 font-inter text-[13px] font-semibold text-[var(--color-green)]">
                  {profile.availability_note ||
                    availabilityLabels[profile.availability] ||
                    profile.availability}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/profile/settings">
                    {tr("Edit profile", "Редактировать профиль")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/profile/complete">
                    {tr("Complete profile", "Заполнить профиль")}
                  </Link>
                </Button>
                {profile.status === "published" ? (
                  <div className="flex min-h-10 items-center gap-3 rounded-md border border-[var(--color-border)] bg-white px-3">
                    <div className="min-w-0">
                      <p
                        id="profile-visibility-label"
                        className="font-inter text-xs font-semibold text-[var(--color-ink)]"
                      >
                        {tr(
                          "Visible in talent feed",
                          "Виден в ленте участников",
                        )}
                      </p>
                      <p
                        id="profile-visibility-description"
                        className="font-inter text-[11px] text-[var(--color-muted)]"
                      >
                        {profile.visibility === "public"
                          ? tr("Profile is published", "Профиль опубликован")
                          : tr("Only you can see it", "Его видите только вы")}
                      </p>
                    </div>
                    <Switch
                      checked={profile.visibility === "public"}
                      disabled={visibilitySaving}
                      aria-labelledby="profile-visibility-label"
                      aria-describedby="profile-visibility-description"
                      onCheckedChange={(checked) =>
                        void updateVisibility(checked)
                      }
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={
                      submitting || profile.status === "pending_moderation"
                    }
                    onClick={() => void submitForModeration()}
                  >
                    {submitting
                      ? tr("Submitting…", "Отправка…")
                      : profile.status === "pending_moderation"
                        ? tr("Under moderation", "На модерации")
                        : tr(
                            "Submit for moderation",
                            "Отправить на модерацию",
                          )}
                  </Button>
                )}
              </div>
            </div>
            {message ? (
              <p
                role="status"
                aria-live="polite"
                className="mt-5 rounded-lg bg-[var(--color-soft-blue)] p-4 font-inter text-sm font-medium text-[var(--color-primary)]"
              >
                {message}
              </p>
            ) : null}
          </div>
        </section>
        <div className="mx-auto grid max-w-[1200px] gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-[18px]">
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("About", "О себе")}
              </h2>
              <p className="mt-4 whitespace-pre-line font-inter text-sm leading-[1.5] text-[var(--color-muted)]">
                {profile.bio ||
                  tr(
                    "Add a short bio so collaborators can understand what you do.",
                    "Добавьте краткое описание, чтобы участники понимали, чем вы занимаетесь.",
                  )}
              </p>
              <h3 className="mt-6 font-geist text-lg font-[650]">
                {tr("Core skills", "Ключевые навыки")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.skills.map(({ skill }) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-neutral-100 px-2.5 py-1 font-inter text-[11px] font-medium"
                  >
                    {taxonomyName(skill)}
                  </span>
                ))}
                {profile.skills.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr("No skills added yet.", "Навыки пока не добавлены.")}
                  </p>
                ) : null}
              </div>
            </Card>
            <Card>
              <div className="border-l-4 border-[var(--color-primary)] pl-4">
                <h2 className="text-balance font-geist text-lg font-[650]">
                  {tr({ en: "Portfolio", ru: "Портфолио", "zh-Hans": "作品集" })}
                </h2>
                <p className="mt-1 text-pretty font-inter text-sm text-[var(--color-muted)]">
                  {tr({ en: "Selected work, cases, and publications", ru: "Избранные работы, кейсы и публикации", "zh-Hans": "精选作品、案例与出版物" })}
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {portfolioLinks.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-lg bg-[var(--color-soft-blue)] p-4 font-inter text-sm font-semibold text-[var(--color-primary)] hover:underline">
                    {item.label || item.url} ↗
                  </a>
                ))}
                {portfolioLinks.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr({ en: "Portfolio has not been added yet.", ru: "Портфолио пока не добавлено.", "zh-Hans": "尚未添加作品集。" })}
                  </p>
                ) : null}
              </div>
            </Card>
            <Card>
              <h2 className="text-balance font-geist text-lg font-[650]">
                {tr({ en: "Projects I want to participate in", ru: "В каких проектах хочу участвовать", "zh-Hans": "我希望参与的项目" })}
              </h2>
              <div className="mt-5 space-y-3">
                {profile.project_preferences.map((item) => (
                  <div key={item.id} className="rounded-lg bg-neutral-100 p-4">
                    <p className="font-inter text-sm font-bold">
                      {item.category ? taxonomyName(item.category) : tr({ en: "Project direction", ru: "Направление проекта", "zh-Hans": "项目方向" })}
                    </p>
                    {item.note ? <p className="mt-2 text-pretty font-inter text-xs leading-5 text-[var(--color-muted)]">{item.note}</p> : null}
                  </div>
                ))}
                {profile.project_preferences.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr({ en: "Project interests have not been specified yet.", ru: "Интересы к проектам пока не указаны.", "zh-Hans": "尚未填写项目兴趣。" })}
                  </p>
                ) : null}
              </div>
            </Card>
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("Experience", "Опыт")}
              </h2>
              <div className="mt-5 space-y-3">
                {profile.experiences.map((experience) => (
                  <div
                    key={experience.id}
                    className="flex gap-4 rounded-lg bg-neutral-100 p-4"
                  >
                    <BriefcaseBusiness
                      className="shrink-0 text-[var(--color-primary)]"
                      size={20}
                    />
                    <div className="min-w-0">
                      <p className="font-inter text-sm font-bold">
                        {experience.title}
                      </p>
                      <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                        {experience.organization_name}
                        {experience.location_text
                          ? ` · ${experience.location_text}`
                          : ""}
                      </p>
                      <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                        {experience.started_on.slice(0, 4)} — {experience.is_current
                          ? tr("Present", "Сейчас")
                          : experience.ended_on?.slice(0, 4) || tr("Present", "Сейчас")}
                      </p>
                      {experience.description ? (
                        <p className="mt-2 text-pretty font-inter text-xs leading-5 text-[var(--color-muted)]">
                          {experience.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {profile.experiences.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr("No experience added yet.", "Опыт пока не добавлен.")}
                  </p>
                ) : null}
              </div>
            </Card>
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("Education", "Образование")}
              </h2>
              <div className="mt-5 space-y-3">
                {profile.education.map((education) => (
                  <div
                    key={education.id}
                    className="flex gap-4 rounded-lg bg-neutral-100 p-4"
                  >
                    <GraduationCap
                      className="shrink-0 text-[var(--color-primary)]"
                      size={20}
                    />
                    <div className="min-w-0">
                      <p className="font-inter text-sm font-bold">
                        {education.degree || education.field_of_study}
                      </p>
                      <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                        {education.institution_name}
                        {education.field_of_study
                          ? ` · ${education.field_of_study}`
                          : ""}
                      </p>
                      <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                        {education.started_on.slice(0, 4)} — {education.ended_on?.slice(0, 4) || tr("Present", "Сейчас")}
                      </p>
                    </div>
                  </div>
                ))}
                {profile.education.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr("No education added yet.", "Образование пока не добавлено.")}
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
          <aside className="space-y-[18px]">
            <Card>
              <h2 className="font-geist text-[17px] font-[650]">
                {tr("Participation format", "Формат участия")}
              </h2>
              <p className="mt-5 flex gap-3 font-inter text-sm font-bold">
                <MonitorSmartphone
                  size={20}
                  className="text-[var(--color-primary)]"
                />
                {profile.remote_preference
                  ? taxonomyName(profile.remote_preference)
                  : tr("Not specified", "Не указан")}
              </p>
            </Card>
            <Card>
              <h2 className="font-geist text-[17px] font-[650]">
                {tr("Languages", "Языки")}
              </h2>
              <div className="mt-5 flex gap-3">
                <Languages size={18} className="text-[var(--color-primary)]" />
                <div className="space-y-2 font-inter text-[13px]">
                  {profile.languages.map(({ language, proficiency }) => (
                    <p key={language.id} className="font-semibold">
                      {taxonomyName(language)} · {proficiency.toUpperCase()}
                    </p>
                  ))}
                  {profile.languages.length === 0 ? (
                    <p className="text-[var(--color-muted)]">
                      {tr(
                        "No languages added yet.",
                        "Языки пока не добавлены.",
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
            <Card>
              <h2 className="font-geist text-[17px] font-[650]">
                {tr("Links", "Ссылки")}
              </h2>
              <div className="mt-4 space-y-2">
                {otherLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-inter text-sm font-semibold text-[var(--color-primary)]"
                  >
                    {item.label || item.url}
                  </a>
                ))}
                {otherLinks.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr("No links added yet.", "Ссылки пока не добавлены.")}
                  </p>
                ) : null}
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
