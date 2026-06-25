# 5173 Product Route Map

5173 is the live customer-facing product surface. It currently runs from `/Users/megdude/Downloads/BASE44 2` and is audited here as the integration target, not edited from the 3014 workspace.

| Route | Product role | Current implementation | 3014 dependency | Integration status |
| --- | --- | --- | --- | --- |
| `/` | Product splash / entry | `SplashPage` | none required for first paint | Public route |
| `/app` | Resident map launcher | `MapLaunchGate` | `/api/map/entities`, `/api/map/events` | Needs client switch from Base44/static feed to 3014 API |
| `/app/map` | Resident map alias | `MapLaunchGate` | map APIs | Same as `/app` |
| `/map` | Product map | `MapLaunchGate` / `MapPage` | map, perks, events, analytics APIs | 3014 endpoints now available |
| `/ask-map` | AI map concierge | `AskMapPage` | `/api/ai/ask-map`, `/api/ai/recommendations` | 3014 endpoints now available |
| `/residents` | Resident landing | marketing/product page | resident APIs for account actions | Public display route |
| `/explore` | Discovery page | lazy marketing page | map/entities API | Needs data binding review |
| `/events` | Event discovery | lazy `EventsPage` | `/api/events`, RSVP endpoints | 3014 endpoints now available |
| `/perks` | Perks discovery | lazy `PerksPage` | `/api/perks`, redeem endpoint | 3014 endpoints now available |
| `/card` | Resident card | lazy `PerksCardPage` | residents, QR, perks | QR/resident APIs now available |
| `/partners` | Partner marketing | `PartnersIndex` | partner registration/provisioning | Public route |
| `/partners/apply` | Partner apply | `ContactPage` | lifecycle provision function/API | Existing contact flow plus 3014 lifecycle |
| `/partners/pricing` | Pricing redirect | redirects to `/marketing/pricing` | pricing config passed to registration | Public route |
| `/partners/start` | Lifecycle start | `PartnerLifecycle` | partner/workspace APIs | 3014 lifecycle APIs exist locally |
| `/partners/register` | Lifecycle registration | `PartnerLifecycle` | partner create/provision APIs | 3014 endpoints now available |
| `/partners/checkout` | Checkout | `PartnerLifecycle` | Stripe/invoice/subscription | Integration pending credentials |
| `/partners/provision` | Workspace provisioning | `PartnerLifecycle` | `provisionPartnerWorkspace`, `/api/partners/:id/provision-workspace` | Local provisioning available |
| `/partner-workspace/*` | Partner workspace | `PartnerWorkspace` | workspace, campaigns, offers, reports, analytics, QR | 3014 operational APIs available; client integration still required |
| `/partner-portal/*` | Portal aliases | `PartnerWorkspace` | same workspace APIs | Non-dead-end shell exists |
| `/marketing/*` | Marketing pages | public marketing routes | contact/pricing/lifecycle | Public route |
| `/pricing`, `/contact`, `/home`, `/splash` | Legacy redirects | React redirects | destination routes | Consolidated |

Known product data path:

- 5173 still uses the Base44 client and product-local repositories in several surfaces.
- 3014 now exposes compatible operational APIs for the product to consume.
- The remaining integration task is to point the 5173 product clients at 3014 where operational source-of-truth behavior is required.

