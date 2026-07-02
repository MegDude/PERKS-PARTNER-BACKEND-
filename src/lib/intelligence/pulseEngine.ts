export type PulseInput = {
  searches?: number;
  views?: number;
  saves?: number;
  directions?: number;
  rsvps?: number;
  redemptions?: number;
  campaignClicks?: number;
  campaignImpressions?: number;
  district?: string;
};

export function generatePulseSignal(input: PulseInput = {}) {
  const actions = (input.saves || 0) + (input.directions || 0) + (input.rsvps || 0) + (input.redemptions || 0);
  const visibility = (input.views || 0) + (input.searches || 0) + (input.campaignImpressions || 0);
  const responseRate = visibility ? Math.round((actions / visibility) * 100) : 0;
  const district = input.district || "Downtown Core";

  return {
    district,
    residentHeadline: actions > 0 ? `${district} has recent activity` : `${district} is ready`,
    partnerHeadline: responseRate > 0 ? `${district} response rate is ${responseRate}%` : `${district} has nearby interest`,
    demandSignal: actions >= 10 ? "More people are interested nearby" : "Some nearby interest",
    coverageSignal: responseRate < 8 ? "More coverage needed nearby" : "Coverage looks healthy",
    campaignSignal: input.campaignClicks ? "People are clicking this campaign" : "A campaign could help here",
    responseRate,
    updatedAt: new Date().toISOString(),
  };
}
