use anyhow::Result;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use bcrypt::{hash, DEFAULT_COST};
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{Utc, Duration};

use crate::models::user::{User, Claims, LoginRequest, RegisterRequest, LoginResponse, UserRole};
use crate::error::AppError;

pub struct AuthService {
    pool: PgPool,
    jwt_secret: String,
    jwt_expiration: i64,
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
        // TODO: Fetch user from database when users table exists
        // For now, return a dummy user
        let user_id = Uuid::new_v4();
        let user = User {
            id: user_id,
            email: req.email.clone(),
            full_name: None,
            role: UserRole::Admin,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

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
}
