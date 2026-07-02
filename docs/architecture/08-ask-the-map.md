# Volume 08: Ask the Map

## Purpose

Define the intent, retrieval, ranking, and response layer for map-aware questions.

## Retrieval Order

1. Registry entities
2. Active perks and events
3. Campaigns and collections
4. Saved places and preferences
5. Google Places as enhancement only when configured

## Required Behavior

Ask the Map should never depend only on Google results. It must ground responses in Downtown Perks registry records and route users to map actions.

## Response Types

- entity recommendation
- collection recommendation
- route suggestion
- perk suggestion
- event suggestion
- follow-up question
- no-match fallback

