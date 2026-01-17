use sqlx::PgPool;
use uuid::Uuid;
use crate::models::arb_notification::{ARBNotification, CreateNotificationRequest, NotificationResponse};
use crate::error::AppError;

pub struct ARBNotificationService {
    pool: PgPool,
}

impl ARBNotificationService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new notification
    pub async fn create_notification(
        &self,
        request: CreateNotificationRequest,
    ) -> Result<ARBNotification, AppError> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();

        let notification = sqlx::query_as::<_, ARBNotification>(
            r#"
            INSERT INTO arb_notifications
            (id, recipient_id, submission_id, meeting_id, notification_type,
             title, message, is_read, read_at, action_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#
        )
        .bind(id)
        .bind(request.recipient_id)
        .bind(request.submission_id)
        .bind(request.meeting_id)
        .bind(&request.notification_type)
        .bind(&request.title)
        .bind(&request.message)
        .bind(false)
        .bind::<Option<chrono::DateTime<chrono::Utc>>>(None)
        .bind(&request.action_url)
        .bind(now)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create notification: {}", e)))?;

        Ok(notification)
    }

    /// Get notifications for a user
    pub async fn get_user_notifications(
        &self,
        recipient_id: Uuid,
        include_read: bool,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ARBNotification>, AppError> {
        let notifications = if include_read {
            sqlx::query_as::<_, ARBNotification>(
                r#"
                SELECT * FROM arb_notifications
                WHERE recipient_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
                "#
            )
            .bind(recipient_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
        } else {
            sqlx::query_as::<_, ARBNotification>(
                r#"
                SELECT * FROM arb_notifications
                WHERE recipient_id = $1 AND is_read = false
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
                "#
            )
            .bind(recipient_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
        }
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch notifications: {}", e)))?;

        Ok(notifications)
    }

    /// Mark a notification as read
    pub async fn mark_as_read(
        &self,
        notification_id: Uuid,
    ) -> Result<ARBNotification, AppError> {
        let now = chrono::Utc::now();

        let notification = sqlx::query_as::<_, ARBNotification>(
            r#"
            UPDATE arb_notifications
            SET is_read = true, read_at = $1, updated_at = $2
            WHERE id = $3
            RETURNING *
            "#
        )
        .bind(now)
        .bind(now)
        .bind(notification_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to mark notification as read: {}", e)))?;

        Ok(notification)
    }

    /// Mark all notifications for a user as read
    pub async fn mark_all_as_read(
        &self,
        recipient_id: Uuid,
    ) -> Result<u64, AppError> {
        let now = chrono::Utc::now();

        let result = sqlx::query(
            r#"
            UPDATE arb_notifications
            SET is_read = true, read_at = $1, updated_at = $2
            WHERE recipient_id = $3 AND is_read = false
            "#
        )
        .bind(now)
        .bind(now)
        .bind(recipient_id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to mark all notifications as read: {}", e)))?;

        Ok(result.rows_affected())
    }

    /// Get unread count for a user
    pub async fn get_unread_count(
        &self,
        recipient_id: Uuid,
    ) -> Result<i64, AppError> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM arb_notifications
            WHERE recipient_id = $1 AND is_read = false
            "#
        )
        .bind(recipient_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get unread count: {}", e)))?;

        Ok(count)
    }

    /// Delete a notification
    pub async fn delete_notification(
        &self,
        notification_id: Uuid,
    ) -> Result<(), AppError> {
        sqlx::query(
            "DELETE FROM arb_notifications WHERE id = $1"
        )
        .bind(notification_id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to delete notification: {}", e)))?;

        Ok(())
    }
}
