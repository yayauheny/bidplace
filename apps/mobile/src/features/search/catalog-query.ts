export function firstQueryParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCsvParam(value: string | string[] | undefined) {
  const raw = firstQueryParam(value);
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function parsePageParam(value: string | string[] | undefined) {
  const raw = firstQueryParam(value);
  const page = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function worksCatalogHref(input: {
  q?: string;
  category?: string;
  materials?: readonly string[];
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.q) params.set('q', input.q);
  if (input.category) params.set('category', input.category);
  if (input.materials && input.materials.length > 0) {
    params.set('materials', input.materials.join(','));
  }
  if (input.sort === 'oldest') params.set('sort', 'oldest');
  if (input.page && input.page > 1) params.set('page', String(input.page));
  const query = params.toString();
  return query ? (`/works?${query}` as const) : ('/works' as const);
}

export function authorsCatalogHref(input: {
  q?: string;
  tag?: string;
  city?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.q) params.set('q', input.q);
  if (input.tag) params.set('tag', input.tag);
  if (input.city) params.set('city', input.city);
  if (input.sort === 'name') params.set('sort', 'name');
  if (input.page && input.page > 1) params.set('page', String(input.page));
  const query = params.toString();
  return query ? (`/authors?${query}` as const) : ('/authors' as const);
}

export function catalogHasFilters(input: {
  q?: string;
  category?: string;
  materials?: readonly string[];
  tag?: string;
  city?: string;
}) {
  return Boolean(
    input.q ||
      input.category ||
      (input.materials && input.materials.length > 0) ||
      input.tag ||
      input.city,
  );
}
