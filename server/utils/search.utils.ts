export function escapeRegex(s: string): string {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function makeCaseInsensitiveRegex(keyword: string): RegExp {
  const escaped = escapeRegex(String(keyword || "").trim());
  return new RegExp(escaped, "i");
}
