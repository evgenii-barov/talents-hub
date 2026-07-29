import { AboutProjectContent } from "@/components/about/about-project-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "О проекте",
  description:
    "Цель и миссия Talents Hub — международной профессиональной сети для талантов, проектов и организаций стран ШОС.",
  path: "/about",
});

export default function AboutProjectPage() {
  return <AboutProjectContent />;
}
