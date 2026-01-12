---

# Appendix E: API Specification (OpenAPI Draft)

**Version:** 2.0.0
**Protocol:** REST + JSON
**Auth:** Bearer Token (JWT)
**Base URL:** `https://api.archzero.com/api/v1` (Production)
**Base URL:** `http://localhost:8080/api/v1` (Development)
**Last Updated:** January 13, 2026

---

## 1. Authentication & Authorization

### 1.1 JWT Token Structure

Arc Zero uses **JSON Web Tokens (JWT)** for stateless authentication.

**JWT Payload Structure:**
```json
{
  "sub": "user-550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "roles": ["architect", "editor"],
  "org_id": "org-acme-corp",
  "iat": 1704110400,
  "exp": 1704114000,
  "iss": "archzero-auth-service",
  "aud": "archzero-api"
}
```

**Token Expiration:**
- **Access Token:** 1 hour
- **Refresh Token:** 7 days

---

### 1.2 Obtaining Tokens

**`POST /auth/login`**

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "user-550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "roles": ["architect", "editor"]
  }
}
```

---

**`POST /auth/refresh`**

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

### 1.3 Using Tokens

Include the JWT in the `Authorization` header:

```http
GET /api/v1/cards HTTP/1.1
Host: api.archzero.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 1.4 Permission Model (RBAC)

| Role | Permissions | Description |
|------|------------|-------------|
| **Viewer** | Read-only access to all Cards and Reports | Business stakeholders |
| **Editor** | Create, Update Cards and Relationships | Enterprise Architects |
| **Admin** | All Editor permissions + Metamodel configuration + User management | Platform Administrators |
| **System** | Internal service account (API integrations) | Pustaka sync, webhooks |

**Endpoint Permission Matrix:**

| Endpoint | Viewer | Editor | Admin |
|----------|--------|--------|-------|
| `GET /cards` | ✅ | ✅ | ✅ |
| `GET /cards/{id}` | ✅ | ✅ | ✅ |
| `PATCH /cards/{id}` | ❌ | ✅ | ✅ |
| `DELETE /cards/{id}` | ❌ | ❌ | ✅ |
| `POST /config/metamodel` | ❌ | ❌ | ✅ |
| `POST /admin/users` | ❌ | ❌ | ✅ |

---

### 1.5 Error Responses

#### 401 Unauthorized (Invalid/Expired Token)

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "JWT signature verification failed",
    "details": {
      "reason": "Token expired",
      "expired_at": "2026-01-12T10:00:00Z"
    }
  }
}
```

---

#### 403 Forbidden (Insufficient Permissions)

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Role 'viewer' cannot modify cards",
    "details": {
      "required_role": "editor",
      "user_roles": ["viewer"]
    }
  }
}
```

---

## 2. Rate Limiting

**Purpose:** Prevent abuse and ensure fair resource allocation.

### 2.1 Rate Limit Tiers

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| **Standard CRUD** (`/cards`, `/relationships`) | 1000 requests | Per hour |
| **Expensive Queries** (`/graph/traverse`, `/tco`) | 100 requests | Per hour |
| **Authentication** (`/auth/login`) | 10 requests | Per 15 minutes |
| **Bulk Operations** (`/cards/import`) | 5 requests | Per hour |

**Rate Limit Key:** Per user (identified by JWT `sub` claim)

---

### 2.2 Rate Limit Headers

**Response Headers (Every Request):**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1704114000
```

**Explanation:**
- `X-RateLimit-Limit`: Total requests allowed in the current window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

---

### 2.3 Rate Limit Exceeded Response

**HTTP 429 Too Many Requests:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 2026-01-12T11:00:00Z",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "reset_at": "2026-01-12T11:00:00Z",
      "retry_after_seconds": 1200
    }
  }
}
```

**HTTP Header:**
```http
Retry-After: 1200
```

---

## 3. Pagination

All list endpoints support pagination to handle large datasets.

### 3.1 Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | Integer | 1 | - | Page number (1-indexed) |
| `limit` | Integer | 50 | 200 | Items per page |

---

### 3.2 Paginated Response Format

**Standard Envelope:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_pages": 20,
    "total_items": 987,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### 3.3 Example: List Cards (Paginated)

**`GET /api/v1/cards?page=2&limit=50&type=Application`**

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "app-001",
      "name": "Salesforce CRM",
      "type": "Application",
      "lifecycle_active": "2020-03-15",
      "quality_score": 85
    }
    // ... 49 more items
  ],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total_pages": 20,
    "total_items": 987,
    "has_next": true,
    "has_prev": true,
    "next_url": "/api/v1/cards?page=3&limit=50&type=Application",
    "prev_url": "/api/v1/cards?page=1&limit=50&type=Application"
  }
}
```

---

## 4. Standard Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "field": "attributes.hosting_type",  // Optional: specific field that caused error
    "details": {}  // Optional: additional context
  }
}
```

**Common Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request payload failed validation |
| 400 | `INVALID_REQUEST` | Malformed JSON or missing required fields |
| 401 | `INVALID_TOKEN` | JWT authentication failed |
| 403 | `INSUFFICIENT_PERMISSIONS` | User lacks required role |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource already exists (duplicate name) |
| 422 | `UNPROCESSABLE_ENTITY` | Semantic validation failed (e.g., cycle detected) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | Database or Neo4j connection failed |

---

## 5. Core Resources (Cards)

### 5.1 List All Cards (Paginated + Filtered)

**`GET /api/v1/cards`**

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | Integer | Page number | `1` |
| `limit` | Integer | Items per page (max 200) | `50` |
| `type` | String | Filter by Card type | `Application` |
| `lifecycle_phase` | String | Filter by lifecycle state | `Active` |
| `tags` | String (comma-separated) | Filter by tags (OR logic) | `Cloud,SaaS` |
| `search` | String | Full-text search on name/description | `Salesforce` |
| `sort` | String | Sort field | `name`, `created_at`, `quality_score` |
| `order` | String | Sort direction | `asc`, `desc` |

**Example Request:**
```http
GET /api/v1/cards?type=Application&lifecycle_phase=Active&sort=quality_score&order=desc&page=1&limit=20
Authorization: Bearer eyJhbGci...
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "app-001",
      "name": "Salesforce CRM",
      "type": "Application",
      "description": "Customer relationship management platform",
      "lifecycle_active": "2020-03-15",
      "quality_score": 92,
      "functional_fit": 4,
      "technical_fit": 3,
      "business_criticality": "Tier 1",
      "tags": ["SaaS", "Cloud", "Sales"],
      "attributes": {
        "hosting_type": "SaaS",
        "financials": {
          "estimated_annual_cost": 180000,
          "currency": "USD"
        }
      },
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2026-01-10T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "total_items": 95
  }
}
```

---

### 5.2 Get Single Card

**`GET /api/v1/cards/{id}`**

**Path Parameters:**
- `id` (UUID): Card identifier

**Response (200 OK):**
```json
{
  "id": "app-001",
  "name": "Salesforce CRM",
  "type": "Application",
  "description": "Customer relationship management platform",
  "lifecycle_plan": "2019-06-01",
  "lifecycle_active": "2020-03-15",
  "lifecycle_eol": null,
  "quality_score": 92,
  "functional_fit": 4,
  "technical_fit": 3,
  "business_criticality": "Tier 1",
  "tags": ["SaaS", "Cloud", "Sales"],
  "attributes": {
    "hosting_type": "SaaS",
    "data_classification": "Confidential",
    "authentication_method": "SSO",
    "financials": {
      "estimated_annual_cost": 180000,
      "currency": "USD"
    },
    "vendor": "Salesforce, Inc.",
    "users_total": 1200,
    "users_active": 980
  },
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2026-01-10T14:30:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Card with ID 'app-999' does not exist"
  }
}
```

---

### 5.3 Unified Upsert (Create or Update)

**`PATCH /api/v1/cards/{id}`**

Handles creating new cards or updating existing ones. Supports updating SQL columns and JSONB attributes in a single atomic request.

**Path Parameters:**
- `id` (UUID): Card identifier (Use `new` to auto-generate)

**Request Body:**
```json
{
  "type": "Application",
  "name": "Customer Portal",
  "description": "Self-service portal for customer accounts",

  // Tier 1: Strict Fields (SQL)
  "lifecycle": {
    "plan": "2026-03-01",
    "phase_in": "2026-05-01",
    "active": "2026-06-01"
  },
  "functional_fit": 3,
  "technical_fit": 4,
  "tags": ["Customer-Facing", "Cloud"],

  // Tier 2: Flexible Fields (JSONB)
  "attributes": {
    "hosting_type": "Cloud Native",
    "cost_center": "CC-DIGITAL-01",
    "data_classification": "Confidential",
    "financials": {
      "estimated_annual_cost": 50000,
      "currency": "USD"
    }
  }
}
```

**Response (200 OK - Update):**
```json
{
  "id": "app-new-123",
  "name": "Customer Portal",
  "type": "Application",
  "lifecycle_active": "2026-06-01",
  "quality_score": 78,
  "attributes": {
    "hosting_type": "Cloud Native"
  },
  "created_at": "2026-01-12T10:00:00Z",
  "updated_at": "2026-01-12T10:00:00Z"
}
```

---

**Response (400 Bad Request - Validation Error):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Attribute 'hosting_type' invalid. Must be one of allowed values.",
    "field": "attributes.hosting_type",
    "details": {
      "provided_value": "Hybrid Cloud",
      "allowed_values": ["SaaS", "PaaS", "IaaS", "On-Premise", "Cloud Native"],
      "rule_id": "metamodel-rule-app-hosting"
    }
  }
}
```

---

### 5.4 Delete Card (Soft Delete)

**`DELETE /api/v1/cards/{id}`**

**Path Parameters:**
- `id` (UUID): Card identifier

**Response (204 No Content):**
```
// Empty body
```

**Behavior:**
- Sets `deleted_at` timestamp (soft delete)
- Cascades to owned resources (e.g., Interfaces if deleting an Application)
- Archives all relationships in Neo4j (sets `status='archived'`)

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Card with ID 'app-999' does not exist"
  }
}
```

---

### 5.5 Bulk Import (Excel/CSV Processor)

**`POST /api/v1/cards/import`**

Processes raw tabular data with intelligent column mapping.

**Request (Multipart/Form-Data):**
```http
POST /api/v1/cards/import HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
Authorization: Bearer eyJhbGci...

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="applications.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[binary file content]
------WebKitFormBoundary
Content-Disposition: form-data; name="card_type"

Application
------WebKitFormBoundary--
```

---

**Response (200 OK - Preview Mode):**
```json
{
  "status": "preview",
  "detected_rows": 150,
  "sample_rows": [
    {
      "App Name": "Salesforce",
      "Owner": "John Doe",
      "Hosting": "SaaS",
      "Cost": "120000"
    }
  ],
  "suggested_mappings": [
    {
      "csv_header": "App Name",
      "target_field": "name",
      "confidence": 0.99,
      "match_reason": "Exact match on standard field"
    },
    {
      "csv_header": "Owner",
      "target_field": "attributes.owner",
      "confidence": 0.85,
      "match_reason": "Fuzzy match on common attribute"
    },
    {
      "csv_header": "Hosting",
      "target_field": "attributes.hosting_type",
      "confidence": 0.90,
      "match_reason": "Semantic similarity"
    },
    {
      "csv_header": "Cost",
      "target_field": "attributes.financials.estimated_annual_cost",
      "confidence": 0.75,
      "match_reason": "Keyword match"
    }
  ],
  "validation_errors": [
    {
      "row": 45,
      "field": "Hosting",
      "value": "Hybrid",
      "error": "Invalid enum value. Allowed: SaaS, PaaS, IaaS, On-Premise"
    }
  ],
  "import_token": "import-session-550e8400-e29b-41d4-a716-446655440000"
}
```

---

**Confirm Import:**

**`POST /api/v1/cards/import/confirm`**

```json
{
  "import_token": "import-session-550e8400-e29b-41d4-a716-446655440000",
  "mappings": [
    { "csv_header": "App Name", "target_field": "name" },
    { "csv_header": "Owner", "target_field": "attributes.owner" },
    { "csv_header": "Hosting", "target_field": "attributes.hosting_type" },
    { "csv_header": "Cost", "target_field": "attributes.financials.estimated_annual_cost" }
  ],
  "skip_errors": true
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "import-job-12345",
  "status": "processing",
  "progress_url": "/api/v1/jobs/import-job-12345"
}
```

---

## 6. Graph & Visualizations

### 6.1 The "Time Machine" Traversal

**`POST /api/v1/graph/traverse`**

Fetches the node/edge structure for visualizations (Landscape, Matrix, Dependency Graph).

**Request Body:**
```json
{
  "root_type": "BusinessCapability",
  "root_id": "cap-sales",
  "depth": 3,
  "target_date": "2027-01-01",
  "relations": ["PARENT_OF", "SUPPORTS"],
  "filter": {
    "type": "Application",
    "attributes.hosting_type": "Cloud"
  },
  "include_metadata": true
}
```

**Query Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `root_type` | String | No | Starting node type (if omitted, returns all nodes) |
| `root_id` | UUID | No | Starting node ID |
| `depth` | Integer | No | Traversal depth (default: 2, max: 5) |
| `target_date` | Date | No | Filter edges by valid date (Time Machine) |
| `relations` | String[] | No | Relationship types to include |
| `filter` | Object | No | Filter nodes by attributes |
| `include_metadata` | Boolean | No | Include node metadata (quality_score, etc.) |

---

**Response (200 OK):**

Standard Graph JSON format (compatible with `react-force-graph` or D3):

```json
{
  "nodes": [
    {
      "id": "cap-sales",
      "name": "Sales",
      "type": "BusinessCapability",
      "group": "Capability",
      "color": "#3498db",
      "metadata": {
        "strategic_importance": "High",
        "maturity_level": 3
      }
    },
    {
      "id": "app-sf",
      "name": "Salesforce CRM",
      "type": "Application",
      "group": "Application",
      "color": "#2ecc71",
      "metadata": {
        "functional_fit": 4,
        "technical_fit": 3,
        "business_criticality": "Tier 1"
      }
    }
  ],
  "links": [
    {
      "source": "app-sf",
      "target": "cap-sales",
      "type": "SUPPORTS",
      "valid_from": "2020-01-01",
      "valid_to": null,
      "description": "Primary CRM system"
    }
  ],
  "metadata": {
    "query_date": "2027-01-01",
    "total_nodes": 2,
    "total_edges": 1,
    "execution_time_ms": 245
  }
}
```

---

### 6.2 TCO Cost Rollup

**`GET /api/v1/cards/{id}/tco`**

Triggers the recursive cost calculation engine for a specific node.

**Path Parameters:**
- `id` (UUID): Card identifier

**Query Parameters:**
- `include_breakdown` (Boolean): Include detailed cost breakdown (default: true)
- `currency` (String): Return costs in specific currency (default: USD)

**Response (200 OK):**
```json
{
  "node_id": "app-sf-001",
  "node_name": "Salesforce CRM",
  "total_tco_annual": 225000,
  "currency": "USD",
  "breakdown": [
    {
      "category": "Direct License Cost",
      "amount": 180000,
      "source": "Pustaka Sync"
    },
    {
      "category": "Inherited Infrastructure",
      "amount": 45000,
      "components": [
        {
          "name": "AWS EC2 Production Cluster",
          "cost": 30000,
          "allocation_method": "Even Split (3 applications)",
          "allocation_pct": 0.33
        },
        {
          "name": "PostgreSQL RDS Instance",
          "cost": 15000,
          "allocation_method": "Manual Percentage (60%)",
          "allocation_pct": 0.60
        }
      ]
    }
  ],
  "cost_by_category": {
    "Licenses": 180000,
    "Infrastructure": 45000,
    "Support": 0
  },
  "comparison": {
    "avg_cost_similar_apps": 150000,
    "percentile": "75th (higher than average)"
  }
}
```

---

## 7. Configuration & Metadata

### 7.1 Fetch Metamodel Rules

**`GET /api/v1/config/metamodel/{card_type}`**

Used by the Frontend to generate dynamic forms.

**Path Parameters:**
- `card_type` (String): Card type (e.g., `Application`, `BusinessCapability`)

**Response (200 OK):**
```json
{
  "card_type": "Application",
  "rules": [
    {
      "key": "hosting_type",
      "label": "Hosting Strategy",
      "widget": "select",
      "data_type": "enum",
      "is_required": true,
      "options": ["SaaS", "PaaS", "IaaS", "On-Premise", "Cloud Native"],
      "default_value": "On-Premise",
      "help_text": "Select the primary hosting model for this application"
    },
    {
      "key": "cost_center",
      "label": "Cost Center Code",
      "widget": "text",
      "data_type": "string",
      "is_required": false,
      "regex": "^CC-[A-Z]{2,4}-\\d{2}$",
      "placeholder": "CC-SALES-01",
      "help_text": "Corporate cost center code (format: CC-DEPT-##)"
    },
    {
      "key": "financials.estimated_annual_cost",
      "label": "Estimated Annual Cost",
      "widget": "currency",
      "data_type": "number",
      "is_required": false,
      "min": 0,
      "currency_default": "USD"
    }
  ]
}
```

---

### 7.2 Scoring Profile Execution (What-If Analysis)

**`POST /api/v1/intelligence/assess`**

Runs the BIA or 6R logic against a hypothetical payload (used for "What-If" analysis in the UI).

**Request Body:**
```json
{
  "profile_id": "profile-cloud-first-v1",
  "profile_type": "6R",
  "inputs": {
    "technical_fit": 2,
    "functional_fit": 4,
    "attributes": {
      "hosting_type": "On-Premise",
      "cloud_ready": true
    }
  }
}
```

**Response (200 OK):**
```json
{
  "recommended_strategy": "REFACTOR",
  "confidence": 0.85,
  "reasoning": "High Functional Fit (4/4) but Low Technical Fit (2/4) + Cloud-ready flag triggers cloud-native refactor rule.",
  "estimated_effort": "12-24 months",
  "estimated_cost_impact": {
    "short_term": "+20% (refactor investment)",
    "long_term": "-40% (reduced maintenance)"
  },
  "risks": [
    "Requires team upskilling in Kubernetes",
    "Database migration complexity"
  ],
  "alternative_strategies": [
    {
      "strategy": "REHOST",
      "confidence": 0.60,
      "reasoning": "Faster time-to-cloud but misses modernization benefits"
    }
  ]
}
```

---

## 8. Webhooks (Outbound Events)

### 8.1 Configuration

**`POST /api/v1/config/webhooks`**

Register a webhook endpoint.

**Request:**
```json
{
  "url": "https://example.com/webhooks/archzero",
  "events": ["card.created", "card.updated", "card.deleted"],
  "secret": "your-webhook-secret",
  "enabled": true
}
```

**Response (201 Created):**
```json
{
  "id": "webhook-12345",
  "url": "https://example.com/webhooks/archzero",
  "events": ["card.created", "card.updated", "card.deleted"],
  "enabled": true,
  "created_at": "2026-01-12T10:00:00Z"
}
```

---

### 8.2 Webhook Payload

**Event: `card.created`**

```json
{
  "event": "card.created",
  "event_id": "event-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-12T10:30:00Z",
  "data": {
    "card": {
      "id": "app-new-001",
      "name": "New Application",
      "type": "Application",
      "created_by": "user-550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Signature Verification:**

Arc Zero signs webhook payloads using HMAC-SHA256.

**Header:**
```http
X-ArcZero-Signature: sha256=5d7e9c8f...
```

**Verification (Python):**
```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## 9. Governance & Compliance APIs

New in v2.0: Endpoints for architecture governance, standards tracking, and compliance management.

---

### 9.1 Architecture Principles

#### 9.1.1 List All Principles

**`GET /api/v1/principles`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (Strategic, Business, Technical, Data) |
| `owner` | string | Filter by owner |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "princ-001",
      "name": "Cloud-First Strategy",
      "type": "ArchitecturePrinciple",
      "statement": "Prefer cloud-native SaaS solutions over on-premise deployments",
      "rationale": "Reduces maintenance overhead and improves scalability",
      "implications": ["All new apps must be cloud-native", "Exceptions require ARB approval"],
      "owner": "Chief Technology Officer",
      "category": "Strategic",
      "adherence_rate": 78,
      "quality_score": 92
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "total_pages": 1
  }
}
```

---

#### 9.1.2 Create Principle

**`POST /api/v1/principles`**

**Request:**
```json
{
  "name": "API-First Design",
  "type": "ArchitecturePrinciple",
  "statement": "All new applications must expose APIs for integration",
  "rationale": "Enables modular architecture and reduces coupling",
  "implications": [
    "RESTful APIs required for all services",
    "API documentation mandatory",
    "API versioning required"
  ],
  "owner": "Chief Architect",
  "category": "Technical"
}
```

**Response (201 Created):**
```json
{
  "id": "princ-002",
  "name": "API-First Design",
  "type": "ArchitecturePrinciple",
  "created_at": "2026-01-13T10:00:00Z"
}
```

---

#### 9.1.3 Get Principle Adherence

**`GET /api/v1/principles/{id}/adherence`**

**Response (200 OK):**
```json
{
  "principle_id": "princ-001",
  "principle_name": "Cloud-First Strategy",
  "adherence_rate": 78,
  "compliant_cards": 45,
  "non_compliant_cards": 12,
  "exempt_cards": 3,
  "violations": [
    {
      "card_name": "Legacy ERP",
      "card_id": "app-legacy-001",
      "reason": "On-premise deployment",
      "exception_id": "exc-001"
    }
  ]
}
```

---

### 9.2 Technology Standards

#### 9.2.1 List Technology Standards

**`GET /api/v1/tech-standards`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (e.g., "Databases", "Languages") |
| `status` | string | Filter by status (Adopt, Trial, Assess, Hold, Sunset, Banned) |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "std-001",
      "name": "PostgreSQL",
      "type": "TechnologyStandard",
      "category": "Relational Databases",
      "status": "Adopt",
      "sunset_date": null,
      "rationale": "Industry-standard with excellent ecosystem"
    },
    {
      "id": "std-002",
      "name": "Oracle Database",
      "type": "TechnologyStandard",
      "category": "Relational Databases",
      "status": "Sunset",
      "sunset_date": "2028-12-31",
      "replacement_id": "std-001",
      "rationale": "Migrating to PostgreSQL for cost savings"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 87
  }
}
```

---

#### 9.2.2 Technology Radar Data

**`GET /api/v1/tech-standards/radar`**

**Response (200 OK):**
```json
{
  "quadrants": [
    {
      "name": "Languages",
      "rings": [
        {
          "name": "Adopt",
          "technologies": ["PostgreSQL", "React", "Python"]
        },
        {
          "name": "Trial",
          "technologies": ["Rust", "Go"]
        },
        {
          "name": "Assess",
          "technologies": ["WebAssembly"]
        },
        {
          "name": "Hold",
          "technologies": ["Java 8", "PHP 5"]
        }
      ]
    }
  ]
}
```

---

#### 9.2.3 Technology Debt Report

**`GET /api/v1/tech-standards/debt-report`**

**Response (200 OK):**
```json
{
  "summary": {
    "total_debt_score": 1250,
    "high_risk_components": 23,
    "estimated_migration_cost": 2500000
  },
  "debt_items": [
    {
      "component_name": "Oracle Database 19c",
      "component_id": "comp-db-001",
      "standard_status": "Sunset",
      "eol_date": "2028-12-31",
      "risk_level": "High",
      "estimated_cost": 500000
    }
  ]
}
```

---

### 9.3 Architecture Policies

#### 9.3.1 List Policies

**`GET /api/v1/policies`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `severity` | string | Filter by severity (Critical, High, Medium, Low) |
| `enforcement` | string | Filter by mode (Blocking, Warning) |
| `page` | integer | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "policy-001",
      "name": "Tier 1 High Availability Policy",
      "type": "ArchitecturePolicy",
      "rule_json": {
        "if": {"business_criticality": "Tier 1"},
        "then": {"requires": ["multi_region", "disaster_recovery_plan"]}
      },
      "severity": "Critical",
      "enforcement": "Blocking"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25
  }
}
```

---

#### 9.3.2 Validate Policy Against Cards

**`POST /api/v1/policies/{id}/validate`**

**Request:**
```json
{
  "card_ids": ["app-001", "app-002", "app-003"]
}
```

**Response (200 OK):**
```json
{
  "policy_id": "policy-001",
  "policy_name": "Tier 1 High Availability Policy",
  "total_cards": 3,
  "compliant": 1,
  "violations": 2,
  "results": [
    {
      "card_id": "app-001",
      "card_name": "Salesforce CRM",
      "status": "Compliant"
    },
    {
      "card_id": "app-002",
      "card_name": "Custom ERP",
      "status": "Violation",
      "missing_requirements": ["multi_region", "disaster_recovery_plan"]
    }
  ]
}
```

---

#### 9.3.3 List All Policy Violations

**`GET /api/v1/policies/violations`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `severity` | string | Filter by severity |
| `policy_id` | string | Filter by policy |

**Response (200 OK):**
```json
{
  "data": [
    {
      "policy_id": "policy-001",
      "policy_name": "Tier 1 High Availability Policy",
      "card_id": "app-002",
      "card_name": "Custom ERP",
      "severity": "Critical",
      "enforcement": "Blocking",
      "violation_details": ["Missing multi_region deployment", "No disaster recovery plan"]
    }
  ],
  "pagination": {
    "total": 45
  }
}
```

---

### 9.4 Exceptions

#### 9.4.1 List Exceptions

**`GET /api/v1/exceptions`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (Pending, Approved, Rejected, Expired) |
| `policy_id` | string | Filter by policy |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "exc-001",
      "name": "Exception for Legacy ERP",
      "type": "Exception",
      "policy_id": "policy-001",
      "card_id": "app-002",
      "justification": "Vendor does not offer cloud version, migration cost > $500K",
      "duration": "Permanent",
      "compensating_controls": ["Enhanced monitoring", "Quarterly review"],
      "status": "Approved",
      "requested_by": "user-001",
      "approved_by": "user-admin",
      "expires_at": null,
      "created_at": "2026-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 12
  }
}
```

---

#### 9.4.2 Request Exception

**`POST /api/v1/exceptions`**

**Request:**
```json
{
  "name": "Exception for Legacy App",
  "policy_id": "policy-001",
  "card_id": "app-legacy-001",
  "justification": "Technical constraint prevents compliance",
  "duration": "90_days",
  "compensating_controls": ["Monthly audit", "Enhanced logging"]
}
```

**Response (201 Created):**
```json
{
  "id": "exc-002",
  "status": "Pending",
  "created_at": "2026-01-13T10:00:00Z"
}
```

---

#### 9.4.3 Approve Exception

**`PATCH /api/v1/exceptions/{id}/approve`**

**Request:**
```json
{
  "approved_by": "user-admin-001",
  "comments": "Approved due to valid business constraint"
}
```

**Response (200 OK):**
```json
{
  "id": "exc-002",
  "status": "Approved",
  "approved_by": "user-admin-001",
  "approved_at": "2026-01-13T11:00:00Z"
}
```

---

#### 9.4.4 Reject Exception

**`PATCH /api/v1/exceptions/{id}/reject`**

**Request:**
```json
{
  "approved_by": "user-admin-001",
  "rejection_reason": "Insufficient justification provided"
}
```

**Response (200 OK):**
```json
{
  "id": "exc-002",
  "status": "Rejected",
  "approved_by": "user-admin-001",
  "rejection_reason": "Insufficient justification provided"
}
```

---

#### 9.4.5 List Expiring Exceptions

**`GET /api/v1/exceptions/expiring`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `days` | integer | Expiring within N days (default: 30) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "exc-003",
      "policy_name": "Cloud-First Policy",
      "card_name": "Legacy Database",
      "expires_at": "2026-02-15T00:00:00Z",
      "days_until_expiry": 15,
      "status": "Approved"
    }
  ],
  "total": 5
}
```

---

### 9.5 Initiatives

#### 9.5.1 List Initiatives

**`GET /api/v1/initiatives`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (Planning, In Progress, On Hold, Completed, Cancelled) |
| `health` | string | Filter by health (On Track, At Risk, Behind Schedule) |
| `type` | string | Filter by initiative_type |
| `page` | integer | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "init-001",
      "name": "Cloud Migration 2027",
      "type": "Initiative",
      "initiative_type": "Migration",
      "strategic_theme": "Cloud Transformation",
      "budget_total": 5000000,
      "budget_spent": 1250000,
      "start_date": "2026-01-01",
      "target_end_date": "2027-12-31",
      "owner": "VP of Infrastructure",
      "status": "In Progress",
      "health": "On Track"
    }
  ],
  "pagination": {
    "total": 15
  }
}
```

---

#### 9.5.2 Get Initiative Impact Map

**`GET /api/v1/initiatives/{id}/impact-map`**

**Response (200 OK):**
```json
{
  "initiative_id": "init-001",
  "initiative_name": "Cloud Migration 2027",
  "impacted_cards": [
    {
      "card_id": "app-001",
      "card_name": "Salesforce CRM",
      "card_type": "Application",
      "impact_description": "Migrate to AWS cloud infrastructure",
      "current_state": "On-Premise",
      "target_state": "AWS SaaS"
    }
  ],
  "total_impacted": 45
}
```

---

#### 9.5.3 Link Cards to Initiative

**`POST /api/v1/initiatives/{id}/link-cards`**

**Request:**
```json
{
  "card_links": [
    {
      "card_id": "app-001",
      "impact_description": "Migrate to cloud"
    },
    {
      "card_id": "app-002",
      "impact_description": "Decommission replacement"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "initiative_id": "init-001",
  "linked_cards": 2,
  "total_impacted": 47
}
```

---

### 9.6 Risks

#### 9.6.1 List Risks

**`GET /api/v1/risks`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by risk_type (Security, Compliance, Operational, Financial, Strategic, Reputational) |
| `status` | string | Filter by status (Open, Mitigated, Accepted, Transferred, Closed) |
| `min_score` | integer | Filter by minimum risk_score |
| `page` | integer | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "risk-001",
      "name": "Oracle Database EOL Risk",
      "type": "Risk",
      "description": "Oracle Database 19c reaches EOL in 2028",
      "risk_type": "Operational",
      "likelihood": 4,
      "impact": 5,
      "risk_score": 20,
      "mitigation_plan": "Migrate to PostgreSQL by 2027-Q4",
      "owner": "Database Team Lead",
      "status": "Open",
      "target_closure_date": "2027-12-31"
    }
  ],
  "pagination": {
    "total": 67
  }
}
```

---

#### 9.6.2 Risk Heat Map Data

**`GET /api/v1/risks/heat-map`**

**Response (200 OK):**
```json
{
  "data": [
    {
      "likelihood": 4,
      "impact": 5,
      "count": 3,
      "risks": [
        {"id": "risk-001", "name": "Oracle EOL", "risk_score": 20}
      ]
    },
    {
      "likelihood": 2,
      "impact": 3,
      "count": 15,
      "risks": []
    }
  ]
}
```

---

#### 9.6.3 Top 10 Risks

**`GET /api/v1/risks/top-10`**

**Response (200 OK):**
```json
{
  "data": [
    {
      "rank": 1,
      "id": "risk-001",
      "name": "Oracle Database EOL Risk",
      "risk_score": 20,
      "risk_type": "Operational",
      "status": "Open"
    }
  ]
}
```

---

### 9.7 Compliance Requirements

#### 9.7.1 List Compliance Requirements

**`GET /api/v1/compliance-requirements`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `framework` | string | Filter by framework (GDPR, SOX, HIPAA, etc.) |
| `page` | integer | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "comp-001",
      "name": "GDPR Compliance",
      "type": "ComplianceRequirement",
      "framework": "GDPR",
      "description": "General Data Protection Regulation compliance",
      "applicable_card_types": ["Application", "DataObject"],
      "required_controls": [
        "Data encryption at rest",
        "Data encryption in transit",
        "Right to erasure"
      ],
      "audit_frequency": "Annual"
    }
  ],
  "pagination": {
    "total": 8
  }
}
```

---

#### 9.7.2 Assess Card Compliance

**`POST /api/v1/compliance-requirements/{id}/assess`**

**Request:**
```json
{
  "card_ids": ["app-001", "app-002", "app-003"]
}
```

**Response (200 OK):**
```json
{
  "compliance_id": "comp-001",
  "framework": "GDPR",
  "total_cards": 3,
  "compliant": 2,
  "non_compliant": 1,
  "results": [
    {
      "card_id": "app-001",
      "card_name": "Customer Portal",
      "status": "Compliant",
      "controls_implemented": ["Data encryption at rest", "Data encryption in transit"]
    },
    {
      "card_id": "app-002",
      "card_name": "Legacy CRM",
      "status": "NonCompliant",
      "missing_controls": ["Right to erasure", "Data encryption at rest"]
    }
  ]
}
```

---

#### 9.7.3 Compliance Dashboard Data

**`GET /api/v1/compliance-requirements/{id}/dashboard`**

**Response (200 OK):**
```json
{
  "compliance_id": "comp-001",
  "framework": "GDPR",
  "summary": {
    "total_applicable_cards": 150,
    "compliant": 120,
    "non_compliant": 25,
    "exempt": 5,
    "compliance_rate": 80
  },
  "by_card_type": {
    "Application": {"total": 100, "compliant": 85},
    "DataObject": {"total": 50, "compliant": 35}
  },
  "last_assessed": "2026-01-13T00:00:00Z"
}
```

---

### 9.8 ARB (Architecture Review Board)

#### 9.8.1 List ARB Reviews

**`GET /api/v1/arb/reviews`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (Pending, Approved, Rejected) |
| `page` | integer | Page number |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "arb-001",
      "card_id": "app-new-001",
      "card_name": "New SaaS Procurement",
      "request_type": "Technology Selection",
      "requested_by": "user-001",
      "status": "Pending",
      "submitted_at": "2026-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 8
  }
}
```

---

#### 9.8.2 Submit for ARB Review

**`POST /api/v1/arb/reviews`**

**Request:**
```json
{
  "card_id": "app-new-001",
  "request_type": "Technology Selection",
  "justification": "Need new CRM for sales team",
  "proposed_solution": "Salesforce Cloud",
  "estimated_cost": 180000
}
```

**Response (201 Created):**
```json
{
  "id": "arb-002",
  "status": "Pending",
  "submitted_at": "2026-01-13T10:00:00Z"
}
```

---

#### 9.8.3 Make ARB Decision

**`PATCH /api/v1/arb/reviews/{id}/decide`**

**Request:**
```json
{
  "decision": "Approved",
  "decision_maker": "user-admin-001",
  "comments": "Approved with conditions - must implement SSO integration",
  "conditions": ["SSO integration required", "Data encryption mandate"]
}
```

**Response (200 OK):**
```json
{
  "id": "arb-001",
  "status": "Approved",
  "decision_maker": "user-admin-001",
  "decision_at": "2026-01-13T11:00:00Z"
}
```

---

### 9.9 Strategic Planning

#### 9.9.1 List Architecture States

**`GET /api/v1/states`**

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "state-baseline",
      "name": "Baseline State",
      "description": "Current architecture state",
      "as_of_date": "2026-01-01",
      "is_baseline": true
    },
    {
      "id": "state-target-2027",
      "name": "Target State 2027",
      "description": "Planned architecture for end of 2027",
      "target_date": "2027-12-31",
      "is_target": true
    }
  ]
}
```

---

#### 9.9.2 Compare Architecture States (Gap Analysis)

**`GET /api/v1/states/compare?baseline={uuid}&target={uuid}`**

**Response (200 OK):**
```json
{
  "baseline_state": {
    "id": "state-baseline",
    "name": "Baseline State",
    "as_of_date": "2026-01-01"
  },
  "target_state": {
    "id": "state-target-2027",
    "name": "Target State 2027",
    "target_date": "2027-12-31"
  },
  "gaps": {
    "applications_to_retire": 15,
    "applications_to_migrate": 25,
    "new_applications_to_add": 8,
    "cost_reduction_target": 2000000,
    "complexity_reduction_target": 30
  },
  "detailed_changes": [
    {
      "card_id": "app-legacy-001",
      "card_name": "Legacy ERP",
      "baseline_action": "Retire",
      "target_action": null,
      "initiative": "init-001"
    }
  ]
}
```

---

#### 9.9.3 Transformation Roadmap

**`GET /api/v1/roadmap`**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `state_id` | string | Filter by target state |
| `initiative_id` | string | Filter by initiative |

**Response (200 OK):**
```json
{
  "timeline": [
    {
      "quarter": "2026-Q1",
      "initiatives": [
        {
          "id": "init-001",
          "name": "Cloud Migration Phase 1",
          "status": "In Progress",
          "health": "On Track",
          "affected_cards": 15,
          "budget": 1000000
        }
      ]
    }
  ],
  "summary": {
    "total_initiatives": 12,
    "total_budget": 5000000,
    "total_affected_cards": 150
  }
}
```

---

### 9.10 New Query Parameters for /cards

The following new query parameters have been added to the `/cards` endpoint to support EA features:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `pace_layer` | string | Filter by pace layer | `?pace_layer=System of Differentiation` |
| `rationalization_action` | string | Filter by rationalization action | `?rationalization_action=Invest` |
| `cloud_readiness_min` | integer | Filter by minimum cloud readiness score (0-100) | `?cloud_readiness_min=70` |
| `compliance_status` | string | Filter by compliance status | `?compliance_status=NonCompliant` |
| `policy_violations` | boolean | Filter cards with policy violations | `?policy_violations=true` |

**Example:**
```
GET /api/v1/cards?policy_violations=true&compliance_status=NonCompliant
```

---

## 10. Implementation Guidelines

### 10.1 Strict Typing (Rust Backend)

The Rust backend MUST deserialize the `attributes` JSONB into specific Structs where possible.

**Example:**
```rust
#[derive(Serialize, Deserialize)]
struct ApplicationAttributes {
    hosting_type: Option<String>,
    cost_center: Option<String>,
    financials: Option<Financials>,
    
    #[serde(flatten)]
    custom_fields: HashMap<String, serde_json::Value>  // Catch-all
}

#[derive(Serialize, Deserialize)]
struct Financials {
    estimated_annual_cost: Option<f64>,
    currency: Option<String>
}
```

---

### 10.2 Graph Performance Optimization

The `/traverse` endpoint should:
1. Use **Neo4j Cypher** directly for graph traversal
2. Enrich Node data (Names, Costs) by batch-fetching from **Postgres** using UUIDs
3. Cache results in **Redis** for common queries

**Example:**
```rust
async fn traverse_graph(params: TraverseParams) -> GraphResult {
    // Step 1: Neo4j query (fast graph traversal)
    let node_ids = neo4j.execute_cypher(
        "MATCH path = (root)-[*1..3]->(leaf) RETURN collect(leaf.id)"
    ).await?;
    
    // Step 2: Batch fetch from Postgres (enrich with names, costs)
    let nodes = postgres.query(
        "SELECT id, name, type, attributes FROM cards WHERE id = ANY($1)",
        &[&node_ids]
    ).await?;
    
    // Step 3: Combine and return
    GraphResult { nodes, links }
}
```

---

## Appendix: OpenAPI 3.0 Specification (Sample)

```yaml
openapi: 3.0.3
info:
  title: Arc Zero API
  version: 1.0.0
  description: Enterprise Architecture Platform API
servers:
  - url: https://api.archzero.com/api/v1
    description: Production
  - url: http://localhost:8080/api/v1
    description: Development

paths:
  /cards:
    get:
      summary: List all cards (paginated)
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 200
        - name: type
          in: query
          schema:
            type: string
            enum: [Application, BusinessCapability, ITComponent]
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CardListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    CardListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Card'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Card:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        type:
          type: string

  responses:
    UnauthorizedError:
      description: Access token is missing or invalid
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release | Product Team |
| 1.0.1 | 2026-01-12 | Added authentication, rate limiting, pagination, error handling, webhooks | Documentation Team |
| 2.0 | 2026-01-13 | **MAJOR UPDATE**: Added Section 9 - Governance & Compliance APIs with 35+ new endpoints. Added Architecture Principles (3 endpoints), Technology Standards (3 endpoints), Architecture Policies (3 endpoints), Exceptions (5 endpoints), Initiatives (3 endpoints), Risks (3 endpoints), Compliance Requirements (3 endpoints), ARB workflows (3 endpoints), Strategic Planning (3 endpoints). Added new query parameters for /cards endpoint (pace_layer, rationalization_action, cloud_readiness_min, compliance_status, policy_violations). | Documentation Team |
