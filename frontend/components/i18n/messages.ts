import type { Locale } from "@/components/i18n/locales";

const englishMessages = {
  aboutProject: "About the project",
  applications: "Applications",
  brand: "Talents Hub",
  chat: "Chat",
  createProfile: "Create profile",
  explore: "Explore",
  forOrganisations: "For organisations",
  language: "Interface language",
  mainNavigation: "Main navigation",
  menu: "Menu",
  notifications: "Notifications",
  projects: "Projects",
  signIn: "Sign in",
  signOut: "Sign out",
  talent: "Talent",
} as const;

export type MessageKey = keyof typeof englishMessages;
type MessageCatalog = Readonly<Record<MessageKey, string>>;

const russianMessages: MessageCatalog = {
  aboutProject: "О проекте",
  applications: "Отклики",
  brand: "Talents Hub",
  chat: "Чат",
  createProfile: "Создать профиль",
  explore: "Обзор",
  forOrganisations: "Организациям",
  language: "Язык интерфейса",
  mainNavigation: "Основная навигация",
  menu: "Меню",
  notifications: "Уведомления",
  projects: "Проекты",
  signIn: "Войти",
  signOut: "Выйти",
  talent: "Таланты",
};

const simplifiedChineseMessages: MessageCatalog = {
  aboutProject: "关于项目",
  applications: "申请",
  brand: "Talents Hub",
  chat: "聊天",
  createProfile: "创建个人资料",
  explore: "发现",
  forOrganisations: "机构",
  language: "界面语言",
  mainNavigation: "主导航",
  menu: "菜单",
  notifications: "通知",
  projects: "项目",
  signIn: "登录",
  signOut: "退出登录",
  talent: "人才",
};

export const messages: Readonly<Record<Locale, MessageCatalog>> = {
  ru: russianMessages,
  en: englishMessages,
  "zh-Hans": simplifiedChineseMessages,
};
