import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata = buildPrivatePageMetadata(
  "Мои отклики",
  "/applications",
);

export default function ApplicationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
