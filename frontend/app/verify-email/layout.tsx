import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata = buildPrivatePageMetadata(
  "Подтверждение email",
  "/verify-email",
);

export default function VerifyEmailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
