import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Организации и партнёры молодёжного сообщества",
  description:
    "Найдите организации международного молодёжного сообщества, их направления работы, инициативы и открытые проекты для сотрудничества.",
  path: "/organizations",
});

export default function OrganizationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
