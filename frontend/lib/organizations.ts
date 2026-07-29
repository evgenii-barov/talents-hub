import { apiFetch, toQuery } from "@/lib/api";
import type { Organization } from "@/lib/contracts";
import type { PaginatedResponse } from "@/lib/pagination";

export type OrganizationSearchParams = {
  search?: string;
  focus?: string;
  country?: string;
  verified?: boolean;
  page?: number;
};

export function getOrganizationsPage(params: OrganizationSearchParams = {}) {
  return apiFetch<PaginatedResponse<Organization>>(`/v1/organizations/${toQuery({
    search: params.search,
    "focuses__focus_area__slug": params.focus,
    "country__code": params.country,
    is_verified: params.verified,
    page: params.page,
  })}`);
}

export async function getOrganizations(params: OrganizationSearchParams = {}) {
  return (await getOrganizationsPage(params)).results;
}

export function getOrganization(slug: string) {
  return apiFetch<Organization>(`/v1/organizations/${encodeURIComponent(slug)}/`);
}
