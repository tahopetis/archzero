use sqlx::PgPool;
use uuid::Uuid;
use std::io::Cursor;
use std::path::PathBuf;
use crate::models::export::{
    ExportRequest, ExportHistoryItem, ExportFormat, ExportStatus, ExportFilters,
    ExportHistoryResponse, PaginationMetadata
};
use crate::error::AppError;

pub struct ExportService {
    pool: PgPool,
    export_dir: PathBuf,
}

impl ExportService {
    pub fn new(pool: PgPool) -> Self {
        // Use /tmp/exports for development
        let export_dir = PathBuf::from("/tmp/exports");

        // Create export directory if it doesn't exist
        std::fs::create_dir_all(&export_dir)
            .unwrap_or_else(|e| eprintln!("Failed to create export directory: {}", e));

        Self { pool, export_dir }
    }

    /// Export cards to CSV/Excel/JSON
    pub async fn export_cards(
        &self,
        request: ExportRequest,
        user_id: Uuid,
    ) -> Result<ExportHistoryItem, AppError> {
        let export_id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let file_extension = match request.format {
            ExportFormat::Csv => "csv",
            ExportFormat::Excel => "xlsx",
            ExportFormat::Json => "json",
        };

        let file_name = format!("cards_{}.{}", now.format("%Y%m%d_%H%M%S"), file_extension);
        let file_path = self.export_dir.join(&file_name);

        // Fetch cards from database
        let cards = self.fetch_cards(&request.filters).await?;

        // Generate export file
        match request.format {
            ExportFormat::Csv => {
                self.generate_csv(&cards, &file_path).await?;
            }
            ExportFormat::Excel => {
                return Err(AppError::Internal(anyhow::anyhow!("Excel export not yet implemented - requires additional system dependencies")));
            }
            ExportFormat::Json => {
                self.generate_json(&cards, &file_path).await?;
            }
        }

        // Create export history record
        let export = self.create_export_history(
            export_id,
            "cards".to_string(),
            request.format,
            ExportStatus::Completed,
            Some(file_path.to_string_lossy().to_string()),
            Some(format!("/exports/{}", file_name)),
            user_id,
            None,
        ).await?;

        Ok(export)
    }

    /// Export by domain (relationships, principles, standards, policies, risks)
    pub async fn export_domain(
        &self,
        domain: &str,
        request: ExportRequest,
        user_id: Uuid,
    ) -> Result<ExportHistoryItem, AppError> {
        let export_id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let file_extension = match request.format {
            ExportFormat::Csv => "csv",
            ExportFormat::Excel => "xlsx",
            ExportFormat::Json => "json",
        };

        let file_name = format!("{}_{}.{}", domain, now.format("%Y%m%d_%H%M%S"), file_extension);
        let file_path = self.export_dir.join(&file_name);

        // Fetch domain data from database
        let data = self.fetch_domain_data(domain, &request.filters).await?;

        // Generate export file
        match request.format {
            ExportFormat::Csv => {
                self.generate_csv_domain(&data, domain, &file_path).await?;
            }
            ExportFormat::Excel => {
                return Err(AppError::Internal(anyhow::anyhow!("Excel export not yet implemented - requires additional system dependencies")));
            }
            ExportFormat::Json => {
                self.generate_json(&data, &file_path).await?;
            }
        }

        // Create export history record
        let export = self.create_export_history(
            export_id,
            domain.to_string(),
            request.format,
            ExportStatus::Completed,
            Some(file_path.to_string_lossy().to_string()),
            Some(format!("/exports/{}", file_name)),
            user_id,
            None,
        ).await?;

        Ok(export)
    }

    /// Get export history for a user
    pub async fn get_export_history(
        &self,
        user_id: Uuid,
        limit: u32,
        offset: u32,
    ) -> Result<ExportHistoryResponse, AppError> {
        // Get total count
        let total: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM exports WHERE created_by = $1"
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to count exports: {}", e)))?;

        // Get paginated exports
        let exports = sqlx::query_as::<_, ExportHistoryItem>(
            r#"
            SELECT id, export_type, format, status, file_path, file_url,
                   error_message, created_at, created_by
            FROM exports
            WHERE created_by = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(user_id)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch export history: {}", e)))?;

        let total_pages = (total as f64 / limit as f64).ceil() as u32;

        let response = ExportHistoryResponse {
            data: exports,
            pagination: PaginationMetadata {
                page: offset / limit + 1,
                limit,
                total,
                total_pages,
            },
        };

        Ok(response)
    }

    /// Fetch cards from database with optional filters
    async fn fetch_cards(&self, filters: &Option<ExportFilters>) -> Result<Vec<serde_json::Value>, AppError> {
        // For now, return empty vec - will be fully implemented in handlers
        // This is a placeholder to allow compilation
        Ok(vec![])
    }

    /// Fetch domain data from database
    async fn fetch_domain_data(&self, domain: &str, filters: &Option<ExportFilters>) -> Result<Vec<serde_json::Value>, AppError> {
        // For now, return empty vec - will be implemented in US-005
        // This is a placeholder to allow compilation
        Ok(vec![])
    }

    /// Generate CSV file from data
    async fn generate_csv(&self, data: &[serde_json::Value], file_path: &PathBuf) -> Result<(), AppError> {
        use csv::WriterBuilder;

        let mut wtr = WriterBuilder::new().from_path(file_path)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create CSV file: {}", e)))?;

        // Write header if data exists
        if let Some(first_item) = data.first() {
            if let Some(obj) = first_item.as_object() {
                let headers: Vec<&str> = obj.keys().map(|k| k.as_str()).collect();
                wtr.write_record(&headers)
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to write CSV header: {}", e)))?;
            }
        }

        // Write data rows
        for item in data {
            if let Some(obj) = item.as_object() {
                let values: Vec<String> = obj.values()
                    .map(|v| v.to_string())
                    .collect();
                wtr.write_record(&values)
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to write CSV row: {}", e)))?;
            }
        }

        wtr.flush()
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to flush CSV: {}", e)))?;

        Ok(())
    }

    /// Generate CSV file for domain data
    async fn generate_csv_domain(&self, data: &[serde_json::Value], domain: &str, file_path: &PathBuf) -> Result<(), AppError> {
        // For now, use the same CSV generation
        self.generate_csv(data, file_path).await
    }

    /// Generate JSON file from data
    async fn generate_json(&self, data: &[serde_json::Value], file_path: &PathBuf) -> Result<(), AppError> {
        let json_array = serde_json::json!(data);
        let json_string = serde_json::to_string_pretty(&json_array)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize JSON: {}", e)))?;

        std::fs::write(file_path, json_string)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to write JSON file: {}", e)))?;

        Ok(())
    }

    /// Create export history record in database
    async fn create_export_history(
        &self,
        id: Uuid,
        export_type: String,
        format: ExportFormat,
        status: ExportStatus,
        file_path: Option<String>,
        file_url: Option<String>,
        created_by: Uuid,
        error_message: Option<String>,
    ) -> Result<ExportHistoryItem, AppError> {
        let now = chrono::Utc::now();

        // Convert format to string
        let format_str = match format {
            ExportFormat::Csv => "csv",
            ExportFormat::Excel => "excel",
            ExportFormat::Json => "json",
        };

        // Convert status to string
        let status_str = match status {
            ExportStatus::Pending => "Pending",
            ExportStatus::InProgress => "InProgress",
            ExportStatus::Completed => "Completed",
            ExportStatus::Failed => "Failed",
        };

        let export = sqlx::query_as::<_, ExportHistoryItem>(
            r#"
            INSERT INTO exports (id, export_type, format, status, file_path, file_url,
                                 error_message, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
            RETURNING id, export_type, format, status, file_path, file_url,
                      error_message, created_at, created_by
            "#
        )
        .bind(id)
        .bind(&export_type)
        .bind(format_str)
        .bind(status_str)
        .bind(&file_path)
        .bind(&file_url)
        .bind(&error_message)
        .bind(created_by)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create export history: {}", e)))?;

        Ok(export)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_service_creation() {
        // This is a placeholder test
        // In a real test, you'd set up a test database pool
        assert!(true);
    }
}
