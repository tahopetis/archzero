use serde::Deserialize;
use config::{Config, ConfigError, Environment, File};

#[derive(Debug, Deserialize, Clone)]
pub struct Database {
    pub postgres_url: String,
    pub neo4j_uri: String,
    pub neo4j_user: String,
    pub neo4j_password: String,
    pub redis_url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Jwt {
    pub secret: String,
    pub expiration_hours: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Server {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Settings {
    pub database: Database,
    pub jwt: Jwt,
    pub server: Server,
}

impl Settings {
    pub fn new() -> Result<Self, ConfigError> {
        let s = Config::builder()
            .add_source(File::with_name("config/default"))
            .add_source(File::with_name("config/local").required(false))
            .add_source(Environment::with_prefix("ARCHZERO").separator("__"))
            .build()?;

        s.try_deserialize()
    }
}
