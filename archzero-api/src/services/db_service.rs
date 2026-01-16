use sqlx::postgres::PgPoolOptions;
use anyhow::Result;

pub struct DatabaseService {
    pub pool: sqlx::PgPool,
}

impl DatabaseService {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(50)  // Increased from 10 to 50 for better parallel test performance
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &sqlx::PgPool {
        &self.pool
    }
}

// Type alias for convenience
pub type PgPool = sqlx::PgPool;
