import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Проекты международного молодёжного сообщества",
  description:
    "Найдите международные проекты, открытые роли и возможности сотрудничества со специалистами и организациями молодёжного профессионального сообщества.",
  path: "/projects",
});

export default function ProjectsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
