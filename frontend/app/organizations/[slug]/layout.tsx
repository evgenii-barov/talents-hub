import type { Metadata } from "next";

import { getOrganization } from "@/lib/organizations";
import {
  buildPageMetadata,
  humanizeSlug,
  trimDescription,
} from "@/lib/seo";

type OrganizationRouteProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: OrganizationRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/organizations/${encodeURIComponent(slug)}`;
  const fallbackTitle = humanizeSlug(slug) || "Организация";
  const fallbackDescription =
    "Профиль организации и её международные проекты в сети Talents Hub.";

  try {
    const organization = await getOrganization(slug);
    return buildPageMetadata({
      title: organization.display_name || fallbackTitle,
      description: trimDescription(
        organization.tagline || organization.description,
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

export default function OrganizationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
