use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::{ToSchema, IntoParams};

/// Export format options
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Csv,
    Excel,
    Json,
}

/// Export status tracking
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ExportStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

/// Export request from client
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
    pub format: ExportFormat,
    pub filters: Option<ExportFilters>,
    pub ids: Option<Vec<Uuid>>,
}

/// Export filters for querying data
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct ExportFilters {
    pub card_type: Option<String>,
    pub lifecycle_state: Option<String>,
    pub domain: Option<String>,
    pub date_from: Option<String>,  // ISO 8601 date
    pub date_to: Option<String>,    // ISO 8601 date
}

/// Export history item
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ExportHistoryItem {
    pub id: Uuid,
    pub export_type: String,
    pub format: String,  // Stored as string in DB, converted to ExportFormat enum in handlers
    pub status: String,  // Stored as string in DB, converted to ExportStatus enum in handlers
    pub file_path: Option<String>,
    pub file_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub error_message: Option<String>,
}

/// Scheduled export schedule types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum Schedule {
    Daily,
    Weekly,
    Monthly,
    Cron(String),
}

/// Scheduled export configuration
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledExport {
    pub id: Uuid,
    pub name: String,
    pub export_type: String,
    pub schedule: String,  // Stored as JSON string in DB, deserialized to Schedule enum in handlers
    pub filters: Option<serde_json::Value>,  // Stored as JSONB in DB
    pub format: String,  // Stored as string in DB
    pub next_run_at: DateTime<Utc>,
    pub last_run_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create scheduled export request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateScheduledExportRequest {
    pub name: String,
    pub export_type: String,
    pub schedule: Schedule,
    pub filters: Option<ExportFilters>,
    pub format: ExportFormat,
}

/// Update scheduled export request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateScheduledExportRequest {
    pub name: Option<String>,
    pub schedule: Option<Schedule>,
    pub filters: Option<ExportFilters>,
    pub format: Option<ExportFormat>,
    pub is_active: Option<bool>,
}

/// Report format options
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum ReportFormat {
    Pdf,
    PowerPoint,
}

/// Report generation request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ReportRequest {
    pub template_id: Option<String>,
    pub data: serde_json::Value,
    pub format: ReportFormat,
}

/// Custom report builder request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CustomReportRequest {
    pub title: String,
    pub sections: Vec<ReportSection>,
    pub format: ReportFormat,
    pub filters: Option<ExportFilters>,
}

/// Report section definition
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ReportSection {
    pub section_type: String,  // "text", "table", "chart"
    pub title: String,
    pub content: serde_json::Value,
}

/// Report template
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub template_config: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create report template request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateReportTemplateRequest {
    pub name: String,
    pub description: Option<String>,
    pub template_config: serde_json::Value,
}

/// Update report template request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReportTemplateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub template_config: Option<serde_json::Value>,
}

/// Response for export history with pagination
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ExportHistoryResponse {
    pub data: Vec<ExportHistoryItem>,
    pub pagination: PaginationMetadata,
}

/// Response for scheduled exports list
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledExportsResponse {
    pub data: Vec<ScheduledExport>,
}

/// Response for report templates list
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ReportTemplatesResponse {
    pub data: Vec<ReportTemplate>,
}

/// Pagination metadata
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PaginationMetadata {
    pub page: u32,
    pub limit: u32,
    pub total: i64,
    pub total_pages: u32,
}

impl Schedule {
    /// Validate cron expression if schedule is Cron variant
    pub fn validate(&self) -> Result<(), String> {
        if let Schedule::Cron(cron_expr) = self {
            // Basic cron validation (5 parts: minute hour day month weekday)
            let parts: Vec<&str> = cron_expr.split_whitespace().collect();
            if parts.len() != 5 {
                return Err("Cron expression must have 5 parts: minute hour day month weekday".to_string());
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_format_display() {
        let format = ExportFormat::Csv;
        assert_eq!(serde_json::to_string(&format).unwrap(), r#""csv""#);
    }

    #[test]
    fn test_export_status_display() {
        let status = ExportStatus::Completed;
        assert_eq!(serde_json::to_string(&status).unwrap(), r#""Completed""#);
    }

    #[test]
    fn test_schedule_validate_cron_valid() {
        let schedule = Schedule::Cron("0 9 * * 1".to_string()); // Every Monday at 9 AM
        assert!(schedule.validate().is_ok());
    }

    #[test]
    fn test_schedule_validate_cron_invalid() {
        let schedule = Schedule::Cron("0 9 * *".to_string()); // Only 4 parts
        assert!(schedule.validate().is_err());
    }

    #[test]
    fn test_schedule_validate_non_cron() {
        let schedule = Schedule::Daily;
        assert!(schedule.validate().is_ok());
    }

    #[test]
    fn test_export_request_serialization() {
        let req = ExportRequest {
            format: ExportFormat::Excel,
            filters: None,
            ids: None,
        };
        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains(r#""format":"excel""#));
    }

    #[test]
    fn test_export_filters_with_optional_fields() {
        let filters = ExportFilters {
            card_type: Some("Application".to_string()),
            lifecycle_state: None,
            domain: None,
            date_from: None,
            date_to: None,
        };
        let json = serde_json::to_string(&filters).unwrap();
        assert!(json.contains(r#""cardType""#));
        assert!(!json.contains("lifecycleState"));
    }
}
