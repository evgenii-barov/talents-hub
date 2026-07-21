import Link from "next/link";
import { Building2, ChevronDown, Compass, FolderKanban, Languages, Sparkles, UserRoundPlus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AuthHeader({ mode }: { mode: "login" | "signup" }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 font-inter text-base font-bold text-[var(--color-ink)]"><span className="flex size-[30px] items-center justify-center rounded-lg bg-[var(--color-primary)] text-white"><Sparkles size={17} /></span>Young Talent Hub</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 font-inter text-sm lg:flex"><Link href="/" className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]"><Compass size={15} className="text-[var(--color-primary)]" />Explore</Link><Link href="/projects" className="flex items-center gap-1.5 font-medium text-[var(--color-muted)]"><FolderKanban size={15} />Projects</Link><Link href="/talents" className="flex items-center gap-1.5 font-medium text-[var(--color-muted)]"><UsersRound size={15} />Talent</Link><Link href="/organizations" className="flex items-center gap-1.5 font-medium text-[var(--color-muted)]"><Building2 size={15} />For organisations</Link></nav>
        <div className="flex items-center gap-2.5"><Link href="/login" aria-current={mode === "login" ? "page" : undefined} className="hidden font-inter text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)] sm:block">Sign in</Link><Button asChild><Link href="/signup"><UserRoundPlus size={16} />Create profile</Link></Button><button aria-label="Select language" className="hidden items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-[7px] font-inter text-xs font-bold text-[var(--color-ink)] md:flex"><Languages size={15} />EN<ChevronDown size={13} className="text-[var(--color-muted)]" /></button></div>
      </div>
    </header>
  );
}
