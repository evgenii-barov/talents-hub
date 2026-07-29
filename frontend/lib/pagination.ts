export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function loadCataloguePages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  targetPages: number,
) {
  const results: T[] = [];
  let response: PaginatedResponse<T> | null = null;
  let pagesLoaded = 0;

  while (pagesLoaded < Math.max(1, targetPages)) {
    response = await fetchPage(pagesLoaded + 1);
    results.push(...response.results);
    pagesLoaded += 1;
    if (!response.next) break;
  }

  return { results, response: response!, pagesLoaded };
}
