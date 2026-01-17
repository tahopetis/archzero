use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ARBNotification {
    pub id: Uuid,
    pub recipient_id: Uuid,
    pub submission_id: Option<Uuid>,
    pub meeting_id: Option<Uuid>,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub is_read: bool,
    pub read_at: Option<chrono::DateTime<chrono::Utc>>,
    pub action_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateNotificationRequest {
    pub recipient_id: Uuid,
    pub submission_id: Option<Uuid>,
    pub meeting_id: Option<Uuid>,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub action_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct NotificationResponse {
    pub id: Uuid,
    pub recipient_id: Uuid,
    pub submission_id: Option<Uuid>,
    pub meeting_id: Option<Uuid>,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub is_read: bool,
    pub read_at: Option<chrono::DateTime<chrono::Utc>>,
    pub action_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<ARBNotification> for NotificationResponse {
    fn from(notification: ARBNotification) -> Self {
        Self {
            id: notification.id,
            recipient_id: notification.recipient_id,
            submission_id: notification.submission_id,
            meeting_id: notification.meeting_id,
            notification_type: notification.notification_type,
            title: notification.title,
            message: notification.message,
            is_read: notification.is_read,
            read_at: notification.read_at,
            action_url: notification.action_url,
            created_at: notification.created_at,
            updated_at: notification.updated_at,
        }
    }
}
