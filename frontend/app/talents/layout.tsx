import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Специалисты международного молодёжного сообщества",
  description:
    "Каталог молодых специалистов и экспертов международного сообщества: компетенции, языки, опыт и готовность к сотрудничеству.",
  path: "/talents",
});

export default function TalentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
