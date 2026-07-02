import { generateOpenAIJson, getOpenAIConfigurationStatus } from "../openai/openaiClient.js";

export type IntelligenceAgentAction =
  | "enrich_company"
  | "identify_decision_makers"
  | "generate_partner_strategy"
  | "generate_resident_offering"
  | "generate_employee_offering"
  | "generate_campaign_plan"
  | "generate_pricing_recommendation"
  | "generate_proposal"
  | "generate_meeting_agenda"
  | "generate_follow_up"
  | "summarize_map_presence"
  | "recommend_next_action";

export type IntelligenceAgentContext = {
  company?: Record<string, unknown>;
  contacts?: Array<Record<string, unknown>>;
  building?: Record<string, unknown>;
  mapPresence?: Array<Record<string, unknown>>;
  existingListings?: Array<Record<string, unknown>>;
  existingPerks?: Array<Record<string, unknown>>;
  pricingCatalog?: Array<Record<string, unknown>>;
  campaignCatalog?: Array<Record<string, unknown>>;
  platformCapabilities?: Array<Record<string, unknown>> | Record<string, unknown>;
  workspaceStatus?: Record<string, unknown>;
  notes?: string;
};

const actionGuidance: Record<IntelligenceAgentAction, string> = {
  enrich_company: "Return a sharper company profile, fit summary, risks, verified-vs-unknown fields, and next research steps.",
  identify_decision_makers: "Return role-based decision-maker targets. Do not invent names, private emails, or phone numbers.",
  generate_partner_strategy: "Return a practical partner strategy, why this partner fits, resident value, business value, objections, and next action.",
  generate_resident_offering: "Return a resident-facing offer that is useful, specific, easy to understand, and low effort to launch.",
  generate_employee_offering: "Return an employee/client-facing offer or guide strategy that helps people nearby choose what to do next.",
  generate_campaign_plan: "Return campaign name, audience, offer, timeline, assets, operational needs, KPIs, risks, and mitigation.",
  generate_pricing_recommendation: "Return annual pricing recommendation, required add-ons, optional add-ons, launch costs, rationale, and caveats.",
  generate_proposal: "Return an executive proposal with digital ecosystem, complement strategy, campaign plan, pricing, KPIs, meeting CTA, and self-service CTA.",
  generate_meeting_agenda: "Return a 15-minute meeting agenda, discovery questions, likely objections, and close with a light next step.",
  generate_follow_up: "Return a short email follow-up and short DM follow-up in plain everyday language.",
  summarize_map_presence: "Return current map presence, missing placements, recommended records, and create-actions.",
  recommend_next_action: "Return the top 3-5 next actions ranked by impact, urgency, effort, and expected value.",
};

const systemPrompt = [
  "You are the Downtown Perks Partner Intelligence agent.",
  "Write in the Downtown Perks voice: clean, calm, direct, local, useful, premium, and easy to understand.",
  "Think like a world-class digital marketing strategist, data analyst, partnership strategist, and media planner.",
  "Position Downtown Perks as a complement to existing platforms, not a replacement.",
  "Use the provided partner context only. If data is missing, mark it as Needs verification.",
  "Never invent personal names, private emails, private phone numbers, revenue, or unverifiable facts.",
  "Avoid hype, jargon, and empty SaaS language. Do not use: leverage, unlock, ecosystem, seamless, synergy, hyperlocal, maximize, revolutionize.",
  "Return strict JSON only. Every generated field must be editable by the UI.",
].join("\n");

export async function runIntelligenceAgent(action: IntelligenceAgentAction, context: IntelligenceAgentContext) {
  const guidance = actionGuidance[action];
  if (!guidance) {
    return {
      ok: false,
      error: "Unsupported Intelligence action.",
      status: 400,
    };
  }

  const response = await generateOpenAIJson({
    schemaName: `intelligence_${action}`,
    system: systemPrompt,
    user: JSON.stringify(
      {
        action,
        instruction: guidance,
        requiredOutput: {
          title: "Short title for this recommendation or asset",
          summary: "Plain-language executive summary",
          recommendations: ["Specific recommendation"],
          generatedCopy: "Only when the action requires outreach, proposal, agenda, or campaign copy",
          nextActions: [{ action: "Concrete next step", owner: "Suggested owner", priority: "high|medium|low" }],
          editableFields: {},
          missingData: ["Fields that need verification"],
          confidence: "verified|likely|needs_review",
        },
        context,
      },
      null,
      2,
    ),
  });

  return {
    ...response,
    action,
    configured: getOpenAIConfigurationStatus().configured,
  };
}

export function getIntelligenceCredentialStatus() {
  return {
    openai: getOpenAIConfigurationStatus(),
    google: {
      configured: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY),
      accepted_env: ["GOOGLE_MAPS_API_KEY", "GOOGLE_PLACES_API_KEY", "VITE_GOOGLE_MAPS_API_KEY"],
    },
    twilio: {
      configured: Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        (process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_SECRET) &&
        (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID),
      ),
      accepted_env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_API_SECRET", "TWILIO_PHONE_NUMBER", "TWILIO_MESSAGING_SERVICE_SID"],
    },
    stripe: {
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      webhook_configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      accepted_env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    },
  };
}
