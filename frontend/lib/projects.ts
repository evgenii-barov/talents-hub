import { apiFetch, toQuery } from "@/lib/api";
import type { Project } from "@/lib/contracts";
import type { PaginatedResponse } from "@/lib/pagination";

export type ProjectSearchParams = {
  search?: string;
  category?: string;
  stage?: string;
  workFormat?: string;
  language?: string;
  roleStatus?: string;
  skill?: string;
  organization?: string;
  page?: number;
};

export function getProjectsPage(params: ProjectSearchParams = {}) {
  return apiFetch<PaginatedResponse<Project>>(`/v1/projects/${toQuery({
    search: params.search,
    "category__slug": params.category,
    stage: params.stage,
    "work_format__slug": params.workFormat,
    "working_language__code": params.language,
    "roles__status": params.roleStatus,
    "skills__skill__slug": params.skill,
    "organization__slug": params.organization,
    page: params.page,
  })}`);
}

export async function getProjects(params: ProjectSearchParams = {}) {
  return (await getProjectsPage(params)).results;
}

export function getProject(slug: string) {
  return apiFetch<Project>(`/v1/projects/${encodeURIComponent(slug)}/`);
}
