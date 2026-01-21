use axum::extract::{Json, State};
use axum::response::IntoResponse;
use axum::http::{header, StatusCode};
use uuid::Uuid;
use serde::{Deserialize, Serialize};

use crate::{
    error::AppError,
    state::AppState,
    services::report_service::{ReportRequest, ReportFormat},
};

/// Request to generate a report
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct GenerateReportRequest {
    pub template_id: Uuid,
    pub data: serde_json::Value,
    #[serde(default = "default_report_format")]
    pub format: ReportFormat,
}

fn default_report_format() -> ReportFormat {
    ReportFormat::Pdf
}

impl From<GenerateReportRequest> for ReportRequest {
    fn from(req: GenerateReportRequest) -> Self {
        Self {
            template_id: req.template_id,
            data: req.data,
            format: req.format,
        }
    }
}

/// Generate a report endpoint
///
/// Generates a PDF or PowerPoint report from the specified template
#[utoipa::path(
    post,
    path = "/api/v1/reports/generate",
    request_body = GenerateReportRequest,
    responses(
        (status = 200, description = "Report generated successfully", content_type = "application/pdf"),
        (status = 200, description = "Report generated successfully", content_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        (status = 400, description = "Invalid template_id or request format"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Reports",
    security(("bearer_auth" = []))
)]
pub async fn generate_report(
    State(state): State<AppState>,
    Json(req): Json<GenerateReportRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate template_id (basic check - would query database in production)
    if req.template_id == Uuid::nil() {
        return Ok((
            StatusCode::BAD_REQUEST,
            "Invalid template_id: cannot be nil UUID"
        ).into_response());
    }

    // Capture format before converting request
    let format = req.format.clone();

    // Convert request to ReportRequest
    let report_request = ReportRequest::from(req);

    // Generate report
    let report_bytes = state.report_service
        .generate_report(report_request)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to generate report: {}", e)))?;

    // Determine content type based on format
    let content_type = match format {
        ReportFormat::Pdf => "application/pdf",
        ReportFormat::PowerPoint => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    let filename = match format {
        ReportFormat::Pdf => format!("report_{}.pdf", Uuid::new_v4()),
        ReportFormat::PowerPoint => format!("report_{}.pptx", Uuid::new_v4()),
    };

    let content_disposition = format!("attachment; filename=\"{}\"", filename);

    let response = (
        [(header::CONTENT_TYPE, content_type),
         (header::CONTENT_DISPOSITION, content_disposition.as_str())],
        report_bytes,
    );

    Ok(response.into_response())
}

/// Section type for custom reports
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ReportSection {
    Text { content: String },
    Table {
        headers: Vec<String>,
        rows: Vec<Vec<String>>,
    },
    Chart {
        chart_type: String,
        data: serde_json::Value,
    },
}

/// Request to generate a custom report
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CustomReportRequest {
    pub title: String,
    pub sections: Vec<ReportSection>,
    #[serde(default = "default_report_format")]
    pub format: ReportFormat,
    #[serde(default)]
    pub filters: Option<serde_json::Value>,
}

/// Generate a custom report endpoint
///
/// Generates a custom PDF or PowerPoint report with specified sections
#[utoipa::path(
    post,
    path = "/api/v1/reports/custom",
    request_body = CustomReportRequest,
    responses(
        (status = 200, description = "Custom report generated successfully", content_type = "application/pdf"),
        (status = 200, description = "Custom report generated successfully", content_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        (status = 400, description = "Invalid section structure"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Reports",
    security(("bearer_auth" = []))
)]
pub async fn generate_custom_report(
    State(state): State<AppState>,
    Json(req): Json<CustomReportRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate title
    if req.title.trim().is_empty() {
        return Ok((
            StatusCode::BAD_REQUEST,
            "Invalid title: cannot be empty"
        ).into_response());
    }

    // Validate sections
    if req.sections.is_empty() {
        return Ok((
            StatusCode::BAD_REQUEST,
            "Invalid sections: must have at least one section"
        ).into_response());
    }

    // Capture format
    let format = req.format.clone();

    // Convert custom report to standard report request
    let data = serde_json::json!({
        "title": req.title,
        "sections": req.sections,
        "filters": req.filters
    });

    let report_request = ReportRequest {
        template_id: Uuid::new_v4(), // Custom reports use generated template ID
        data,
        format: req.format,
    };

    // Generate report
    let report_bytes = state.report_service
        .generate_report(report_request)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to generate custom report: {}", e)))?;

    // Determine content type based on format
    let content_type = match format {
        ReportFormat::Pdf => "application/pdf",
        ReportFormat::PowerPoint => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    let filename = match format {
        ReportFormat::Pdf => format!("custom_report_{}.pdf", Uuid::new_v4()),
        ReportFormat::PowerPoint => format!("custom_report_{}.pptx", Uuid::new_v4()),
    };

    let content_disposition = format!("attachment; filename=\"{}\"", filename);

    let response = (
        [(header::CONTENT_TYPE, content_type),
         (header::CONTENT_DISPOSITION, content_disposition.as_str())],
        report_bytes,
    );

    Ok(response.into_response())
}
