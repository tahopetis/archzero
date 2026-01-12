# Arc Zero Implementation Plan

**Version**: 2.0
**Date**: 2026-01-12
**Status**: Planning Phase
**Project**: Arc Zero Enterprise Architecture Platform v2.0

---

## Executive Summary

Arc Zero is a comprehensive Enterprise Architecture (EA) platform designed to bridge the gap between strategic business planning and technical implementation. This document outlines the complete implementation plan to build Arc Zero from **ground zero** to production deployment, covering all phases of development.

**Current State**: Documentation complete, zero code written.
**Target State**: Production-ready Arc Zero v2.0 platform with full Governance & Compliance capabilities.

### Vision Statement

To create an enterprise architecture platform that serves as the single source of truth for organizational technology landscapes, enabling data-driven architectural decisions through automated impact analysis, comprehensive governance, and real-time visualization of business-technology dependencies.

### Project Scope

**In Scope**:
- Complete platform development from scratch
- Backend API (Rust + Axum)
- Frontend application (React + Vite + Shadcn UI)
- Database schemas (PostgreSQL + Neo4j)
- All governance and compliance features (v2.0)
- Deployment infrastructure (Docker Compose + Kubernetes)
- Documentation and testing

**Out of Scope** (Future Phases):
- Mobile applications
- Advanced ML/AI beyond scoring profiles
- Multi-tenant SaaS deployment
- Real-time collaboration

---

## Implementation Phases

Arc Zero will be implemented across **7 phases** from foundation to production. Each phase builds upon the previous and delivers incrementally valuable functionality.

### Phase Overview

| Phase | Name | Duration | Status | Key Deliverables |
|-------|------|----------|--------|------------------|
| 0 | Foundation | 4 weeks | 🔴 Not Started | Dev environment, basic infra, auth |
| 1 | Core Functionality | 8 weeks | 🔴 Not Started | CRUD APIs, basic UI, card management |
| 2 | Intelligence Engines | 10 weeks | 🔴 Not Started | BIA, 6R, TCO engines |
| 3 | Governance & Compliance | 12 weeks | 🔴 Not Started | 7 governance card types, ARB workflows |
| 4 | Advanced Features | 6 weeks | 🔴 Not Started | Graph viz, bulk ops, exports |
| 5 | Production Hardening | 4 weeks | 🔴 Not Started | Monitoring, security, performance |
| 6 | Initial Deployment | 4 weeks | 🔴 Not Started | Production cutover, hypercare support |

**Total Timeline**: 48 weeks (~11 months) from zero to production

---

## Phase 0: Foundation (4 weeks)

**Goal**: Establish development infrastructure and basic authentication framework.

### Week 1-2: Development Environment

**Backend Setup**:
- [ ] Initialize Rust project with Cargo
  ```bash
  cargo new archzero-api --bin
  cd archzero-api
  ```
- [ ] Add dependencies to `Cargo.toml`:
  - `axum = "0.7"` (web framework)
  - `tokio = { version = "1", features = ["full"] }` (async runtime)
  - `sqlx = { version = "0.7", features = ["postgres", "runtime-tokio", "uuid", "chrono", "json"] }`
  - `neo4rs = "0.6"` (Neo4j driver)
  - `redis = { version = "0.24", features = ["tokio-comp", "connection-manager"] }`
  - `serde = { version = "1.0", features = ["derive"] }`
  - `serde_json = "1.0"`
  - `jsonwebtoken = "9.0"`
  - `bcrypt = "0.15"`
  - `validator = { version = "0.16", features = ["derive"] }`
  - `anyhow = "1.0"` (error handling)
  - `tracing = "0.1"` (logging)
  - `tracing-subscriber = { version = "0.3", features = ["env-filter"] }`
  - `config = "0.14"` (configuration)
  - `uuid = { version = "1.0", features = ["v4", "serde"] }`
  - `chrono = { version = "0.4", features = ["serde"] }`
  - `thiserror = "1.0"`
  - `tower = "0.4"` (middleware)
  - `tower-http = { version = "0.5", features = ["cors", "trace", "compression", "limit"] }`

- [ ] Configure project structure:
  ```
  archzero-api/
  ├── Cargo.toml
  ├── src/
  │   ├── main.rs
  │   ├── lib.rs
  │   ├── config/
  │   │   ├── mod.rs
  │   │   └── database.rs
  │   ├── models/
  │   │   ├── mod.rs
  │   │   ├── card.rs
  │   │   ├── user.rs
  │   │   └── relationship.rs
  │   ├── handlers/
  │   │   ├── mod.rs
  │   │   ├── auth.rs
  │   │   ├── cards.rs
  │   │   └── health.rs
  │   ├── services/
  │   │   ├── mod.rs
  │   │   ├── auth_service.rs
  │   │   ├── card_service.rs
  │   │   └── db_service.rs
  │   ├── middleware/
  │   │   ├── mod.rs
  │   │   └── auth.rs
  │   └── error.rs
  └── tests/
      └── integration_tests.rs
  ```

- [ ] Set up configuration management (`config/`):
  ```rust
  // src/config/mod.rs
  use serde::Deserialize;
  use config::{Config, ConfigError, Environment, File};

  #[derive(Debug, Deserialize)]
  pub struct Database {
      pub postgres_url: String,
      pub neo4j_uri: String,
      pub neo4j_user: String,
      pub neo4j_password: String,
      pub redis_url: String,
  }

  #[derive(Debug, Deserialize)]
  pub struct Jwt {
      pub secret: String,
      pub expiration_hours: i64,
  }

  #[derive(Debug, Deserialize)]
  pub struct Server {
      pub host: String,
      pub port: u16,
  }

  #[derive(Debug, Deserialize)]
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
              .add_source(Environment::with_prefix("ARCHZERO"))
              .build()?;

          s.try_deserialize()
      }
  }
  ```

- [ ] Create Docker Compose for development:
  ```yaml
  # docker-compose.dev.yml
  version: '3.8'

  services:
    postgres:
      image: postgres:16
      environment:
        POSTGRES_DB: archzero_dev
        POSTGRES_USER: archzero
        POSTGRES_PASSWORD: devpassword
      ports:
        - "5432:5432"
      volumes:
        - postgres_dev:/var/lib/postgresql/data

    neo4j:
      image: neo4j:5.15-community
      environment:
        NEO4J_AUTH: neo4j/devpassword
      ports:
        - "7474:7474"
        - "7687:7687"
      volumes:
        - neo4j_dev:/data

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - redis_dev:/data

  volumes:
    postgres_dev:
    neo4j_dev:
    redis_dev:
  ```

**Frontend Setup**:
- [ ] Initialize React + Vite project:
  ```bash
  npm create vite@latest archzero-ui -- --template react-ts
  cd archzero-ui
  npm install
  ```

- [ ] Install dependencies:
  ```bash
  # Core
  npm install react react-dom react-router-dom

  # State Management & Data Fetching
  npm install @tanstack/react-query zustand

  # UI Components
  npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
  npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
  npm install @radix-ui/react-label @radix-ui/react-select
  npm install @radix-ui/react-tabs @radix-ui/react-toast
  npm install class-variance-authority clsx tailwind-merge

  # Styling
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p

  # Visualization
  npm install d3 @reactflow/core @reactflow/background @reactflow/controls

  # Utilities
  npm install date-fns axios lucide-react
  ```

- [ ] Configure Tailwind CSS:
  ```javascript
  // tailwind.config.js
  export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  ```

- [ ] Set up frontend structure:
  ```
  archzero-ui/
  ├── src/
  │   ├── App.tsx
  │   ├── main.tsx
  │   ├── index.css
  │   ├── components/
  │   │   ├── ui/           # Shadcn UI components
  │   │   ├── layout/       # Layout components
  │   │   ├── cards/        # Card components
  │   │   └── graph/        # Graph visualization
  │   ├── pages/
  │   ├── lib/
  │   │   ├── api.ts        # API client
  │   │   ├── query.ts      # React Query hooks
  │   │   └── auth.ts       # Auth utilities
  │   ├── stores/
  │   │   └── useStore.ts   # Zustand stores
  │   └── types/
  │       └── api.ts        # TypeScript types
  ```

### Week 3: Database Schemas

**PostgreSQL Setup**:
- [ ] Run PostgreSQL DDL from `docs/04-sql-ddl.md`
- [ ] Create all base tables:
  ```sql
  -- Cards table (unified for all card types)
  CREATE TABLE cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN (
          -- Layer A
          'BusinessCapability', 'Objective',
          -- Layer B
          'Application', 'Interface',
          -- Layer C
          'ITComponent', 'Platform',
          -- Layer D
          'ArchitecturePrinciple', 'TechnologyStandard',
          'ArchitecturePolicy', 'Exception', 'Initiative',
          'Risk', 'ComplianceRequirement'
      )),
      lifecycle_phase TEXT CHECK (lifecycle_phase IN (
          'Discovery', 'Strategy', 'Planning', 'Development',
          'Testing', 'Active', 'Decommissioned', 'Retired'
      )),
      quality_score NUMERIC(3,2) CHECK (quality_score BETWEEN 0 AND 1),
      description TEXT,
      owner_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      valid_from DATE DEFAULT CURRENT_DATE,
      valid_to DATE,
      attributes JSONB DEFAULT '{}'::jsonb,
      tags TEXT[],
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))
  );

  -- Users table
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'architect', 'editor', 'viewer')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
  );

  -- Relationships table
  CREATE TABLE relationships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      to_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL,
      valid_from DATE DEFAULT CURRENT_DATE,
      valid_to DATE,
      attributes JSONB DEFAULT '{}'::jsonb,
      confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(from_card_id, to_card_id, relationship_type, valid_from)
  );

  -- Indexes
  CREATE INDEX idx_cards_type ON cards(type);
  CREATE INDEX idx_cards_lifecycle ON cards(lifecycle_phase);
  CREATE INDEX idx_cards_tags ON cards USING GIN(tags);
  CREATE INDEX idx_cards_attributes ON cards USING GIN(attributes);
  CREATE INDEX idx_relationships_from ON relationships(from_card_id);
  CREATE INDEX idx_relationships_to ON relationships(to_card_id);
  CREATE INDEX idx_relationships_type ON relationships(relationship_type);
  ```

- [ ] Create migration scripts:
  ```bash
  # migrations/001_initial.up.sql
  # migrations/001_initial.down.sql
  ```

**Neo4j Setup**:
- [ ] Create Neo4j constraints:
  ```cypher
  CREATE CONSTRAINT card_id IF NOT EXISTS FOR (c:Card) REQUIRE c.id IS UNIQUE;
  CREATE CONSTRAINT card_name IF NOT EXISTS FOR (c:Card) REQUIRE c.name IS UNIQUE;
  CREATE CONSTRAINT card_type IF NOT EXISTS FOR (c:Card) REQUIRE c.type IS NOT NULL;

  CREATE CONSTRAINT layer_a_type IF NOT EXISTS FOR (c:LayerACard) REQUIRE c.type IS NOT NULL;
  CREATE CONSTRAINT layer_b_type IF NOT EXISTS FOR (c:LayerBCard) REQUIRE c.type IS NOT NULL;
  CREATE CONSTRAINT layer_c_type IF NOT EXISTS FOR (c:LayerCCard) REQUIRE c.type IS NOT NULL;
  CREATE CONSTRAINT layer_d_type IF NOT EXISTS FOR (c:LayerDCard) REQUIRE c.type IS NOT NULL;
  ```

- [ ] Create Neo4j indexes:
  ```cypher
  CREATE INDEX card_type_index IF NOT EXISTS FOR (c:Card) ON (c.type);
  CREATE INDEX card_lifecycle_index IF NOT EXISTS FOR (c:Card) ON (c.lifecycle_phase);
  CREATE INDEX rel_type_index IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.type);
  CREATE INDEX rel_valid_from_index IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.valid_from);
  ```

### Week 4: Authentication Framework

**Backend - JWT Authentication**:
- [ ] Implement user models:
  ```rust
  // src/models/user.rs
  use serde::{Deserialize, Serialize};
  use uuid::Uuid;
  use chrono::{DateTime, Utc};

  #[derive(Debug, Serialize, Deserialize, Clone)]
  pub struct User {
      pub id: Uuid,
      pub email: String,
      pub full_name: Option<String>,
      pub role: UserRole,
      pub created_at: DateTime<Utc>,
      pub updated_at: DateTime<Utc>,
  }

  #[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
  #[serde(rename_all = "lowercase")]
  pub enum UserRole {
      Admin,
      Architect,
      Editor,
      Viewer,
  }

  #[derive(Debug, Deserialize)]
  pub struct LoginRequest {
      pub email: String,
      pub password: String,
  }

  #[derive(Debug, Serialize)]
  pub struct LoginResponse {
      pub token: String,
      pub user: User,
  }

  #[derive(Debug, Serialize, Deserialize)]
  pub struct Claims {
      pub sub: String,  // user id
      pub email: String,
      pub role: UserRole,
      pub exp: usize,
  }
  ```

- [ ] Implement auth service:
  ```rust
  // src/services/auth_service.rs
  use anyhow::Result;
  use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
  use bcrypt::{hash, verify, DEFAULT_COST};
  use sqlx::PgPool;

  use crate::models::user::{User, Claims, LoginRequest, UserRole};

  pub struct AuthService {
      pool: PgPool,
      jwt_secret: String,
      jwt_expiration: i64,
  }

  impl AuthService {
      pub fn new(pool: PgPool, jwt_secret: String, jwt_expiration: i64) -> Self {
          Self { pool, jwt_secret, jwt_expiration }
      }

      pub async fn login(&self, req: LoginRequest) -> Result<LoginResponse> {
          // Fetch user from database
          // Verify password hash
          // Generate JWT token
          // Return response
      }

      pub async fn register(&self, email: String, password: String, role: UserRole) -> Result<User> {
          // Hash password
          // Insert user into database
          // Return user
      }

      pub fn generate_token(&self, user: &User) -> Result<String> {
          // Generate JWT with claims
      }

      pub fn verify_token(&self, token: &str) -> Result<Claims> {
          // Decode and validate JWT
      }
  }
  ```

- [ ] Implement auth middleware:
  ```rust
  // src/middleware/auth.rs
  use axum::{
      extract::{Request, State},
      http::StatusCode,
      middleware::Next,
      response::Response,
  };
  use crate::models::user::Claims;

  pub async fn auth_middleware(
      State claims): State<Claims>,
      request: Request,
      next: Next,
  ) -> Result<Response, StatusCode> {
      // Extract JWT from Authorization header
      // Validate token
      // Add claims to request state
      // Call next handler
  }

  pub fn require_role(allowed_roles: Vec<UserRole>) -> impl Fn(...) -> ... {
      // Check if user's role is in allowed list
  }
  ```

- [ ] Implement auth handlers:
  ```rust
  // src/handlers/auth.rs
  use axum::{Json, extract::State};
  use crate::models::user::{LoginRequest, LoginResponse};
  use crate::services::AuthService;

  pub async fn login(
      State(auth_service): State<AuthService>,
      Json(req): Json<LoginRequest>,
  ) -> Result<Json<LoginResponse>, StatusCode> {
      auth_service.login(req).await...
  }

  pub async fn logout() -> StatusCode {
      // JWT is stateless, logout is client-side
      StatusCode::OK
  }

  pub async fn me(
      State(claims): State<Claims>
  ) -> Json<User> {
      // Return current user from claims
  }
  ```

- [ ] Create auth routes:
  ```rust
  // src/main.rs
  use axum::{
      routing::{get, post},
      Router,
  };

  let auth_routes = Router::new()
      .route("/login", post(login))
      .route("/logout", post(logout))
      .route("/me", get(me));

  let app = Router::new()
      .nest("/api/v1/auth", auth_routes)
      .layer(auth_middleware);
  ```

**Frontend - Authentication**:
- [ ] Create auth context:
  ```tsx
  // src/stores/useAuthStore.ts
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';

  interface User {
    id: string;
    email: string;
    fullName?: string;
    role: 'admin' | 'architect' | 'editor' | 'viewer';
  }

  interface AuthStore {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
  }

  export const useAuthStore = create<AuthStore>()(
    persist(
      (set) => ({
        user: null,
        token: null,
        login: async (email, password) => {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          set({ user: data.user, token: data.token });
        },
        logout: () => set({ user: null, token: null }),
      }),
      { name: 'auth-storage' }
    )
  );
  ```

- [ ] Create login page:
  ```tsx
  // src/pages/Login.tsx
  import { useAuthStore } from '@/stores/useAuthStore';
  import { useState } from 'react';

  export function Login() {
    const login = useAuthStore((s) => s.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await login(email, password);
    };

    return (
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    );
  }
  ```

- [ ] Create protected route component:
  ```tsx
  // src/components/ProtectedRoute.tsx
  import { useAuthStore } from '@/stores/useAuthStore';
  import { Navigate } from 'react-router-dom';

  export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  }
  ```

**Deliverables**:
- ✅ Development environment running locally
- ✅ PostgreSQL and Neo4j databases initialized with base schema
- ✅ Basic authentication (login/logout/JWT)
- ✅ Project scaffolding for backend and frontend

---

## Phase 1: Core Functionality (8 weeks)

**Goal**: Implement basic CRUD for all card types and relationships.

### Week 5-6: Card Models and CRUD API

**Backend**:
- [ ] Implement card models:
  ```rust
  // src/models/card.rs
  use serde::{Deserialize, Serialize};
  use uuid::Uuid;
  use chrono::{NaiveDate, DateTime, Utc};

  #[derive(Debug, Serialize, Deserialize, Clone)]
  pub struct Card {
      pub id: Uuid,
      pub name: String,
      #[serde(rename = "type")]
      pub card_type: CardType,
      pub lifecycle_phase: LifecyclePhase,
      pub quality_score: Option<f64>,
      pub description: Option<String>,
      pub owner_id: Option<Uuid>,
      pub created_at: DateTime<Utc>,
      pub updated_at: DateTime<Utc>,
      pub valid_from: NaiveDate,
      pub valid_to: Option<NaiveDate>,
      pub attributes: serde_json::Value,
      pub tags: Vec<String>,
      pub status: String,
  }

  #[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
  #[serde(rename_all = "PascalCase")]
  pub enum CardType {
      // Layer A: Strategic
      BusinessCapability,
      Objective,
      // Layer B: Application
      Application,
      Interface,
      // Layer C: Technology
      ITComponent,
      Platform,
      // Layer D: Governance (added in Phase 3)
  }

  #[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
  #[serde(rename_all = "PascalCase")]
  pub enum LifecyclePhase {
      Discovery,
      Strategy,
      Planning,
      Development,
      Testing,
      Active,
      Decommissioned,
      Retired,
  }

  #[derive(Debug, Deserialize)]
  pub struct CreateCardRequest {
      pub name: String,
      #[serde(rename = "type")]
      pub card_type: CardType,
      pub lifecycle_phase: LifecyclePhase,
      pub quality_score: Option<f64>,
      pub description: Option<String>,
      pub owner_id: Option<Uuid>,
      pub valid_from: Option<NaiveDate>,
      pub valid_to: Option<NaiveDate>,
      pub attributes: Option<serde_json::Value>,
      pub tags: Option<Vec<String>>,
  }

  #[derive(Debug, Deserialize)]
  pub struct UpdateCardRequest {
      pub name: Option<String>,
      pub lifecycle_phase: Option<LifecyclePhase>,
      pub quality_score: Option<f64>,
      pub description: Option<String>,
      pub attributes: Option<serde_json::Value>,
      pub tags: Option<Vec<String>>,
  }

  #[derive(Debug, Deserialize)]
  pub struct CardSearchParams {
      pub q: Option<String>,
      #[serde(rename = "type")]
      pub card_type: Option<CardType>,
      pub lifecycle_phase: Option<LifecyclePhase>,
      pub tags: Option<Vec<String>>,
      pub page: Option<u32>,
      pub page_size: Option<u32>,
  }
  ```

- [ ] Implement card service:
  ```rust
  // src/services/card_service.rs
  use anyhow::Result;
  use sqlx::PgPool;
  use uuid::Uuid;

  use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest, CardSearchParams};

  pub struct CardService {
      pool: PgPool,
  }

  impl CardService {
      pub fn new(pool: PgPool) -> Self {
          Self { pool }
      }

      pub async fn create(&self, req: CreateCardRequest, user_id: Uuid) -> Result<Card> {
          // Insert into PostgreSQL
          // Sync to Neo4j
          // Return card
      }

      pub async fn get(&self, id: Uuid) -> Result<Card> {
          // Fetch from PostgreSQL with relationships
      }

      pub async fn list(&self, params: CardSearchParams) -> Result<(Vec<Card>, u64)> {
          // Query with filters, pagination
          // Use GIN indexes for JSONB and tags
      }

      pub async fn update(&self, id: Uuid, req: UpdateCardRequest) -> Result<Card> {
          // Update in PostgreSQL
          // Update in Neo4j
      }

      pub async fn delete(&self, id: Uuid) -> Result<()> {
          // Soft delete in PostgreSQL (set status='archived')
          // Delete from Neo4j
      }

      pub async fn search(&self, query: String, filters: CardSearchParams) -> Result<Vec<Card>> {
          // Full-text search using pg_trgm
          // Filter by type, lifecycle, tags
      }
  }
  ```

- [ ] Implement dual-write to Neo4j (SAGA pattern):
  ```rust
  // src/services/sync_service.rs
  use anyhow::Result;
  use neo4rs::{Graph, Node};
  use sqlx::PgPool;

  pub struct SyncService {
      pool: PgPool,
      graph: Graph,
  }

  impl SyncService {
      pub async fn sync_card_to_neo4j(&self, card: &Card) -> Result<()> {
          // Create node in Neo4j
          let query = "CREATE (c:Card {id: $id, name: $name, type: $type})";
          // Execute with parameters
      }

      pub async fn sync_relationship_to_neo4j(&self, rel: &Relationship) -> Result<()> {
          // Create relationship in Neo4j
      }
  }
  ```

- [ ] Implement card handlers:
  ```rust
  // src/handlers/cards.rs
  use axum::{extract::{Path, State, Query}, Json};
  use uuid::Uuid;
  use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest, CardSearchParams};
  use crate::services::CardService;

  pub async fn create_card(
      State(card_service): State<CardService>,
      Json(req): Json<CreateCardRequest>,
  ) -> Result<Json<Card>, StatusCode> {
      // Create card
  }

  pub async fn get_card(
      State(card_service): State<CardService>,
      Path(id): Path<Uuid>,
  ) -> Result<Json<Card>, StatusCode> {
      // Get card by ID
  }

  pub async fn list_cards(
      State(card_service): State<CardService>,
      Query(params): Query<CardSearchParams>,
  ) -> Result<Json<Vec<Card>>, StatusCode> {
      // List cards with filters
  }

  pub async fn update_card(
      State(card_service): State<CardService>,
      Path(id): Path<Uuid>,
      Json(req): Json<UpdateCardRequest>,
  ) -> Result<Json<Card>, StatusCode> {
      // Update card
  }

  pub async fn delete_card(
      State(card_service): State<CardService>,
      Path(id): Path<Uuid>,
  ) -> Result<StatusCode, StatusCode> {
      // Delete card
  }

  pub async fn search_cards(
      State(card_service): State<CardService>,
      Query(params): Query<CardSearchParams>,
  ) -> Result<Json<Vec<Card>>, StatusCode> {
      // Search cards
  }
  ```

**Frontend**:
- [ ] Create card types:
  ```tsx
  // src/types/api.ts
  export interface Card {
    id: string;
    name: string;
    type: CardType;
    lifecyclePhase: LifecyclePhase;
    qualityScore?: number;
    description?: string;
    ownerId?: string;
    createdAt: string;
    updatedAt: string;
    validFrom: string;
    validTo?: string;
    attributes: Record<string, any>;
    tags: string[];
    status: string;
  }

  export enum CardType {
    BusinessCapability = 'BusinessCapability',
    Objective = 'Objective',
    Application = 'Application',
    Interface = 'Interface',
    ITComponent = 'ITComponent',
    Platform = 'Platform',
  }

  export enum LifecyclePhase {
    Discovery = 'Discovery',
    Strategy = 'Strategy',
    Planning = 'Planning',
    Development = 'Development',
    Testing = 'Testing',
    Active = 'Active',
    Decommissioned = 'Decommissioned',
    Retired = 'Retired',
  }
  ```

- [ ] Create API client:
  ```tsx
  // src/lib/api.ts
  import axios from 'axios';
  import { useAuthStore } from '@/stores/useAuthStore';

  const api = axios.create({
    baseURL: '/api/v1',
  });

  // Add auth interceptor
  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  export default api;
  ```

- [ ] Create card API hooks:
  ```tsx
  // src/lib/query.ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import api from './api';
  import { Card, CreateCardRequest, UpdateCardRequest } from '@/types/api';

  export function useCards(filters?: Record<string, any>) {
    return use_query({
      queryKey: ['cards', filters],
      queryFn: async () => {
        const { data } = await api.get('/cards', { params: filters });
        return data;
      },
    });
  }

  export function useCard(id: string) {
    return useQuery({
      queryKey: ['card', id],
      queryFn: async () => {
        const { data } = await api.get(`/cards/${id}`);
        return data;
      },
    });
  }

  export function useCreateCard() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (req: CreateCardRequest) => {
        const { data } = await api.post('/cards', req);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }

  export function useUpdateCard() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, ...req }: UpdateCardRequest & { id: string }) => {
        const { data } = await api.patch(`/cards/${id}`, req);
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['card', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }

  export function useDeleteCard() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/cards/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }
  ```

### Week 7-8: Card UI and List Views

**Frontend**:
- [ ] Create card list page:
  ```tsx
  // src/pages/Cards.tsx
  import { useCards } from '@/lib/query';
  import { useState } from 'react';

  export function Cards() {
    const [filters, setFilters] = useState({});
    const { data: cards, isLoading } = useCards(filters);

    if (isLoading) return <div>Loading...</div>;

    return (
      <div>
        <h1>Application Portfolio</h1>
        <Filters value={filters} onChange={setFilters} />
        <CardTable cards={cards} />
      </div>
    );
  }
  ```

- [ ] Create card detail page:
  ```tsx
  // src/pages/CardDetail.tsx
  import { useCard } from '@/lib/query';
  import { useParams } from 'react-router-dom';

  export function CardDetail() {
    const { id } = useParams<{ id: string }>();
    const { data: card, isLoading } = useCard(id!);

    if (isLoading) return <div>Loading...</div>;

    return (
      <div>
        <h1>{card?.name}</h1>
        <CardMetadata card={card} />
        <CardAttributes card={card} />
        <CardRelationships cardId={card?.id} />
      </div>
    );
  }
  ```

- [ ] Create card form (create/edit):
  ```tsx
  // src/components/CardForm.tsx
  import { useCreateCard, useUpdateCard } from '@/lib/query';
  import { useState } from 'react';

  export function CardForm({ card, onSuccess }: { card?: Card; onSuccess: () => void }) {
    const createMutation = useCreateCard();
    const updateMutation = useUpdateCard();
    const [values, setValues] = useState<CreateCardRequest | UpdateCardRequest>({});

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (card) {
        await updateMutation.mutateAsync({ id: card.id, ...values });
      } else {
        await createMutation.mutateAsync(values as CreateCardRequest);
      }
      onSuccess();
    };

    return (
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={values.name || ''}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder="Name"
          required
        />
        <select
          name="type"
          value={values.type || ''}
          onChange={(e) => setValues({ ...values, type: e.target.value })}
          required
        >
          <option value="">Select Type</option>
          <option value="Application">Application</option>
          <option value="ITComponent">IT Component</option>
          {/* ... */}
        </select>
        <button type="submit">{card ? 'Update' : 'Create'}</button>
      </form>
    );
  }
  ```

**Deliverables**:
- ✅ Full CRUD API for cards (6 base types)
- ✅ Card list view with filtering
- ✅ Card detail page
- ✅ Create/edit card forms
- ✅ PostgreSQL + Neo4j dual-write working

---

## Phase 2: Intelligence Engines (10 weeks)

**Goal**: Implement BIA scoring, 6R migration advisor, and TCO calculator.

### Week 9-11: Business Impact Analysis (BIA) Engine

- [ ] Implement BIA scoring profiles:
  ```rust
  // src/services/bia_service.rs
  use serde_json::Value;

  #[derive(Debug, Deserialize)]
  pub struct BIAProfile {
      pub name: String,
      pub dimensions: Vec<BIADimension>,
      pub aggregation_strategy: AggregationStrategy,
  }

  #[derive(Debug, Deserialize)]
  pub struct BIADimension {
      pub name: String,
      pub weight: f64,
      pub questions: Vec<BIAQuestion>,
  }

  #[derive(Debug, Deserialize)]
  pub struct BIAQuestion {
      pub text: String,
      pub weight: f64,
      pub response_options: Vec<ResponseOption>,
  }

  #[derive(Debug, Deserialize)]
  #[serde(rename_all = "lowercase")]
  pub enum AggregationStrategy {
      Max,
      WeightedAvg,
      Sum,
  }

  // Default profiles
  pub const HEALTHCARE_PROFILE: &str = include_str!("config/bia_healthcare.json");
  pub const FINANCIAL_PROFILE: &str = include_str!("config/bia_financial.json");
  pub const MANUFACTURING_PROFILE: &str = include_str!("config/bia_manufacturing.json");
  ```

- [ ] Implement topology-aware scoring:
  ```rust
  // Use Neo4j to calculate fan-in (incoming dependencies)
  pub async fn calculate_fan_in(&self, card_id: Uuid) -> Result<u32> {
      let query = "
          MATCH (c:Card {id: $id})<-[:DEPENDS_ON]-(other:Card)
          RETURN count(other) as fan_in
      ";
      // Execute query, return count
  }

  // Escalate criticality for high fan-in apps
  pub async fn adjust_criticality_for_topology(&self, card: &Card, fan_in: u32) -> LifecyclePhase {
      if fan_in > 50 {
          // Escalate to higher criticality tier
      }
  }
  ```

### Week 12-14: 6R Migration Decision Engine

- [ ] Implement 6R decision tree:
  ```rust
  // src/services/migration_service.rs
  #[derive(Debug, Deserialize)]
  pub struct MigrationProfile {
      pub name: String,
      pub rules: Vec<MigrationRule>,
  }

  #[derive(Debug, Deserialize)]
  pub struct MigrationRule {
      pub priority: u32,
      pub condition: String,  // JSONLogic expression
      pub recommendation: RecommendationType,
      pub reasoning_template: String,
  }

  #[derive(Debug, Serialize, Deserialize, PartialEq)]
  #[serde(rename_all = "PascalCase")]
  pub enum RecommendationType {
      Rehost,   // Lift and shift to cloud
      Refactor, // Minimal changes to cloud
      Revise,   // Rewrite partially for cloud
      Replatform, // Rewrite fully for cloud
      Replace,  // Buy SaaS instead
      Retire,   // Decommission
      Retain,   // Keep as-is
  }

  pub struct MigrationRecommendation {
      pub card_id: Uuid,
      pub recommendation: RecommendationType,
      pub reasoning: String,
      pub effort_estimate: EffortLevel,
      pub cost_impact: CostImpact,
      pub risk_assessment: RiskLevel,
  }
  ```

### Week 15-18: TCO Allocation Engine

- [ ] Implement TCO calculation:
  ```rust
  // src/services/tco_service.rs
  pub async fn calculate_tco(&self, card_id: Uuid) -> Result<TCOCalculation> {
      // Get base cost from ITAM system
      let base_cost = self.get_base_cost(card_id).await?;

      // Get all dependents (fan-out)
      let dependents = self.get_dependents(card_id).await?;

      // Allocate cost based on strategy
      match allocation_strategy {
          AllocationStrategy::EvenSplit => {
              let allocation = base_cost / dependents.len() as f64;
              // Distribute evenly
          }
          AllocationStrategy::ManualPercentage => {
              // Use relationship edge properties
          }
          AllocationStrategy::UsageBased => {
              // Use actual consumption metrics
          }
      }

      // Recursively calculate TCO for all dependencies
      let dependency_tco = self.calculate_dependency_tco(card_id).await?;

      // Sum base cost + allocated costs + dependency TCO
  }
  ```

**Deliverables**:
- ✅ BIA scoring with configurable profiles
- ✅ 6R migration recommendations with reasoning
- ✅ TCO calculator with allocation strategies
- ✅ ITAM integration (Pustaka) for cost data

---

## Phase 3: Governance & Compliance (12 weeks)

**Goal**: Implement all 7 governance card types and ARB workflows.

### Week 19-22: Governance Card Types

- [ ] Extend CardType enum with Layer D:
  ```rust
  #[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
  #[serde(rename_all = "PascalCase")]
  pub enum CardType {
      // ... existing types ...
      // Layer D: Governance
      ArchitecturePrinciple,
      TechnologyStandard,
      ArchitecturePolicy,
      Exception,
      Initiative,
      Risk,
      ComplianceRequirement,
  }
  ```

- [ ] Create governance-specific tables:
  ```sql
  -- Architecture Principles
  CREATE TABLE architecture_principles (
      id UUID PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
      principle_category TEXT,
      adherence_level TEXT CHECK (adherence_level IN ('Mandatory', 'Recommended', 'Advisory')),
      impact_risk TEXT CHECK (impact_risk IN ('High', 'Medium', 'Low'))
  );

  -- Technology Standards
  CREATE TABLE technology_standards (
      id UUID PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
      technology_category TEXT,
      lifecycle_status TEXT CHECK (lifecycle_status IN (
          'Adopt', 'Trial', 'Assess', 'Hold', 'Sunset', 'Banned'
      )),
      radar_quadrant TEXT,
  );

  -- Architecture Policies
  CREATE TABLE architecture_policies (
      id UUID PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
      policy_type TEXT,
      severity TEXT CHECK (severity IN ('Critical', 'Major', 'Minor')),
      enforcement_level TEXT,
  );

  -- Exceptions
  CREATE TABLE exceptions (
      id UUID PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
      related_policy_id UUID REFERENCES cards(id),
      exception_reason TEXT,
      expiration_date DATE,
      status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Expired')),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMPTZ,
  );

  -- And so on for Initiative, Risk, ComplianceRequirement
  ```

### Week 23-26: ARB Workflows

- [ ] Implement ARB meeting management:
  ```rust
  // src/models/arb.rs
  #[derive(Debug, Serialize, Deserialize)]
  pub struct ARBMeeting {
      pub id: Uuid,
      pub title: String,
      pub scheduled_date: NaiveDate,
      pub status: ARBMeetingStatus,
      pub submissions: Vec<ARBSubmission>,
  }

  #[derive(Debug, Serialize, Deserialize)]
  pub struct ARBSubmission {
      pub id: Uuid,
      pub card_id: Uuid,
      pub submission_type: ARBSubmissionType,
      pub rationale: String,
      pub submitted_by: Uuid,
      pub submitted_at: DateTime<Utc>,
      pub decision: Option<ARBDecision>,
  }

  #[derive(Debug, Serialize, Deserialize)]
  pub struct ARBDecision {
      pub decision: ARBDecisionType,
      pub decided_by: Uuid,
      pub decided_at: DateTime<Utc>,
      pub conditions: Option<String>,
  }

  #[derive(Debug, Serialize, Deserialize, PartialEq)]
  #[serde(rename_all = "lowercase")]
  pub enum ARBDecisionType {
      Approve,
      ApproveWithConditions,
      Reject,
      RequestMoreInfo,
      Defer,
  }
  ```

### Week 27-30: Risk and Compliance Tracking

- [ ] Implement risk heat map:
  ```rust
  // src/services/risk_service.rs
  #[derive(Debug, Serialize, Deserialize)]
  pub struct RiskAssessment {
      pub id: Uuid,
      pub card_id: Uuid,
      pub likelihood: RiskLevel,
      pub impact: RiskLevel,
      pub risk_score: f64,  // likelihood * impact
      pub mitigation_strategy: Option<String>,
      pub owner_id: Uuid,
  }

  #[derive(Debug, Serialize, Deserialize)]
  #[serde(rename_all = "lowercase")]
  pub enum RiskLevel {
      VeryLow,   // 1
      Low,       // 2
      Medium,    // 3
      High,      // 4
      VeryHigh,  // 5
  }

  pub async fn generate_heat_map(&self) -> Result<Vec<RiskHeatMapCell>> {
      // Group risks by likelihood x impact
      // Return matrix
  }
  ```

**Deliverables**:
- ✅ All 7 governance card types with attributes
- ✅ ARB workflow (submission, review, decision)
- ✅ Exception request/approval process
- ✅ Risk register with heat map visualization
- ✅ Compliance dashboard

---

## Phase 4: Advanced Features (6 weeks)

**Goal**: Implement graph visualization, bulk operations, and exports.

### Week 31-32: Graph Visualization

- [ ] Implement ReactFlow integration:
  ```tsx
  // src/components/graph/GraphView.tsx
  import ReactFlow, { Node, Edge, Background, Controls } from '@reactflow/core';
  import 'reactflow/dist/style.css';

  export function GraphView({ centerCardId }: { centerCardId: string }) {
    const { data: nodes, data: edges } = useGraphData(centerCardId);

    return (
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    );
  }
  ```

### Week 33-34: Bulk Operations

- [ ] Implement bulk import:
  ```rust
  // src/handlers/import.rs
  pub async fn bulk_import(
      State(card_service): State<CardService>,
      multipart: Multipart,
  ) -> Result<Json<ImportResult>, StatusCode> {
      // Parse CSV/Excel
      // Validate rows
      // Import with confidence scoring
      // Return result with errors
  }
  ```

### Week 35-36: Export Features

- [ ] Implement export endpoints:
  ```rust
  // Excel export with custom templates
  pub async fn export_cards_excel(
      Query(params): Query<ExportParams>,
  ) -> Result<Bytes, StatusCode> {
      // Generate Excel with openpyxl-rust
  }
  ```

**Deliverables**:
- ✅ Interactive graph visualization
- ✅ Bulk card operations
- ✅ Excel/CSV import and export
- ✅ PDF export for reports

---

## Phase 5: Production Hardening (4 weeks)

**Goal**: Performance optimization, security, monitoring.

### Week 37-38: Performance Optimization

- [ ] Implement caching:
  ```rust
  // Redis caching for frequent queries
  pub async fn get_cards_cached(&self) -> Result<Vec<Card>> {
      // Check Redis first
      // If miss, query PostgreSQL
      // Cache result with 15min TTL
  }
  ```

- [ ] Add database indexes:
  ```sql
  CREATE INDEX CONCURRENTLY idx_cards_search ON cards USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
  ```

### Week 39: Security Hardening

- [ ] Implement rate limiting:
  ```rust
  // Rate limiting using Redis
  pub async fn rate_limit_middleware(
      State(redis): State<Redis>,
      request: Request,
      next: Next,
  ) -> Result<Response, StatusCode> {
      // Check rate limit
      // Increment counter
      // Return 429 if exceeded
  }
  ```

### Week 40: Monitoring Setup

- [ ] Implement Prometheus metrics:
  ```rust
  // Metrics endpoint
  pub async fn metrics() -> String {
      // Return Prometheus format metrics
  }
  ```

**Deliverables**:
- ✅ Response times < 200ms (p95)
- ✅ Rate limiting configured
- ✅ Prometheus + Grafana dashboards
- ✅ Security audit passed

---

## Phase 6: Initial Deployment (4 weeks)

**Goal**: Deploy to production environment.

### Week 41-42: Infrastructure

- [ ] Set up production infrastructure (Docker Compose or Kubernetes)
- [ ] Configure SSL certificates and DNS
- [ ] Set up database backups
- [ ] Configure monitoring and alerting

### Week 43: Testing

- [ ] Run performance tests (100+ concurrent users)
- [ ] Security penetration testing
- [ ] User acceptance testing (UAT)

### Week 44: Go-Live

- [ ] Production cutover
- [ ] Hypercare support (2 weeks)
- [ ] Handoff to operations

**Deliverables**:
- ✅ Production deployment successful
- ✅ All tests passing
- ✅ Users trained and onboarded
- ✅ Operations team empowered

---

## Resource Requirements

### Team Structure

**Core Team** (11 FTE):
- **Solution Architect**: 1 FTE (technical leadership)
- **Backend Engineers (Rust)**: 3 FTEs
- **Frontend Engineers (React)**: 3 FTEs
- **DevOps Engineer**: 1 FTE
- **QA Engineer**: 1 FTE
- **Data Engineer**: 1 FTE (ITAM integration, data migrations)
- **Product Manager**: 1 FTE

### Infrastructure Costs

**Development/Staging**:
- Cloud costs: ~$500/month
- Development tools: ~$100/month

**Production**:
- Small deployment (< 50 users): ~$300/month
- Large deployment (50+ users): ~$2,000/month

---

## Success Criteria

### Technical

- ✅ API response time: p95 < 200ms
- ✅ Uptime: 99.5%+
- ✅ Test coverage: > 70% backend, > 50% frontend
- ✅ Zero critical security vulnerabilities

### Functional

- ✅ All 13 card types supported
- ✅ All 28 relationship types supported
- ✅ Graph visualization handles 1000+ nodes
- ✅ Bulk import handles 10,000+ cards

### Business Value

- ✅ Reduced impact analysis time: from days to minutes
- ✅ 100% of applications documented
- ✅ Architecture decisions supported by data
- ✅ User satisfaction > 4/5

---

## Appendix

**Timeline Summary**:
- Phase 0: 4 weeks
- Phase 1: 8 weeks
- Phase 2: 10 weeks
- Phase 3: 12 weeks
- Phase 4: 6 weeks
- Phase 5: 4 weeks
- Phase 6: 4 weeks
- **Total**: 48 weeks (~11 months)

**Next Steps**:
1. Assemble development team
2. Set up development infrastructure
3. Begin Phase 0: Foundation

---

**Document Status**: Draft for Review
**Last Updated**: 2026-01-12
