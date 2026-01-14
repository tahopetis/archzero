use anyhow::Result;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use bcrypt::{hash, verify, DEFAULT_COST};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{Utc, Duration};
use serde::Deserialize;

use crate::models::user::{User, Claims, LoginRequest, RegisterRequest, LoginResponse, UserRole};
use crate::error::AppError;

pub struct AuthService {
    pool: PgPool,
    jwt_secret: String,
    jwt_expiration: i64,
}

#[derive(Debug, Deserialize, FromRow)]
struct UserRow {
    id: Uuid,
    email: String,
    full_name: Option<String>,
    role: String,
    password_hash: String,
    failed_login_attempts: i32,
    locked_until: Option<chrono::DateTime<Utc>>,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
}

impl AuthService {
    pub fn new(pool: PgPool, jwt_secret: String, jwt_expiration: i64) -> Self {
        Self {
            pool,
            jwt_secret,
            jwt_expiration,
        }
    }

    pub async fn login(&self, req: LoginRequest) -> Result<LoginResponse, AppError> {
        // Fetch user from database
        let user_row = sqlx::query_as::<_, UserRow>(
            "SELECT id, email, full_name, role, password_hash, failed_login_attempts, locked_until, created_at, updated_at
             FROM users WHERE email = $1"
        )
        .bind(&req.email)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        let user_row = user_row.ok_or(AppError::Auth("Invalid credentials".to_string()))?;

        // Check if account is locked
        if let Some(locked_until) = user_row.locked_until {
            if Utc::now() < locked_until {
                return Err(AppError::Auth("Account locked".to_string()));
            }
            // Lock expired, reset it
            sqlx::query("UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = $1")
                .bind(&user_row.id)
                .execute(&self.pool)
                .await
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;
        }

        // Verify password
        let is_valid = verify(&req.password, &user_row.password_hash)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Password verification error: {}", e)))?;

        if !is_valid {
            // Increment failed login attempts
            let new_attempts = user_row.failed_login_attempts + 1;

            if new_attempts >= 5 {
                // Lock account for 30 minutes
                let lock_until = Utc::now() + Duration::minutes(30);
                sqlx::query("UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3")
                    .bind(new_attempts)
                    .bind(&lock_until)
                    .bind(&user_row.id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

                return Err(AppError::Auth("Account locked".to_string()));
            } else {
                sqlx::query("UPDATE users SET failed_login_attempts = $1 WHERE id = $2")
                    .bind(new_attempts)
                    .bind(&user_row.id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;
            }

            return Err(AppError::Auth("Invalid credentials".to_string()));
        }

        // Reset failed login attempts on successful login
        sqlx::query("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1")
            .bind(&user_row.id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        // Parse role from string (database uses lowercase)
        let role = match user_row.role.as_str() {
            "admin" => UserRole::Admin,
            "architect" => UserRole::Architect,
            "editor" => UserRole::Editor,
            "viewer" => UserRole::Viewer,
            _ => UserRole::Viewer,
        };

        // Create user object
        let user = User {
            id: user_row.id,
            email: user_row.email,
            full_name: user_row.full_name,
            role,
            created_at: user_row.created_at,
            updated_at: user_row.updated_at,
        };

        // Generate JWT token
        let token = self.generate_token(&user)?;

        Ok(LoginResponse { token, user })
    }

    pub async fn register(&self, req: RegisterRequest) -> Result<User, AppError> {
        // Hash password
        let _password_hash = hash(&req.password, DEFAULT_COST)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Password hash failed: {}", e)))?;

        // Insert user into database
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        // TODO: This will fail until users table is created in migration
        let user = User {
            id: user_id,
            email: req.email.clone(),
            full_name: req.full_name,
            role: req.role,
            created_at: now,
            updated_at: now,
        };

        Ok(user)
    }

    pub async fn get_user(&self, user_id: Uuid) -> Result<User, AppError> {
        // TODO: Implement when users table exists
        // For now, return a dummy user
        Ok(User {
            id: user_id,
            email: "user@example.com".to_string(),
            full_name: None,
            role: UserRole::Viewer,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }

    pub fn generate_token(&self, user: &User) -> Result<String, AppError> {
        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(self.jwt_expiration))
            .expect("valid timestamp")
            .timestamp();

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role.clone(),
            exp: expiration as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Token generation failed: {}", e)))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, AppError> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|e| AppError::Jwt(e))
    }

    /// Reset authentication state for testing
    /// This should ONLY be called in development/test environments
    pub async fn reset_auth_state(&self) -> Result<(), AppError> {
        sqlx::query("UPDATE users SET failed_login_attempts = 0, locked_until = NULL")
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;
        Ok(())
    }
}
