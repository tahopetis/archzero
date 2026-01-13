# Architecture Principles Handlers - Quick Reference

## File Location
`/home/tahopetis/dev/archzero/archzero-api/src/handlers/principles.rs`

## Implementation Status
✅ **COMPLETE** - All handlers use real database logic via CardService

## API Endpoints

### 1. List Principles
```
GET /api/v1/principles?page=1&limit=50&category=Technical&owner=Architecture
```
- Returns: `PrinciplesListResponse` with data + pagination
- Filters by: category, owner (partial match)
- Pagination: page, limit

### 2. Get Principle
```
GET /api/v1/principles/{id}
```
- Returns: `ArchitecturePrinciple`
- Error: 404 if not found or wrong card type

### 3. Create Principle
```
POST /api/v1/principles
Content-Type: application/json

{
  "name": "Loose Coupling",
  "description": "Components should be loosely coupled",
  "statement": "System components shall be loosely coupled",
  "rationale": "Enables independent evolution and scalability",
  "implications": [
    "Use REST APIs for inter-service communication",
    "Implement asynchronous messaging where appropriate"
  ],
  "owner": "Architecture Team",
  "category": "Technical"
}
```
- Returns: Created `ArchitecturePrinciple`
- Stores in: `cards` table with `type='ArchitecturePrinciple'`

### 4. Update Principle
```
PUT /api/v1/principles/{id}
Content-Type: application/json

{
  "statement": "Updated principle statement",
  "rationale": "Updated rationale"
}
```
- Returns: Updated `ArchitecturePrinciple`
- All fields optional (partial update supported)

### 5. Delete Principle
```
DELETE /api/v1/principles/{id}
```
- Returns: Empty response
- Soft-delete: Sets `status='deleted'`
- Error: 404 if not found

### 6. Get Compliance Report
```
GET /api/v1/principles/{id}/compliance
```
- Returns: `PrincipleComplianceReport`
  - `adherence_rate`: 0-100
  - `compliant_cards`: Count
  - `non_compliant_cards`: Count
  - `exempt_cards`: Count (TODO: query exceptions)
  - `violations`: Array of non-compliant cards

## Data Model

### ArchitecturePrinciple Response
```typescript
{
  id: string,
  name: string,
  description?: string,
  type: string,  // "ArchitecturePrinciple"
  statement: string,
  rationale: string,
  implications: string[],
  owner: string,
  category: "Strategic" | "Business" | "Technical" | "Data",
  adherence_rate: number,  // 0-100
  quality_score?: number,
  created_at: string,  // ISO 8601
  updated_at: string   // ISO 8601
}
```

### Storage Format
```sql
-- Card table
INSERT INTO cards (
  id, name, type, lifecycle_phase,
  description, attributes, status
) VALUES (
  uuid, 'Loose Coupling', 'ArchitecturePrinciple', 'Active',
  'Components should be loosely coupled',
  '{
    "statement": "System components shall be loosely coupled",
    "rationale": "Enables independent evolution",
    "implications": ["Use REST APIs", "Async messaging"],
    "owner": "Architecture Team",
    "category": "Technical",
    "adherence_rate": 0
  }'::jsonb,
  'active'
);
```

## Compliance Logic

### Category-Specific Checks

#### Strategic Principles
- **Scope**: All cards
- **Check**: Has non-empty description
- **Attribute Required**: `description`

#### Business Principles
- **Scope**: Business process cards
- **Check**: Has business context
- **Attributes**: `business_value` OR `stakeholders`

#### Technical Principles
- **Scope**: Technical components
- **Check**: Has technical specifications
- **Attributes**: `technology` OR `architecture` OR `api_spec`

#### Data Principles
- **Scope**: Data-related cards
- **Check**: Has data governance
- **Attributes**: `data_classification` OR `schema` OR `pii_fields`

### Compliance Calculation
```
adherence_rate = (compliant_cards / total_cards) * 100

total_cards = all cards - other architecture principles
```

## Handler Signatures

```rust
// List with filters
pub async fn list_principles(
    Extension(saga): Extension<Arc<SagaOrchestrator>>,
    Query(params): Query<PrincipleSearchParams>,
) -> Result<Json<PrinciplesListResponse>>

// Get by ID
pub async fn get_principle(
    Extension(saga): Extension<Arc<SagaOrchestrator>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ArchitecturePrinciple>>

// Create new
pub async fn create_principle(
    Extension(saga): Extension<Arc<SagaOrchestrator>>,
    Json(req): Json<CreatePrincipleRequest>,
) -> Result<Json<ArchitecturePrinciple>>

// Update existing
pub async fn update_principle(
    Extension(saga): Extension<Arc<SagaOrchestrator>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePrincipleRequest>,
) -> Result<Json<ArchitecturePrinciple>>

// Delete (soft)
pub async fn delete_principle(
    Extension(saga): Extension<Arc<SagaOrchestrator>>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>>

// Compliance report
pub async fn get_principle_compliance(
    Extension(saga): Extension<Arc<SagaOrchestrator>>,
    Path(id): Path<Uuid>,
) -> Result<Json<PrincipleComplianceReport>>
```

## Error Responses

### 404 Not Found
```json
{
  "error": "Card {uuid} is not an Architecture Principle"
}
```

### 422 Validation Error
```json
{
  "error": "Missing statement in attributes"
}
```

## Testing Examples

### Create & Query
```bash
# Create
curl -X POST http://localhost:3000/api/v1/principles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Loose Coupling",
    "statement": "System components shall be loosely coupled",
    "rationale": "Enables independent evolution",
    "implications": ["Use REST APIs"],
    "owner": "Architecture Team",
    "category": "Technical"
  }'

# List technical principles
curl http://localhost:3000/api/v1/principles?category=Technical

# Get compliance
curl http://localhost:3000/api/v1/principles/{uuid}/compliance
```

## Dependencies

- **CardService**: Database operations
- **SagaOrchestrator**: Dual-write coordination (PostgreSQL + Neo4j)
- **CardType::ArchitecturePrinciple**: Type filter
- **JSONB attributes**: Flexible field storage

## TODOs

1. ✅ Basic CRUD - DONE
2. ✅ Compliance calculation - DONE
3. ⚠️ Exception tracking - Partial (stubbed)
4. ⚠️ Authorization - Not implemented
5. ⚠️ Validation rules - Simplified (hard-coded)
6. ⚠️ Performance optimization - Not optimized (loads all cards)

## Files Modified

1. `/home/tahopetis/dev/archzero/archzero-api/src/handlers/principles.rs`
   - Updated imports to use `SagaOrchestrator`
   - Implemented real database logic
   - Added compliance calculation

## Files Created

1. `/home/tahopetis/dev/archzero/archzero-api/PRINCIPLES_IMPLEMENTATION_SUMMARY.md`
   - Detailed implementation documentation

2. `/home/tahopetis/dev/archzero/archzero-api/PRINCIPLES_QUICK_REFERENCE.md`
   - This file - quick reference guide
