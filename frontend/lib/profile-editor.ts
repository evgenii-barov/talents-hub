import { apiFetch } from "@/lib/api";
import type { ProfileEducation, ProfileExperience, ProfileLanguage, ProfileLink, ProfileProjectPreference, ProfileSkill } from "@/lib/contracts";

export type SkillInput = { skill: string; level?: string; is_primary?: boolean; sort_order?: number };
export type LanguageInput = { language: string; proficiency: string; is_primary?: boolean; sort_order?: number };
export type ExperienceInput = {
  organization_name: string;
  title: string;
  location_text?: string;
  work_format?: string | null;
  started_on: string;
  ended_on?: string | null;
  is_current?: boolean;
  description?: string;
  sort_order?: number;
};
export type EducationInput = {
  institution_name: string;
  degree?: string;
  field_of_study?: string;
  education_level?: string | null;
  started_on: string;
  ended_on?: string | null;
  credential_url?: string;
};
export type ProfileLinkInput = { kind: ProfileLink["kind"]; url: string; label?: string };
export type ProfileProjectPreferenceInput = {
  category?: string | null;
  focus_area?: string | null;
  work_format?: string | null;
  note?: string;
  sort_order?: number;
};

export function createSkill(input: SkillInput) {
  return apiFetch<ProfileSkill>("/v1/me/profile/skills/", { method: "POST", body: input });
}

export function deleteSkill(id: string) {
  return apiFetch<void>(`/v1/me/profile/skills/${id}/`, { method: "DELETE" });
}

export function updateSkill(id: string, input: Partial<SkillInput>) {
  return apiFetch<ProfileSkill>(`/v1/me/profile/skills/${id}/`, { method: "PATCH", body: input });
}

export function createLanguage(input: LanguageInput) {
  return apiFetch<ProfileLanguage>("/v1/me/profile/languages/", { method: "POST", body: input });
}

export function deleteLanguage(id: string) {
  return apiFetch<void>(`/v1/me/profile/languages/${id}/`, { method: "DELETE" });
}

export function updateLanguage(id: string, input: Partial<LanguageInput>) {
  return apiFetch<ProfileLanguage>(`/v1/me/profile/languages/${id}/`, { method: "PATCH", body: input });
}

export function createExperience(input: ExperienceInput) {
  return apiFetch<ProfileExperience>("/v1/me/profile/experiences/", { method: "POST", body: input });
}

export function deleteExperience(id: string) {
  return apiFetch<void>(`/v1/me/profile/experiences/${id}/`, { method: "DELETE" });
}

export function updateExperience(id: string, input: Partial<ExperienceInput>) {
  return apiFetch<ProfileExperience>(`/v1/me/profile/experiences/${id}/`, { method: "PATCH", body: input });
}

export function createEducation(input: EducationInput) {
  return apiFetch<ProfileEducation>("/v1/me/profile/education/", { method: "POST", body: input });
}
export function deleteEducation(id: string) { return apiFetch<void>(`/v1/me/profile/education/${id}/`, { method: "DELETE" }); }
export function updateEducation(id: string, input: Partial<EducationInput>) { return apiFetch<ProfileEducation>(`/v1/me/profile/education/${id}/`, { method: "PATCH", body: input }); }
export function createProfileLink(input: ProfileLinkInput) { return apiFetch<ProfileLink>("/v1/me/profile/links/", { method: "POST", body: input }); }
export function deleteProfileLink(id: string) { return apiFetch<void>(`/v1/me/profile/links/${id}/`, { method: "DELETE" }); }
export function updateProfileLink(id: string, input: Partial<ProfileLinkInput>) { return apiFetch<ProfileLink>(`/v1/me/profile/links/${id}/`, { method: "PATCH", body: input }); }
export function createProjectPreference(input: ProfileProjectPreferenceInput) { return apiFetch<ProfileProjectPreference>("/v1/me/profile/project-preferences/", { method: "POST", body: input }); }
export function deleteProjectPreference(id: string) { return apiFetch<void>(`/v1/me/profile/project-preferences/${id}/`, { method: "DELETE" }); }
export function updateProjectPreference(id: string, input: Partial<ProfileProjectPreferenceInput>) { return apiFetch<ProfileProjectPreference>(`/v1/me/profile/project-preferences/${id}/`, { method: "PATCH", body: input }); }
