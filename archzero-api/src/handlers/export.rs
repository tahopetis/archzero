use axum::extract::{Json, State, Query};
use axum::response::{Response, IntoResponse};
use axum::http::{StatusCode, header};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

use crate::{
    error::AppError,
    state::AppState,
    models::export::{ExportRequest, ExportFormat, ExportFilters},
};

/// Query parameters for export history
#[derive(Debug, Deserialize, utoipa::IntoParams)]
pub struct ExportHistoryParams {
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

/// Export cards endpoint
///
/// Export cards to CSV, Excel, or JSON format
#[utoipa::path(
    post,
    path = "/api/v1/export/cards",
    request_body = ExportRequest,
    responses(
        (status = 200, description = "Export file generated successfully", content_type = "text/csv"),
        (status = 200, description = "Export file generated successfully", content_type = "application/json"),
        (status = 400, description = "Invalid format"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Export",
    security(("bearer_auth" = []))
)]
pub async fn export_cards(
    State(state): State<AppState>,
    Json(req): Json<ExportRequest>,
) -> Result<Response<impl IntoResponse>, AppError> {
    // Get user ID from JWT (would normally come from middleware)
    // For now, use a placeholder - in real implementation, extract from request
    let user_id = Uuid::new_v4(); // Placeholder

    // Call export service
    let export = state.export_service.export_cards(req, user_id).await?;

    // Read the file
    let file_content = tokio::fs::read(&export.file_path.ok_or_else(||
        AppError::Internal(anyhow::anyhow!("Export file path not found"))
    )?)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to read export file: {}", e)))?;

    // Determine content type based on format
    let content_type = match export.format.as_str() {
        "csv" => "text/csv",
        "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "json" => "application/json",
        _ => "application/octet-stream",
    };

    // Determine file extension
    let extension = match export.format.as_str() {
        "csv" => "csv",
        "excel" => "xlsx",
        "json" => "json",
        _ => "bin",
    };

    let filename = format!("cards_export.{}", extension);
    let content_disposition = format!("attachment; filename=\"{}\"", filename);

    // Return file response
    let response = (
        [(header::CONTENT_TYPE, content_type),
         (header::CONTENT_DISPOSITION, content_disposition.as_str())],
        file_content,
    );
    Ok(response.into_response())
}

/// Export by domain endpoint
///
/// Export data by domain (relationships, principles, standards, policies, risks)
#[utoipa::path(
    post,
    path = "/api/v1/export/{domain}",
    params(
        ("domain" = String, Path, description = "Domain to export (relationships, principles, standards, policies, risks)")
    ),
    request_body = ExportRequest,
    responses(
        (status = 200, description = "Export file generated successfully"),
        (status = 400, description = "Invalid domain or format"),
        (status = 404, description = "Invalid domain"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Export",
    security(("bearer_auth" = []))
)]
pub async fn export_domain(
    State(state): State<AppState>,
    axum::extract::Path(domain): axum::extract::Path<String>,
    Json(req): Json<ExportRequest>,
) -> Result<Response<impl IntoResponse>, AppError> {
    // Validate domain
    let valid_domains = vec!["relationships", "principles", "standards", "policies", "risks"];
    if !valid_domains.contains(&domain.as_str()) {
        let response = (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": format!("Invalid domain: {}. Valid domains: {}", domain, valid_domains.join(", "))
            }))
        );
        return Ok(response.into_response());
    }

    // Get user ID (placeholder)
    let user_id = Uuid::new_v4();

    // Call export service
    let export = state.export_service.export_domain(&domain, req, user_id).await?;

    // Read the file
    let file_content = tokio::fs::read(&export.file_path.ok_or_else(||
        AppError::Internal(anyhow::anyhow!("Export file path not found"))
    )?)
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to read export file: {}", e)))?;

    // Determine content type
    let content_type = match export.format.as_str() {
        "csv" => "text/csv",
        "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "json" => "application/json",
        _ => "application/octet-stream",
    };

    let extension = match export.format.as_str() {
        "csv" => "csv",
        "excel" => "xlsx",
        "json" => "json",
        _ => "bin",
    };

    let filename = format!("{}_export.{}", domain, extension);
    let content_disposition = format!("attachment; filename=\"{}\"", filename);

    let response = (
        [(header::CONTENT_TYPE, content_type),
         (header::CONTENT_DISPOSITION, content_disposition.as_str())],
        file_content,
    );
    Ok(response.into_response())
}

/// Get export history endpoint
///
/// Retrieve export history for the current user
#[utoipa::path(
    get,
    path = "/api/v1/export/history",
    params(
        ("limit" = u32, Query, description = "Number of results to return (default 50)"),
        ("offset" = u32, Query, description = "Number of results to skip (default 0)")
    ),
    responses(
        (status = 200, description = "Export history retrieved successfully"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Export",
    security(("bearer_auth" = []))
)]
pub async fn get_export_history(
    State(state): State<AppState>,
    Query(params): Query<ExportHistoryParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Get user ID (placeholder)
    let user_id = Uuid::new_v4();

    let limit = params.limit.unwrap_or(50);
    let offset = params.offset.unwrap_or(0);

    let response = state.export_service.get_export_history(user_id, limit, offset).await?;

    let json_value = serde_json::to_value(response)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize response: {}", e)))?;

    Ok(Json(json_value))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_history_params() {
        let params = ExportHistoryParams {
            limit: Some(100),
            offset: Some(0),
        };
        assert_eq!(params.limit, Some(100));
        assert_eq!(params.offset, Some(0));
    }
}
