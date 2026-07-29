"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  FolderKanban,
  Globe2,
  MapPin,
  MonitorSmartphone,
} from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { DirectoryBreadcrumbs } from "@/components/navigation/directory-navigation";
import type { Organization, Project } from "@/lib/contracts";
import { getOrganization } from "@/lib/organizations";
import { getProjects } from "@/lib/projects";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-[var(--color-border)] bg-white p-6">
      {children}
    </section>
  );
}

export default function OrganisationProfilePage() {
  const { taxonomyName, tr } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const [organization, setOrganization] = useState<Organization>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([getOrganization(slug), getProjects({ organization: slug })])
      .then(([nextOrganization, allProjects]) => {
        setOrganization(nextOrganization);
        setProjects(
          allProjects.filter(
            (project) => project.organization?.slug === nextOrganization.slug,
          ),
        );
      })
      .catch(() =>
        setError(
          tr(
            "This organisation is unavailable or no longer public.",
            "Организация недоступна или больше не является публичной.",
          ),
        ),
      );
  }, [slug, tr]);

  if (error)
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main className="mx-auto max-w-[720px] px-6 py-12">
          <DirectoryBreadcrumbs
            directoryHref="/organizations"
            directoryLabel={tr("Back to organisations", "Назад к организациям")}
            currentLabel={tr(
              "Organisation unavailable",
              "Организация недоступна",
            )}
          />
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5 font-inter text-sm text-red-700">
            {error}
          </p>
        </main>
      </div>
    );
  if (!organization)
    return (
      <div className="min-h-full bg-[var(--color-background)]">
        <AuthenticatedHeader />
        <main className="mx-auto max-w-[720px] px-6 py-12">
          <DirectoryBreadcrumbs
            directoryHref="/organizations"
            directoryLabel={tr("Back to organisations", "Назад к организациям")}
            currentLabel={tr(
              "Loading organisation…",
              "Загружаем организацию…",
            )}
          />
          <p className="mt-5 font-inter text-sm text-[var(--color-muted)]">
            {tr("Loading organisation…", "Загружаем организацию…")}
          </p>
        </main>
      </div>
    );

  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-[42px] lg:px-12">
            <DirectoryBreadcrumbs
              directoryHref="/organizations"
              directoryLabel={tr("Back to organisations", "Назад к организациям")}
              currentLabel={organization.display_name}
            />
            <div className="mt-6 flex flex-col gap-5 lg:flex-row">
              <span className="flex size-[104px] shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-primary)] font-geist text-[27px] font-bold text-white">
                {organization.display_name.slice(0, 3).toUpperCase()}
              </span>
              <div className="flex-1">
                <h1 className="font-geist text-[34px] font-[650]">
                  {organization.display_name}
                </h1>
                <p className="mt-1 font-inter text-[15px] font-medium text-[var(--color-muted)]">
                  {organization.tagline || organization.organization_type}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {organization.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-soft-green)] px-2.5 py-1 font-inter text-[11px] font-bold text-emerald-700">
                      <BadgeCheck
                        size={14}
                        className="text-[var(--color-green)]"
                      />
                      {tr("Verified", "Проверена")}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5 font-inter text-[13px] text-[var(--color-muted)]">
                    <MapPin size={14} />
                    {organization.location_text ||
                      (organization.country
                        ? taxonomyName(organization.country)
                        : undefined) ||
                      tr("Location not specified", "Местоположение не указано")}
                  </span>
                </div>
                <p className="mt-5 max-w-[700px] font-inter text-[15px] leading-[1.45] text-[var(--color-muted)]">
                  {organization.description ||
                    tr(
                      "This organisation has not added a public description yet.",
                      "Организация пока не добавила публичное описание.",
                    )}
                </p>
              </div>
            </div>
            <div className="mt-8 flex gap-8 font-inter text-xs font-bold text-[var(--color-muted)]">
              <span>
                {tr({
                  en: `${projects.length} public ${projects.length === 1 ? "project" : "projects"}`,
                  ru: `Публичных проектов: ${projects.length}`,
                  "zh-Hans": `公开项目：${projects.length}`,
                })}
              </span>
              {organization.founded_year ? (
                <span>
                  {tr({
                    en: `Established ${organization.founded_year}`,
                    ru: `Год основания: ${organization.founded_year}`,
                    "zh-Hans": `成立于 ${organization.founded_year} 年`,
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-7 lg:grid-cols-[minmax(0,856px)_460px] lg:px-12">
          <div className="space-y-[18px]">
            <Card>
              <h2 className="font-geist text-[19px] font-[650]">
                {tr("About the organisation", "Об организации")}
              </h2>
              <p className="mt-4 whitespace-pre-line font-inter text-sm leading-[1.5] text-[var(--color-muted)]">
                {organization.description ||
                  tr(
                    "This organisation has not added a public description yet.",
                    "Организация пока не добавила публичное описание.",
                  )}
              </p>
              {organization.website_url || organization.founded_year ? (
                <div className="mt-6 flex flex-wrap gap-8 font-inter text-[13px] font-bold text-[var(--color-primary)]">
                  {organization.founded_year ? (
                    <span>
                      {tr({
                        en: `Established ${organization.founded_year}`,
                        ru: `Год основания: ${organization.founded_year}`,
                        "zh-Hans": `成立于 ${organization.founded_year} 年`,
                      })}
                    </span>
                  ) : null}
                  {organization.website_url ? (
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tr("Visit website ↗", "Перейти на сайт ↗")}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </Card>
            <Card>
              <h2 className="font-geist text-[19px] font-[650]">
                {tr("Open projects", "Открытые проекты")}
              </h2>
              <p className="mt-2 font-inter text-[13px] text-[var(--color-muted)]">
                {tr(
                  "Public projects currently looking for contributors from this organisation.",
                  "Публичные проекты организации, которые сейчас ищут участников.",
                )}
              </p>
              <div className="mt-5 space-y-3">
                {projects.map((project, index) => {
                  const seats = project.roles
                    .filter((role) => role.status === "open")
                    .reduce(
                      (total, role) =>
                        total + role.seats_total - role.seats_filled,
                      0,
                    );
                  return (
                    <div
                      key={project.id}
                      className={`flex items-center gap-4 rounded-[9px] p-4 ${index === 0 ? "bg-neutral-100" : "border border-[var(--color-border)]"}`}
                    >
                      <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
                        <FolderKanban size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-inter text-sm font-bold">
                          {project.title}
                        </p>
                        <p className="mt-1 font-inter text-xs text-[var(--color-muted)]">
                          {project.short_description}
                        </p>
                        <p className="mt-1 font-inter text-[11px] font-bold text-[var(--color-primary)]">
                          {tr({
                            en: `${seats} seats open`,
                            ru: `Свободных мест: ${seats}`,
                            "zh-Hans": `开放名额：${seats}`,
                          })}
                        </p>
                      </div>
                      <Link
                        href={`/projects/${project.slug}`}
                        className="font-inter text-xs font-bold text-[var(--color-primary)]"
                      >
                        {tr("View project →", "Открыть проект →")}
                      </Link>
                    </div>
                  );
                })}
                {projects.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr(
                      "No public projects are listed yet.",
                      "Публичных проектов пока нет.",
                    )}
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
          <aside className="space-y-[18px]">
            {organization.website_url ? (
              <Card>
                <h2 className="font-geist text-lg font-[650]">
                  {tr("Website", "Сайт")}
                </h2>
                <a
                  className="mt-5 flex gap-3 font-inter text-[13px] font-bold text-[var(--color-primary)]"
                  href={organization.website_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe2 size={16} />
                  {organization.website_url.replace(/^https?:\/\//, "")}
                </a>
              </Card>
            ) : null}
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("Focus areas", "Направления работы")}
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {organization.focuses.map(({ focus_area }) => (
                  <span
                    key={focus_area.id}
                    className="rounded-full bg-neutral-100 px-2.5 py-1 font-inter text-xs font-medium"
                  >
                    {taxonomyName(focus_area)}
                  </span>
                ))}
                {organization.focuses.length === 0 ? (
                  <p className="font-inter text-sm text-[var(--color-muted)]">
                    {tr(
                      "Focus areas have not been added yet.",
                      "Направления работы пока не указаны.",
                    )}
                  </p>
                ) : null}
              </div>
            </Card>
            <Card>
              <h2 className="font-geist text-lg font-[650]">
                {tr("Participation", "Участие")}
              </h2>
              <p className="mt-4 flex gap-3 font-inter text-sm font-bold">
                <MonitorSmartphone
                  size={20}
                  className="text-[var(--color-primary)]"
                />
                {tr(
                  "Contact the organisation through its public website.",
                  "Свяжитесь с организацией через её официальный сайт.",
                )}
              </p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
