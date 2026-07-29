import { apiFetch, toQuery } from "@/lib/api";
import type { Profile } from "@/lib/contracts";
import type { PaginatedResponse } from "@/lib/pagination";

export type ProfileSearchParams = {
  search?: string;
  availability?: string;
  country?: string;
  skill?: string;
  language?: string;
  workFormat?: string;
  page?: number;
};

export function getProfilesPage(params: ProfileSearchParams = {}) {
  return apiFetch<PaginatedResponse<Profile>>(`/v1/profiles/${toQuery({
    search: params.search,
    availability: params.availability,
    "country__code": params.country,
    "skills__skill__slug": params.skill,
    "languages__language__code": params.language,
    "remote_preference__slug": params.workFormat,
    page: params.page,
  })}`);
}

export async function getProfiles(params: ProfileSearchParams = {}) {
  return (await getProfilesPage(params)).results;
}

export function getProfile(slug: string) {
  return apiFetch<Profile>(`/v1/profiles/${encodeURIComponent(slug)}/`);
}
