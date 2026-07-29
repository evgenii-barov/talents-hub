"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  GraduationCap,
  Languages,
  MapPin,
  MonitorSmartphone,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { DirectoryBreadcrumbs } from "@/components/navigation/directory-navigation";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/contracts";
import { getProfile } from "@/lib/profiles";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-[var(--color-border)] bg-white p-6">
      {children}
    </section>
  );
}

export default function TalentProfilePage() {
  const { taxonomyName, tr } = useLocale();
  const availabilityLabels: Record<string, string> = {
    available: tr("Available now", "Доступен сейчас"),
    limited: tr("Limited availability", "Ограниченная доступность"),
    unavailable: tr("Not available", "Недоступен"),
  };
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setProfile(undefined);
    try {
      setProfile(await getProfile(slug));
    } catch {
      setError(
        tr(
          "Could not load this profile. It may be unavailable or no longer public.",
          "Не удалось загрузить профиль. Возможно, он недоступен или больше не является публичным.",
        ),
      );
    }
  }, [slug, tr]);

  useEffect(() => {
    void load();
  }, [load]);
  if (error)
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main className="mx-auto max-w-[720px] px-6 py-12">
          <DirectoryBreadcrumbs
            directoryHref="/talents"
            directoryLabel={tr("Back to talents", "Назад к талантам")}
            currentLabel={tr("Profile unavailable", "Профиль недоступен")}
          />
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5"
          >
            <h1 className="text-balance font-geist text-xl font-[650] text-[var(--color-ink)]">
              {tr("Profile unavailable", "Профиль недоступен")}
            </h1>
            <p className="mt-2 text-pretty font-inter text-sm text-red-700">
              {error}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void load()}>
                {tr("Try again", "Повторить")}
              </Button>
              <Button asChild variant="outline">
                <Link href="/talents">
                  {tr(
                    "Back to talent directory",
                    "Вернуться к каталогу талантов",
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  if (!profile)
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main aria-busy="true" className="mx-auto max-w-[720px] px-6 py-12">
          <DirectoryBreadcrumbs
            directoryHref="/talents"
            directoryLabel={tr("Back to talents", "Назад к талантам")}
            currentLabel={tr("Loading profile…", "Загружаем профиль…")}
          />
          <div role="status" aria-live="polite">
            <p className="mt-5 font-inter text-sm font-semibold text-[var(--color-muted)]">
              {tr("Loading profile…", "Загружаем профиль…")}
            </p>
            <div
              aria-hidden="true"
              className="mt-5 rounded-[10px] border border-[var(--color-border)] bg-white p-6"
            >
              <div className="size-20 rounded-full bg-neutral-100" />
              <div className="mt-5 h-7 w-1/2 rounded bg-neutral-100" />
              <div className="mt-3 h-3 w-3/4 rounded bg-neutral-100" />
              <div className="mt-10 h-32 rounded bg-neutral-100" />
            </div>
          </div>
        </main>
      </div>
    );
  const location = [
    profile.city ? taxonomyName(profile.city) : undefined,
    profile.country ? taxonomyName(profile.country) : undefined,
    profile.remote_preference
      ? taxonomyName(profile.remote_preference)
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-[1440px] px-6 pt-7 lg:px-12">
            <DirectoryBreadcrumbs
              directoryHref="/talents"
              directoryLabel={tr("Back to talents", "Назад к талантам")}
              currentLabel={profile.display_name}
            />
          </div>
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start lg:px-12">
            <ProfileAvatar
              profile={profile}
              className="size-[104px] text-[34px]"
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-geist text-[32px] font-[650]">
                {profile.display_name}
              </h1>
              <p className="mt-1 font-inter text-[15px] font-medium text-[var(--color-muted)]">
                {profile.headline ||
                  tr("Talents Hub member", "Участник Talents Hub")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {profile.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-soft-green)] px-2.5 py-1 font-inter text-xs font-bold text-emerald-700">
                    <BadgeCheck size={14} />
                    {tr("Verified profile", "Проверенный профиль")}
                  </span>
                ) : null}
                {location ? (
                  <span className="flex items-center gap-1.5 font-inter text-[13px] text-[var(--color-muted)]">
                    <MapPin size={14} />
                    {location}
                  </span>
                ) : null}
              </div>
              <p className="mt-5 font-inter text-[13px] font-semibold text-[var(--color-green)]">
                {profile.availability_note ||
                  availabilityLabels[profile.availability] ||
                  profile.availability.replaceAll("_", " ")}
              </p>
            </div>
            <Button asChild>
              <Link
                href={`/chat?recipient=${profile.id}&name=${encodeURIComponent(profile.display_name)}`}
              >
                {tr("Message", "Написать")}
              </Link>
            </Button>
          </div>
        </section>
        <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 lg:grid-cols-[minmax(0,860px)_460px] lg:px-12">
          <div className="space-y-[18px]">
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("About", "О себе")}
              </h2>
              <p className="mt-4 whitespace-pre-line font-inter text-sm leading-[1.5] text-[var(--color-muted)]">
                {profile.bio ||
                  tr(
                    "This member has not added a public bio yet.",
                    "Участник пока не добавил публичное описание.",
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
                    {tr(
                      "No public skills yet.",
                      "Публичные навыки пока не указаны.",
                    )}
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
                    <div>
                      <p className="font-inter text-sm font-bold">
                        {experience.title}
                      </p>
                      <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                        {experience.organization_name}
                        {experience.location_text
                          ? ` · ${experience.location_text}`
                          : ""}
                      </p>
                      {experience.description ? (
                        <p className="mt-2 font-inter text-[11px] leading-[1.35] text-[var(--color-muted)]">
                          {experience.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {profile.experiences.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr(
                      "No public experience yet.",
                      "Публичный опыт пока не указан.",
                    )}
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
                    {tr(
                      "No public education yet.",
                      "Публичное образование пока не указано.",
                    )}
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
                  : tr("Format not specified", "Формат не указан")}
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
                        "No public languages yet.",
                        "Публичные языки пока не указаны.",
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
            {profile.links.length ? (
              <Card>
                <h2 className="font-geist text-[17px] font-[650]">
                  {tr("Links", "Ссылки")}
                </h2>
                <div className="mt-4 space-y-3 font-inter text-sm font-semibold text-[var(--color-primary)]">
                  {profile.links.map((link) => (
                    <a
                      key={link.id}
                      className="block"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label || link.url} ↗
                    </a>
                  ))}
                </div>
              </Card>
            ) : null}
            <Link
              href="/talents"
              className="block font-inter text-sm font-bold text-[var(--color-primary)]"
            >
              {tr(
                "← Back to talent directory",
                "← Вернуться к каталогу талантов",
              )}
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
