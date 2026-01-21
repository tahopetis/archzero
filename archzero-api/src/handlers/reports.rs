use axum::extract::{Json, State};
use axum::response::IntoResponse;
use axum::http::{header, StatusCode};
use uuid::Uuid;
use serde::Deserialize;

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
