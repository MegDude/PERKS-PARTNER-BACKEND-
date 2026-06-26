# Module Completion Matrix

Scoring reflects evidence in code and persisted data, not visual presence alone.

| Module | Status | Implementation | Design | Backend | API | Workflow | Automation | Reporting | Testing | Production Ready |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Marketing | Partial | 55% | 60% | 35% | 30% | 30% | 10% | 20% | 0% | 28% |
| Resident | Partial | 62% | 58% | 62% | 58% | 42% | 15% | 40% | 0% | 39% |
| Partner Lifecycle | Built/Partial | 78% | 72% | 80% | 75% | 72% | 35% | 65% | 0% | 58% |
| Partner Workspace | Partial | 72% | 70% | 70% | 65% | 58% | 30% | 55% | 0% | 51% |
| Map | Partial | 70% | 65% | 75% | 80% | 55% | 20% | 50% | 0% | 50% |
| Search | Partial | 35% | 45% | 20% | 15% | 10% | 0% | 10% | 0% | 15% |
| AI | Partial | 62% | 55% | 70% | 75% | 55% | 30% | 45% | 0% | 45% |
| Registration | Built/Partial | 74% | 68% | 78% | 75% | 65% | 25% | 55% | 0% | 53% |
| Pricing / Checkout | Built/Partial | 76% | 68% | 78% | 78% | 70% | 25% | 60% | 0% | 55% |
| Promotions | Built/Partial | 82% | 70% | 82% | 86% | 76% | 35% | 65% | 0% | 62% |
| Properties | Partial | 68% | 70% | 68% | 70% | 48% | 10% | 45% | 0% | 43% |
| Buildings | Partial | 76% | 72% | 62% | 55% | 55% | 15% | 50% | 0% | 46% |
| Residents Admin | Partial | 66% | 62% | 64% | 60% | 45% | 15% | 42% | 0% | 42% |
| Segmentation | Partial | 58% | 62% | 55% | 50% | 48% | 20% | 35% | 0% | 38% |
| Perks | Built/Partial | 82% | 78% | 78% | 82% | 68% | 25% | 70% | 0% | 61% |
| Events | Partial | 68% | 66% | 70% | 76% | 60% | 30% | 55% | 0% | 51% |
| Campaigns / Engagement | Partial | 65% | 64% | 68% | 72% | 55% | 28% | 50% | 0% | 48% |
| Announcements | Partial | 60% | 62% | 55% | 50% | 45% | 20% | 30% | 0% | 38% |
| Surveys | Partial | 70% | 68% | 62% | 55% | 55% | 28% | 55% | 0% | 49% |
| Reports | Partial | 62% | 62% | 62% | 65% | 45% | 18% | 62% | 0% | 45% |
| Analytics | Partial | 55% | 58% | 55% | 62% | 35% | 10% | 55% | 0% | 36% |
| Automations | Partial | 45% | 50% | 48% | 50% | 35% | 25% | 25% | 0% | 31% |
| Integrations | Partial | 42% | 50% | 45% | 45% | 25% | 10% | 20% | 0% | 28% |
| Billing / Stripe | Partial | 58% | 60% | 60% | 66% | 55% | 15% | 50% | 0% | 43% |

## Highest Confidence Areas

- Partner provisioning data model and tenant/workspace record creation.
- The Shore workspace now has workbook-backed resident and unit records linked to the canonical building/workspace.
- Promotions and complimentary checkout logic.
- Perks admin UI and basic analytics relationships.
- Map data import/storage and map API routes.
- AI gateway module skeleton.

## Lowest Confidence Areas

- External provider integrations.
- Automated workflows.
- Runtime test coverage.
- Product surface at 5173.
- Server-side RBAC and schema validation completeness.
- Resident lifecycle automation after import, including enrollment, card/access status, and message delivery.
