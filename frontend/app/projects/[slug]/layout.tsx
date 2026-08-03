import type { Metadata } from "next";

import { getProject } from "@/lib/projects";
import {
  buildPageMetadata,
  humanizeSlug,
  trimDescription,
} from "@/lib/seo";

type ProjectRouteProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: ProjectRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/projects/${encodeURIComponent(slug)}`;
  const fallbackTitle = humanizeSlug(slug) || "Проект";
  const fallbackDescription =
    "Международный проект и открытые роли для участников молодёжного профессионального сообщества.";

  try {
    const project = await getProject(slug);
    return buildPageMetadata({
      title: project.title || fallbackTitle,
      description: trimDescription(
        project.short_description || project.description,
        fallbackDescription,
      ),
      path,
    });
  } catch {
    return buildPageMetadata({
      title: fallbackTitle,
      description: fallbackDescription,
      path,
    });
  }
}

export default function ProjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
