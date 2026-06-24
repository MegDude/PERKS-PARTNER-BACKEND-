/**
 * Calculate engagement level for a resident based on perks enrollment and tier
 * Power Users: VIP or Premium tier + enrolled
 * Occasional: Standard tier + enrolled
 * Inactive: Not enrolled in perks
 */
export const calculateEngagementLevel = (resident) => {
  if (!resident.perks_enrolled) {
    return 'Inactive';
  }

  if (resident.perks_tier === 'vip' || resident.perks_tier === 'premium') {
    return 'Power User';
  }

  return 'Occasional';
};

/**
 * Segment residents by engagement level
 */
export const segmentResidents = (residents) => {
  const segments = {
    'Power User': [],
    'Occasional': [],
    'Inactive': []
  };

  residents.forEach(resident => {
    const level = calculateEngagementLevel(resident);
    segments[level].push(resident);
  });

  return segments;
};

/**
 * Get engagement statistics for a group of residents
 */
export const getEngagementStats = (residents) => {
  const total = residents.length;
  const powerUsers = residents.filter(r => calculateEngagementLevel(r) === 'Power User').length;
  const occasional = residents.filter(r => calculateEngagementLevel(r) === 'Occasional').length;
  const inactive = residents.filter(r => calculateEngagementLevel(r) === 'Inactive').length;

  return {
    total,
    powerUsers,
    occasional,
    inactive,
    powerUserRate: total > 0 ? Math.round((powerUsers / total) * 100) : 0,
    engagementRate: total > 0 ? Math.round(((powerUsers + occasional) / total) * 100) : 0
  };
};