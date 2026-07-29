import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Проекты сотрудничества ШОС",
  description:
    "Найдите международные проекты, открытые роли и возможности сотрудничества с экспертами и организациями стран ШОС.",
  path: "/projects",
});

export default function ProjectsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
