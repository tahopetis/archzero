use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::{ToSchema, IntoParams};

/// Exception status workflow
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ExceptionStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
}

/// Exception duration types
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "camelCase")]
pub enum ExceptionDuration {
    Days30,
    Days60,
    Days90,
    Permanent,
}

/// Exception card representing an approved deviation from policy
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Exception {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub policy_id: Uuid,
    pub card_id: Uuid,
    pub justification: String,
    pub duration: ExceptionDuration,
    pub compensating_controls: Vec<String>,
    pub status: ExceptionStatus,
    pub requested_by: Uuid,
    pub approved_by: Option<Uuid>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// Request to create a new exception
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateExceptionRequest {
    pub name: String,
    pub policy_id: Uuid,
    pub card_id: Uuid,
    pub justification: String,
    pub duration: ExceptionDuration,
    pub compensating_controls: Vec<String>,
}

/// Response after creating an exception
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateExceptionResponse {
    pub id: Uuid,
    pub status: ExceptionStatus,
    pub created_at: DateTime<Utc>,
}

/// Request to approve an exception
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ApproveExceptionRequest {
    pub approved_by: Uuid,
    pub comments: Option<String>,
}

/// Response after approving an exception
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ApproveExceptionResponse {
    pub id: Uuid,
    pub status: ExceptionStatus,
    pub approved_by: Uuid,
    pub approved_at: DateTime<Utc>,
}

/// Request to reject an exception
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RejectExceptionRequest {
    pub approved_by: Uuid,
    pub rejection_reason: String,
}

/// Response after rejecting an exception
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RejectExceptionResponse {
    pub id: Uuid,
    pub status: ExceptionStatus,
    pub approved_by: Uuid,
    pub rejection_reason: String,
}

/// Query parameters for listing exceptions
#[derive(Debug, Deserialize, IntoParams, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExceptionListParams {
    pub status: Option<ExceptionStatus>,
    pub policy_id: Option<Uuid>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

/// Query parameters for listing expiring exceptions
#[derive(Debug, Deserialize, IntoParams, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExpiringExceptionsParams {
    pub days: Option<u32>,
}

/// Exception list response
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExceptionListResponse {
    pub data: Vec<Exception>,
    pub pagination: ExceptionPagination,
}

/// Pagination metadata
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExceptionPagination {
    pub total: i64,
}

/// Expiring exception summary
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExpiringException {
    pub id: Uuid,
    pub policy_name: String,
    pub card_name: String,
    pub expires_at: DateTime<Utc>,
    pub days_until_expiry: i32,
    pub status: ExceptionStatus,
}

/// Expiring exceptions list response
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExpiringExceptionsResponse {
    pub data: Vec<ExpiringException>,
    pub total: i64,
}
