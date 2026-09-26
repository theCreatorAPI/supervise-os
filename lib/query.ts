/**
 * Builds a URL with one or more query parameters changed, leaving the rest in
 * place, so filters, sorting and paging compose instead of clobbering each other.
 *
 * Values equal to "all" and a `page` of 1 are dropped, which keeps the default
 * view on a clean URL rather than `?status=all&page=1`.
 */
export function buildQueryHref(
  basePath: string,
  params: Record<string, string | undefined>,
  changes: Record<string, string | undefined> = {}
) {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...params, ...changes })) {
    if (!value || value === "all") continue;
    if (key === "page" && value === "1") continue;
    next.set(key, value);
  }

  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
