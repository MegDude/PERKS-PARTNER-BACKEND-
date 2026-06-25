# Conditional Logic

| Condition | Behavior |
| --- | --- |
| backend unavailable | Product/admin should show retryable error state |
| map entity inactive | Hide from resident product map; keep admin record |
| resident mode | Show resident copy/actions only |
| partner mode | Show partner copy/actions only |
| perk paused | Disable redemption |
| perk active | Enable redemption |
| duplicate redemption | Return 409 duplicate |
| campaign active | Eligible for placements |
| campaign paused | Preserve reports, halt placements |
| event full | Return 409 full |
| integration pending | Disable external call and show setup state |
| QR invalid | Record invalid scan and return safe error |
| automation fails | Store failed run with logs and retry action |

