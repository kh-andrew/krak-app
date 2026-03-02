# Krak Infrastructure Monitoring & Scaling Guide

**Role:** Chief of Staff (AI Agent)  
**Responsibility:** Monitor volumes, suggest migrations, ensure scalability and security

---

## Activity Log Monitoring

### Current Schema (Lean, Audit-Ready)
- No JSON blobs
- Separate fields for queryability
- ~200 bytes per log entry
- 500K logs = ~100MB (Neon Free tier)

### Monitoring Triggers

| Metric | Threshold | Action | Cost Impact |
|--------|-----------|--------|-------------|
| Activity Logs | 400K records (80% of 500K) | Suggest gzip export | $0 |
| Neon Storage | 400MB (80% of 500MB) | Suggest Pro tier ($19/mo) | +$19/mo |
| Query Time | >500ms p95 | Suggest indexing optimization | $0 |
| Logs >90 days | Auto | Archive to compressed file | $0 |
| Order Volume | 10K/month | Review schema performance | $0 |
| Order Volume | 100K/month | Suggest S3 warm storage | +$5/mo |
| Order Volume | 1M/month | Suggest tiered storage | +$50/mo |

### Migration Triggers (I Will Notify You)

**Phase 1 → Phase 2 (Gzip Export)**
- When: 300K+ activity logs OR 6 months post-launch
- Action: Implement nightly gzip export to /tmp
- Effort: 2 hours
- Downtime: None

**Phase 2 → Phase 3 (S3 Warm Storage)**
- When: 100K+ orders/month OR 2 years of data
- Action: Add S3 bucket, Athena queries
- Effort: 1 day
- Downtime: None

**Phase 3 → Phase 4 (Full Tiered)**
- When: 1M+ orders/month OR compliance requirement
- Action: Hot/warm/cold architecture
- Effort: 1 week
- Downtime: Planned maintenance window

---

## Security Checklist

### Data Handling
- [ ] No PII in activity logs (reference only)
- [ ] Customer emails hashed in logs after 90 days
- [ ] IP addresses anonymized (last octet removed)
- [ ] Signatures/photos in Cloudinary (not DB)

### Access Control
- [ ] Activity logs: Admin read-only
- [ ] No DELETE permissions on logs
- [ ] Actor email immutable (denormalized)

### Audit Integrity
- [ ] Logs append-only
- [ ] CreatedAt non-modifiable
- [ ] Hash chain for critical actions (future)

---

## Subagent Readiness Checklist

### Demand Planner Agent
- [x] Inventory table exists
- [x] Reorder points configurable
- [ ] API endpoint for suggestions
- [ ] Human approval workflow
- [ ] Confidence scoring

### Ops Manager Agent
- [x] Activity logging
- [x] Order status API
- [ ] Exception handling rules
- [ ] Auto-assignment logic
- [ ] Escalation thresholds

### Finance Agent
- [ ] Treasury integration (Airwallex)
- [ ] PO approval workflow
- [ ] Cash flow monitoring
- [ ] Anomaly detection

---

## Monthly Review (Automated)

First Monday of each month, I will:
1. Check activity log count
2. Check database size
3. Check query performance
4. Review error rates
5. Suggest optimizations
6. Update this document

---

## Emergency Procedures

### Database Full
1. Immediate: Delete logs >180 days
2. Short-term: Enable gzip export
3. Long-term: Migrate to tiered storage

### Audit Request (Legal)
1. Query hot storage (last 90 days)
2. Search warm storage (90 days - 2 years)
3. Retrieve cold storage if needed (48h)
4. Export to PDF/Excel

### Agent Misbehavior
1. Pause agent: `/agent pause [name]`
2. Review last 100 actions
3. Rollback if needed
4. Retrain/calibrate
5. Resume with tighter thresholds

---

## Cost Tracking

| Month | Storage Used | Cost | Action Taken |
|-------|-------------|------|--------------|
| Mar 2026 | ~10MB | $0 | Launch |
| | | | |

---

## Notes

- Always design for 10x current scale
- Prefer vertical scaling (bigger DB) before horizontal (more services)
- Security > Performance > Cost
- Human-in-the-loop for all irreversible actions
- Audit trail is non-negotiable