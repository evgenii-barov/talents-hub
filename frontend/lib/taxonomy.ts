import { apiFetch, toQuery } from "@/lib/api";
import type { City, Country, Language, TaxonomyReference } from "@/lib/contracts";

export type TaxonomyResource =
  | "categories"
  | "focus-areas"
  | "countries"
  | "cities"
  | "education-levels"
  | "languages"
  | "skills"
  | "work-formats";

type TaxonomyResponse = TaxonomyReference | Country | City | Language;

export function getTaxonomy<T extends TaxonomyResponse>(
  resource: TaxonomyResource,
  params: Record<string, string | boolean | undefined> = {},
) {
  return apiFetch<T[]>(`/v1/taxonomy/${resource}/${toQuery(params)}`);
}
