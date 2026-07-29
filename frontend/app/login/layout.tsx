import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata = buildPrivatePageMetadata("Вход", "/login");

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
