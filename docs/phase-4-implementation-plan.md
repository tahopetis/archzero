# Phase 4 Implementation Plan: Backend API Integration

**Date**: 2026-01-21
**Status**: Assessment Complete, Ready for Implementation
**Current E2E Test Pass Rate**: ~67% (310+/466 tests passing)
**Target**: 100% (466/466 tests passing)

---

## Executive Summary

Phase 4 focuses on completing missing backend endpoints to unblock E2E tests. The frontend components are already built and production-ready, but tests fail due to missing backend APIs.

**Root Cause**: Backend endpoints for export, audit logs, and report generation are not yet implemented.

**Impact**: ~30+ E2E tests blocked on these missing APIs

**Solution**: Implement missing backend endpoints following a 4-phase approach (4.2A → 4.2B → 4.2C → 4.2D)

**Estimated Timeline**: 4-5 days

---

## Current Status

### Phase 4 Progress: 30% Complete

| Sub-Phase | Status | Completion | Tests Unblocked |
|-----------|--------|-------------|-----------------|
| **Phase 4.1** | ✅ COMPLETE | 100% | ~20 tests |
| **Phase 4.2A** | ⏳ PENDING | 0% | ~15 tests |
| **Phase 4.2B** | ⏳ PENDING | 0% | ~8 tests |
| **Phase 4.2C** | ⏳ PENDING | 0% | ~6 tests |
| **Phase 4.2D** | ⏳ PENDING | 0% | ~20 tests |
| **Phase 4.3** | ⏳ PENDING | 0% | ~30 tests |

### Completed Work

**Phase 4.1: API Mocking Tests Infrastructure** ✅
- Test data seeder implemented (31 cards, relationships, ARB submissions)
- Authentication state loading fixed
- API health checks fixed
- Test selectors standardized
- React stability fixes (memoization, DOM stability)

**Recent Bug Fixes** (Jan 15-21, 2026):
- Risk component test selectors fixed
- React memoization for performance
- Docker infrastructure completed
- Documentation reorganization

---

## Missing Backend Endpoints

### Existing Endpoints ✅

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| `/api/v1/export/bulk` | POST | `bulk.rs` | ✅ Implemented |
| `/api/v1/compliance-audits` | GET, POST, PUT, DELETE | `compliance.rs` | ✅ Implemented |
| `/api/v1/arb/audit-logs` | GET | `arb.rs` | ✅ Implemented |
| `/api/v1/arb/audit-logs/{entityType}/{entityId}` | GET | `arb.rs` | ✅ Implemented |

### Missing Endpoints ❌

#### 1. Export Module (`/api/v1/export/*`)

| Endpoint | Method | Priority | Description | Tests Blocked |
|----------|--------|----------|-------------|---------------|
| `/api/v1/export/cards` | POST | **P0** | Export cards to CSV/Excel | Card export E2E tests (~8 tests) |
| `/api/v1/export/{domain}` | POST | **P0** | Export by domain (relationships, governance, etc.) | Domain export tests (~5 tests) |
| `/api/v1/export/scheduled` | POST | **P1** | Schedule recurring exports | Scheduled export tests (~5 tests) |
| `/api/v1/export/history` | GET | **P0** | Get export history | Export history UI tests (~3 tests) |

**Frontend References**:
- `archzero-ui/src/lib/export-hooks.ts`
- `archzero-ui/src/pages/export/ExportPage.tsx`
- `archzero-ui/src/lib/bulk-hooks.ts`

#### 2. ARB Audit Export (`/api/v1/arb/audit-logs/export`)

| Endpoint | Method | Priority | Description | Tests Blocked |
|----------|--------|----------|-------------|---------------|
| `/api/v1/arb/audit-logs/export` | GET | **P1** | Export audit logs to CSV/Excel | ARB audit export tests (~6 tests) |

**Frontend References**:
- `archzero-ui/src/components/governance/arb/AuditLogPage.tsx`

#### 3. Report Generation

| Feature | Priority | Description | Tests Blocked |
|----------|----------|-------------|---------------|
| PDF report generation | **P1** | Generate PDF reports | PDF export tests (~10 tests) |
| PowerPoint export | **P2** | Export to PowerPoint format | PPT export tests (~5 tests) |
| Custom report builder | **P1** | API for custom report generation | Report builder tests (~10 tests) |
| Executive summary generation | **P2** | Generate executive summaries | Summary tests (~5 tests) |

**Note**: Report generation is a larger feature that may be deferred to Phase 5.

---

## Implementation Plan

### Phase 4.2A: Core Export APIs (Priority: P0)

**Timeline**: 2-3 days
**Tests Unblocked**: ~15 tests

#### Task 1: Create Export Handlers Module
- [ ] Create `archzero-api/src/handlers/export.rs`
- [ ] Define export request/response models
- [ ] Add to `handlers/mod.rs`

**Models to Implement**:
```rust
pub struct ExportRequest {
    pub format: ExportFormat,  // Csv, Excel, Json
    pub filters: Option<ExportFilters>,
    pub ids: Option<Vec<Uuid>>,
}

pub struct ExportHistoryItem {
    pub id: Uuid,
    pub export_type: String,
    pub format: ExportFormat,
    pub status: ExportStatus,
    pub created_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub file_url: Option<String>,
}

pub enum ExportFormat {
    Csv,
    Excel,
    Json,
}

pub enum ExportStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}
```

#### Task 2: Implement Export Service
- [ ] Create `archzero-api/src/services/export_service.rs`
- [ ] Implement CSV generation for cards
- [ ] Implement Excel generation (using `xlsx` crate)
- [ ] Implement domain-based export (relationships, governance)
- [ ] Add to `services/mod.rs`
- [ ] Register in `AppState` (main.rs)

#### Task 3: Implement Endpoints
- [ ] `POST /api/v1/export/cards` - Export cards with filters
- [ ] `POST /api/v1/export/{domain}` - Export by domain (relationships, principles, standards, policies, risks)
- [ ] `GET /api/v1/export/history` - List user's export history
- [ ] Register routes in `main.rs`

#### Task 4: Database Schema
- [ ] Create `exports` table (id, export_type, format, status, file_path, created_at, created_by)
- [ ] Add migration file
- [ ] Run migrations

**Acceptance Criteria**:
- All 4 endpoints return 200 OK with valid data
- Export files are generated correctly
- Export history is tracked in database
- E2E tests for export functionality pass

---

### Phase 4.2B: Scheduled Exports (Priority: P1)

**Timeline**: 1 day
**Tests Unblocked**: ~8 tests

#### Task 1: Scheduled Export Models
```rust
pub struct ScheduledExport {
    pub id: Uuid,
    pub name: String,
    pub export_type: String,
    pub schedule: Schedule,  // Cron expression
    pub filters: ExportFilters,
    pub format: ExportFormat,
    pub next_run_at: DateTime<Utc>,
    pub last_run_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub is_active: bool,
}

pub enum Schedule {
    Daily,
    Weekly,
    Monthly,
    Cron(String),
}
```

#### Task 2: Background Job Scheduler
- [ ] Integrate job scheduler (tokio-cron-scheduler or similar)
- [ ] Implement scheduled export execution
- [ ] Add error handling and retry logic

#### Task 3: Implement Endpoint
- [ ] `POST /api/v1/export/scheduled` - Create scheduled export
- [ ] `GET /api/v1/export/scheduled` - List scheduled exports
- [ ] `PUT /api/v1/export/scheduled/{id}` - Update scheduled export
- [ ] `DELETE /api/v1/export/scheduled/{id}` - Delete scheduled export

**Acceptance Criteria**:
- Scheduled exports run automatically
- Export notifications are sent
- E2E tests for scheduled exports pass

---

### Phase 4.2C: Audit Log Export (Priority: P1)

**Timeline**: 1 day
**Tests Unblocked**: ~6 tests

#### Task 1: Add Export Handler to ARB
- [ ] Add export function to `archzero-api/src/handlers/arb.rs`
- [ ] Implement CSV export for audit logs
- [ ] Implement Excel export for audit logs

#### Task 2: Implement Endpoint
- [ ] `GET /api/v1/arb/audit-logs/export?format=csv` - Export audit logs
- [ ] Support query filters (entity_type, date range, actor)

**Acceptance Criteria**:
- Audit logs export to CSV/Excel correctly
- Large datasets export efficiently
- E2E tests for audit export pass

---

### Phase 4.2D: Report Generation (Priority: P1/P2)

**Timeline**: 2-3 days
**Tests Unblocked**: ~20 tests

**Note**: This is a larger feature. Consider deferring to Phase 5 if time-constrained.

#### Task 1: PDF Report Generation
- [ ] Create `archzero-api/src/services/report_service.rs`
- [ ] Integrate PDF generation library (genpdf or printpdf)
- [ ] Implement report templates
- [ ] `POST /api/v1/reports/generate` - Generate PDF report

#### Task 2: PowerPoint Export
- [ ] Integrate PPTX generation library (rust-pptx or custom)
- [ ] `POST /api/v1/reports/export/pptx` - Export to PowerPoint

#### Task 3: Custom Report Builder
- [ ] Create report template system
- [ ] `POST /api/v1/reports/custom` - Generate custom report
- [ ] `GET /api/v1/reports/templates` - List report templates
- [ ] `POST /api/v1/reports/templates` - Create report template

**Acceptance Criteria**:
- Reports generate correctly in PDF format
- PowerPoint exports work
- Custom report builder is functional
- E2E tests for reports pass

---

## File Structure

### New Files to Create

```
archzero-api/src/
├── handlers/
│   └── export.rs                 # Export endpoints (NEW)
├── services/
│   ├── export_service.rs         # Export business logic (NEW)
│   └── report_service.rs         # Report generation (NEW)
├── models/
│   └── export.rs                 # Export models (NEW)
migrations/
└── 20260121XXXXXX_create_exports_table.sql  # Export history table (NEW)
```

### Files to Modify

```
archzero-api/src/
├── handlers/
│   ├── mod.rs                    # Add export module
│   └── arb.rs                    # Add audit log export endpoint
├── services/
│   └── mod.rs                    # Add export_service, report_service
├── models/
│   └── mod.rs                    # Add export models
└── main.rs                       # Register export routes
```

---

## Dependencies

### Cargo Crates Required

```toml
# Export functionality
xlsxwriter = "0.6"              # Excel file generation
csv = "1.3"                     # CSV generation
tokio-cron-scheduler = "0.10"   # Scheduled exports

# Report generation (Phase 4.2D)
genpdf = "0.10"                 # PDF generation
printpdf = "0.7"                # Alternative PDF library
```

---

## Testing Strategy

### Unit Tests
- [ ] Test export service functions
- [ ] Test CSV/Excel generation
- [ ] Test scheduled export logic

### Integration Tests
- [ ] Test export endpoints with real data
- [ ] Test export history tracking
- [ ] Test scheduled export execution

### E2E Tests
- [ ] Export cards to CSV
- [ ] Export relationships
- [ ] Export governance data
- [ ] View export history
- [ ] Create scheduled export
- [ ] Export audit logs
- [ ] Generate PDF reports

---

## Risk Mitigation

### Risk 1: Large Dataset Performance
**Mitigation**: Implement streaming for exports, add pagination support

### Risk 2: Scheduled Export Reliability
**Mitigation**: Add retry logic, error notifications, monitoring

### Risk 3: File Storage
**Mitigation**: Use object storage (S3-compatible) for exported files

### Risk 4: PDF Generation Complexity
**Mitigation**: Use template-based approach, defer complex reports to Phase 5

---

## Success Metrics

### Phase 4.2A Success Criteria
- [ ] All 4 core export endpoints implemented
- [ ] Export functionality E2E tests pass (~15 tests)
- [ ] API health check returns 200 for `/api/v1/export/*`

### Phase 4.2B Success Criteria
- [ ] Scheduled export endpoints implemented
- [ ] Background scheduler running
- [ ] Scheduled export E2E tests pass (~8 tests)

### Phase 4.2C Success Criteria
- [ ] Audit log export endpoint implemented
- [ ] Audit export E2E tests pass (~6 tests)

### Phase 4.2D Success Criteria (Optional)
- [ ] PDF report generation working
- [ ] PowerPoint export working
- [ ] Report E2E tests pass (~20 tests)

### Overall Phase 4 Success
- [ ] E2E test pass rate increases from 67% to ~80% (+60 tests)
- [ ] All export features functional
- [ ] Backend API documentation updated
- [ ] Zero regressions in existing tests

---

## Next Steps

### Immediate Actions (Today)
1. Review and approve this implementation plan
2. Create Beads issue for Phase 4.2A implementation
3. Set up development environment
4. Begin implementation of export handlers

### This Week
- [ ] Complete Phase 4.2A (Core Export APIs)
- [ ] Run E2E tests to verify unblocking
- [ ] Begin Phase 4.2B (Scheduled Exports)

### Next Week
- [ ] Complete Phase 4.2B and 4.2C
- [ ] Assess Phase 4.2D (Report Generation) scope
- [ ] Begin Phase 4.3 (Test Stabilization)

---

## References

- **E2E Test Plan**: `e2e/100-percent-test-success-plan.md`
- **API Documentation**: `docs/05-api-spec.md`
- **Database Schema**: `docs/01-metamodel-spec.md`
- **Codebase Map**: `docs/CODEBASE_MAP.md`

### Related Beads Issues
- `archzero-b0n` - Phase 4.2: Implement Missing Features (IN_PROGRESS)
- `archzero-5aq` - Achieve 100% E2E Test Success Rate (EPIC)
- `archzero-3hv` - Phase 4.3: Test Stabilization & Quality (OPEN)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-21
**Author**: Claude Code (Arc Zero Development)
