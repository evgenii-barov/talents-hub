import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

type BreadcrumbItem = {
  label: string;
  href?: ComponentProps<typeof Link>["href"];
};

export function ProfileBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumbs">
      <ol className="flex flex-wrap items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight aria-hidden="true" size={13} className="text-neutral-400" />
              ) : null}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined} className="font-semibold text-[var(--color-ink)]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
