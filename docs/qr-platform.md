# QR Platform

## API

- `GET /api/qr/:id`
- `POST /api/qr/scan`

## Scan Flow

```text
scan
-> resolve PartnerQrExperience
-> validate active status
-> create QrScan
-> increment QR scan count
-> write AnalyticsEvent
-> write TenantAuditLog
-> return destination_url
```

Invalid QR scans are recorded with `status: invalid` and return `404`.

