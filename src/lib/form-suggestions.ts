/** Common shop categories (Bangladesh retail) — shown while typing. */
export const DEFAULT_PRODUCT_CATEGORIES = [
  "মুদি",
  "ডাল-চাল",
  "তেল-মসলা",
  "পানীয়",
  "স্ন্যাকস",
  "বিস্কুট-কেক",
  "দুধ-ডিম",
  "সাবান-শ্যাম্পু",
  "পরিষ্কার-সাফাই",
  "বাচ্চাদের জিনিস",
  "ফলমূল",
  "সবজি",
  "মাছ-মাংস",
  "বেকারি",
  "ইলেকট্রনিক্স",
  "প্লাস্টিক/হাউসহোল্ড",
  "ঔষধ/হেলথ",
  "সিগারেট/সামগ্রী",
  "অন্যান্য",
] as const;

export function mergeCategorySuggestions(
  existingFromShop: string[],
  query: string,
  limit = 10,
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  const push = (raw: string) => {
    const t = raw.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    merged.push(t);
  };

  for (const c of DEFAULT_PRODUCT_CATEGORIES) push(c);
  for (const c of existingFromShop) push(c);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? merged.filter((c) => c.toLowerCase().includes(q))
    : merged;

  return filtered.slice(0, limit);
}

export function filterOptions<T extends { label: string; hint?: string }>(
  options: T[],
  query: string,
  limit = 12,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  return options
    .filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    )
    .slice(0, limit);
}
