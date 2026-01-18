# Phase 2.3: Complete ARB Implementation Plan

## Overview
Implement full Architecture Review Board (ARB) functionality to make 141 E2E tests pass (47 unique tests × 3 browsers).

## Current Status (Updated: January 18, 2026)

### Test Results: **108/141 passing (76.6%)**
- **Starting point**: 75/141 (53.2%)
- **Improvement**: +33 tests (+23.4%)
- **Remaining**: 33 failures (11 unique tests × 3 browsers)

### Completed Work ✅

**Frontend Implementation:**
- ✅ RequestDetail component with full CRUD operations
- ✅ DecisionForm with approve/reject/conditional/defer workflows
- ✅ MeetingDetail component with agenda and minutes
- ✅ SubmissionsQueue with status filtering
- ✅ ARBDashboard with metrics display
- ✅ Role-based access control (RBAC) enforcement
- ✅ Navigation structure complete

**Test Improvements (6 commits):**
1. ✅ Fixed React Hooks order violation in RequestDetail
2. ✅ Updated all navigation tests to click pattern (13 tests)
3. ✅ Fixed authentication credentials (architect1 → arb-member)
4. ✅ Fixed test selectors (pending → draft status)
5. ✅ Added test data (12 draft submissions for parallel execution)
6. ✅ Fixed conditional approval selectors (condition-1, condition-2)

### Known Backend Issues Blocking 3 Tests ❌

**1. Overdue Test Failure** (9 failures × 3 browsers)
- **Test**: "should send reminder for overdue reviews"
- **Root Cause**: Backend ignores `submittedAt` field
- **Location**: `archzero-api/src/handlers/arb.rs:726`
- **Issue**: `let submitted_at = Utc::now();` overwrites test data
- **Fix Required**: Accept and preserve `submittedAt` from request body

**2. Template Save Failure** (9 failures × 3 browsers)
- **Test**: "should save request as template"
- **Root Cause**: Template save API endpoint not working
- **Impact**: Success message never appears
- **Fix Required**: Debug and implement `createTemplate` API endpoint

**3. Conditional Approval - Test Isolation** (9 failures × 3 browsers)
- **Test**: "should conditionally approve request"
- **Status**: ✅ **PASSES when run individually**
- **Root Cause**: Tests compete for limited draft submissions in parallel
- **Fix Required**: Add more test data (30+ submissions) or run sequentially

### Remaining Test Breakdown

| Category | Total | Passing | Failing | Blocker |
|----------|-------|---------|---------|---------|
| ARB Review Requests | 9 | 9 | 0 | None ✅ |
| ARB Review Process | 6 | 5 | 1 | Test isolation |
| ARB Dashboard & Metrics | 7 | 7 | 0 | None ✅ |
| ARB Meetings | 7 | 7 | 0 | None ✅ |
| ARB Integration with Cards | 4 | 4 | 0 | None ✅ |
| ARB Member Permissions | 3 | 2 | 1 | Backend bug |
| ARB Audit Trail | 4 | 4 | 0 | None ✅ |
| ARB Templates | 3 | 2 | 1 | API endpoint |
| ARB Notifications | 4 | 3 | 1 | Backend bug |

### Backend API Status

**Implemented & Working ✅:**
- ✅ GET/POST `/api/v1/arb/meetings`
- ✅ GET/PUT/DELETE `/api/v1/arb/meetings/:id`
- ✅ GET/POST `/api/v1/arb/meetings/:id/agenda`
- ✅ GET/POST `/api/v1/arb/submissions`
- ✅ GET/PUT/DELETE `/api/v1/arb/submissions/:id`
- ✅ POST `/api/v1/arb/submissions/:id/decision`
- ✅ GET `/api/v1/arb/dashboard`
- ✅ GET `/api/v1/arb/statistics`

**Needs Implementation ❌:**
- ❌ POST `/api/v1/arb/templates` - Template save endpoint
- ❌ POST `/api/v1/arb/submissions` should accept `submittedAt` from request
- ❌ Reminder system for overdue reviews
- ❌ Email notification endpoints

### Previous Status (Before January 18, 2026)
- ✅ API health endpoints working
- ✅ Backend APIs exist for most ARB operations
- ✅ Basic frontend routes configured
- ✅ NewRequestForm with API integration
- ✅ DecisionForm with API integration
- ❌ 141 tests failing - need full implementation

## Test Breakdown by Category

| Category | Tests | Priority | Dependencies |
|----------|-------|----------|--------------|
| ARB Review Requests | 9 | P0 | None |
| ARB Review Process | 6 | P0 | Review Requests |
| ARB Dashboard & Metrics | 7 | P1 | Review Requests, Process |
| ARB Meetings | 7 | P1 | Review Requests |
| ARB Integration with Cards | 4 | P1 | Review Requests |
| ARB Member Permissions | 3 | P2 | Review Process |
| ARB Audit Trail | 4 | P2 | Review Process |
| ARB Templates | 3 | P2 | Review Requests |
| ARB Notifications | 4 | P3 | Review Process, Meetings |

## Implementation Phases

### Phase 2.3.1: Core ARB Request Management (P0 - Highest Impact)
**Target Tests:** 9 ARB Review Requests tests
**Est. Complexity:** High

#### Tasks:
1. **Request Details View**
   - Create RequestDetail component
   - Display all submission information
   - Show submission history
   - Add edit/delete actions for draft status
   - Route: `/arb/requests/:id`

2. **Edit Draft Requests**
   - Implement edit form (reuse NewRequestForm)
   - Add draft status management
   - Add data-testid="edit-request-btn"
   - Save draft without submitting

3. **File Attachments**
   - Add file upload component
   - Support PDF, DOC, DOCX
   - Display attachment list
   - Delete attachments
   - Backend: store file metadata

4. **Request List Enhancements**
   - Add status badges (draft, pending, approved, rejected)
   - Add filtering controls (data-testid="filter-status")
   - Add priority badges
   - Show submission date

#### Acceptance Criteria:
- All 9 ARB Review Requests tests pass
- Can create, view, edit, and delete requests
- File attachments work end-to-end

---

### Phase 2.3.2: ARB Review Process (P0 - High Impact)
**Target Tests:** 6 ARB Review Process tests
**Est. Complexity:** High

#### Tasks:
1. **Review Interface**
   - Create ReviewForm component
   - Add review comments (data-testid="review-comments")
   - Add condition management
   - Add action items
   - Assign action items to users (data-testid="action-assignee")

2. **Decision Recording**
   - Implement approve workflow (data-testid="decision-approve")
   - Implement reject workflow (data-testid="decision-reject")
   - Implement conditional approval (data-testid="decision-conditional")
   - Implement defer workflow (data-testid="decision-defer")
   - Add approval conditions input (data-testid="approval-conditions")
   - Add rejection reason input (data-testid="rejection-reason")
   - Add defer reason input (data-testid="defer-reason")

3. **Decision History**
   - Create DecisionHistory component
   - Show timeline of all decisions
   - Display decision rationale
   - Display conditions
   - Add data-testid="decision-history-tab"
   - Add data-testid="decision-history"

#### Acceptance Criteria:
- All 6 ARB Review Process tests pass
- Full decision workflow works (approve/reject/conditional/defer)
- Decision history displays correctly

---

### Phase 2.3.3: ARB Dashboard & Metrics (P1)
**Target Tests:** 7 Dashboard tests
**Est. Complexity:** Medium

#### Tasks:
1. **Dashboard Metrics**
   - Add overdue action items display
   - Add review workload by member chart
   - Add decision statistics

2. **Filtering & Search**
   - Add status filter dropdown (data-testid="filter-status")
   - Add priority filter dropdown (data-testid="filter-priority")
   - Add search input (data-testid="search-input")
   - Implement filter logic

3. **Export Reports**
   - Add export button (data-testid="export-report-btn")
   - Generate PDF/CSV reports
   - Include all submission data
   - Include decision history

#### Acceptance Criteria:
- All 7 Dashboard tests pass
- Filters and search work correctly
- Export generates valid reports

---

### Phase 2.3.4: ARB Meetings (P1)
**Target Tests:** 7 Meeting tests
**Est. Complexity:** High

#### Tasks:
1. **Meeting List & Detail**
   - Create MeetingList component with data-testid="meetings-list"
   - Create MeetingDetail component
   - Show meeting status (scheduled, in-progress, completed)
   - Display agenda items
   - Show attendees

2. **Meeting Scheduling**
   - Create ScheduleMeetingForm component
   - Title input (data-testid="meeting-title")
   - Date input (data-testid="meeting-date")
   - Time input (data-testid="meeting-time")
   - Attendee selection
   - Add to calendar integration

3. **Agenda Management**
   - Add items to agenda (data-testid="add-to-agenda-btn")
   - Reorder agenda items
   - Set time allocations
   - Attach submissions to agenda

4. **Meeting Minutes**
   - Create MinutesEditor component
   - Rich text editing
   - Action item tracking
   - Decision recording
   - Save/export minutes

5. **Meeting Pack Export**
   - Generate meeting pack PDF
   - Include all agenda items
   - Include relevant submissions
   - Include previous decisions

6. **Minutes Distribution**
   - Email minutes to attendees
   - Post to dashboard
   - Track acknowledgment

#### Acceptance Criteria:
- All 7 Meeting tests pass
- Can schedule, manage, and conduct meetings
- Minutes capture and distribution works

---

### Phase 2.3.5: ARB Card Integration (P1)
**Target Tests:** 4 Integration tests
**Est. Complexity:** Medium

#### Tasks:
1. **Card Linking**
   - Add card selector to request form
   - Store cardId on submission
   - Display linked card in request detail

2. **Card Status Display**
   - Show ARB status on card detail page
   - Show pending/approved/rejected badges
   - Link to ARB request

3. **ARB Approval Enforcement**
   - Add ARB status check before card updates
   - Block changes for non-approved cards
   - Show approval requirement message

4. **Status Synchronization**
   - Update card status when ARB decision made
   - Add approved/rejected workflow
   - Sync decision metadata to card

#### Acceptance Criteria:
- All 4 Integration tests pass
- Cards properly linked to ARB requests
- Status sync works bidirectionally

---

### Phase 2.3.6: ARB Permissions (P2)
**Target Tests:** 3 Permission tests
**Est. Complexity:** Medium

#### Tasks:
1. **Role-Based Access Control**
   - Define ARB roles: Chair, Member, NonMember
   - Add role management in user profile
   - Enforce role-based permissions

2. **Chair Permissions**
   - Can approve requests
   - Can schedule meetings
   - Can manage templates

3. **Member Permissions**
   - Can review assigned requests
   - Can add comments
   - Cannot approve (only chair)

4. **Non-Member Restrictions**
   - Read-only access to dashboard
   - Cannot create requests
   - Redirect to permission denied page

#### Acceptance Criteria:
- All 3 Permission tests pass
- Role-based access enforced correctly

---

### Phase 2.3.7: ARB Audit Trail (P2)
**Target Tests:** 4 Audit Trail tests
**Est. Complexity:** Medium

#### Tasks:
1. **Audit Logging**
   - Log all request creations
   - Log all decision changes
   - Log all edits
   - Include timestamp, user, action

2. **Audit Trail Display**
   - Create AuditTrail component
   - Show chronological history
   - Display action, user, timestamp
   - Add data-testid="audit-trail"

3. **Audit Export**
   - Export audit trail to CSV
   - Include all history
   - Filter by date range

#### Acceptance Criteria:
- All 4 Audit Trail tests pass
- Complete audit history maintained

---

### Phase 2.3.8: ARB Templates (P2)
**Target Tests:** 3 Template tests
**Est. Complexity:** Low

#### Tasks:
1. **Save as Template**
   - Add "Save as Template" button
   - Save form data as template
   - Name and describe template

2. **Create from Template**
   - Show template library
   - Load template into form
   - Edit before submission

3. **Template Management**
   - List all templates
   - Edit templates
   - Delete templates
   - Share with team

#### Acceptance Criteria:
- All 3 Template tests pass
- Templates can be created, loaded, and managed

---

### Phase 2.3.9: ARB Notifications (P3)
**Target Tests:** 4 Notification tests
**Est. Complexity:** Medium

#### Tasks:
1. **Review Assignments**
   - Notify reviewer when assigned
   - Send email notification
   - Show in-app notification

2. **Decision Notifications**
   - Notify requester when decision made
   - Include decision details
   - Provide next steps

3. **Reminder System**
   - Send reminders for overdue reviews
   - Escalate after X days
   - Track reminders sent

4. **Meeting Notifications**
   - Notify upcoming meetings
   - Include agenda
   - RSVP tracking

#### Acceptance Criteria:
- All 4 Notification tests pass
- Notifications sent and tracked correctly

---

## Backend API Requirements

### Verify/Implement Endpoints:
- ✅ GET/POST `/api/v1/arb/meetings`
- ✅ GET/PUT/DELETE `/api/v1/arb/meetings/:id`
- ✅ GET `/api/v1/arb/meetings/:id/agenda`
- ✅ POST `/api/v1/arb/meetings/:id/agenda`
- ✅ GET/POST `/api/v1/arb/submissions`
- ✅ GET/PUT/DELETE `/api/v1/arb/submissions/:id`
- ✅ POST `/api/v1/arb/submissions/:id/decision`
- ✅ GET `/api/v1/arb/dashboard`
- ✅ GET `/api/v1/arb/statistics`

### Additional Endpoints Needed:
- POST `/api/v1/arb/submissions/:id/comments` - Add review comments
- POST `/api/v1/arb/submissions/:id/action-items` - Add action items
- POST `/api/v1/arb/submissions/:id/attachments` - Upload attachment
- DELETE `/api/v1/arb/submissions/:id/attachments/:attachmentId`
- GET `/api/v1/arb/submissions/:id/history` - Get audit trail
- POST `/api/v1/arb/templates` - Save template
- GET `/api/v1/arb/templates` - List templates
- POST `/api/v1/arb/submissions/from-template/:templateId` - Create from template
- POST `/api/v1/arb/meetings/:id/minutes` - Save minutes
- POST `/api/v1/arb/meetings/:id/distribute` - Distribute minutes
- GET `/api/v1/arb/reports/export` - Export reports

---

## Frontend Components to Create

### Core Components:
1. RequestDetail.tsx - Full request view with edit capability
2. ReviewForm.tsx - Review interface with comments and action items
3. DecisionHistory.tsx - Timeline of decisions
4. MeetingForm.tsx - Schedule/create meetings
5. MeetingDetail.tsx - Meeting view with agenda
6. MinutesEditor.tsx - Rich text minutes editor
7. AuditTrail.tsx - Audit history display
8. TemplateLibrary.tsx - Template management
9. NotificationPanel.tsx - In-app notifications
10. RequestFilters.tsx - Filter controls

### Enhancements to Existing:
1. NewRequestForm - Add draft mode
2. DecisionForm - Add condition management
3. SubmissionsQueue - Add filtering
4. ARBDashboard - Add metrics and charts

---

## Data Model Additions

### New Types Needed:
```typescript
// Review Comment
interface ARBReviewComment {
  id: string;
  submissionId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}

// Action Item
interface ARBActionItem {
  id: string;
  submissionId: string;
  assigneeId: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
}

// Attachment
interface ARBAttachment {
  id: string;
  submissionId: string;
  filename: string;
  fileUrl: string;
  uploadedAt: Date;
}

// Template
interface ARBTemplate {
  id: string;
  name: string;
  description?: string;
  submissionType: ARBSubmissionType;
  data: Partial<CreateARBSubmissionRequest>;
  createdBy: string;
  createdAt: Date;
}

// Audit Log Entry
interface ARBAuditLogEntry {
  id: string;
  submissionId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
}

// Meeting Minutes
interface ARBMeetingMinutes {
  id: string;
  meetingId: string;
  content: string;
  actionItems: ARBActionItem[];
  decisions: ARBDecision[];
  distributedAt?: Date;
}
```

---

## Testing Strategy

### After Each Phase:
1. Run tests for that specific category
2. Fix any failures immediately
3. Run full ARB test suite to check for regressions
4. Run Phase 1 tests to ensure no regressions

### Continuous Testing:
- Write tests as we build components
- Test components in isolation
- Test integration with backend
- Test end-to-end workflows

---

## Success Criteria

### Phase 2.3 Complete When:
- ✅ All 141 ARB tests pass (47 unique × 3 browsers)
- ✅ Phase 1 tests still pass (no regressions)
- ✅ All CRUD operations work end-to-end
- ✅ Full audit trail maintained
- ✅ Production-ready code quality
- ✅ No console errors
- ✅ No temporary hacks or shortcuts

---

## Risk Mitigation

### Potential Issues:
1. **Backend API Missing Endpoints**
   - Risk: High
   - Mitigation: Check backend before each phase, implement missing endpoints

2. **Complex State Management**
   - Risk: Medium
   - Mitigation: Use React Query for server state, Zustand for UI state

3. **Test Flakiness**
   - Risk: Medium
   - Mitigation: Add proper waits, use data-testid attributes

4. **File Upload Complexity**
   - Risk: Low
   - Mitigation: Use existing upload patterns in codebase

---

## Time Estimate

- Phase 2.3.1: Core Requests (P0) - 4-6 hours
- Phase 2.3.2: Review Process (P0) - 4-6 hours
- Phase 2.3.3: Dashboard (P1) - 2-3 hours
- Phase 2.3.4: Meetings (P1) - 4-6 hours
- Phase 2.3.5: Card Integration (P1) - 2-3 hours
- Phase 2.3.6: Permissions (P2) - 2-3 hours
- Phase 2.3.7: Audit Trail (P2) - 2-3 hours
- Phase 2.3.8: Templates (P2) - 1-2 hours
- Phase 2.3.9: Notifications (P3) - 2-3 hours

**Total Estimated: 23-35 hours**

---

## Execution Order

1. Start with Phase 2.3.1 (Core Requests) - highest test count, foundation
2. Continue with Phase 2.3.2 (Review Process) - enables decision workflow
3. Phase 2.3.3 (Dashboard) - improves user experience
4. Phase 2.3.4 (Meetings) - major feature area
5. Phase 2.3.5 (Card Integration) - connects to existing cards
6. Phase 2.3.6-2.3.9 - Complete remaining features

Run full regression after each phase completion.
