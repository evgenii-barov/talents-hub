import type { MetadataRoute } from "next";

import type { PaginatedResponse } from "@/lib/pagination";
import { getOrganizationsPage } from "@/lib/organizations";
import { getProfilesPage } from "@/lib/profiles";
import { getProjectsPage } from "@/lib/projects";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const maxCataloguePages = 100;

async function loadAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const results: T[] = [];

  for (let page = 1; page <= maxCataloguePages; page += 1) {
    const response = await fetchPage(page);
    results.push(...response.results);
    if (!response.next) break;
  }

  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/projects"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/talents"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/organizations"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/cookies"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const [projectsResult, profilesResult, organizationsResult] =
    await Promise.allSettled([
      loadAllPages((page) => getProjectsPage({ page })),
      loadAllPages((page) => getProfilesPage({ page })),
      loadAllPages((page) => getOrganizationsPage({ page })),
    ]);

  const dynamicPages: MetadataRoute.Sitemap = [];

  if (projectsResult.status === "fulfilled") {
    dynamicPages.push(
      ...projectsResult.value.map((project) => ({
        url: absoluteUrl(`/projects/${encodeURIComponent(project.slug)}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );
  }

  if (profilesResult.status === "fulfilled") {
    dynamicPages.push(
      ...profilesResult.value
        .filter(
          (profile) =>
            (profile.visibility === undefined ||
              profile.visibility === "public") &&
            (!profile.status || profile.status === "published"),
        )
        .map((profile) => ({
          url: absoluteUrl(`/talents/${encodeURIComponent(profile.slug)}`),
          lastModified: profile.published_at || now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    );
  }

  if (organizationsResult.status === "fulfilled") {
    dynamicPages.push(
      ...organizationsResult.value.map((organization) => ({
        url: absoluteUrl(
          `/organizations/${encodeURIComponent(organization.slug)}`,
        ),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );
  }

  return Array.from(
    new Map(
      [...staticPages, ...dynamicPages].map((entry) => [entry.url, entry]),
    ).values(),
  );
}
