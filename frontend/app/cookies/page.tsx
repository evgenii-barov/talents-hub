import { CookiePolicyContent } from "@/components/privacy/cookie-policy-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Политика использования cookies",
  description: "Как Talents Hub использует cookies и данные браузера.",
  path: "/cookies",
});

export default function CookiePolicyPage() {
  return <CookiePolicyContent />;
}
