export type IntelligenceImportRow = Record<string, string | number | boolean | null | undefined>;

function normalise(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function findIntelligenceDuplicates(rows: IntelligenceImportRow[], existing: IntelligenceImportRow[] = []) {
  const seen = new Map<string, IntelligenceImportRow>();
  for (const item of existing) {
    const key = [item.companyName || item.name, item.website, item.address].map(normalise).filter(Boolean).join("|");
    if (key) seen.set(key, item);
  }
  return rows.map((row) => {
    const key = [row.companyName || row.name, row.website, row.address].map(normalise).filter(Boolean).join("|");
    return {
      row,
      key,
      duplicate: Boolean(key && seen.has(key)),
      match: key ? seen.get(key) || null : null,
    };
  });
}
