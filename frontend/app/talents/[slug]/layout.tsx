import type { Metadata } from "next";

import { getProfile } from "@/lib/profiles";
import {
  buildPageMetadata,
  humanizeSlug,
  trimDescription,
} from "@/lib/seo";

type TalentRouteProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: TalentRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/talents/${encodeURIComponent(slug)}`;
  const fallbackTitle = humanizeSlug(slug) || "Профиль эксперта";
  const fallbackDescription =
    "Профиль участника международной профессиональной сети Talents Hub.";

  try {
    const profile = await getProfile(slug);
    const isPublic =
      profile.visibility === "public" &&
      (!profile.status || profile.status === "published");

    return buildPageMetadata({
      title: profile.display_name || fallbackTitle,
      description: trimDescription(
        profile.headline || profile.bio,
        fallbackDescription,
      ),
      path,
      index: isPublic,
    });
  } catch {
    return buildPageMetadata({
      title: fallbackTitle,
      description: fallbackDescription,
      path,
      index: false,
    });
  }
}

export default function TalentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
