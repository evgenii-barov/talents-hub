import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CircleUserRound,
  Compass,
  Ellipsis,
  FolderKanban,
  Globe2,
  Landmark,
  Leaf,
  MapPin,
  MessageCircleHeart,
  Rocket,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

const featuredProjects: { category: string; accentClass: string; icon: LucideIcon; title: string; description: string; roles: string }[] = [
  { category: "SUSTAINABILITY", accentClass: "text-[var(--color-green)]", icon: Leaf, title: "Designing practical climate solutions together.", description: "Join a cross-disciplinary team turning local ideas into scalable community pilots.", roles: "+4" },
  { category: "CIVIC TECH", accentClass: "text-[var(--color-primary)]", icon: Landmark, title: "Make public services easier to navigate.", description: "A six-week sprint for researchers, designers and developers with a civic lens.", roles: "+3" },
  { category: "CREATIVE", accentClass: "text-violet-700", icon: Video, title: "Build stories that travel across communities.", description: "A publishing collective connecting young editors, filmmakers and translators.", roles: "+5" },
];

const talents = [
  { initials: "MC", colorClass: "bg-violet-700", name: "Maya Chen", role: "Product designer · Open to collaborate", location: "Singapore · Remote", skills: ["UX Research", "Design Systems"] },
  { initials: "MS", colorClass: "bg-teal-700", name: "Mateo Silva", role: "Data strategist · Available now", location: "Lisbon · Hybrid", skills: ["Data Analysis", "Policy"] },
  { initials: "AY", colorClass: "bg-pink-600", name: "Amina Yusuf", role: "Community builder · 12 hrs / week", location: "Nairobi · Remote", skills: ["Partnerships", "Facilitation"] },
];

const journey: { icon: LucideIcon; number: string; title: string; description: string }[] = [
  { icon: CircleUserRound, number: "01", title: "Show up", description: "Create a profile that makes your strengths easy to recognise." },
  { icon: Compass, number: "02", title: "Discover", description: "Find briefs and people aligned with your interests." },
  { icon: MessageCircleHeart, number: "03", title: "Connect", description: "Start a thoughtful conversation around a shared goal." },
  { icon: Rocket, number: "04", title: "Make progress", description: "Join forces and build something you can point to." },
];

function Avatar({ initials, colorClass, size = "size-11" }: { initials: string; colorClass: string; size?: string }) {
  return <span className={`${size} ${colorClass} flex shrink-0 items-center justify-center rounded-full font-geist text-xs font-bold text-white`}>{initials}</span>;
}

function ProjectCard({ project }: { project: (typeof featuredProjects)[number] }) {
  const Icon = project.icon;
  return (
    <article className="flex h-[318px] flex-col justify-between rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-transform hover:-translate-y-1">
      <div className="space-y-[14px]">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-bold tracking-[0.04em] ${project.accentClass}`}>{project.category}</span>
          <span className="font-inter text-xs text-[var(--color-muted)]">Closes in 12 days</span>
        </div>
        <span className={`flex size-[34px] items-center justify-center rounded-lg bg-[var(--color-soft-blue)] ${project.accentClass}`}><Icon size={18} /></span>
        <h3 className="font-geist text-[19px] font-[650] leading-[1.2] text-[var(--color-ink)]">{project.title}</h3>
        <p className="font-inter text-[13px] leading-[1.45] text-[var(--color-muted)]">{project.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]"><b className="flex size-[25px] items-center justify-center rounded-full bg-[var(--color-soft-blue)] text-[10px] text-[var(--color-primary)]">{project.roles}</b>roles open</span>
        <Link aria-label={`Open ${project.title}`} href="/projects" className="flex size-8 items-center justify-center rounded-md bg-neutral-100 text-[var(--color-ink)] hover:bg-[var(--color-soft-blue)]"><ArrowRight size={16} /></Link>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[var(--color-hero)] text-white">
          <div className="mx-auto grid min-h-[464px] max-w-[1440px] grid-cols-1 px-6 py-14 lg:grid-cols-[560px_1fr] lg:px-12 lg:py-[68px]">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 font-inter text-[11px] font-semibold text-blue-100"><span className="size-1.5 rounded-full bg-[var(--color-green)]" />NEW OPPORTUNITIES THIS WEEK</span>
              <h1 className="mt-5 whitespace-pre-line font-geist text-[42px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[45px]">{"Build work that\nmoves your world forward."}</h1>
              <p className="mt-5 max-w-[485px] font-inter text-base leading-6 text-[var(--color-hero-muted)]">A trusted space for emerging talent to find purposeful projects, meet collaborators and turn ambition into momentum.</p>
              <div className="mt-6 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/projects">Explore projects <ArrowRight size={16} /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/signup">Create your profile</Link></Button></div>
              <div className="mt-11 flex flex-wrap gap-6 font-inter text-xs text-[var(--color-hero-muted)]"><span><b className="text-white">2,400+</b> active talents</span><span><b className="text-white">180</b> open projects</span><span><b className="text-white">34</b> countries represented</span></div>
            </div>
            <div className="relative hidden h-[370px] lg:block">
              <div className="absolute left-[39px] top-[10px] size-[330px] rounded-full border border-blue-400/25 bg-blue-600/10" />
              <div className="absolute left-[18px] top-[55px] w-[292px] rounded-xl bg-white p-[18px] text-[var(--color-ink)] shadow-[0_12px_24px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-soft-green)] px-2 py-1 font-inter text-[10px] font-bold tracking-[0.04em] text-emerald-700"><span className="size-1.5 rounded-full bg-[var(--color-green)]" />OPEN BRIEF</span><Ellipsis className="text-[var(--color-muted)]" size={18} /></div>
                <h2 className="mt-3 font-geist text-xl font-[650]">Digital Career Map</h2><p className="mt-2 font-inter text-xs leading-[1.4] text-[var(--color-muted)]">A shared map of opportunities, mentors and learning paths for emerging professionals.</p>
                <p className="mt-3 font-inter text-[10px] font-bold tracking-[0.05em] text-[var(--color-muted)]">LOOKING FOR</p><div className="mt-2 flex gap-1.5"><span className="rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-semibold text-[var(--color-primary)]">UX Designer</span><span className="rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-semibold text-[var(--color-primary)]">Data Analyst</span></div>
                <div className="mt-4 flex items-center justify-between"><div className="flex -space-x-1.5"><Avatar initials="LM" colorClass="bg-violet-700" size="size-[25px]" /><Avatar initials="RS" colorClass="bg-teal-700" size="size-[25px]" /><Avatar initials="+2" colorClass="bg-slate-500" size="size-[25px]" /></div><span className="font-inter text-[11px] font-semibold text-[var(--color-primary)]">12 days left</span></div>
              </div>
              <div className="absolute left-[280px] top-[137px] w-[220px] rounded-xl bg-[var(--color-hero-card)] p-4 shadow-[0_12px_22px_rgba(0,0,0,0.28)]"><div className="flex justify-between"><Avatar initials="AY" colorClass="bg-pink-600" size="size-[38px]" /><span className="rounded-full bg-white/10 px-2 py-1 font-inter text-[10px] font-bold">92% match</span></div><h2 className="mt-2.5 font-geist text-[15px] font-[650]">Amina Yusuf</h2><p className="mt-1 font-inter text-[11px] text-blue-200">Community builder · Remote</p><div className="mt-3 flex gap-1"><span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-blue-100">Research</span><span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-blue-100">Facilitation</span></div><p className="mt-4 flex items-center gap-1.5 font-inter text-[10px] font-semibold text-blue-100"><Sparkles size={14} className="text-blue-400" />Ready to connect</p></div>
              <div className="absolute left-[242px] top-[118px] flex size-[50px] items-center justify-center rounded-full bg-[var(--color-primary)] shadow-[0_6px_14px_rgba(37,99,235,0.53)]"><Sparkles size={20} /></div>
              <span className="absolute left-[335px] top-[30px] inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 font-inter text-[10px] font-bold"><span className="size-1.5 rounded-full bg-[var(--color-green)]" />LIVE MATCH</span>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface)] py-[38px] pb-[46px]"><div className="mx-auto max-w-[1440px] px-6 lg:px-12"><div className="flex items-end justify-between"><div><p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">DISCOVER WHAT&apos;S MOVING</p><h2 className="mt-2 font-geist text-[30px] font-[650]">Projects looking for people like you.</h2></div><Link href="/projects" className="hidden items-center gap-1.5 font-inter text-sm font-semibold text-[var(--color-primary)] md:flex">View all projects <ArrowRight size={16} /></Link></div><div className="mt-[34px] grid gap-4 md:grid-cols-3">{featuredProjects.map((project) => <ProjectCard key={project.category} project={project} />)}</div></div></section>

        <section className="bg-[var(--color-soft-blue)] py-[42px]"><div className="mx-auto grid max-w-[1440px] gap-8 px-6 lg:grid-cols-[370px_742px] lg:px-12"><div className="pt-1"><p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">MEET THE PEOPLE</p><h2 className="mt-3 font-geist text-[30px] font-[650] leading-[1.15]">Great projects start with the right people.</h2><p className="mt-4 max-w-[350px] font-inter text-sm leading-[1.5] text-[var(--color-muted)]">Discover ambitious builders with complementary skills, availability and a shared appetite for meaningful work.</p><Button asChild className="mt-6" variant="outline"><Link href="/talents">Browse talent</Link></Button></div><div className="grid gap-[14px] sm:grid-cols-3">{talents.map((talent) => <article key={talent.name} className="flex min-h-[305px] flex-col justify-between rounded-[10px] border border-[var(--color-card-blue-border)] bg-white p-[18px] shadow-[0_5px_14px_rgba(30,58,138,0.07)]"><div><div className="flex justify-between"><Avatar initials={talent.initials} colorClass={talent.colorClass} /><span className="flex size-[26px] items-center justify-center rounded-full bg-[var(--color-soft-green)] text-[var(--color-green)]"><BadgeCheck size={15} /></span></div><h3 className="mt-3 font-geist text-base font-[650]">{talent.name}</h3><p className="mt-1 font-inter text-[13px] leading-[1.4] text-[var(--color-muted)]">{talent.role}</p><p className="mt-3 flex items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]"><MapPin size={14} className="text-[var(--color-primary)]" />{talent.location}</p></div><div className="flex flex-wrap gap-1.5">{talent.skills.map((skill) => <span key={skill} className="rounded-full bg-neutral-100 px-2 py-1 font-inter text-[11px] font-medium">{skill}</span>)}</div></article>)}</div></div></section>

        <section className="bg-white py-[54px]"><div className="mx-auto max-w-[1440px] px-6 lg:px-12"><p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">A CLEAR PATH FORWARD</p><h2 className="mt-2 font-geist text-[30px] font-[650]">From a good fit to a real contribution.</h2><div className="mt-[52px] grid gap-7 md:grid-cols-2 lg:grid-cols-4">{journey.map((step, index) => { const Icon = step.icon; return <article key={step.number} className={`flex gap-[14px] ${index < 3 ? "lg:border-r lg:border-[var(--color-border)] lg:pr-[18px]" : ""}`}><span className="flex size-[42px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-soft-blue)] text-[var(--color-primary)]"><Icon size={20} /></span><div><p className="font-geist-mono text-[11px] font-bold text-[var(--color-primary)]">{step.number}</p><h3 className="mt-1 font-inter text-sm font-bold">{step.title}</h3><p className="mt-1 font-inter text-xs leading-[1.4] text-[var(--color-muted)]">{step.description}</p></div></article>; })}</div></div></section>

        <section className="bg-[var(--color-primary)] py-[56px] text-white"><div className="mx-auto grid max-w-[1440px] gap-10 px-6 lg:grid-cols-[455px_602px] lg:px-12"><div><p className="font-inter text-[11px] font-bold tracking-[0.08em] text-blue-100">BUILT FOR MOMENTUM</p><h2 className="mt-3 font-geist text-[33px] font-[650] leading-[1.14]">The network is growing. Your place in it is waiting.</h2><p className="mt-4 max-w-[420px] font-inter text-[15px] leading-[1.5] text-blue-100">Join the people turning fresh perspectives into projects, portfolios and long-term collaborations.</p><Button asChild className="mt-6 bg-white text-[var(--color-primary)] hover:bg-blue-50"><Link href="/signup">Join Young Talent Hub</Link></Button></div><div className="grid min-h-[254px] grid-cols-3 border border-white/30">{[[UsersRound,"2,400+","people sharing skills and ideas"],[FolderKanban,"180","opportunities in motion now"],[Globe2,"34","countries represented today"]].map(([Icon, value, label], index) => { const StatIcon = Icon as LucideIcon; return <div key={value as string} className={`flex flex-col justify-center gap-3.5 p-[22px] ${index < 2 ? "border-r border-white/30" : ""}`}><StatIcon size={22} className="text-blue-200" /><p className="font-geist-mono text-[28px] font-bold">{value as string}</p><p className="font-inter text-xs leading-[1.4] text-blue-100">{label as string}</p></div>; })}</div></div></section>
      </main>
      <footer className="bg-[var(--color-hero)] py-9 text-white"><div className="mx-auto max-w-[1440px] px-6 lg:px-12"><div className="flex flex-wrap items-center justify-between gap-5"><Link href="/" className="flex items-center gap-2.5 font-inter text-base font-bold"><span className="flex size-[30px] items-center justify-center rounded-lg bg-[var(--color-primary)] font-geist text-sm">Y</span>Young Talent Hub</Link><nav className="flex gap-6 font-inter text-sm text-blue-200"><Link href="/projects">Projects</Link><Link href="/talents">Talent</Link><Link href="/organizations">Organisations</Link></nav></div><div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-white/15 pt-5 font-inter text-xs text-[var(--color-footer-muted)]"><p>© 2026 Young Talent Hub · Make your next move matter.</p><p>LinkedIn · Instagram · X</p></div></div></footer>
    </div>
  );
}
