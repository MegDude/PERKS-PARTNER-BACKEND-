export type CampaignAction = "view" | "save" | "directions" | "rsvp" | "redeem" | "visit" | "launch" | "compare" | "review";

export function tableForCampaignAction(action: CampaignAction) {
  const tableByAction: Record<CampaignAction, string> = {
    view: "campaign_impressions",
    save: "campaign_clicks",
    directions: "campaign_directions",
    rsvp: "campaign_rsvps",
    redeem: "campaign_redemptions",
    visit: "campaign_conversions",
    launch: "campaign_clicks",
    compare: "campaign_clicks",
    review: "campaign_clicks",
  };
  return tableByAction[action];
}

export function createAttributionEvent(action: CampaignAction, payload: Record<string, unknown>) {
  return {
    ...payload,
    action,
    table: tableForCampaignAction(action),
    occurred_at: new Date().toISOString(),
  };
}
