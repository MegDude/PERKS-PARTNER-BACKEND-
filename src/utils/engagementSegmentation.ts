type ResidentLike = {
  perks_enrolled?: boolean;
  perks_tier?: string;
  [key: string]: unknown;
};

export function calculateEngagementLevel(resident: ResidentLike) {
  if (!resident.perks_enrolled) return "Inactive";
  if (resident.perks_tier === "vip" || resident.perks_tier === "premium") return "Power User";
  return "Occasional";
}

export function segmentResidents<T extends ResidentLike>(residents: T[]) {
  const segments: Record<"Power User" | "Occasional" | "Inactive", T[]> = {
    "Power User": [],
    Occasional: [],
    Inactive: [],
  };

  residents.forEach((resident) => {
    segments[calculateEngagementLevel(resident) as keyof typeof segments].push(resident);
  });

  return segments;
}

export function getEngagementStats(residents: ResidentLike[]) {
  const total = residents.length;
  const powerUsers = residents.filter((resident) => calculateEngagementLevel(resident) === "Power User").length;
  const occasional = residents.filter((resident) => calculateEngagementLevel(resident) === "Occasional").length;
  const inactive = residents.filter((resident) => calculateEngagementLevel(resident) === "Inactive").length;

  return {
    total,
    powerUsers,
    occasional,
    inactive,
    powerUserRate: total > 0 ? Math.round((powerUsers / total) * 100) : 0,
    engagementRate: total > 0 ? Math.round(((powerUsers + occasional) / total) * 100) : 0,
  };
}
