import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Эксперты и таланты стран ШОС",
  description:
    "Каталог специалистов, выпускников и экспертов стран ШОС: компетенции, языки, опыт и готовность к международному сотрудничеству.",
  path: "/talents",
});

export default function TalentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
