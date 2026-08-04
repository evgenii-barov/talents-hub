"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleUserRound,
  Compass,
  Ellipsis,
  FolderKanban,
  GraduationCap,
  Globe2,
  Handshake,
  Languages,
  MapPin,
  MessageCircleHeart,
  Rocket,
  Scale,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

const featuredProjects: {
  id: string;
  category: string;
  accentClass: string;
  icon: LucideIcon;
  title: string;
  description: string;
  roles: string;
}[] = [
  {
    id: "legal-bridge",
    category: "SUPPORT & PROFESSIONAL SERVICES",
    accentClass: "text-[var(--color-green)]",
    icon: Scale,
    title: "Build a China–Iran legal working group.",
    description:
      "A China-based lawyer is looking for Iranian counsel to support a joint market-entry project.",
    roles: "+2",
  },
  {
    id: "digital-trade-research",
    category: "SCIENCE & EDUCATION",
    accentClass: "text-[var(--color-primary)]",
    icon: GraduationCap,
    title: "Compare digital trade rules across international markets.",
    description:
      "Alumni, researchers and policy experts are preparing a practical guide for cross-border teams.",
    roles: "+3",
  },
  {
    id: "founder-mentoring",
    category: "BUSINESS & ENTREPRENEURSHIP",
    accentClass: "text-violet-700",
    icon: Handshake,
    title: "Launch a cross-border mentor circle for founders.",
    description:
      "Entrepreneurs from Kazakhstan, China and Russia are inviting mentors with regional experience.",
    roles: "+4",
  },
];

const talents = [
  {
    initials: "LW",
    colorClass: "bg-violet-700",
    name: "Lin Wei",
    role: "International business lawyer · Open to collaborate",
    location: "Beijing, China · Remote",
    skills: ["Commercial Law", "Market Entry"],
  },
  {
    initials: "SR",
    colorClass: "bg-teal-700",
    name: "Samin Rahimi",
    role: "Corporate lawyer · Available for consultations",
    location: "Tehran, Iran · Remote",
    skills: ["Corporate Law", "Compliance"],
  },
  {
    initials: "AS",
    colorClass: "bg-pink-600",
    name: "Aigerim Sadykova",
    role: "International partnerships manager · Open to projects",
    location: "Almaty, Kazakhstan · Hybrid",
    skills: ["Partnerships", "Project Launch"],
  },
];

const journey: {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}[] = [
  {
    icon: CircleUserRound,
    number: "01",
    title: "Present your expertise",
    description:
      "Show your experience, languages and the countries where you can help.",
  },
  {
    icon: Compass,
    number: "02",
    title: "Look across borders",
    description: "Find specialists, alumni and requests across the international youth community.",
  },
  {
    icon: MessageCircleHeart,
    number: "03",
    title: "Start a direct dialogue",
    description: "Discuss the task, local context and a useful format for cooperation.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Build together",
    description: "Form an international team and turn expertise into a shared result.",
  },
];

const featuredProjectsRu = [
  {
    category: "СОПРОВОЖДЕНИЕ И ПРОФЕССИОНАЛЬНЫЕ УСЛУГИ",
    title: "Создаём юридическую рабочую группу Китай — Иран.",
    description:
      "Юрист из Китая ищет коллегу из Ирана для сопровождения совместного выхода на новый рынок.",
  },
  {
    category: "НАУЧНЫЕ И ОБРАЗОВАТЕЛЬНЫЕ ПРОЕКТЫ",
    title: "Сравниваем правила цифровой торговли на международных рынках.",
    description:
      "Выпускники, исследователи и эксперты готовят практический гид для международных команд.",
  },
  {
    category: "БИЗНЕС И ПРЕДПРИНИМАТЕЛЬСТВО",
    title: "Запускаем международный круг наставников для основателей.",
    description:
      "Предприниматели из Казахстана, Китая и России ищут наставников с опытом работы в регионе.",
  },
];

const talentsRu = [
  {
    role: "Юрист по международному бизнесу · Открыт к сотрудничеству",
    location: "Пекин, Китай · Удалённо",
    skills: ["Коммерческое право", "Выход на рынок"],
  },
  {
    role: "Корпоративный юрист · Доступна для консультаций",
    location: "Тегеран, Иран · Удалённо",
    skills: ["Корпоративное право", "Комплаенс"],
  },
  {
    role: "Менеджер международных партнёрств · Открыта к проектам",
    location: "Алматы, Казахстан · Гибридно",
    skills: ["Партнёрства", "Запуск проектов"],
  },
];

const journeyRu = [
  {
    title: "Покажите свою экспертизу",
    description:
      "Расскажите об опыте, языках и странах, в которых вы можете быть полезны.",
  },
  {
    title: "Ищите без границ",
    description: "Находите специалистов, выпускников и запросы в международном молодёжном сообществе.",
  },
  {
    title: "Начните прямой диалог",
    description: "Обсудите задачу, местный контекст и удобный формат сотрудничества.",
  },
  {
    title: "Создавайте вместе",
    description:
      "Соберите международную команду и превратите экспертизу в общий результат.",
  },
];

const featuredProjectsZhHans = [
  {
    category: "专业支持与服务",
    title: "组建中国—伊朗法律工作组。",
    description: "一位中国律师正在寻找伊朗法律顾问，共同支持市场进入项目。",
  },
  {
    category: "科研与教育项目",
    title: "比较国际市场的数字贸易规则。",
    description: "校友、研究人员和政策专家正在为跨境团队编写实用指南。",
  },
  {
    category: "商业与创业",
    title: "为创业者发起跨境导师圈。",
    description: "来自哈萨克斯坦、中国和俄罗斯的创业者正在寻找具有区域经验的导师。",
  },
];

const talentsZhHans = [
  {
    role: "国际商务律师 · 欢迎合作",
    location: "中国北京 · 远程",
    skills: ["商法", "市场准入"],
  },
  {
    role: "公司律师 · 可提供咨询",
    location: "伊朗德黑兰 · 远程",
    skills: ["公司法", "合规"],
  },
  {
    role: "国际合作经理 · 欢迎项目合作",
    location: "哈萨克斯坦阿拉木图 · 混合办公",
    skills: ["合作伙伴关系", "项目启动"],
  },
];

const journeyZhHans = [
  {
    title: "展示专业能力",
    description: "介绍您的经验、语言以及可以提供帮助的国家和地区。",
  },
  {
    title: "跨越国界寻找伙伴",
    description: "在国际青年社群中发现专业人士、校友和合作需求。",
  },
  {
    title: "开始直接对话",
    description: "讨论任务、本地背景和合适的合作方式。",
  },
  {
    title: "共同创造成果",
    description: "组建国际团队，将专业能力转化为共同成果。",
  },
];

function Avatar({
  initials,
  colorClass,
  size = "size-11",
}: {
  initials: string;
  colorClass: string;
  size?: string;
}) {
  return (
    <span
      className={`${size} ${colorClass} flex shrink-0 items-center justify-center rounded-full font-geist text-xs font-bold text-white`}
    >
      {initials}
    </span>
  );
}

function HeroLanguages({ className = "" }: { className?: string }) {
  const { tr } = useLocale();
  const languages = [
    { mark: "EN", name: "English" },
    { mark: "РУ", name: "Русский" },
    { mark: "中", name: "中文" },
    { mark: "فا", name: "فارسی" },
  ];

  return (
    <div
      className={`${className} flex items-center gap-2 rounded-full border border-white/10 bg-white/10 py-1.5 pl-2.5 pr-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur-sm`}
    >
      <Languages aria-hidden="true" size={15} className="text-blue-200" />
      <span className="sr-only">
        {tr({
          en: "Languages in the network",
          ru: "Языки сообщества",
          "zh-Hans": "社群语言",
        })}
      </span>
      <div className="flex items-center gap-1" aria-hidden="true">
        {languages.map((language) => (
          <span
            key={language.mark}
            title={language.name}
            className="flex size-7 items-center justify-center rounded-full bg-white/10 font-inter text-[9px] font-bold text-white ring-1 ring-inset ring-white/10"
          >
            {language.mark}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroOrganizationCard({ className = "" }: { className?: string }) {
  const { tr } = useLocale();

  return (
    <article
      className={`${className} rounded-xl border border-white/15 bg-white p-3.5 text-[var(--color-ink)] shadow-[0_12px_24px_rgba(0,0,0,0.2)]`}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
          <Building2 aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-inter text-[9px] font-bold tracking-[0.07em] text-[var(--color-primary)]">
            {tr({
              en: "ALUMNI ORGANISATION",
              ru: "ОРГАНИЗАЦИЯ ВЫПУСКНИКОВ",
              "zh-Hans": "校友组织",
            })}
          </p>
          <h2 className="mt-0.5 font-geist text-[13px] font-[650] leading-tight">
            {tr({
              en: "International Legal Alumni Network",
              ru: "Международная сеть выпускников-юристов",
              "zh-Hans": "国际法律校友网络",
            })}
          </h2>
          <p className="mt-1 font-inter text-[10px] text-[var(--color-muted)]">
            {tr({
              en: "China · Iran · Russia",
              ru: "Китай · Иран · Россия",
              "zh-Hans": "中国 · 伊朗 · 俄罗斯",
            })}
          </p>
        </div>
      </div>
    </article>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: (typeof featuredProjects)[number];
  index: number;
}) {
  const { tr } = useLocale();
  const Icon = project.icon;
  return (
    <article
      data-reveal="up"
      style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
      className="scroll-reveal flex min-h-[318px] flex-col justify-between rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] motion-reduce:transition-none"
    >
      <div className="space-y-[14px]">
        <div className="flex flex-col items-start gap-2">
          <span
            className={`inline-flex max-w-full rounded-lg bg-[var(--color-soft-blue)] px-2.5 py-1 font-inter text-[10px] font-bold leading-4 sm:whitespace-nowrap sm:rounded-full ${project.accentClass}`}
          >
            {project.category}
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-inter text-[11px] text-[var(--color-muted)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--color-green)]"
            />
            {tr({
              en: "Open to collaborators",
              ru: "Открыто для участников",
              "zh-Hans": "开放合作",
            })}
          </span>
        </div>
        <span
          className={`flex size-[34px] items-center justify-center rounded-lg bg-[var(--color-soft-blue)] ${project.accentClass}`}
        >
          <Icon size={18} />
        </span>
        <h3 className="text-balance font-geist text-[19px] font-[650] leading-[1.2] text-[var(--color-ink)]">
          {project.title}
        </h3>
        <p className="text-pretty font-inter text-[13px] leading-[1.45] text-[var(--color-muted)]">
          {project.description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]">
          <b className="flex size-[25px] items-center justify-center rounded-full bg-[var(--color-soft-blue)] text-[10px] text-[var(--color-primary)]">
            {project.roles}
          </b>
          {tr({
            en: "specialists wanted",
            ru: "нужны специалисты",
            "zh-Hans": "招募专业人士",
          })}
        </span>
        <Link
          aria-label={tr({
            en: `Open ${project.title}`,
            ru: `Открыть проект «${project.title}»`,
            "zh-Hans": `打开项目“${project.title}”`,
          })}
          href="/projects"
          className="flex size-8 items-center justify-center rounded-md bg-neutral-100 text-[var(--color-ink)] hover:bg-[var(--color-soft-blue)]"
        >
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const { localize, tr } = useLocale();

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

    root.classList.remove("home-intro-play");
    root.classList.add("motion-ready");
    const introFrame = window.requestAnimationFrame(() => {
      root.classList.add("home-intro-play");

      if (reduceMotion || !supportsObserver) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
      );

      elements.forEach((element) => observer?.observe(element));
    });

    const cleanupMotionClasses = () => {
      window.cancelAnimationFrame(introFrame);
      observer?.disconnect();
      root.classList.remove("home-intro-play", "motion-ready");
    };

    if (reduceMotion || !supportsObserver) {
      elements.forEach((element) => element.classList.add("is-visible"));
    }

    return cleanupMotionClasses;
  }, []);
  const localizedProjects = featuredProjects.map((project, index) =>
    localize({
      en: project,
      ru: { ...project, ...featuredProjectsRu[index] },
      "zh-Hans": { ...project, ...featuredProjectsZhHans[index] },
    }),
  );
  const localizedTalents = talents.map((talent, index) =>
    localize({
      en: talent,
      ru: { ...talent, ...talentsRu[index] },
      "zh-Hans": { ...talent, ...talentsZhHans[index] },
    }),
  );
  const localizedJourney = journey.map((step, index) =>
    localize({
      en: step,
      ru: { ...step, ...journeyRu[index] },
      "zh-Hans": { ...step, ...journeyZhHans[index] },
    }),
  );
  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[var(--color-hero)] text-white">
          <div className="mx-auto grid min-h-[464px] max-w-[1440px] grid-cols-1 px-6 py-14 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:px-12 lg:py-[68px]">
            <div className="relative z-10">
              <span
                style={{ "--intro-delay": "160ms" } as CSSProperties}
                className="home-hero-intro inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 font-inter text-[11px] font-semibold text-blue-100"
              >
                <span className="size-1.5 rounded-full bg-[var(--color-green)]" />
                {tr({
                  en: "INTERNATIONAL YOUTH COMMUNITY",
                  ru: "МЕЖДУНАРОДНОЕ МОЛОДЁЖНОЕ СООБЩЕСТВО",
                  "zh-Hans": "国际青年专业社群",
                })}
              </span>
              <h1
                style={{ "--intro-delay": "230ms" } as CSSProperties}
                className="home-hero-intro mt-5 whitespace-pre-line font-geist text-[clamp(2rem,10.5vw,2.625rem)] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[45px]"
              >
                {tr({
                  en: "Expertise across borders.\nCollaboration in action.",
                  ru: "Экспертиза без границ.\nСотрудничество в действии.",
                  "zh-Hans": "专业无国界。\n合作见行动。",
                })}
              </h1>
              <p
                style={{ "--intro-delay": "310ms" } as CSSProperties}
                className="home-hero-intro mt-5 max-w-[485px] font-inter text-base leading-6 text-[var(--color-hero-muted)]"
              >
                {tr({
                  en: "An international youth professional community where specialists find trusted peers, exchange expertise and launch collaborative projects.",
                  ru: "Международное молодёжное профессиональное сообщество, где специалисты находят надёжных партнёров, обмениваются экспертизой и запускают совместные проекты.",
                  "zh-Hans": "一个国际青年专业社群，帮助专业人士找到可信赖的伙伴、交流经验并发起合作项目。",
                })}
              </p>
              <div
                style={{ "--intro-delay": "390ms" } as CSSProperties}
                className="home-hero-intro mt-6 flex flex-wrap gap-3"
              >
                <Button asChild size="lg">
                  <Link href="/talents">
                    {tr({
                      en: "Find a specialist",
                      ru: "Найти специалиста",
                      "zh-Hans": "寻找专业人士",
                    })}{" "}
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/signup">
                    {tr({
                      en: "Join the community",
                      ru: "Войти в сообщество",
                      "zh-Hans": "加入社群",
                    })}
                  </Link>
                </Button>
              </div>
              <div
                style={{ "--intro-delay": "470ms" } as CSSProperties}
                className="home-hero-intro mt-11 flex flex-wrap gap-6 font-inter text-xs text-[var(--color-hero-muted)]"
              >
                <span>
                  <b className="text-white">
                    {tr({ en: "YOUTH", ru: "ВМЕСТЕ", "zh-Hans": "青年" })}
                  </b>{" "}
                  {tr({
                    en: "shared professional space",
                    ru: "общее профессиональное пространство",
                    "zh-Hans": "共同专业空间",
                  })}
                </span>
                <span>
                  <b className="text-white">P2P</b>{" "}
                  {tr({
                    en: "direct expert connections",
                    ru: "прямые связи между экспертами",
                    "zh-Hans": "专业人士直接连接",
                  })}
                </span>
                <span>
                  <b className="text-white">OPEN</b>{" "}
                  {tr({
                    en: "to international cooperation",
                    ru: "к международному сотрудничеству",
                    "zh-Hans": "开放国际合作",
                  })}
                </span>
              </div>
              <div
                style={{ "--intro-delay": "540ms" } as CSSProperties}
                className="home-hero-intro mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:hidden"
              >
                <HeroOrganizationCard />
                <HeroLanguages className="justify-self-start sm:self-center" />
              </div>
            </div>
            <div
              className="home-hero-visual-intro relative hidden h-[410px] items-center justify-end lg:flex"
            >
              <div className="hero-visual-stage relative h-[410px] w-[630px]">
              <div className="hero-orbit absolute right-[84px] top-[12px] size-[360px] rounded-full border border-blue-400/25 bg-blue-600/10" />
              <div className="hero-demo-card absolute left-[40px] top-[58px] z-10 w-[320px] rounded-xl bg-white p-[18px] text-[var(--color-ink)] shadow-[0_12px_24px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-soft-green)] px-2 py-1 font-inter text-[10px] font-bold tracking-[0.04em] text-emerald-700">
                    <span className="size-1.5 rounded-full bg-[var(--color-green)]" />
                    {tr({
                      en: "COLLABORATION REQUEST",
                      ru: "ЗАПРОС НА СОТРУДНИЧЕСТВО",
                      "zh-Hans": "合作需求",
                    })}
                  </span>
                  <Ellipsis
                    aria-hidden="true"
                    className="text-[var(--color-muted)]"
                    size={18}
                  />
                </div>
                <h2 className="mt-3 font-geist text-xl font-[650]">
                  {tr({
                    en: "Legal bridge: China ↔ Iran",
                    ru: "Юридический мост: Китай ↔ Иран",
                    "zh-Hans": "法律桥梁：中国 ↔ 伊朗",
                  })}
                </h2>
                <p className="mt-2 font-inter text-xs leading-[1.4] text-[var(--color-muted)]">
                  {tr({
                    en: "A China-based lawyer is looking for Iranian counsel to advise a joint market-entry project.",
                    ru: "Юрист из Китая ищет коллегу из Ирана для консультации по совместному выходу на рынок.",
                    "zh-Hans": "一位中国律师正在寻找伊朗法律顾问，为联合市场进入项目提供建议。",
                  })}
                </p>
                <p className="mt-3 font-inter text-[10px] font-bold tracking-[0.05em] text-[var(--color-muted)]">
                  {tr({
                    en: "EXPERTISE NEEDED",
                    ru: "НУЖНА ЭКСПЕРТИЗА",
                    "zh-Hans": "所需专业能力",
                  })}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-semibold text-[var(--color-primary)]">
                    {tr({
                      en: "China counsel",
                      ru: "Юрист по Китаю",
                      "zh-Hans": "中国法律顾问",
                    })}
                  </span>
                  <span className="rounded-full bg-[var(--color-soft-blue)] px-2 py-1 font-inter text-[10px] font-semibold text-[var(--color-primary)]">
                    {tr({
                      en: "Iran counsel",
                      ru: "Юрист по Ирану",
                      "zh-Hans": "伊朗法律顾问",
                    })}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    <Avatar
                      initials="LW"
                      colorClass="bg-violet-700"
                      size="size-[25px]"
                    />
                    <Avatar
                      initials="SR"
                      colorClass="bg-teal-700"
                      size="size-[25px]"
                    />
                    <Avatar
                      initials="+2"
                      colorClass="bg-slate-500"
                      size="size-[25px]"
                    />
                  </div>
                  <span className="font-inter text-[11px] font-semibold text-[var(--color-primary)]">
                    {tr({
                      en: "Team is forming",
                      ru: "Команда формируется",
                      "zh-Hans": "团队组建中",
                    })}
                  </span>
                </div>
              </div>
              <div className="hero-demo-card hero-demo-card-profile absolute right-0 top-[157px] z-20 w-[230px] rounded-xl bg-[var(--color-hero-card)] p-4 shadow-[0_12px_22px_rgba(0,0,0,0.28)]">
                <div className="flex justify-between">
                  <Avatar
                    initials="SR"
                    colorClass="bg-pink-600"
                    size="size-[38px]"
                  />
                  <span className="self-start rounded-full bg-white/10 px-2 py-1 font-inter text-[10px] font-bold">
                    {tr({
                      en: "RELEVANT MATCH",
                      ru: "ПОДХОДЯЩИЙ КОНТАКТ",
                      "zh-Hans": "高度相关",
                    })}
                  </span>
                </div>
                <h2 className="mt-2.5 font-geist text-[15px] font-[650]">
                  Samin Rahimi
                </h2>
                <p className="mt-1 font-inter text-[11px] text-blue-200">
                  {tr({
                    en: "Corporate lawyer · Iran",
                    ru: "Корпоративный юрист · Иран",
                    "zh-Hans": "公司律师 · 伊朗",
                  })}
                </p>
                <div className="mt-3 flex gap-1">
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-blue-100">
                    {tr({
                      en: "Market entry",
                      ru: "Выход на рынок",
                      "zh-Hans": "市场准入",
                    })}
                  </span>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-blue-100">
                    {tr({
                      en: "Commercial law",
                      ru: "Коммерческое право",
                      "zh-Hans": "商法",
                    })}
                  </span>
                </div>
                <p className="mt-4 flex items-center gap-1.5 font-inter text-[10px] font-semibold text-blue-100">
                  <Sparkles
                    aria-hidden="true"
                    size={14}
                    className="text-blue-400"
                  />
                  {tr({
                    en: "Ready to collaborate",
                    ru: "Готова к сотрудничеству",
                    "zh-Hans": "可开展合作",
                  })}
                </p>
              </div>
              <HeroOrganizationCard className="hero-demo-card hero-demo-card-organization absolute -bottom-9 right-[132px] z-20 w-[286px]" />
              <div className="hero-spark absolute left-[327px] top-[126px] z-30 flex size-[50px] items-center justify-center rounded-full bg-[var(--color-primary)] shadow-[0_6px_14px_rgba(37,99,235,0.53)]">
                <Sparkles aria-hidden="true" size={20} />
              </div>
              <span className="absolute right-0 top-[18px] inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 font-inter text-[10px] font-bold">
                <span className="hero-status-dot size-1.5 rounded-full bg-[var(--color-green)]" />
                {tr({
                  en: "CROSS-BORDER MATCH",
                  ru: "МЕЖДУНАРОДНЫЙ КОНТАКТ",
                  "zh-Hans": "跨境匹配",
                })}
              </span>
              <HeroLanguages className="absolute right-0 top-[54px] z-20" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface)] py-[38px] pb-[46px]">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            <div
              data-reveal="up"
              className="home-scroll-reveal scroll-reveal flex items-end justify-between"
            >
              <div>
                <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">
                  {tr({
                    en: "INTERNATIONAL COLLABORATION",
                    ru: "МЕЖДУНАРОДНОЕ СОТРУДНИЧЕСТВО",
                    "zh-Hans": "国际合作",
                  })}
                </p>
                <h2 className="mt-2 font-geist text-[30px] font-[650]">
                  {tr({
                    en: "Requests that connect expertise across countries.",
                    ru: "Запросы, которые соединяют экспертизу разных стран.",
                    "zh-Hans": "连接不同国家专业能力的合作需求。",
                  })}
                </h2>
              </div>
              <Link
                href="/projects"
                className="hidden items-center gap-1.5 font-inter text-sm font-semibold text-[var(--color-primary)] md:flex"
              >
                {tr({
                  en: "View all requests",
                  ru: "Все запросы",
                  "zh-Hans": "查看全部需求",
                })}{" "}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div className="mt-[34px] grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {localizedProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-soft-blue)] py-[42px]">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-6 lg:grid-cols-[370px_742px] lg:px-12">
            <div data-reveal="left" className="scroll-reveal pt-1">
              <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">
                {tr({
                  en: "EXPERTISE ACROSS THE REGION",
                  ru: "ЭКСПЕРТИЗА СО ВСЕГО РЕГИОНА",
                  "zh-Hans": "汇聚区域专业能力",
                })}
              </p>
              <h2 className="mt-3 font-geist text-[30px] font-[650] leading-[1.15]">
                {tr({
                  en: "The specialist you need may be one border away.",
                  ru: "Нужный специалист может быть по другую сторону границы.",
                  "zh-Hans": "您需要的专业人士，也许就在邻国。",
                })}
              </h2>
              <p className="mt-4 max-w-[350px] font-inter text-sm leading-[1.5] text-[var(--color-muted)]">
                {tr({
                  en: "Find alumni and professionals who understand the local context, speak the right language and are ready for direct cooperation.",
                  ru: "Находите выпускников и профессионалов, которые знают местный контекст, говорят на нужном языке и готовы к прямому сотрудничеству.",
                  "zh-Hans": "寻找了解本地背景、掌握所需语言并愿意直接合作的校友和专业人士。",
                })}
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/talents">
                  {tr({
                    en: "Browse specialists",
                    ru: "Найти специалиста",
                    "zh-Hans": "浏览专业人士",
                  })}
                </Link>
              </Button>
            </div>
            <div className="grid gap-[14px] sm:grid-cols-3">
              {localizedTalents.map((talent, index) => (
                <article
                  key={talent.name}
                  data-reveal="up"
                  style={
                    { "--reveal-delay": `${index * 90}ms` } as CSSProperties
                  }
                  className="scroll-reveal flex min-h-[305px] flex-col justify-between rounded-[10px] border border-[var(--color-card-blue-border)] bg-white p-[18px] shadow-[0_5px_14px_rgba(30,58,138,0.07)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(30,58,138,0.13)] motion-reduce:transition-none"
                >
                  <div>
                    <div className="flex justify-between">
                      <Avatar
                        initials={talent.initials}
                        colorClass={talent.colorClass}
                      />
                      <span className="flex size-[26px] items-center justify-center rounded-full bg-[var(--color-soft-green)] text-[var(--color-green)]">
                        <BadgeCheck aria-hidden="true" size={15} />
                      </span>
                    </div>
                    <h3 className="mt-3 font-geist text-base font-[650]">
                      {talent.name}
                    </h3>
                    <p className="mt-1 font-inter text-[13px] leading-[1.4] text-[var(--color-muted)]">
                      {talent.role}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 font-inter text-xs text-[var(--color-muted)]">
                      <MapPin
                        aria-hidden="true"
                        size={14}
                        className="text-[var(--color-primary)]"
                      />
                      {talent.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-neutral-100 px-2 py-1 font-inter text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-[54px]">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            <div data-reveal="up" className="scroll-reveal">
              <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-[var(--color-primary)]">
                {tr({
                  en: "FROM CONTACT TO COLLABORATION",
                  ru: "ОТ КОНТАКТА К СОТРУДНИЧЕСТВУ",
                  "zh-Hans": "从联系到合作",
                })}
              </p>
              <h2 className="mt-2 font-geist text-[30px] font-[650]">
                {tr({
                  en: "A clear path from first message to a shared result.",
                  ru: "Понятный путь от первого сообщения до общего результата.",
                  "zh-Hans": "从第一条消息到共同成果的清晰路径。",
                })}
              </h2>
            </div>
            <div className="mt-[52px] grid gap-7 md:grid-cols-2 lg:grid-cols-4">
              {localizedJourney.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.number}
                    data-reveal="up"
                    style={
                      { "--reveal-delay": `${index * 80}ms` } as CSSProperties
                    }
                    className={`scroll-reveal flex gap-[14px] ${index < 3 ? "lg:border-r lg:border-[var(--color-border)] lg:pr-[18px]" : ""}`}
                  >
                    <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-soft-blue)] text-[var(--color-primary)]">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <p className="font-geist-mono text-[11px] font-bold text-[var(--color-primary)]">
                        {step.number}
                      </p>
                      <h3 className="mt-1 font-inter text-sm font-bold">
                        {step.title}
                      </h3>
                      <p className="mt-1 font-inter text-xs leading-[1.4] text-[var(--color-muted)]">
                        {step.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[var(--color-primary)] py-[56px] text-white">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-6 lg:grid-cols-[455px_602px] lg:px-12">
            <div data-reveal="left" className="scroll-reveal">
              <p className="font-inter text-[11px] font-bold tracking-[0.08em] text-blue-100">
                {tr({
                  en: "A NETWORK ACROSS BORDERS",
                  ru: "СЕТЬ, КОТОРАЯ ОБЪЕДИНЯЕТ СТРАНЫ",
                  "zh-Hans": "跨越国界的专业网络",
                })}
              </p>
              <h2 className="mt-3 font-geist text-[33px] font-[650] leading-[1.14]">
                {tr({
                  en: "Your next professional connection may begin here.",
                  ru: "Ваше следующее международное партнёрство может начаться здесь.",
                  "zh-Hans": "您的下一段国际专业合作，可能从这里开始。",
                })}
              </h2>
              <p className="mt-4 max-w-[420px] font-inter text-[15px] leading-[1.5] text-blue-100">
                {tr({
                  en: "Join a community where alumni, experts and organisations exchange knowledge, mentor one another and assemble international teams.",
                  ru: "Присоединяйтесь к сообществу, где выпускники, эксперты и организации обмениваются знаниями, находят наставников и собирают международные команды.",
                  "zh-Hans": "加入由校友、专家和机构组成的社群，交流知识、互相指导并组建国际团队。",
                })}
              </p>
              <Button
                asChild
                className="mt-6 bg-white text-[var(--color-primary)] hover:bg-blue-50"
              >
                <Link href="/signup">
                  {tr({
                    en: "Join the professional network",
                    ru: "Войти в профессиональную сеть",
                    "zh-Hans": "加入专业网络",
                  })}
                </Link>
              </Button>
            </div>
            <div
              data-reveal="right"
              style={{ "--reveal-delay": "100ms" } as CSSProperties}
              className="scroll-reveal grid min-h-[254px] grid-cols-1 border border-white/30 sm:grid-cols-3"
            >
              {[
                [
                  UsersRound,
                  tr({ en: "YOUTH", ru: "МОЛОДЁЖЬ", "zh-Hans": "青年" }),
                  tr({
                    en: "a shared space for alumni and experts",
                    ru: "общее пространство для выпускников и экспертов",
                    "zh-Hans": "校友与专家的共同空间",
                  }),
                ],
                [
                  FolderKanban,
                  "P2P",
                  tr({
                    en: "direct specialist-to-specialist dialogue",
                    ru: "прямой диалог между специалистами",
                    "zh-Hans": "专业人士之间的直接对话",
                  }),
                ],
                [
                  Globe2,
                  "OPEN",
                  tr({
                    en: "projects, mentoring and international teams",
                    ru: "проекты, наставничество и международные команды",
                    "zh-Hans": "项目、导师支持与国际团队",
                  }),
                ],
              ].map(([Icon, value, label], index) => {
                const StatIcon = Icon as LucideIcon;
                return (
                  <div
                    key={value as string}
                    className={`flex flex-col justify-center gap-3.5 p-[22px] ${index < 2 ? "border-b border-white/30 sm:border-b-0 sm:border-r" : ""}`}
                  >
                    <StatIcon
                      aria-hidden="true"
                      size={22}
                      className="text-blue-200"
                    />
                    <p className="font-geist-mono text-[28px] font-bold">
                      {value as string}
                    </p>
                    <p className="min-h-14 font-inter text-xs leading-[1.4] text-blue-100">
                      {label as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
