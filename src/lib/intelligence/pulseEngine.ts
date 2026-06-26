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
    residentHeadline: actions > 0 ? `${district} activity is moving` : `${district} is live`,
    partnerHeadline: responseRate > 0 ? `${district} response is ${responseRate}%` : `${district} demand signal nearby`,
    demandSignal: actions >= 10 ? "Demand rising nearby" : "Demand signal nearby",
    coverageSignal: responseRate < 8 ? "Coverage gap nearby" : "Coverage holding",
    campaignSignal: input.campaignClicks ? "Campaign clicks active" : "Campaign opportunity nearby",
    responseRate,
    updatedAt: new Date().toISOString(),
  };
}
