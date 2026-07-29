import { authMessages } from "@/components/i18n/catalogs/zh-hans/auth";
import { collaborationMessages } from "@/components/i18n/catalogs/zh-hans/collaboration";
import { commonMessages } from "@/components/i18n/catalogs/zh-hans/common";
import { discoveryMessages } from "@/components/i18n/catalogs/zh-hans/discovery";
import { privacyMessages } from "@/components/i18n/catalogs/zh-hans/privacy";
import { profileMessages } from "@/components/i18n/catalogs/zh-hans/profiles";
import { projectMessages } from "@/components/i18n/catalogs/zh-hans/projects";

export const simplifiedChineseLegacyMessages: Readonly<Record<string, string>> = {
  ...authMessages,
  ...collaborationMessages,
  ...commonMessages,
  ...discoveryMessages,
  ...privacyMessages,
  ...profileMessages,
  ...projectMessages,
};
