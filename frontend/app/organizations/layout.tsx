import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Организации и партнёры ШОС",
  description:
    "Найдите организации стран ШОС, их направления работы, международные инициативы и открытые проекты для сотрудничества.",
  path: "/organizations",
});

export default function OrganizationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
