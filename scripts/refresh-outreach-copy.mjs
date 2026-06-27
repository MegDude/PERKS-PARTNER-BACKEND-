import fs from "fs";

const path = "data/downtown-perks-db.json";
const db = JSON.parse(fs.readFileSync(path, "utf8"));
const now = new Date().toISOString();

const clean = (value) => {
  const text = String(value ?? "").trim();
  return !text || /^(to verify|verify|needs verification|n\/a|na|tbd|unknown|null|undefined)$/i.test(text) ? "" : text;
};

const slug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const firstName = (value) => {
  const text = clean(value);
  return !text || /verif|needs|unknown|contact/i.test(text) ? "there" : text.split(/\s+/)[0];
};
const escapeHtml = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const meaningfulTerms = (value, max = 4) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .split(/\s+/)
  .filter((term) => term.length > 3 && !["with", "from", "that", "this", "into", "nearby", "simple", "downtown", "perks", "partner"].includes(term))
  .slice(0, max);

function lensFor(type) {
  const raw = String(type || "").toLowerCase();
  if (raw.includes("hotel")) return { audience: "hotel guests and concierge/front desk teams", benefit: "make nearby recommendations easier without asking guests to download another app", ask: "review a guest-friendly listing and a simple local guide placement" };
  if (raw.includes("property") || raw.includes("residential") || raw.includes("building")) return { audience: "residents, leasing teams, and property managers", benefit: "turn local discovery into a useful resident amenity", ask: "review a building welcome route and confirm the right contact for setup" };
  if (raw.includes("civic") || raw.includes("community")) return { audience: "downtown residents, visitors, and nearby workers looking for local resources", benefit: "make civic programs, events, and resources easier to find in context", ask: "review the listing angle and identify the best program or event to feature first" };
  if (raw.includes("brand") || raw.includes("campaign")) return { audience: "downtown residents and guests who are close to a purchase or visit decision", benefit: "test a focused neighborhood campaign instead of broad untargeted awareness", ask: "look at one lightweight campaign concept and decide if it is worth piloting" };
  if (raw.includes("event")) return { audience: "eventgoers planning what to do before or after the event", benefit: "connect event interest to nearby food, drink, parking, and service decisions", ask: "review one event route or featured listing idea" };
  if (raw.includes("retail")) return { audience: "residents, hotel guests, and downtown workers shopping nearby", benefit: "surface the shop when people are already close enough to visit", ask: "review a simple resident offer or featured local campaign" };
  if (raw.includes("coffee")) return { audience: "morning residents, hybrid workers, and hotel guests", benefit: "capture repeat nearby routines without making the offer complicated", ask: "review a morning perk or workday listing idea" };
  if (raw.includes("bar") || raw.includes("restaurant") || raw.includes("venue")) return { audience: "residents, guests, and nearby workers choosing where to eat or meet", benefit: "show up during the decision moment for dining, happy hour, or group plans", ask: "review one resident dining perk or featured route idea" };
  return { audience: "downtown residents, guests, and nearby workers", benefit: "make the partner easier to discover when people are deciding what to do nearby", ask: "review one simple listing and perk idea" };
}

function districtInsight(district) {
  const raw = String(district || "").toLowerCase();
  if (raw.includes("rainey")) return "Rainey has dense residential towers, hotel traffic, trail access, and quick dinner/drink decisions.";
  if (raw.includes("red river")) return "Red River is event-led, music-driven, and strongest when visitors can connect venues with nearby food and drinks.";
  if (raw.includes("congress")) return "Congress works well for civic, hotel, office, and visitor discovery because it sits in the downtown decision path.";
  if (raw.includes("2nd") || raw.includes("second")) return "Second Street is a retail and dining corridor where resident offers and featured campaigns can feel timely.";
  if (raw.includes("warehouse")) return "The Warehouse District is strongest for after-work, dining, nightlife, and group plans.";
  if (raw.includes("east")) return "East downtown discovery benefits from simple map context because residents often move between food, wellness, and events.";
  return district ? district + " benefits from practical local discovery at the moment people are choosing where to go." : "Downtown discovery works best when the ask is practical and close to a real resident or visitor decision.";
}

function score(copy, brief) {
  const combined = [copy.shortText, copy.subject, copy.body].join(" ").toLowerCase();
  let value = 0;
  if (meaningfulTerms(brief.partner_name, 3).some((term) => combined.includes(term))) value += 2;
  if (meaningfulTerms(brief.suggested_perk, 5).some((term) => combined.includes(term))) value += 2;
  if (meaningfulTerms(brief.suggested_campaign, 5).some((term) => combined.includes(term))) value += 1;
  if (meaningfulTerms(brief.district, 2).some((term) => combined.includes(term))) value += 1;
  if (meaningfulTerms(brief.partner_type, 2).some((term) => combined.includes(term))) value += 1;
  if (meaningfulTerms(brief.audience, 4).some((term) => combined.includes(term))) value += 1;
  if (meaningfulTerms(brief.business_value, 5).some((term) => combined.includes(term))) value += 1;
  if (meaningfulTerms(brief.resident_value, 5).some((term) => combined.includes(term))) value += 1;
  return value;
}

function emailHtml(name, subject, body, perk) {
  const headline = "A local idea for " + name;
  const banner = "https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1200&q=80";
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="x-apple-disable-message-reformatting" />',
    "<title>" + escapeHtml(subject) + "</title></head>",
    '<body style="margin:0;padding:0;background:#ffffff;color:#0B1F33;font-family:Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;">',
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + escapeHtml(perk) + " for " + escapeHtml(name) + ".</div>",
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;"><tr><td align="center" style="padding:24px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-collapse:collapse;border:1px solid rgba(11,31,51,0.10);">',
    '<tr><td style="padding:18px 20px;border-bottom:1px solid rgba(11,31,51,0.08);"><p style="margin:0;color:#0B1F33;font-size:14px;line-height:1;font-weight:750;">Downtown Perks</p></td></tr>',
    '<tr><td><img src="' + banner + '" width="640" alt="' + escapeHtml(name) + ' local discovery" style="display:block;width:100%;max-width:640px;height:auto;max-height:250px;object-fit:cover;border:0;" /></td></tr>',
    '<tr><td style="padding:22px 22px 6px 22px;"><p style="margin:0;color:#C8A96A;font-size:10px;line-height:1.2;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Downtown Perks</p><h1 style="margin:8px 0 0 0;color:#0B1F33;font-size:20px;line-height:1.2;font-weight:650;">' + escapeHtml(headline) + '</h1><p style="margin:9px 0 0 0;color:rgba(11,31,51,0.64);font-size:13px;line-height:1.45;font-weight:400;">' + escapeHtml(perk) + "</p></td></tr>",
    '<tr><td style="padding:12px 22px 0 22px;"><div style="margin:0;color:#24384B;font-size:14px;line-height:1.58;font-weight:400;">' + escapeHtml(body).replace(/\n/g, "<br />") + "</div></td></tr>",
    '<tr><td style="padding:20px 22px 24px 22px;"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 10px 8px 0;"><a href="https://downtown-perks-backend.vercel.app/partners/register" style="display:inline-block;background:#C8A96A;color:#0B1F33;text-decoration:none;padding:11px 15px;border-radius:4px;font-size:12px;line-height:1;font-weight:700;">Review partner setup</a></td><td style="padding:0 0 8px 0;"><a href="https://downtown-perks-backend.vercel.app/map" style="display:inline-block;color:#0B1F33;text-decoration:none;padding:10px 0;border-bottom:1px solid #C8A96A;font-size:12px;line-height:1;font-weight:700;">View map idea</a></td></tr></table></td></tr>',
    '<tr><td style="padding:15px 22px;background:#0B1F33;"><p style="margin:0;color:#ffffff;font-size:12px;line-height:1.45;font-weight:700;">Downtown Perks</p><p style="margin:4px 0 0 0;color:rgba(255,255,255,0.72);font-size:11px;line-height:1.45;">Local discovery for downtown Austin residents, guests, and nearby workers.</p></td></tr>',
    "</table></td></tr></table></body></html>",
  ].join("\n");
}

const partners = db.entities.Partner.filter((partner) => partner.source_type === "partner_outreach_crm");
let updated = 0;

for (const partner of partners) {
  const contact = db.entities.PartnerOutreachContact.find((item) => item.partner_id === partner.id) || {};
  const name = clean(partner.business_name) || clean(partner.name) || "Partner";
  const type = clean(partner.partner_type) || clean(partner.type) || clean(partner.category) || "Partner";
  const district = clean(partner.district) || "Downtown Austin";
  const lens = lensFor(type);
  const perk = clean(partner.suggested_perk) || clean(partner.recommended_perk) || "a simple resident-friendly perk";
  const campaign = clean(partner.suggested_campaign) || clean(partner.recommended_campaign) || "a focused local discovery campaign";
  const residentValue = clean(partner.resident_value) || clean(partner.description) || lens.audience;
  const businessValue = clean(partner.business_value) || clean(partner.partner_fit) || lens.benefit;
  const proofPoint = businessValue || residentValue || clean(partner.notes) || type + " in " + district + " has a natural discovery moment.";
  const brief = {
    partner_name: name,
    partner_type: type,
    district,
    contact_role: clean(contact.role) || "partner decision maker",
    contact_name: clean(contact.name) || clean(contact.contact_name),
    suggested_perk: perk,
    suggested_campaign: campaign,
    resident_value: residentValue,
    business_value: businessValue,
    existing_notes: clean(partner.notes) || clean(partner.partner_fit),
    priority: clean(partner.priority) || String(partner.priority_score || ""),
    district_insight: districtInsight(district),
    audience: lens.audience,
    strategic_benefit: lens.benefit,
    recommended_angle: name + " can use Downtown Perks to reach " + lens.audience + "; the practical first step is " + perk + ".",
    practical_ask: lens.ask,
    proof_point: proofPoint,
    quality_rules: [
      "Use the partner name naturally, not as a mail-merge token.",
      "Reference the partner type, district, perk, campaign, or notes in a specific way.",
      "Write in the Downtown Perks brand voice: clean, calm, direct, local, premium, and easy to understand.",
      "Use everyday language people actually say. Prefer short words and simple sentences.",
      "Sound like a thoughtful local operator, not a SaaS sales sequence or marketing deck.",
      "Avoid jargon like optimize, leverage, unlock, synergy, ecosystem, frictionless, maximize, seamless, hyperlocal, and omnichannel.",
      "Keep the text message under 70 words and the email under 170 words.",
      "Do not claim results, traffic, exclusivity, guaranteed revenue, or formal partnership status.",
      "End with a low-pressure quick-chat ask.",
    ],
  };
  const first = firstName(brief.contact_name);
  const reason = String(brief.proof_point || brief.district_insight).replace(/[.。]+$/, "");
  const typeContext = (brief.district + " " + brief.partner_type.toLowerCase()).replace(/\s+/g, " ").trim();
  const subject = brief.partner_name + ": " + brief.suggested_perk;
  const shortText = "Hey " + first + " - I’m building Downtown Perks for people who are already nearby. " + brief.partner_name + " feels like a good fit for " + brief.suggested_perk + ", especially around " + typeContext + ". I’d love to show you the idea and see if it feels useful. Open to a quick chat?";
  const body = "Hi " + first + ",\n\nI’m building Downtown Perks, a simple local map for people who live, work, and stay downtown.\n\n" + brief.partner_name + " stood out because " + reason + ".\n\nFor a first step, I’d keep it simple: " + brief.suggested_perk + ". That could pair well with " + brief.suggested_campaign + " and give people nearby a clear reason to notice " + brief.partner_name + ".\n\nWould you be open to a quick 15-minute chat next week? No pressure either way.\n\nBest,\nMeg";
  const strategy = {
    angle: brief.recommended_angle,
    audience: brief.audience,
    benefit: brief.strategic_benefit,
    proof_point: brief.proof_point,
    ask: brief.practical_ask,
    quality: "curated_local_strategy",
    voice: "downtown_perks_plainspoken",
    specificity_score: score({ shortText, subject, body }, brief),
  };
  let email = db.entities.PartnerOutreachMessage.find((item) => item.partner_id === partner.id && item.channel === "email");
  if (!email) {
    email = { id: "outreach_message_" + slug(partner.external_entity_id || partner.id) + "_email", created_at: now, partner_id: partner.id, contact_id: contact.id || "", channel: "email", status: "draft", follow_up_at: "" };
    db.entities.PartnerOutreachMessage.push(email);
  }
  Object.assign(email, { updated_at: now, subject, body, html: emailHtml(name, subject, body, perk), strategy, intelligence: brief, provider: "local_strategy", guardrail: "" });
  let sms = db.entities.PartnerOutreachMessage.find((item) => item.partner_id === partner.id && item.channel === "sms");
  if (!sms) {
    sms = { id: "outreach_message_" + slug(partner.external_entity_id || partner.id) + "_sms", created_at: now, partner_id: partner.id, contact_id: contact.id || "", channel: "sms", subject: "Short text / DM", status: "draft", follow_up_at: "" };
    db.entities.PartnerOutreachMessage.push(sms);
  }
  Object.assign(sms, { updated_at: now, body: shortText, subject: "Short text / DM", strategy, intelligence: brief, provider: "local_strategy", guardrail: "" });
  updated += 1;
}

fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log(JSON.stringify({ updated, partners: partners.length }, null, 2));
