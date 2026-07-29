"use client";

import {
  ArrowRight,
  Building2,
  FolderKanban,
  Globe2,
  Handshake,
  MapPin,
  MessageCircle,
  Rocket,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, type CSSProperties } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export function AboutProjectContent() {
  const { tr } = useLocale();

  useEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".scroll-reveal"),
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const supportsObserver = "IntersectionObserver" in window;
    let observer: IntersectionObserver | undefined;

    root.classList.remove("about-intro-play");
    root.classList.add("motion-ready");

    const introFrame = window.requestAnimationFrame(() => {
      root.classList.add("about-intro-play");

      if (reduceMotion || !supportsObserver) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.14, rootMargin: "0px 0px -7% 0px" },
      );

      elements.forEach((element) => observer?.observe(element));
    });

    if (reduceMotion || !supportsObserver) {
      elements.forEach((element) => element.classList.add("is-visible"));
    }

    return () => {
      window.cancelAnimationFrame(introFrame);
      observer?.disconnect();
      root.classList.remove("about-intro-play", "motion-ready");
    };
  }, []);

  return (
    <>
    <main className="min-h-[calc(100vh-72px)] overflow-x-clip bg-[var(--color-background)]">
      <section className="relative overflow-hidden bg-[var(--color-hero)] text-white">
        <div className="about-hero-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid min-h-[540px] max-w-[1440px] gap-10 px-6 py-14 lg:grid-cols-[minmax(0,520px)_minmax(520px,1fr)] lg:items-center lg:px-12 lg:py-[68px]">
          <div className="relative z-10">
            <span
              style={{ "--intro-delay": "120ms" } as CSSProperties}
              className="about-hero-intro inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 font-inter text-[11px] font-semibold text-blue-100"
            >
              <Sparkles aria-hidden="true" size={13} className="text-blue-300" />
              {tr({
                en: "ABOUT TALENTS HUB",
                ru: "О ПРОЕКТЕ TALENTS HUB",
                "zh-Hans": "关于 TALENTS HUB",
              })}
            </span>
            <h1
              style={{ "--intro-delay": "200ms" } as CSSProperties}
              className="about-hero-intro mt-5 max-w-[620px] text-balance font-geist text-[42px] font-bold leading-[1.03] tracking-[-0.035em] sm:text-[52px] lg:text-[58px]"
            >
              {tr({
                en: "Where expertise becomes a shared result.",
                ru: "Где экспертиза становится общим результатом.",
                "zh-Hans": "让专业能力转化为共同成果。",
              })}
            </h1>
            <p
              style={{ "--intro-delay": "280ms" } as CSSProperties}
              className="about-hero-intro mt-5 max-w-[505px] font-inter text-base leading-7 text-[var(--color-hero-muted)]"
            >
              {tr({
                en: "Talents Hub connects people, initiatives and organisations across SCO countries so that a useful contact can grow into an international project.",
                ru: "Talents Hub соединяет людей, инициативы и организации стран ШОС, чтобы полезный контакт мог перерасти в международный проект.",
                "zh-Hans": "Talents Hub 连接上合组织国家的人才、项目与机构，让一次有价值的联系发展为国际合作项目。",
              })}
            </p>
            <div
              style={{ "--intro-delay": "360ms" } as CSSProperties}
              className="about-hero-intro mt-7 flex flex-wrap gap-3"
            >
              <Button asChild size="lg">
                <Link href="/projects">
                  {tr({
                    en: "Explore projects",
                    ru: "Найти проект",
                    "zh-Hans": "发现项目",
                  })}
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/talents">
                  {tr({
                    en: "Find expertise",
                    ru: "Найти специалиста",
                    "zh-Hans": "寻找专业人才",
                  })}
                </Link>
              </Button>
            </div>
            <div
              style={{ "--intro-delay": "440ms" } as CSSProperties}
              className="about-hero-intro mt-9 hidden flex-wrap gap-x-6 gap-y-2 font-inter text-xs text-[var(--color-hero-muted)] lg:flex"
            >
              <span><b className="font-geist-mono text-white">SCO</b> · {tr({ en: "one region", ru: "единый регион", "zh-Hans": "同一区域" })}</span>
              <span><b className="font-geist-mono text-white">P2P</b> · {tr({ en: "direct dialogue", ru: "прямой диалог", "zh-Hans": "直接对话" })}</span>
              <span><b className="font-geist-mono text-white">OPEN</b> · {tr({ en: "shared projects", ru: "общие проекты", "zh-Hans": "合作项目" })}</span>
            </div>
            <div
              style={{ "--intro-delay": "440ms" } as CSSProperties}
              className="about-hero-intro relative mt-8 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 lg:hidden"
            >
              <span className="absolute left-[16%] right-[16%] top-[31px] h-px bg-blue-300/20" />
              <MobileNetworkPoint icon={UsersRound} label={tr({ en: "Talent", ru: "Таланты", "zh-Hans": "人才" })} />
              <MobileNetworkPoint icon={FolderKanban} label={tr({ en: "Projects", ru: "Проекты", "zh-Hans": "项目" })} featured />
              <MobileNetworkPoint icon={Building2} label={tr({ en: "Organisations", ru: "Организации", "zh-Hans": "机构" })} />
            </div>
          </div>

          <NetworkScene />
        </div>
      </section>

      <section className="bg-white py-[54px] sm:py-[64px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div data-reveal="up" className="scroll-reveal max-w-[760px]">
            <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">
              {tr({
                en: "WHY TALENTS HUB EXISTS",
                ru: "ЗАЧЕМ НУЖЕН TALENTS HUB",
                "zh-Hans": "TALENTS HUB 的意义",
              })}
            </p>
            <h2 className="mt-2 text-balance font-geist text-[30px] font-[650] leading-[1.15] sm:text-[34px]">
              {tr({
                en: "A common space for a common ambition.",
                ru: "Общее пространство для общего стремления.",
                "zh-Hans": "为共同愿景打造共同空间。",
              })}
            </h2>
          </div>

          <div className="mt-[34px] grid gap-4 lg:grid-cols-2">
            <Statement
              reveal="left"
              icon={Target}
              label={tr({ en: "Project goal", ru: "Цель проекта", "zh-Hans": "项目目标" })}
              title={tr({
                en: "Make it easy to find one another and form international teams.",
                ru: "Сделать поиск друг друга и создание международных команд простым.",
                "zh-Hans": "让彼此发现和组建国际团队变得简单。",
              })}
            >
              {tr({
                en: "Young specialists present their expertise, initiative leaders find the right people, and organisations discover partners across SCO countries.",
                ru: "Молодые специалисты представляют свою экспертизу, лидеры инициатив находят нужных людей, а организации — партнёров в странах ШОС.",
                "zh-Hans": "青年专业人士展示能力，项目发起人寻找合适成员，机构也能在上合组织国家中发现合作伙伴。",
              })}
            </Statement>
            <Statement
              reveal="right"
              icon={Globe2}
              label={tr({ en: "Our mission", ru: "Наша миссия", "zh-Hans": "我们的使命" })}
              title={tr({
                en: "Turn international connections and expertise into real cooperation.",
                ru: "Превращать международные связи и экспертизу в реальное сотрудничество.",
                "zh-Hans": "让国际联系与专业能力转化为真正的合作。",
              })}
            >
              {tr({
                en: "We help people apply their skills, projects assemble strong teams, and organisations launch initiatives whose impact crosses borders.",
                ru: "Мы помогаем людям применять свои навыки, проектам — собирать сильные команды, а организациям — запускать инициативы с международным эффектом.",
                "zh-Hans": "我们帮助人才发挥所长、项目组建强大团队，并支持机构发起具有跨国影响力的行动。",
              })}
            </Statement>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-soft-blue)] py-[48px] sm:py-[56px]">
        <div className="mx-auto grid max-w-[1440px] gap-9 px-6 lg:grid-cols-[370px_minmax(0,1fr)] lg:px-12">
          <div data-reveal="left" className="scroll-reveal pt-1">
            <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">
              {tr({ en: "FROM IDEA TO TEAM", ru: "ОТ ИДЕИ К КОМАНДЕ", "zh-Hans": "从创意到团队" })}
            </p>
            <h2 className="mt-3 text-balance font-geist text-[30px] font-[650] leading-[1.15]">
              {tr({
                en: "A practical meeting point for everyone who makes cooperation happen.",
                ru: "Практичная точка встречи для всех, кто создаёт сотрудничество.",
                "zh-Hans": "为所有推动合作的人提供一个实用的汇聚点。",
              })}
            </h2>
            <p className="mt-4 max-w-[360px] font-inter text-sm leading-6 text-[var(--color-muted)]">
              {tr({
                en: "Choose where you want to start: with a person, an initiative or a future partner.",
                ru: "Выберите, с чего начать: со специалиста, инициативы или будущего партнёра.",
                "zh-Hans": "选择您的起点：人才、项目或未来合作伙伴。",
              })}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionLink index={0} href="/talents" icon={UsersRound} label={tr({ en: "Find expertise", ru: "Найти экспертизу", "zh-Hans": "寻找专业人才" })} />
            <ActionLink index={1} href="/projects" icon={FolderKanban} label={tr({ en: "Join a project", ru: "Присоединиться к проекту", "zh-Hans": "加入项目" })} />
            <ActionLink index={2} href="/organizations" icon={Building2} label={tr({ en: "Meet partners", ru: "Найти партнёров", "zh-Hans": "寻找合作伙伴" })} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--color-primary)] py-[56px] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 lg:grid-cols-[455px_minmax(0,1fr)] lg:px-12">
          <div data-reveal="left" className="scroll-reveal">
            <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-blue-100">
              {tr({ en: "COOPERATION IN PRACTICE", ru: "СОТРУДНИЧЕСТВО НА ПРАКТИКЕ", "zh-Hans": "把合作落到实处" })}
            </p>
            <h2 className="mt-3 text-balance font-geist text-[33px] font-[650] leading-[1.14]">
              {tr({
                en: "A useful connection is only the beginning.",
                ru: "Полезный контакт — только начало.",
                "zh-Hans": "有价值的联系只是开始。",
              })}
            </h2>
            <p className="mt-4 max-w-[420px] font-inter text-[15px] leading-6 text-blue-100">
              {tr({
                en: "Talents Hub helps turn the first conversation into a team, a plan and a result that matters across borders.",
                ru: "Talents Hub помогает превратить первый разговор в команду, план и значимый международный результат.",
                "zh-Hans": "Talents Hub 帮助将第一次对话转化为团队、计划和具有跨国价值的成果。",
              })}
            </p>
            <Button asChild className="mt-6 bg-white text-[var(--color-primary)] hover:bg-blue-50">
              <Link href="/signup">
                {tr({ en: "Join Talents Hub", ru: "Присоединиться к Talents Hub", "zh-Hans": "加入 Talents Hub" })}
              </Link>
            </Button>
          </div>
          <div data-reveal="right" className="scroll-reveal grid min-h-[230px] grid-cols-1 border border-white/30 sm:grid-cols-3">
            <ImpactPoint icon={MessageCircle} title={tr({ en: "Direct contact", ru: "Прямой контакт", "zh-Hans": "直接联系" })} text={tr({ en: "people speak without unnecessary barriers", ru: "люди общаются без лишних барьеров", "zh-Hans": "减少沟通障碍" })} />
            <ImpactPoint icon={Handshake} title={tr({ en: "Shared context", ru: "Общий контекст", "zh-Hans": "共同背景" })} text={tr({ en: "countries and cultures become an advantage", ru: "страны и культуры становятся преимуществом", "zh-Hans": "让国家与文化差异成为优势" })} />
            <ImpactPoint icon={Rocket} title={tr({ en: "Real action", ru: "Реальное действие", "zh-Hans": "真正行动" })} text={tr({ en: "ideas grow into international projects", ru: "идеи превращаются в международные проекты", "zh-Hans": "让创意发展为国际项目" })} />
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}

function NetworkScene() {
  const { tr } = useLocale();

  return (
    <div
      aria-label={tr({
        en: "A live network connecting talent, projects and organisations",
        ru: "Живая сеть, соединяющая таланты, проекты и организации",
        "zh-Hans": "连接人才、项目与机构的活跃网络",
      })}
      className="about-hero-visual-intro relative mx-auto hidden h-[430px] w-full max-w-[690px] lg:block"
    >
      <div className="absolute inset-[28px_52px_24px_42px] rounded-[28px] border border-white/10 bg-white/[0.025]" />
      <div className="absolute left-1/2 top-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/20" />
      <div className="absolute left-1/2 top-1/2 size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/15" />
      <div className="absolute left-1/2 top-1/2 size-[118px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/[0.06]" />

      <div className="about-core absolute left-1/2 top-1/2 z-20 flex size-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[var(--color-primary)] text-center shadow-[0_0_0_12px_rgba(37,99,235,0.12),0_18px_48px_rgba(0,0,0,0.28)]">
        <Globe2 aria-hidden="true" size={19} className="text-blue-100" />
        <span className="mt-1 font-geist text-xs font-bold">Talents Hub</span>
      </div>

      <Connection className="left-[194px] top-[155px] w-[112px] rotate-[24deg]" />
      <Connection className="right-[175px] top-[175px] w-[122px] -rotate-[24deg]" delay="800ms" />
      <Connection className="left-[324px] top-[257px] w-[86px] rotate-[94deg]" delay="1400ms" />

      <SceneCard className="about-node-one left-[18px] top-[54px]" icon={UsersRound} eyebrow={tr({ en: "TALENT", ru: "СПЕЦИАЛИСТ", "zh-Hans": "人才" })} title={tr({ en: "Project strategist", ru: "Проектный стратег", "zh-Hans": "项目策略专家" })} meta={tr({ en: "Almaty · Open to collaborate", ru: "Алматы · Открыта к проектам", "zh-Hans": "阿拉木图 · 欢迎合作" })} />
      <SceneCard className="about-node-two right-[2px] top-[92px]" icon={FolderKanban} eyebrow={tr({ en: "PROJECT", ru: "ПРОЕКТ", "zh-Hans": "项目" })} title={tr({ en: "Cross-border mentor circle", ru: "Международный круг наставников", "zh-Hans": "跨境导师圈" })} meta={tr({ en: "3 specialists wanted", ru: "Нужны 3 специалиста", "zh-Hans": "招募 3 位专业人士" })} />
      <SceneCard className="about-node-three bottom-[32px] left-[96px]" icon={Building2} eyebrow={tr({ en: "ORGANISATION", ru: "ОРГАНИЗАЦИЯ", "zh-Hans": "机构" })} title={tr({ en: "International programme", ru: "Международная программа", "zh-Hans": "国际合作项目" })} meta={tr({ en: "Partners across the SCO", ru: "Партнёры в странах ШОС", "zh-Hans": "上合组织国家合作伙伴" })} />

      <span className="about-live-badge absolute bottom-[44px] right-[68px] inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-[var(--color-hero-card)] px-3 py-2 font-inter text-[10px] font-bold text-blue-100 shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
        <span className="about-status-dot size-1.5 rounded-full bg-emerald-400" />
        {tr({ en: "NETWORK ACTIVE", ru: "СЕТЬ АКТИВНА", "zh-Hans": "网络活跃" })}
      </span>
    </div>
  );
}

function Connection({ className, delay = "0ms" }: { className: string; delay?: string }) {
  return (
    <span className={`absolute z-10 h-px origin-left bg-blue-300/25 ${className}`}>
      <span className="about-signal absolute -top-0.5 left-0 size-1 rounded-full bg-blue-200 shadow-[0_0_8px_rgba(191,219,254,0.9)]" style={{ animationDelay: delay }} />
    </span>
  );
}

function SceneCard({ className, icon: Icon, eyebrow, title, meta }: { className: string; icon: typeof UsersRound; eyebrow: string; title: string; meta: string }) {
  return (
    <article className={`absolute z-30 w-[230px] rounded-xl border border-white/15 bg-[var(--color-hero-card)] p-4 shadow-[0_14px_28px_rgba(0,0,0,0.26)] ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-200">
          <Icon aria-hidden="true" size={17} />
        </span>
        <div className="min-w-0">
          <p className="font-geist-mono text-[9px] font-bold tracking-[0.12em] text-blue-300">{eyebrow}</p>
          <h2 className="mt-1 font-inter text-[13px] font-bold leading-[1.25] text-white">{title}</h2>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 font-inter text-[10px] text-blue-200">
        <MapPin aria-hidden="true" size={12} />
        {meta}
      </p>
    </article>
  );
}

function MobileNetworkPoint({ icon: Icon, label, featured = false }: { icon: typeof UsersRound; label: string; featured?: boolean }) {
  return (
    <span className="relative z-10 flex flex-col items-center gap-2 text-center font-inter text-[10px] font-bold text-blue-100">
      <span className={`flex size-9 items-center justify-center rounded-full border ${featured ? "border-blue-300/40 bg-[var(--color-primary)] text-white shadow-[0_0_0_6px_rgba(37,99,235,0.12)]" : "border-white/15 bg-[var(--color-hero-card)] text-blue-200"}`}>
        <Icon aria-hidden="true" size={15} />
      </span>
      {label}
    </span>
  );
}

function Statement({ icon: Icon, label, title, children, reveal }: { icon: typeof Target; label: string; title: string; children: React.ReactNode; reveal: "left" | "right" }) {
  return (
    <article data-reveal={reveal} className="scroll-reveal flex min-h-[335px] flex-col justify-between rounded-[10px] border border-[var(--color-card-blue-border)] bg-white p-7 shadow-[0_5px_14px_rgba(30,58,138,0.05)] sm:p-9">
      <div>
        <div className="flex items-center gap-3 font-geist-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
          <span className="flex size-10 items-center justify-center rounded-[9px] bg-[var(--color-soft-blue)]">
            <Icon aria-hidden="true" size={19} />
          </span>
          {label}
        </div>
        <h3 className="mt-8 max-w-[560px] text-balance font-geist text-2xl font-[650] leading-[1.2] tracking-[-0.02em] sm:text-[28px]">{title}</h3>
      </div>
      <p className="mt-6 max-w-[620px] font-inter text-sm leading-6 text-[var(--color-muted)]">{children}</p>
    </article>
  );
}

function ActionLink({ href, icon: Icon, label, index }: { href: "/talents" | "/projects" | "/organizations"; icon: typeof UsersRound; label: string; index: number }) {
  return (
    <Link
      href={href}
      data-reveal="up"
      style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
      className="scroll-reveal group flex min-h-[210px] flex-col justify-between rounded-[10px] border border-[var(--color-card-blue-border)] bg-white p-5 shadow-[0_5px_14px_rgba(30,58,138,0.07)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(30,58,138,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <span className="flex size-10 items-center justify-center rounded-[9px] bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
        <Icon aria-hidden="true" size={19} />
      </span>
      <span className="flex items-end justify-between gap-3 font-inter text-sm font-bold text-[var(--color-ink)]">
        {label}
        <ArrowRight aria-hidden="true" size={17} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
      </span>
    </Link>
  );
}

function ImpactPoint({ icon: Icon, title, text }: { icon: typeof MessageCircle; title: string; text: string }) {
  return (
    <div className="flex flex-col justify-center gap-3 border-b border-white/30 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <Icon aria-hidden="true" size={22} className="text-blue-100" />
      <h3 className="font-inter text-sm font-bold">{title}</h3>
      <p className="font-inter text-xs leading-5 text-blue-100">{text}</p>
    </div>
  );
}
