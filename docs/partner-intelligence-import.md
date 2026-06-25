# Partner Intelligence Import

## Source Files

- `/Users/megdude/Downloads/BACKEND/WITH IMAGES downtown-perks-intelligence.zip`
- `/Users/megdude/Downloads/BACKEND/updatedharmony-homes-copy-02f82b0c.zip`
- `/Users/megdude/Downloads/1. 20 JULY BUILD/downtown_perks_pin_details_mapped.csv`
- `/Users/megdude/Downloads/1. 20 JULY BUILD/legends_property_extraction.csv`
- `/Users/megdude/Downloads/1. 20 JULY BUILD/Downtown Perks-openapi-spec.json`

## Rule

Older builds are treated as reference data and capability inventory. The current 3014 UI and architecture are not overwritten.

## Imported Intelligence

The `WITH IMAGES downtown-perks-intelligence.zip` source contributed structured partner activation data.

Imported records:

- 22 partner intelligence activations
- 0 skipped rows

Destination entities:

- `PlatformTenant`
- `TenantWorkspace`
- `Partner`
- `PartnerProfile`
- `PartnerLocation`
- `PerkLocation`
- `Campaign`
- `PartnerAnalytics`
- `PartnerQrExperience`
- `AiInsight`
- `MapEntityLink`

Examples imported:

- Comedor
- Banger's
- Stay Put
- Half Step
- Geraldine's
- Jo's Coffee
- Hotel Van Zandt
- Four Seasons
- YETI
- Rivian
- lululemon
- Legends Fine Eyewear
- Topo Chico

## Agentic Module Inventory

Older modules were cataloged as capability references:

- Agent prompt bar
- Agent suggestion cards
- Agent recommendation hook
- Agentic search overlay
- Campaign builder overlay
- Intelligence strip
- Partner scanner
- Resident profile overlay
- Relationship engine
- Live signals

These are represented as operational `AiInsight`, `Campaign`, and `PartnerAnalytics` records rather than copied as old UI.

## API

- `POST /api/intelligence/import`
- `POST /api/agent-recommendations`
- `POST /api/ai/ask-map`
- `POST /api/ai/recommendations`

