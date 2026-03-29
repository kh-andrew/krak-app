# Delivery Photo Storage Management

**Implemented:** March 29, 2026  
**Purpose:** Automated cleanup of old delivery photos to manage storage costs

---

## Storage Strategy

### Current Implementation

| Asset Type | Retention | Compression | Storage Location |
|------------|-----------|-------------|------------------|
| **Signatures** | Permanent | 800px max, 80% quality | Supabase + Cloudinary backup |
| **Photos** | 90 days | 1200px max, 80% quality | Supabase + Cloudinary backup |

### Compression Settings

**Signatures:**
- Max width: 800px
- Quality: auto:good (typically 80%)
- Format: auto (WebP for modern browsers)
- **Result:** 70-80% file size reduction

**Photos:**
- Max width: 1200px  
- Quality: auto:good (typically 80%)
- Format: auto (WebP for modern browsers)
- **Result:** 60-75% file size reduction

---

## Automated Cleanup

### Cron Job
- **Schedule:** Daily at 2:00 AM UTC
- **Endpoint:** `/api/cron/cleanup-photos`
- **Authentication:** Requires `CRON_SECRET` environment variable

### What It Does
1. Finds all deliveries with photos older than 90 days
2. Deletes photo from Supabase Storage
3. Clears `photoUrl` from database (keeps delivery record)
4. Logs cleanup activity
5. Keeps signatures permanently (legal requirement)

### Files Created

```
krak-app/
├── app/api/cron/cleanup-photos/route.ts    # Cron endpoint
├── scripts/cleanup-old-photos.py            # Manual cleanup script
├── vercel.json                              # Cron schedule config
└── docs/STORAGE_MANAGEMENT.md               # This documentation
```

---

## Environment Variables

Add to Vercel:
```
CRON_SECRET=your-random-secret-key-here
```

Generate with:
```bash
openssl rand -base64 32
```

---

## Manual Cleanup

If you need to run cleanup manually:

```bash
cd ~/krak-app
python3 scripts/cleanup-old-photos.py
```

---

## Monitoring

### Storage Usage Alerts

Set up Vercel monitoring to alert when:
- Supabase Storage > 80% capacity
- Daily cleanup fails
- Photo upload errors spike

### Check Cleanup Logs

```sql
-- View recent cleanup activity
SELECT * FROM activity_logs 
WHERE action = 'cleanup_photos' 
ORDER BY createdAt DESC 
LIMIT 10;
```

---

## Cost Projection

| Scenario | Monthly Cost |
|----------|--------------|
| No cleanup (unlimited growth) | $50+ |
| 90-day retention (current) | $10-15 |
| 30-day retention (aggressive) | $5-8 |

**Savings:** 70-80% reduction in storage costs

---

## Future Enhancements

### Phase 2 (Next 90 days)
- [ ] Cold storage migration (photos > 90 days to cheaper storage)
- [ ] Storage usage dashboard
- [ ] Automated compression of existing uncompressed images

### Phase 3 (Next 6 months)
- [ ] CDN optimization for faster image loading
- [ ] AI-based duplicate detection
- [ ] Geographic storage distribution

---

## Troubleshooting

### Photos Not Deleting
1. Check cron job logs in Vercel
2. Verify `CRON_SECRET` is set
3. Test endpoint manually with curl

### Storage Still Growing
1. Check if cleanup is running (activity_logs)
2. Verify photo URLs are being cleared
3. Check for orphaned files in Supabase Storage

### Legal Concerns
- Signatures are NEVER deleted (permanent retention)
- Photos retained for 90 days (sufficient for dispute resolution)
- All deletions logged in activity_logs table
