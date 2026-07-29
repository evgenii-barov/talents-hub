import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata = buildPrivatePageMetadata(
  "Модерация",
  "/moderation",
);

export default function ModerationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
