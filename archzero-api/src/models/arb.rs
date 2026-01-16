use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{NaiveDate, DateTime, Utc};
use utoipa::ToSchema;

/// ARB Meeting status
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ARBMeetingStatus {
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
}

/// ARB Submission type
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ARBSubmissionType {
    ExceptionRequest,
    PolicyViolation,
    StandardException,
    NewTechnologyProposal,
    ArchitectureReview,
    Other(String),
}

/// ARB Decision type
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ARBDecisionType {
    Approve,
    ApproveWithConditions,
    Reject,
    RequestMoreInfo,
    Defer,
}

/// ARB Meeting representation
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBMeeting {
    pub id: Uuid,
    pub title: String,
    #[serde(rename = "type")]
    pub meeting_type: String, // Always "ARBMeeting"
    pub scheduled_date: NaiveDate,
    pub status: ARBMeetingStatus,
    pub agenda: Vec<String>,
    pub attendees: Vec<Uuid>, // User IDs
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a new ARB meeting
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateARBMeetingRequest {
    pub title: String,
    pub scheduled_date: NaiveDate,
    pub agenda: Vec<String>,
    pub attendees: Vec<Uuid>,
}

/// Request to update an ARB meeting
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateARBMeetingRequest {
    pub title: Option<String>,
    pub scheduled_date: Option<NaiveDate>,
    pub status: Option<ARBMeetingStatus>,
    pub agenda: Option<Vec<String>>,
    pub attendees: Option<Vec<Uuid>>,
}

/// Query parameters for listing ARB meetings
#[derive(Debug, Deserialize, ToSchema, utoipa::IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct ARBMeetingSearchParams {
    pub status: Option<ARBMeetingStatus>,
    pub date_from: Option<NaiveDate>,
    pub date_to: Option<NaiveDate>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

/// ARB Submission representation
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBSubmission {
    pub id: Uuid,
    pub title: Option<String>,
    pub meeting_id: Option<Uuid>, // Optional until scheduled
    pub card_id: Option<Uuid>,
    #[serde(rename = "type")]
    pub submission_type: ARBSubmissionType,
    pub rationale: String,
    pub submitted_by: Uuid,
    pub submitted_at: DateTime<Utc>,
    pub decision: Option<ARBDecision>,
    pub priority: Option<ARBPriority>,
    pub related_policy_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// ARB Submission priority
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ARBPriority {
    Critical,
    High,
    Medium,
    Low,
}

/// Request to create a new ARB submission
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateARBSubmissionRequest {
    pub card_id: Option<Uuid>,
    #[serde(rename = "type")]
    pub submission_type: ARBSubmissionType,
    pub title: Option<String>,
    pub rationale: String,
    pub priority: ARBPriority,
    pub related_policy_id: Option<Uuid>,
}

/// Request to update an ARB submission
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateARBSubmissionRequest {
    pub meeting_id: Option<Uuid>,
    pub rationale: Option<String>,
    pub priority: Option<ARBPriority>,
}

/// Query parameters for listing ARB submissions
#[derive(Debug, Deserialize, ToSchema, utoipa::IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct ARBSubmissionSearchParams {
    pub meeting_id: Option<Uuid>,
    pub submission_type: Option<ARBSubmissionType>,
    pub status: Option<ARBSubmissionStatus>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

/// ARB Submission status for filtering
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ARBSubmissionStatus {
    Pending,
    UnderReview,
    DecisionMade,
    Deferred,
    Withdrawn,
}

/// ARB Decision representation
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBDecision {
    pub id: Uuid,
    pub submission_id: Uuid,
    #[serde(rename = "type")]
    pub decision_type: ARBDecisionType,
    pub decided_by: Uuid,
    pub decided_at: DateTime<Utc>,
    pub conditions: Option<String>,
    pub rationale: String,
    pub valid_until: Option<NaiveDate>,
}

/// Request to create an ARB decision
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateARBDecisionRequest {
    pub submission_id: Uuid,
    #[serde(rename = "type")]
    pub decision_type: ARBDecisionType,
    pub conditions: Option<String>,
    pub rationale: String,
    pub valid_until: Option<NaiveDate>,
}

/// Request to update an ARB decision
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateARBDecisionRequest {
    pub decision_type: Option<ARBDecisionType>,
    pub conditions: Option<String>,
    pub rationale: Option<String>,
    pub valid_until: Option<NaiveDate>,
}

/// Response for listing ARB meetings
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBMeetingListResponse {
    pub data: Vec<ARBMeeting>,
    pub pagination: ARBPagination,
}

/// Response for listing ARB submissions
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBSubmissionListResponse {
    pub data: Vec<ARBSubmission>,
    pub pagination: ARBPagination,
}

/// Pagination metadata for ARB entities
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBPagination {
    pub page: u32,
    pub limit: u32,
    pub total: i64,
}

/// ARB Meeting Agenda Item
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBAgendaItem {
    pub submission_id: Uuid,
    pub title: String,
    pub submission_type: ARBSubmissionType,
    pub priority: ARBPriority,
    pub estimated_duration_minutes: Option<u32>,
}

/// Request to add a submission to a meeting
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AddSubmissionToMeetingRequest {
    pub submission_id: Uuid,
    pub estimated_duration_minutes: Option<u32>,
}

/// ARB Dashboard summary
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBDashboard {
    pub pending_submissions: i32,
    pub upcoming_meetings: i32,
    pub decisions_this_month: i32,
    pub critical_submissions: i32,
    pub avg_decision_time_days: f64,
}

/// ARB Statistics
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ARBStatistics {
    pub total_submissions: i64,
    pub total_meetings: i64,
    pub approval_rate: f64,
    pub avg_decision_time_hours: f64,
    pub submissions_by_type: Vec<SubmissionTypeCount>,
    pub decisions_by_type: Vec<DecisionTypeCount>,
}

/// Count by submission type
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SubmissionTypeCount {
    #[serde(rename = "type")]
    pub submission_type: ARBSubmissionType,
    pub count: i64,
}

/// Count by decision type
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DecisionTypeCount {
    #[serde(rename = "type")]
    pub decision_type: ARBDecisionType,
    pub count: i64,
}
