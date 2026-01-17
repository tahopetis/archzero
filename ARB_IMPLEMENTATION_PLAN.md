# ARB Implementation Plan - 100% E2E Test Pass

**Current Status:** 80/141 tests passing (56.7%)
**Goal:** 141/141 tests passing (100%)

**Last Updated:** January 17, 2026

---

## Summary

This plan outlines the implementation required to achieve 100% pass rate for all ARB E2E tests. The failing tests (61/141) are grouped into 4 major feature areas.

---

## Priority 1: ARB Templates System (9 failing tests)

**Impact:** 9 tests × 3 browsers = 27 test failures

### Backend Implementation

#### 1.1 Database Schema
```sql
CREATE TABLE arb_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  request_type VARCHAR(50) NOT NULL, -- 'application', 'major_change', 'exception'
  card_id UUID REFERENCES cards(id),
  template_data JSONB NOT NULL, -- Stores form fields, rationale, etc.
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_arb_templates_type ON arb_templates(request_type);
CREATE INDEX idx_arb_templates_created_by ON arb_templates(created_by);
```

**File:** `archzero-api/migrations/008_create_arb_templates.sql`

#### 1.2 Backend Models
**File:** `archzero-api/src/models/arb_template.rs`

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ARBTemplate {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub request_type: String,
    pub card_id: Option<Uuid>,
    pub template_data: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTemplateRequest {
    pub title: String,
    pub description: Option<String>,
    pub request_type: String,
    pub card_id: Option<Uuid>,
    pub submission_id: Uuid, // Copy from existing submission
}

#[derive(Debug, Deserialize)]
pub struct CreateFromTemplateRequest {
    pub template_id: Uuid,
    pub card_id: Option<Uuid>,
    pub title: String,
    pub additional_notes: Option<String>,
}
```

#### 1.3 API Handlers
**File:** `archzero-api/src/handlers/arb_templates.rs`

Required endpoints:
- `GET /api/v1/arb/templates` - List all templates
- `POST /api/v1/arb/templates` - Save submission as template
- `POST /api/v1/arb/submissions/from-template` - Create submission from template
- `PUT /api/v1/arb/templates/:id` - Update template
- `DELETE /api/v1/arb/templates/:id` - Delete template

#### 1.4 Main Router Integration
**File:** `archzero-api/src/main.rs`

Add routes:
```rust
.route("/api/v1/arb/templates", get(arb_templates::list_templates).post(arb_templates::create_template))
.route("/api/v1/arb/templates/:id", get(arb_templates::get_template).put(arb_templates::update_template).delete(arb_templates::delete_template))
.route("/api/v1/arb/submissions/from-template", post(arb_templates::create_from_template))
```

### Frontend Implementation

#### 1.5 API Service
**File:** `archzero-ui/src/services/arbTemplateService.ts`

```typescript
export const arbTemplateService = {
  listTemplates: () => fetch('/api/v1/arb/templates').then(r => r.json()),
  createTemplate: (data: CreateTemplateRequest) =>
    fetch('/api/v1/arb/templates', { method: 'POST', body: JSON.stringify(data) }),
  getTemplate: (id: string) => fetch(`/api/v1/arb/templates/${id}`).then(r => r.json()),
  updateTemplate: (id: string, data: UpdateTemplateRequest) =>
    fetch(`/api/v1/arb/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    fetch(`/api/v1/arb/templates/${id}`, { method: 'DELETE' }),
  createFromTemplate: (data: CreateFromTemplateRequest) =>
    fetch('/api/v1/arb/submissions/from-template', { method: 'POST', body: JSON.stringify(data) }),
};
```

#### 1.6 RequestDetail Component - Save as Template Button
**File:** `archzero-ui/src/components/governance/arb/RequestDetail.tsx`

Add "Save as Template" button in action menu:
```typescript
const handleSaveAsTemplate = async () => {
  const template = await arbTemplateService.createTemplate({
    title: `${submission.title} - Template`,
    description: submission.rationale,
    request_type: submission.request_type,
    card_id: submission.card_id,
    submission_id: submission.id,
  });
  setSuccessMessage('Saved as template');
};
```

Add `data-testid="save-as-template-btn"` attribute.

#### 1.7 CreateRequest Component - Use Template
**File:** `archzero-ui/src/components/governance/arb/CreateRequest.tsx`

Add template selection UI:
- "Use Template" button with `data-testid="use-template-btn"`
- Template modal/drawer showing available templates
- Pre-fill form with template data

#### 1.8 Template Management Page
**File:** `archzero-ui/src/components/governance/arb/TemplateLibrary.tsx`

Create new component with:
- List of all templates
- Edit/Delete buttons for each template
- `data-testid="template-library"`
- `data-testid="template-item"` for each template card
- `data-testid="edit-template-btn"` and `data-testid="delete-template-btn"`

#### 1.9 Routing
**File:** `archzero-ui/src/App.tsx`

Add route: `/arb/templates` for TemplateLibrary component

### Expected Test Impact
- ✅ should save request as template (3 tests)
- ✅ should create request from template (3 tests)
- ✅ should manage template library (3 tests)

---

## Priority 2: ARB Audit Trail System (9 failing tests)

**Impact:** 9 tests × 3 browsers = 27 test failures

### Backend Implementation

#### 2.1 Database Schema
```sql
CREATE TABLE arb_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'submission', 'decision', 'meeting'
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
  actor_id UUID REFERENCES users(id),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_arb_audit_entity ON arb_audit_logs(entity_type, entity_id);
CREATE INDEX idx_arb_audit_created_at ON arb_audit_logs(created_at DESC);
```

**File:** `archzero-api/migrations/009_create_arb_audit_logs.sql`

#### 2.2 Backend Models
**File:** `archzero-api/src/models/arb_audit.rs`

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ARBAuditLog {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub actor_id: Option<Uuid>,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct ARBAuditLogResponse {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub actor: Option<UserBasicInfo>,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}
```

#### 2.3 Audit Service
**File:** `archzero-api/src/services/audit_service.rs`

```rust
pub struct AuditService {
    pool: PgPool,
}

impl AuditService {
    pub async fn log_event(
        &self,
        entity_type: &str,
        entity_id: Uuid,
        action: &str,
        actor_id: Option<Uuid>,
        old_value: Option<serde_json::Value>,
        new_value: Option<serde_json::Value>,
        metadata: Option<serde_json::Value>,
    ) -> Result<(), AppError> {
        // Insert audit log record
    }

    pub async fn get_entity_history(
        &self,
        entity_type: &str,
        entity_id: Uuid,
    ) -> Result<Vec<ARBAuditLogResponse>, AppError> {
        // Fetch and return audit history
    }

    pub async fn export_audit_trail(
        &self,
        entity_type: &str,
        entity_id: Uuid,
    ) -> Result<String, AppError> {
        // Generate CSV export
    }
}
```

#### 2.4 Integration with Existing Services
Update `arb_service.rs` to call audit service on:
- Submission creation
- Submission updates
- Decision recording
- Meeting creation/updates

**File:** `archzero-api/src/services/arb_service.rs`

Add to all mutation methods:
```rust
self.audit_service.log_event(
    "submission",
    submission.id,
    "created",
    Some(user_id),
    None,
    Some(serde_json::to_value(submission)?),
    None,
).await?;
```

#### 2.5 API Handlers
**File:** `archzero-api/src/handlers/arb_audit.rs`

Required endpoints:
- `GET /api/v1/arb/audit/:entity_type/:entity_id` - Get audit trail
- `GET /api/v1/arb/audit/:entity_type/:entity_id/export` - Export as CSV
- `GET /api/v1/arb/audit/filter` - Filter by entity type, date range, actor

#### 2.6 Main Router Integration
**File:** `archzero-api/src/main.rs`

```rust
.route("/api/v1/arb/audit/:entity_type/:entity_id", get(arb_audit::get_audit_trail))
.route("/api/v1/arb/audit/:entity_type/:entity_id/export", get(arb_audit::export_audit_trail))
```

### Frontend Implementation

#### 2.7 Audit Trail Component
**File:** `archzero-ui/src/components/governance/arb/AuditTrail.tsx`

```typescript
interface AuditLog {
  id: string;
  action: string;
  actor: { email: string; full_name: string } | null;
  old_value: any;
  new_value: any;
  created_at: string;
}

export function AuditTrail({ entityType, entityId }: Props) {
  const { data: logs } = useQuery({
    queryKey: ['audit', entityType, entityId],
    queryFn: () => fetch(`/api/v1/arb/audit/${entityType}/${entityId}`).then(r => r.json()),
  });

  return (
    <div data-testid="audit-trail">
      {logs?.map(log => (
        <div key={log.id} data-testid={`audit-log-${log.id}`}>
          <span>{log.action}</span>
          <span>{log.actor?.email}</span>
          <span>{formatDate(log.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
```

#### 2.8 RequestDetail Component - Audit Tab
**File:** `archzero-ui/src/components/governance/arb/RequestDetail.tsx`

Add audit tab:
```typescript
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details" data-testid="details-tab">Details</TabsTrigger>
    <TabsTrigger value="audit" data-testid="audit-tab">Audit Trail</TabsTrigger>
  </TabsList>
  <TabsContent value="audit">
    <AuditTrail entityType="submission" entityId={id} />
  </TabsContent>
</Tabs>
```

#### 2.9 Audit Filtering Component
**File:** `archzero-ui/src/components/governance/arb/AuditFilter.tsx`

Add filter dropdown with `data-testid="audit-filter"`:
- Filter by entity type (submission, decision, meeting)
- Filter by date range
- Filter by actor

### Expected Test Impact
- ✅ should log request creation (3 tests)
- ✅ should log decision changes (3 tests)
- ✅ should show full audit trail for request (3 tests)
- ✅ should export audit trail (3 tests)

---

## Priority 3: ARB Integration with Cards (9 failing tests)

**Impact:** 9 tests × 3 browsers = 27 test failures

### Backend Implementation

#### 3.1 Card Model Updates
**File:** `archzero-api/src/models/card.rs`

Add ARB-related fields:
```rust
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Card {
    // ... existing fields ...
    pub arb_status: Option<String>, // 'pending', 'approved', 'rejected', 'conditional'
    pub arb_submission_id: Option<Uuid>,
    pub requires_arb_approval: bool,
}
```

#### 3.2 Database Migration
**File:** `archzero-api/migrations/010_add_arb_to_cards.sql`

```sql
ALTER TABLE cards ADD COLUMN IF NOT EXISTS arb_status VARCHAR(50);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS arb_submission_id UUID REFERENCES arb_submissions(id);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS requires_arb_approval BOOLEAN DEFAULT false;

CREATE INDEX idx_cards_arb_status ON cards(arb_status);
```

#### 3.3 Card Service Updates
**File:** `archzero-api/src/services/card_service.rs`

Update `list_cards` to include ARB status:
```rust
pub async fn list_cards(&self, filters: CardFilters) -> Result<Vec<Card>, AppError> {
    // ... existing code ...
    // Add JOIN with arb_submissions to get ARB status
}
```

Update `update_card` to enforce ARB approval:
```rust
pub async fn update_card(&self, id: Uuid, updates: CardUpdate) -> Result<Card, AppError> {
    // Check if card requires ARB approval
    let card = self.get_card(id).await?;

    if card.requires_arb_approval && card.arb_status != Some("approved".to_string()) {
        return Err(AppError::Auth("Card requires ARB approval before modification".to_string()));
    }

    // Proceed with update
}
```

#### 3.4 ARB Service Updates
**File:** `archzero-api/src/services/arb_service.rs`

Add sync logic:
```rust
pub async fn record_decision(&self, decision: RecordDecisionRequest) -> Result<ARBDecision, AppError> {
    // ... existing code ...

    // Sync with linked card
    if let Some(card_id) = submission.card_id {
        let new_status = match decision.decision_type {
            DecisionType::Approve => "approved",
            DecisionType::Reject => "rejected",
            DecisionType::Conditional => "conditional",
            DecisionType::Defer => "pending",
        };

        sqlx::query("UPDATE cards SET arb_status = $1 WHERE id = $2")
            .bind(new_status)
            .bind(card_id)
            .execute(&self.pool)
            .await?;
    }

    Ok(decision)
}
```

#### 3.5 API Response Updates
**File:** `archzero-api/src/handlers/cards.rs`

Update card list response to include ARB status:
```rust
pub async fn list_cards(Query(params): Query<CardListParams>) -> Result<Json<Vec<Card>>> {
    let cards = card_service.list_cards(filters).await?;
    Ok(Json(cards)) // Cards now include arb_status field
}
```

### Frontend Implementation

#### 3.6 Card Detail Updates
**File:** `archzero-ui/src/components/cards/CardDetail.tsx`

Display ARB status:
```typescript
<Card className="p-6">
  {card.requires_arb_approval && (
    <div data-testid="arb-status-badge">
      ARB Status: {card.arb_status || 'Pending Review'}
    </div>
  )}
</Card>
```

#### 3.7 Card List Updates
**File:** `archzero-ui/src/components/cards/CardList.tsx`

Add ARB status column/badge:
```typescript
{card.requires_arb_approval && (
  <Badge data-testid={`arb-status-${card.id}`} variant="outline">
    {card.arb_status || 'Pending'}
  </Badge>
)}
```

#### 3.8 Card Edit Protection
**File:** `archzero-ui/src/components/cards/EditCard.tsx`

Check ARB status before allowing edits:
```typescript
const canEdit = !card.requires_arb_approval || card.arb_status === 'approved';

{!canEdit && (
  <div data-testid="arb-approval-required">
    This card requires ARB approval before editing
  </div>
)}
```

### Expected Test Impact
- ✅ should show ARB status on card (3 tests)
- ✅ should enforce ARB approval before changes (3 tests)
- ✅ should sync ARB decision with card status (3 tests)

---

## Priority 4: ARB Notifications System (9 failing tests)

**Impact:** 9 tests × 3 browsers = 27 test failures

### Backend Implementation

#### 4.1 Database Schema
```sql
CREATE TABLE arb_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'review_assigned', 'decision_made', 'reminder'
  submission_id UUID REFERENCES arb_submissions(id),
  message TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_arb_notifications_recipient ON arb_notifications(recipient_id, created_at DESC);
CREATE INDEX idx_arb_notifications_read ON arb_notifications(recipient_id, read_at);
```

**File:** `archzero-api/migrations/011_create_arb_notifications.sql`

#### 4.2 Notification Service
**File:** `archzero-api/src/services/notification_service.rs`

```rust
pub struct NotificationService {
    pool: PgPool,
    email_service: Option<EmailService>,
}

impl NotificationService {
    pub async fn notify_reviewer_assigned(&self, submission_id: Uuid, reviewer_id: Uuid) -> Result<(), AppError> {
        self.create_notification(
            reviewer_id,
            "review_assigned",
            submission_id,
            "You have been assigned to review an ARB request",
        ).await?;

        // Send email if configured
        if let Some(email) = &self.email_service {
            email.send_reviewer_notification(reviewer_id, submission_id).await?;
        }

        Ok(())
    }

    pub async fn notify_requester_of_decision(&self, submission_id: Uuid, decision: &str) -> Result<(), AppError> {
        let submission = self.get_submission(submission_id).await?;

        self.create_notification(
            submission.created_by,
            "decision_made",
            submission_id,
            &format!("Your ARB request has been: {}", decision),
        ).await?;

        Ok(())
    }

    pub async fn send_reminders_for_overdue(&self) -> Result<usize, AppError> {
        // Find overdue reviews
        let overdue = sqlx::query!(
            "SELECT reviewer_id, submission_id FROM arb_review_assignments
             WHERE status = 'in_progress' AND due_date < NOW()"
        )
        .fetch_all(&self.pool)
        .await?;

        for review in overdue {
            self.create_notification(
                review.reviewer_id,
                "reminder",
                review.submission_id,
                "Your ARB review is overdue",
            ).await?;
        }

        Ok(overdue.len())
    }

    async fn create_notification(
        &self,
        recipient_id: Uuid,
        type_: &str,
        submission_id: Uuid,
        message: &str,
    ) -> Result<(), AppError> {
        sqlx::query(
            "INSERT INTO arb_notifications (recipient_id, type, submission_id, message)
             VALUES ($1, $2, $3, $4)"
        )
        .bind(recipient_id)
        .bind(type_)
        .bind(submission_id)
        .bind(message)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
```

#### 4.3 ARB Service Integration
**File:** `archzero-api/src/services/arb_service.rs`

Call notification service on:
- Review assignment
- Decision recording
- Review status changes

```rust
// When assigning reviewer
self.notification_service.notify_reviewer_assigned(submission.id, reviewer_id).await?;

// When recording decision
self.notification_service.notify_requester_of_decision(submission.id, &decision_type).await?;
```

#### 4.4 API Handlers
**File:** `archzero-api/src/handlers/arb_notifications.rs`

Required endpoints:
- `GET /api/v1/arb/notifications` - List current user's notifications
- `PUT /api/v1/arb/notifications/:id/read` - Mark notification as read
- `POST /api/v1/arb/notifications/send-reminders` - Manual trigger for reminders

#### 4.5 Main Router Integration
**File:** `archzero-api/src/main.rs`

```rust
.route("/api/v1/arb/notifications", get(arb_notifications::list_notifications))
.route("/api/v1/arb/notifications/:id/read", put(arb_notifications::mark_read))
.route("/api/v1/arb/notifications/send-reminders", post(arb_notifications::send_reminders))
```

### Frontend Implementation

#### 4.6 Notification Context/Store
**File:** `archzero-ui/src/stores/useNotificationStore.ts`

```typescript
interface Notification {
  id: string;
  type: 'review_assigned' | 'decision_made' | 'reminder';
  submission_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    const response = await fetch('/api/v1/arb/notifications');
    const notifications = await response.json();
    set({ notifications, unreadCount: notifications.filter((n: Notification) => !n.read_at).length });
  },
  markAsRead: async (id: string) => {
    await fetch(`/api/v1/arb/notifications/${id}/read`, { method: 'PUT' });
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ),
      unreadCount: state.unreadCount - 1,
    }));
  },
}));
```

#### 4.7 Notification Toast Component
**File:** `archzero-ui/src/components/notifications/NotificationToast.tsx`

```typescript
export function NotificationToast() {
  const { notifications } = useNotificationStore();

  return (
    <div data-testid="notification-toast">
      {notifications.filter(n => !n.read_at).map(notification => (
        <div key={notification.id} className="toast">
          {notification.message}
        </div>
      ))}
    </div>
  );
}
```

#### 4.8 RequestDetail Integration
**File:** `archzero-ui/src/components/governance/arb/RequestDetail.tsx`

Show success messages with `data-testid="success-message"`:
```typescript
const handleAssignReviewer = async (reviewerId: string) => {
  await arbService.assignReviewer(submission.id, reviewerId);
  setSuccessMessage('Reviewer assigned successfully');
};

{successMessage && (
  <div data-testid="success-message" className="alert alert-success">
    {successMessage}
  </div>
)}
```

### Expected Test Impact
- ✅ should notify reviewer of assigned review (3 tests)
- ✅ should notify requester of decision (3 tests)
- ✅ should send reminder for overdue reviews (3 tests)

---

## Priority 5: Draft Editing & File Attachments (6 failing tests)

**Impact:** 6 tests × 3 browsers = 18 test failures

### Backend Implementation

#### 5.1 Submission Status Update
**File:** `archzero-api/src/models/arb_submission.rs`

Add draft status:
```rust
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SubmissionStatus {
    Draft,
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Conditional,
    Deferred,
}
```

#### 5.2 Database Migration
**File:** `archzero-api/migrations/012_add_draft_status.sql`

```sql
ALTER TABLE arb_submissions ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE arb_submissions ADD CONSTRAINT check_status
  CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected', 'conditional', 'deferred'));
```

#### 5.3 Update Endpoint Permissions
**File:** `archzero-api/src/handlers/arb_submissions.rs`

Allow edits for draft submissions by creator:
```rust
pub async fn update_submission(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    AuthUser(user): AuthUser,
    Json(update): Json<UpdateSubmissionRequest>,
) -> Result<Json<ARBSubmission>> {
    let submission = arb_service.get_submission(id).await?;

    // Allow edit if: draft + creator OR admin/chair
    let can_edit = submission.status == "draft" && submission.created_by == user.id
        || user.role == "admin"
        || user.role == "arbchair";

    if !can_edit {
        return Err(AppError::Auth("Not authorized to edit this submission".to_string()));
    }

    let updated = arb_service.update_submission(id, update).await?;
    Ok(Json(updated))
}
```

#### 5.4 File Upload Storage
**File:** `archzero-api/src/services/file_storage.rs`

```rust
pub struct FileStorage {
    upload_dir: PathBuf,
}

impl FileStorage {
    pub async fn save_attachment(&self, file: Multipart) -> Result<String, AppError> {
        let filename = file.filename.ok_or(AppError::BadRequest("No filename".to_string()))?;
        let path = self.upload_dir.join(&filename);

        // Save file
        tokio::fs::copy(&file.path, &path).await?;

        Ok(filename)
    }

    pub async fn delete_attachment(&self, filename: &str) -> Result<(), AppError> {
        let path = self.upload_dir.join(filename);
        tokio::fs::remove_file(path).await?;
        Ok(())
    }
}
```

#### 5.5 Attachment Database Schema
**File:** `archzero-api/migrations/013_add_attachments.sql`

```sql
CREATE TABLE arb_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES arb_submissions(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  content_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_arb_attachments_submission ON arb_attachments(submission_id);
```

#### 5.6 Attachment Handlers
**File:** `archzero-api/src/handlers/arb_attachments.rs`

Required endpoints:
- `POST /api/v1/arb/submissions/:id/attachments` - Upload file
- `GET /api/v1/arb/submissions/:id/attachments` - List attachments
- `DELETE /api/v1/arb/attachments/:id` - Delete attachment

### Frontend Implementation

#### 5.7 Edit Button for Drafts
**File:** `archzero-ui/src/components/governance/arb/RequestDetail.tsx`

```typescript
const canEdit = submission.status === 'draft' && submission.created_by === user?.id
    || user?.role === 'admin'
    || user?.role === 'arbchair';

{canEdit && (
  <button
    onClick={() => navigate(`/arb/submissions/${id}/edit`)}
    data-testid="edit-request-btn"
  >
    Edit Request
  </button>
)}
```

#### 5.8 File Upload Component
**File:** `archzero-ui/src/components/governance/arb/FileUpload.tsx`

```typescript
export function FileUpload({ submissionId }: { submissionId: string }) {
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = async () => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      await fetch(`/api/v1/arb/submissions/${submissionId}/attachments`, {
        method: 'POST',
        body: formData,
      });
    }

    queryClient.invalidateQueries(['submission', submissionId]);
    setFiles([]);
  };

  return (
    <div data-testid="file-upload">
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      <button onClick={handleUpload} data-testid="upload-btn">Upload</button>
    </div>
  );
}
```

#### 5.9 Attachment List Component
**File:** `archzero-ui/src/components/governance/arb/AttachmentList.tsx`

```typescript
export function AttachmentList({ submissionId }: { submissionId: string }) {
  const { data: attachments } = useQuery({
    queryKey: ['attachments', submissionId],
    queryFn: () => fetch(`/api/v1/arb/submissions/${submissionId}/attachments`).then(r => r.json()),
  });

  return (
    <div data-testid="attachment-list">
      {attachments?.map((file: any) => (
        <div key={file.id} data-testid={`attachment-${file.id}`}>
          <span>{file.original_filename}</span>
          <button onClick={() => deleteAttachment(file.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Expected Test Impact
- ✅ should allow editing draft requests (3 tests)
- ✅ should support file attachments (3 tests)

---

## Implementation Order & Dependencies

### Phase 1: Foundation (Week 1)
1. Database migrations for all tables (Templates, Audit, Notifications, Attachments, Cards ARB fields)
2. Basic models and services for each feature
3. API endpoints for all features

### Phase 2: Frontend Integration (Week 2)
1. Template system (templates CRUD, use template flow)
2. Audit trail (display logs, filtering, export)
3. Notifications (store, toasts, mark read)

### Phase 3: Card Integration & Polish (Week 3)
1. Card ARB status display and enforcement
2. Sync ARB decisions to cards
3. Draft editing functionality
4. File attachments

### Phase 4: Testing & Refinement (Week 4)
1. Full E2E test suite runs
2. Fix any remaining test failures
3. Performance optimization
4. Documentation

---

## Success Criteria

**Target:** 141/141 tests passing (100%)

### Test Breakdown by Feature
- ✅ ARB Review Requests: 10/10 passing (already complete)
- ✅ ARB Review Process: 7/7 passing (already complete)
- ✅ ARB Meetings: 2/2 passing (already complete)
- ✅ ARB Member Permissions: 9/9 passing (already complete)
- 🔄 ARB Templates: 0/9 → 9/9
- 🔄 ARB Audit Trail: 0/9 → 9/9
- 🔄 ARB Integration with Cards: 0/9 → 9/9
- 🔄 ARB Notifications: 0/9 → 9/9
- 🔄 Draft/Attachments: 0/6 → 6/6

---

## Testing Strategy

### Per Feature
1. Implement backend code
2. Write integration tests
3. Implement frontend code
4. Run specific E2E test suite for feature
5. Debug and fix until 100% passing

### Regression Testing
After each feature completion:
```bash
npx playwright test arb --reporter=line
```

Verify:
- No previously passing tests break
- Pass rate increases monotonically
- All tests for completed features pass

---

## Notes

### Critical Dependencies
- PostgreSQL database migrations must run in order
- Frontend depends on backend API stability
- E2E tests depend on both frontend and backend

### Risk Areas
- **File Uploads**: Ensure proper handling of large files
- **Audit Trail Performance**: May need pagination for large histories
- **Notification Delivery**: Email service is optional, in-app notifications required
- **Card Integration**: Must not break existing card functionality

### Performance Considerations
- Add indexes to all foreign keys and frequently queried fields
- Consider soft deletes for templates to preserve history
- Audit logs may need archival for old records
- Notification cleanup for old read notifications

---

## Next Steps

1. Review and approve this plan
2. Create GitHub issues for each feature
3. Set up project board with phases
4. Begin implementation with Priority 1 (Templates)

**Estimated Timeline:** 3-4 weeks for 100% test pass rate
