# Risk Handlers Implementation Summary

## Overview
The Risk handlers in `/home/tahopetis/dev/archzero/archzero-api/src/handlers/risks.rs` are fully implemented with real database logic using CardService and PostgreSQL.

## Implementation Details

### 1. Database Integration
- **Service**: Uses `CardService` for all database operations
- **Queries**: Real PostgreSQL queries via SQLx
- **Card Type Filter**: All operations filter by `CardType::Risk`
- **Storage**: Risk-specific fields stored in `card.attributes` JSONB column

### 2. Risk-Specific Attributes
Risk data is stored in the `card.attributes` JSONB field with the following structure:
```json
{
  "riskType": "Security|Compliance|Operational|Financial|Strategic|Reputational",
  "likelihood": 1-5,
  "impact": 1-5,
  "riskScore": 1-25,
  "status": "Open|Mitigated|Accepted|Transferred|Closed",
  "mitigationPlan": "optional string",
  "owner": "optional string",
  "targetClosureDate": "optional ISO 8601 date"
}
```

### 3. Risk Score Calculation
- **Formula**: `risk_score = likelihood * impact`
- **Range**: 1-25 (both 1-5 scales)
- **Validation**: Enforces 1-5 range for both fields

## Implemented Handlers

### 1. List Risks (`list_risks`)
**Endpoint**: `GET /api/v1/risks`

**Features**:
- Filters by `risk_type`, `status`, `min_score`
- Pagination support
- Returns `RiskListResponse` with pagination metadata

**Database Logic**:
```rust
let card_params = CardSearchParams {
    card_type: Some(CardType::Risk),
    page: params.page,
    ...
};
let (cards, total) = card_service.list(card_params).await?;
```

**Post-Processing**:
- Converts cards to Risk objects
- Applies additional risk-specific filters (risk_type, status, min_score)
- Returns paginated results

### 2. Get Risk (`get_risk`)
**Endpoint**: `GET /api/v1/risks/{id}`

**Database Logic**:
```rust
let card = card_service.get(id).await?;
card_to_risk(card)
    .map(Json)
    .ok_or_else(|| AppError::NotFound(...))
```

**Validation**: Verifies card is of type `Risk` before conversion

### 3. Create Risk (`create_risk`)
**Endpoint**: `POST /api/v1/risks`

**Features**:
- Validates likelihood/impact ranges (1-5)
- Auto-calculates risk_score
- Stores all fields in card.attributes

**Database Logic**:
```rust
let risk_score = req.calculate_risk_score();
let attributes = serde_json::json!({
    "riskType": req.risk_type,
    "likelihood": req.likelihood,
    "impact": req.impact,
    "riskScore": risk_score,
    "status": req.status.unwrap_or(RiskStatus::Open),
    ...
});

let card_req = CreateCardRequest {
    name: req.name,
    card_type: CardType::Risk,
    attributes: Some(attributes),
    ...
};

let card = card_service.create(card_req).await?;
```

### 4. Update Risk (`update_risk`)
**Endpoint**: `PUT /api/v1/risks/{id}`

**Features**:
- Partial updates supported
- Recalculates risk_score if likelihood/impact change
- Merges with existing attributes

**Database Logic**:
```rust
let existing_card = card_service.get(id).await?;
let mut attributes = /* merge existing with new */;

if let (Some(likelihood), Some(impact)) = (req.likelihood, req.impact) {
    attributes["riskScore"] = serde_json::json!(likelihood * impact);
}

let card = card_service.update(id, card_req).await?;
```

### 5. Delete Risk (`delete_risk`)
**Endpoint**: `DELETE /api/v1/risks/{id}`

**Database Logic**:
```rust
card_service.delete(id).await?;
```

**Note**: Soft delete via CardService (sets status to 'deleted')

### 6. Get Risk Heat Map (`get_risk_heat_map`)
**Endpoint**: `GET /api/v1/risks/heat-map`

**Features**:
- Generates 5x5 matrix (likelihood x impact)
- Groups risks by cell
- Returns count and risk details per cell

**Database Logic**:
```rust
let params = CardSearchParams {
    card_type: Some(CardType::Risk),
    ...
};
let (cards, _) = card_service.list(params).await?;

let risks: Vec<Risk> = cards
    .into_iter()
    .filter_map(|card| card_to_risk(card))
    .collect();

// Build 5x5 heat map
let mut heat_map: HashMap<(i32, i32), RiskHeatMapData> = HashMap::new();

for risk in risks {
    let key = (risk.likelihood, risk.impact);
    let entry = heat_map.entry(key).or_insert(...);
    entry.count += 1;
    entry.risks.push(...);
}
```

**Response Format**:
```json
[
  {
    "likelihood": 5,
    "impact": 5,
    "count": 3,
    "risks": [
      {"id": "...", "name": "...", "riskScore": 25},
      ...
    ]
  },
  ...
]
```

### 7. Get Top Risks (`get_top_risks`)
**Endpoint**: `GET /api/v1/risks/top-10`

**Features**:
- Returns top 10 risks by risk_score
- Sorted descending
- Includes rank number

**Database Logic**:
```rust
let (cards, _) = card_service.list(params).await?;

let mut risks: Vec<Risk> = cards
    .into_iter()
    .filter_map(|card| card_to_risk(card))
    .collect();

risks.sort_by(|a, b| b.risk_score.cmp(&a.risk_score));

let top_risks: Vec<TopRisk> = risks
    .into_iter()
    .take(10)
    .enumerate()
    .map(|(idx, risk)| TopRisk {
        rank: (idx + 1) as i32,
        ...
    })
    .collect();
```

## Helper Function: `card_to_risk`

Converts a generic Card to a Risk by extracting risk-specific attributes:

```rust
fn card_to_risk(card: Card) -> Option<Risk> {
    if card.card_type != CardType::Risk {
        return None;
    }

    let attrs = &card.attributes;

    let risk_type: RiskType = attrs.get("riskType")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let likelihood: i32 = attrs.get("likelihood")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let impact: i32 = attrs.get("impact")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let risk_score: i32 = attrs.get("riskScore")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    // ... extract other fields

    Some(Risk { ... })
}
```

## Database Schema

The Risk handlers use the `cards` table with the following structure:

```sql
CREATE TABLE cards (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,  -- 'Risk'
    lifecycle_phase VARCHAR,
    quality_score INTEGER,
    description TEXT,
    owner_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    attributes JSONB NOT NULL,  -- Risk-specific fields here
    tags TEXT[],
    status VARCHAR NOT NULL
);
```

## Validation

### CreateRiskRequest
```rust
pub fn validate(&self) -> Result<(), String> {
    if !(1..=5).contains(&self.likelihood) {
        return Err("Likelihood must be between 1 and 5");
    }
    if !(1..=5).contains(&self.impact) {
        return Err("Impact must be between 1 and 5");
    }
    Ok(())
}
```

### UpdateRiskRequest
```rust
pub fn validate(&self) -> Result<(), String> {
    if let Some(likelihood) = self.likelihood {
        if !(1..=5).contains(&likelihood) {
            return Err("Likelihood must be between 1 and 5");
        }
    }
    if let Some(impact) = self.impact {
        if !(1..=5).contains(&impact) {
            return Err("Impact must be between 1 and 5");
        }
    }
    Ok(())
}
```

## Test Coverage

All risk model tests pass:
- ✅ `test_risk_score_calculation`: Verifies risk_score = likelihood * impact
- ✅ `test_validation_valid`: Valid inputs pass validation
- ✅ `test_validation_invalid_likelihood`: Rejects likelihood > 5
- ✅ `test_validation_invalid_impact`: Rejects impact < 1

## Performance Considerations

1. **JSONB Indexing**: The `attributes` field is JSONB for efficient querying
2. **pg_trgm**: Text search uses ILIKE with pg_trgm indexes
3. **Pagination**: All list operations support pagination
4. **Soft Delete**: Delete operations don't remove data, just set status

## Security Considerations

1. **Input Validation**: All likelihood/impact values validated to 1-5 range
2. **SQL Injection**: Uses parameterized queries via SQLx
3. **Type Safety**: Rust's type system prevents many errors
4. **Status Filtering**: List operations only return 'active' cards

## File Location

`/home/tahopetis/dev/archzero/archzero-api/src/handlers/risks.rs`

## Dependencies

- `sqlx`: PostgreSQL database access
- `serde`: JSON serialization/deserialization
- `uuid`: Unique identifiers
- `chrono`: Date/time handling
- `axum`: HTTP framework
- `utoipa`: OpenAPI documentation

## Compilation Status

✅ **Compiles successfully**
✅ **All tests pass**
✅ **No blocking errors**

Only minor warnings about unused imports/variables (non-breaking).
