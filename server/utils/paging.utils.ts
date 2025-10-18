export function parsePaging(q: any, maxLimit = 100, defaultLimit = 10) {
  let page = Number.parseInt(String(q?.page), 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  let limit = Number.parseInt(String(q?.limit), 10);
  if (Number.isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildSort<T extends readonly string[]>(
  q: any,
  allowed: T,
  def: T[number]
) {
  const sortByRaw = String(q?.sortBy ?? "");
  const sortBy = (allowed as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as T[number])
    : def;
  const sortOrder = String(q?.sortOrder) === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder } as Record<T[number], 1 | -1>;
}
