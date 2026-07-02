export function searchIntelligenceRecords<T extends Record<string, unknown>>(records: T[], query: string, fields: string[]) {
  const needle = query.trim().toLowerCase();
  if (!needle) return records;
  return records.filter((record) =>
    fields.some((field) => String(record[field] || "").toLowerCase().includes(needle)),
  );
}
