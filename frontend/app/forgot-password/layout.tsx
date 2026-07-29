import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata = buildPrivatePageMetadata(
  "Восстановление пароля",
  "/forgot-password",
);

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
