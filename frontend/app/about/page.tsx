import { AboutProjectContent } from "@/components/about/about-project-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "О проекте",
  description:
    "Цель и миссия Talents Hub — международного молодёжного профессионального сообщества для специалистов, проектов и организаций.",
  path: "/about",
});

export default function AboutProjectPage() {
  return <AboutProjectContent />;
}
