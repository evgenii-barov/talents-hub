import type { Locale } from "@/components/i18n/locales";

export type TaxonomyLabelSource = {
  name: string;
  slug?: string;
  code?: string;
};

const simplifiedChineseLabels: Readonly<Record<string, string>> = {
  technology: "技术",
  education: "教育",
  "social-impact": "社会影响",
  "creative-industries": "创意产业",
  entrepreneurship: "创业",
  research: "研究",
  sustainability: "可持续发展",
  "artificial-intelligence": "人工智能",
  "web-mobile": "网页与移动产品",
  careers: "职业发展与就业",
  urban: "城市项目",
  inclusion: "包容性",
  climate: "气候与环境",
  "culture-media": "文化与媒体",
  remote: "远程",
  "on-site": "现场",
  onsite: "现场",
  hybrid: "混合办公",
  flexible: "灵活安排",
  secondary: "中等教育",
  vocational: "职业教育",
  bachelor: "学士",
  bachelors: "学士",
  master: "硕士",
  masters: "硕士",
  doctorate: "博士",
  continuing: "继续教育",
  ru: "俄语",
  en: "英语",
  es: "西班牙语",
  zh: "中文",
  fr: "法语",
  de: "德语",
  kk: "哈萨克语",
  uk: "乌克兰语",
  russia: "俄罗斯",
  kazakhstan: "哈萨克斯坦",
  belarus: "白俄罗斯",
  armenia: "亚美尼亚",
  azerbaijan: "阿塞拜疆",
  georgia: "格鲁吉亚",
  kyrgyzstan: "吉尔吉斯斯坦",
  uzbekistan: "乌兹别克斯坦",
  tajikistan: "塔吉克斯坦",
  moldova: "摩尔多瓦",
  ukraine: "乌克兰",
  other: "其他",
  python: "Python",
  "javascript-typescript": "JavaScript / TypeScript",
  "ux-ui-design": "UX/UI 设计",
  "data-analytics": "数据分析",
  "product-management": "产品管理",
  "project-management": "项目管理",
  marketing: "市场营销",
  "content-copywriting": "内容与文案",
  "graphic-design": "平面设计",
  "video-production": "视频制作",
  fundraising: "筹款",
  partnerships: "合作伙伴关系",
  "event-management": "活动管理",
  teaching: "教学",
  "community-management": "社区管理",
  finance: "财务",
  legal: "法律",
  "business-english": "商务英语",
  Moscow: "莫斯科",
  "Saint Petersburg": "圣彼得堡",
  Kazan: "喀山",
  Novosibirsk: "新西伯利亚",
  Yekaterinburg: "叶卡捷琳堡",
  Astana: "阿斯塔纳",
  Almaty: "阿拉木图",
  Karaganda: "卡拉干达",
  Minsk: "明斯克",
  Yerevan: "埃里温",
  Tbilisi: "第比利斯",
  Tashkent: "塔什干",
};

function languagePart(name: string, locale: "ru" | "en"): string {
  const parts = name.split(" / ");
  return locale === "ru" ? parts[0] : parts.at(-1) ?? name;
}
export function resolveTaxonomyLabel(
  locale: Locale,
  item: TaxonomyLabelSource,
): string {
  if (locale === "ru") return languagePart(item.name, "ru");
  const englishName = languagePart(item.name, "en");
  if (locale === "en") return englishName;

  const lookupKeys = [item.code?.toLowerCase(), item.slug, englishName];
  for (const key of lookupKeys) {
    if (key && simplifiedChineseLabels[key]) return simplifiedChineseLabels[key];
  }
  return englishName;
}
