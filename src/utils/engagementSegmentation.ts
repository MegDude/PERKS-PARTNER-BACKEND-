export const segmentResidents = (residents: any[]) => {
  const active = residents.filter(r => r.perks_enrolled && (r.perks_tier === 'premium' || r.perks_tier === 'vip'));
  const occasional = residents.filter(r => r.perks_enrolled && r.perks_tier !== 'premium' && r.perks_tier !== 'vip');
  const inactive = residents.filter(r => !r.perks_enrolled);
  
  return {
    'Power User': active,
    'Occasional': occasional,
    'Inactive': inactive
  };
};

export const getEngagementStats = (residents: any[]) => {
  const total = residents.length;
  const enrolled = residents.filter(r => r.perks_enrolled).length;
  const powerUsers = residents.filter(r => r.perks_enrolled && (r.perks_tier === 'premium' || r.perks_tier === 'vip')).length;
  
  return {
    total,
    powerUsers,
    inactive: total - enrolled,
    powerUserRate: total ? Math.round((powerUsers / total) * 100) : 0,
    engagementRate: total ? Math.round((enrolled / total) * 100) : 0
  };
};

export const calculateEngagementLevel = () => ('medium');
