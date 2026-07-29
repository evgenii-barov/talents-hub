import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata = buildPrivatePageMetadata(
  "Создание проекта",
  "/projects/new",
);

export default function NewProjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
