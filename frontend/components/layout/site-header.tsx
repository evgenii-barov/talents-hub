import Link from "next/link";
import { ChevronDown, Globe2, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 font-inter text-[16px] font-bold text-[var(--color-ink)]">
          <span className="flex size-[30px] items-center justify-center rounded-lg bg-[var(--color-primary)] font-geist text-sm font-bold text-white">Y</span>
          Young Talent Hub
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 font-inter text-sm font-medium text-[var(--color-muted)] lg:flex">
          <Link href="/" className="text-[var(--color-ink)] hover:text-[var(--color-primary)]">Explore</Link>
          <Link href="/projects" className="hover:text-[var(--color-primary)]">Projects</Link>
          <Link href="/talents" className="hover:text-[var(--color-primary)]">Talent</Link>
          <Link href="/organizations" className="hover:text-[var(--color-primary)]">Organisations</Link>
        </nav>
        <div className="flex items-center gap-2.5 font-inter">
          <Link href="/login" className="hidden px-2 text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)] sm:block">Sign in</Link>
          <Button asChild size="default"><Link href="/signup"><UserRoundPlus size={16} />Create profile</Link></Button>
          <button aria-label="Select language" className="hidden items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-[7px] text-xs font-semibold text-[var(--color-ink)] hover:bg-neutral-200 md:flex"><Globe2 size={15} />EN<ChevronDown size={14} /></button>
        </div>
      </div>
    </header>
  );
}
