---

# Appendix G: Architecture Decision Records (ADR)

**Version:** 1.0  
**Last Updated:** January 12, 2026  
**Status:** Living Document

---

## What are ADRs?

Architecture Decision Records (ADRs) document the **key technical decisions** made during the design of Arc Zero. Each ADR captures:

- **Context:** What problem were we solving?
- **Decision:** What did we choose?
- **Rationale:** Why did we choose it?
- **Consequences:** What are the trade-offs?
- **Alternatives Considered:** What else did we evaluate?

**Purpose:** Prevent future team members from asking "Why did they build it this way?" and potentially repeating past mistakes.

---

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](#adr-001-polyglot-persistence-architecture) | Polyglot Persistence Architecture | ✅ Accepted | 2025-09-15 |
| [ADR-002](#adr-002-rust-for-backend-api) | Rust for Backend API | ✅ Accepted | 2025-09-20 |
| [ADR-003](#adr-003-jsonb-vs-eav-for-flexible-attributes) | JSONB vs EAV for Flexible Attributes | ✅ Accepted | 2025-10-01 |
| [ADR-004](#adr-004-dual-write-consistency-strategy) | Dual-Write Consistency Strategy | ✅ Accepted | 2025-10-15 |
| [ADR-005](#adr-005-client-side-rendering-vs-ssr) | Client-Side Rendering vs SSR | ✅ Accepted | 2025-11-01 |
| [ADR-006](#adr-006-jwt-authentication-stateless-api) | JWT Authentication (Stateless API) | ✅ Accepted | 2025-11-10 |
| [ADR-007](#adr-007-shadcn-ui-over-material-ui) | Shadcn UI over Material UI | ✅ Accepted | 2025-12-01 |

---

## ADR-001: Polyglot Persistence Architecture

**Status:** ✅ Accepted  
**Date:** 2025-09-15  
**Deciders:** CTO, Lead Architect, Backend Lead

---

### Context

Enterprise Architecture platforms must handle multiple data access patterns:

1. **CRUD Operations:** Create, Read, Update, Delete Cards (Applications, Capabilities, etc.)
2. **Complex Queries:** Multi-attribute filtering (e.g., "Show all SaaS apps in Europe with Tier 1 criticality")
3. **Graph Traversal:** Deep dependency analysis (e.g., "What breaks if this database fails?")
4. **Hierarchical Queries:** Recursive trees (e.g., Business Capability parent-child relationships)
5. **Aggregations:** Cost roll-ups, portfolio health metrics

**Problem:** No single database excels at all these patterns.

**Considered Approaches:**

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Single PostgreSQL** | Store everything in relational tables | Simple operations, ACID | Recursive queries are slow (CTEs), graph queries are painful |
| **Single MongoDB** | NoSQL document store | Flexible schema | No ACID, weak aggregations, no graph support |
| **Single Neo4j** | Pure graph database | Amazing graph queries | Poor for bulk CRUD, no JSONB-like flexibility |
| **Polyglot Persistence** | PostgreSQL + Neo4j + Redis | Optimized per use case | Complexity, dual-write consistency |

---

### Decision

**Use Polyglot Persistence with 3 databases:**

1. **PostgreSQL 16** (Primary)
   - **Role:** Source of Truth for Card data
   - **Stores:** Cards table with SQL columns + JSONB attributes
   - **Handles:** CRUD, filtering, audit logs

2. **Neo4j 5** (Secondary)
   - **Role:** Topology/Relationship Engine
   - **Stores:** Graph nodes (references to Postgres UUIDs) + Edges
   - **Handles:** Graph traversal, impact analysis, dependency mapping

3. **Redis 7** (Cache)
   - **Role:** Performance Layer
   - **Stores:** Expensive query results (Landscape Heatmap data, Fan-In counts)
   - **Handles:** Sub-millisecond reads, session management

---

### Rationale

**Why PostgreSQL as Primary?**
- ✅ **ACID Compliance:** Enterprise data requires transactional integrity
- ✅ **JSONB Support:** Flexible schema without sacrificing SQL performance
- ✅ **Rich Ecosystem:** ORMs, migrations, backup tools are mature
- ✅ **Operational Familiarity:** Most ops teams know Postgres well

**Why Neo4j for Graphs?**
- ✅ **100x Faster:** Graph queries (3-level traversal) in Neo4j vs SQL:
  - Neo4j: 50ms
  - PostgreSQL WITH RECURSIVE: 5,000ms
- ✅ **Cypher Expressiveness:** Query language designed for relationships
- ✅ **Built-In Algorithms:** Shortest path, centrality, community detection

**Why Redis for Cache?**
- ✅ **Speed:** Sub-millisecond reads (vs 50ms Postgres query)
- ✅ **TTL Support:** Auto-expiring cache keys prevent stale data
- ✅ **Simplicity:** Key-value store is easy to reason about

---

### Consequences

**Positive:**
- ✅ Each database is used for what it does best
- ✅ Graph queries are 100x faster than pure SQL
- ✅ JSONB flexibility without abandoning relational integrity
- ✅ Horizontal scalability: Can scale Postgres, Neo4j, Redis independently

**Negative:**
- ❌ **Operational Complexity:** 3 databases to monitor, backup, and maintain
- ❌ **Dual-Write Consistency:** Postgres and Neo4j must stay in sync (see ADR-004)
- ❌ **Learning Curve:** Team must learn Cypher (Neo4j query language)
- ❌ **Cost:** 3 database instances instead of 1 (mitigated by Docker Compose for dev)

**Mitigation Strategies:**
- Use Docker Compose to simplify local development (1 command starts all 3)
- Implement SAGA pattern for dual-write consistency (ADR-004)
- Provide Cypher training materials and common query templates
- Use managed services in production (AWS RDS, Neo4j Aura, ElastiCache)

---

### Alternatives Considered

**Alternative 1: PostgreSQL with pg_graph extension**
- **Pros:** Single database
- **Cons:** pg_graph is immature, not production-ready, no Cypher support
- **Rejected:** Too risky for enterprise product

**Alternative 2: Single Neo4j with Properties**
- **Pros:** Excellent graph support
- **Cons:** Poor JSONB equivalent, weak transaction support, harder CRUD operations
- **Rejected:** Not designed for CRUD workloads

**Alternative 3: PostgreSQL + ElasticSearch (for search)**
- **Pros:** Great full-text search
- **Cons:** Doesn't solve graph problem, adds another database
- **Rejected:** Out of scope for MVP (can add later)

---

### References

- [Neo4j vs SQL Performance Comparison](https://neo4j.com/blog/rdbms-vs-nosql-vs-graph-databases/)
- [PostgreSQL JSONB Performance](https://www.postgresql.org/docs/16/datatype-json.html)
- Internal Load Test Results: `docs/performance/graph-query-benchmarks.md`

---

## ADR-002: Rust for Backend API

**Status:** ✅ Accepted  
**Date:** 2025-09-20  
**Deciders:** CTO, Backend Lead, Senior Engineer

---

### Context

Arc Zero's backend must handle:
- **Complex Business Logic:** BIA scoring, TCO calculation, 6R decision trees
- **High Concurrency:** 100+ simultaneous users querying graphs
- **Data Orchestration:** Coordinating Postgres, Neo4j, Redis
- **Memory Safety:** No crashes from null pointers or buffer overflows

**Problem:** Choose a backend language that balances performance, safety, and developer productivity.

**Considered Languages:**

| Language | Pros | Cons |
|----------|------|------|
| **Python (FastAPI)** | Fast development, great for data science | Slow, GIL limits concurrency, runtime errors |
| **Node.js (Express)** | JavaScript everywhere, large ecosystem | Single-threaded, callback hell, weak typing |
| **Go** | Fast, simple concurrency (goroutines) | Verbose error handling, no generics (at the time) |
| **Java (Spring Boot)** | Mature, enterprise standard | Heavy (JVM), slow startup, verbose |
| **Rust (Axum)** | Memory-safe, fast, excellent async | Steep learning curve, slower development |

---

### Decision

**Use Rust with the Axum web framework.**

---

### Rationale

**Why Rust?**

1. **Memory Safety Without GC:**
   - No null pointer crashes (compiler enforces Option<T>)
   - No data races (borrow checker prevents concurrent access bugs)
   - No GC pauses (important for consistent API latency)

2. **Performance:**
   - Comparable to C/C++ (10x faster than Python, 3x faster than Node.js)
   - Zero-cost abstractions (high-level code compiles to efficient machine code)
   - Benchmarks (TechEmpower):
     - Rust (Axum): 500,000 req/sec
     - Node.js (Express): 50,000 req/sec
     - Python (FastAPI): 20,000 req/sec

3. **Concurrency:**
   - Tokio async runtime handles thousands of concurrent connections
   - No GIL (unlike Python), no callback hell (unlike Node.js)
   - Built for microservices architecture

4. **Developer Experience:**
   - **Cargo:** Best-in-class package manager and build tool
   - **Strong Typing:** Catches bugs at compile time (vs runtime errors in Python/JS)
   - **Error Handling:** Result<T, E> forces explicit error handling

**Why Axum Framework?**
- Built on Tokio (battle-tested async runtime)
- Type-safe extractors (request parsing)
- Middleware system for auth, logging, CORS
- Lower boilerplate than Actix-Web

---

### Consequences

**Positive:**
- ✅ **Zero Production Crashes:** Memory safety eliminates entire classes of bugs
- ✅ **10x Lower Latency:** Faster API response times improve UX
- ✅ **Horizontal Scalability:** Can handle more users per instance (lower cloud costs)
- ✅ **Compile-Time Guarantees:** Many bugs caught before deployment

**Negative:**
- ❌ **Steep Learning Curve:** Borrow checker frustrates beginners (2-4 week ramp-up)
- ❌ **Slower Development:** Compile times longer than interpreted languages
- ❌ **Smaller Talent Pool:** Fewer Rust developers than JavaScript/Python
- ❌ **Library Maturity:** Some crates are less mature than npm/PyPI equivalents

**Mitigation Strategies:**
- Invest in team training (Rust book, workshops, pair programming)
- Use pre-built Docker images to speed up CI/CD
- Hire for "smart generalist" rather than "must know Rust" (trainable skill)
- Contribute to open-source Rust ecosystem where gaps exist

---

### Alternatives Considered

**Alternative 1: Python (FastAPI)**
- **Pros:** Fastest development, great for data science integrations
- **Cons:** Too slow for 100+ concurrent users, GIL is a bottleneck
- **Rejected:** Performance inadequate for production scale

**Alternative 2: Go**
- **Pros:** Simple concurrency, fast compile times
- **Cons:** No generics (2025 context: Go 1.18+ has generics now, but decision predates), verbose error handling
- **Decision:** Close second choice. We chose Rust for memory safety guarantees

**Alternative 3: Node.js (TypeScript)**
- **Pros:** JavaScript everywhere (same language as frontend)
- **Cons:** Single-threaded (must use worker threads), weaker type system than Rust
- **Rejected:** Concurrency limitations unacceptable

---

### References

- [Rust vs Go Benchmark](https://benchmarksgame-team.pages.debian.net/benchmarksgame/fastest/rust-go.html)
- [Why Discord Switched to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust)
- Internal Load Test: `benchmarks/api-load-test-results.md`

---

## ADR-003: JSONB vs EAV for Flexible Attributes

**Status:** ✅ Accepted  
**Date:** 2025-10-01  
**Deciders:** Backend Lead, Database Architect

---

### Context

Arc Zero's metamodel must support:
- **Standard Fields:** (e.g., `name`, `type`, `lifecycle`) - Same for all Cards
- **Flexible Fields:** (e.g., `hosting_type`, `cost_center`) - Vary by Card type and customer

**Problem:** How to store flexible attributes that differ per Card and per organization?

**Considered Approaches:**

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Fixed Columns** | Add SQL column for every possible attribute | Fast queries | Inflexible (100+ columns, many NULL) |
| **EAV (Entity-Attribute-Value)** | Separate table for attributes | Fully flexible | Complex queries, many JOINs, slow |
| **JSONB** | JSON column in PostgreSQL | Flexible + queryable | Slightly slower than SQL columns |
| **NoSQL (MongoDB)** | Store entire Card as JSON document | Maximum flexibility | No ACID, weak aggregations |

---

### Decision

**Use PostgreSQL JSONB for flexible attributes.**

Store flexible data in a single `attributes` JSONB column alongside strict SQL columns.

**Table Schema:**
```sql
CREATE TABLE cards (
    -- Strict SQL columns (fast, indexed)
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    lifecycle_active DATE,
    quality_score INT,
    
    -- Flexible JSONB column (schema-less)
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for JSONB queries
CREATE INDEX idx_cards_attributes ON cards USING GIN (attributes);
```

---

### Rationale

**Why JSONB?**

1. **Query Performance:**
   - GIN index allows fast queries: `WHERE attributes->>'hosting_type' = 'SaaS'`
   - Performance: ~5ms for JSONB query vs ~50ms for EAV with JOINs
   - Benchmark: 10,000 cards, filter by JSONB attribute:
     - JSONB with GIN index: 8ms
     - EAV with JOINs: 45ms

2. **Simplicity:**
   - Single row per Card (no JOINs required)
   - `SELECT * FROM cards WHERE id = $1` returns complete Card
   - EAV requires complex query: `SELECT ... FROM cards LEFT JOIN attributes ON ... GROUP BY ...`

3. **Flexibility:**
   - Add new attributes without schema migration
   - Each organization can define custom fields
   - Example: Healthcare adds `hipaa_compliant` field, Finance adds `sox_compliance`

4. **Developer Experience:**
   - JSON is universal (every language has JSON support)
   - Easy to serialize/deserialize in Rust: `serde_json`
   - Rust struct example:
     ```rust
     #[derive(Serialize, Deserialize)]
     struct Card {
         id: Uuid,
         name: String,
         attributes: serde_json::Value,  // JSONB
     }
     ```

**Why NOT EAV?**

- **Query Complexity:** Every attribute lookup requires a JOIN
  ```sql
  -- EAV query (ugly)
  SELECT c.name, a1.value AS hosting, a2.value AS cost
  FROM cards c
  LEFT JOIN attributes a1 ON c.id = a1.card_id AND a1.key = 'hosting_type'
  LEFT JOIN attributes a2 ON c.id = a2.card_id AND a2.key = 'cost'
  ```
- **Performance:** N+1 query problem (one query per attribute)
- **Data Integrity:** Hard to enforce constraints (e.g., "hosting_type must be enum")

---

### Consequences

**Positive:**
- ✅ **Fast Queries:** GIN index makes JSONB nearly as fast as SQL columns
- ✅ **Simple Code:** No complex ORM mappings or JOINs
- ✅ **Schema Evolution:** Add fields without downtime
- ✅ **Customer Flexibility:** Each org can add custom attributes

**Negative:**
- ❌ **Validation Complexity:** JSONB doesn't enforce types (must validate in app layer)
- ❌ **Slightly Slower:** JSONB queries are ~2x slower than SQL column (8ms vs 4ms)
- ❌ **Disk Space:** JSONB has overhead (~20% larger than EAV)
- ❌ **Reporting Challenges:** BI tools (Tableau, PowerBI) struggle with JSONB

**Mitigation Strategies:**
- Implement Metamodel Rules engine to validate JSONB at API layer (see 01-metamodel-spec.md)
- Use SQL columns for frequently-queried fields (50% of queries rule)
- Create materialized views for BI tools (flatten JSONB to columns)
- Monitor JSONB query performance with `EXPLAIN ANALYZE`

---

### Alternatives Considered

**Alternative 1: Pure EAV**
- **Rejected:** Too slow, too complex, developer productivity loss

**Alternative 2: MongoDB (NoSQL)**
- **Rejected:** Loss of ACID transactions unacceptable for enterprise data

**Alternative 3: PostgreSQL hstore**
- **Rejected:** hstore is older, less powerful than JSONB (no nested objects)

---

### References

- [PostgreSQL JSONB Performance](https://www.postgresql.org/docs/16/datatype-json.html)
- [JSONB vs EAV Benchmark](https://www.citusdata.com/blog/2016/07/14/choosing-nosql-hstore-json-jsonb/)
- Internal Benchmark: `benchmarks/jsonb-vs-eav-performance.md`

---

## ADR-004: Dual-Write Consistency Strategy

**Status:** ✅ Accepted  
**Date:** 2025-10-15  
**Deciders:** CTO, Backend Lead, Database Architect

---

### Context

Arc Zero uses **two databases** (see ADR-001):
1. **PostgreSQL:** Stores Card data (source of truth)
2. **Neo4j:** Stores relationships (graph topology)

**Problem:** When a Card or Relationship is created/updated, **both databases must be updated**. If one fails, we have inconsistent data.

**Example Failure Scenario:**
```
1. User creates relationship: App A → Database B
2. ✅ Postgres INSERT succeeds
3. ❌ Neo4j CREATE fails (network timeout)
4. Result: Relationship exists in Postgres but NOT in Neo4j
5. Impact: Graph visualizations are incomplete
```

---

### Decision

**Use SAGA Pattern with Compensating Transactions.**

**Workflow:**
```
1. START Transaction
2. Write to PostgreSQL (source of truth)
3. IF Postgres succeeds:
   3a. Write to Neo4j
   3b. IF Neo4j fails:
       - ROLLBACK Postgres change
       - LOG error for manual investigation
       - RETURN error to user
4. COMMIT if both succeed
```

**Implementation (Rust Pseudocode):**
```rust
async fn create_relationship(rel: Relationship) -> Result<Relationship, Error> {
    // Step 1: Start Postgres transaction
    let mut tx = postgres.begin().await?;
    
    // Step 2: Write to Postgres
    let rel_id = tx.execute(
        "INSERT INTO relationships (source_id, target_id, type) VALUES ($1, $2, $3)",
        &[&rel.source_id, &rel.target_id, &rel.type]
    ).await?;
    
    // Step 3: Write to Neo4j
    let neo4j_result = neo4j.execute_cypher(
        "MATCH (a {id: $source}), (b {id: $target})
         CREATE (a)-[r:RELIES_ON]->(b)
         RETURN r",
        params! { "source" => rel.source_id, "target" => rel.target_id }
    ).await;
    
    // Step 4: Handle Neo4j result
    match neo4j_result {
        Ok(_) => {
            tx.commit().await?;  // Both succeeded
            Ok(rel)
        },
        Err(e) => {
            tx.rollback().await?;  // Compensate: undo Postgres change
            log::error!("Neo4j write failed, rolled back Postgres: {}", e);
            Err(Error::DualWriteFailed(e))
        }
    }
}
```

---

### Rationale

**Why SAGA Pattern?**

1. **Atomic Operations:** Either both databases update or neither does
2. **Simple Logic:** Easy to understand and debug
3. **Error Recovery:** Failed operations are logged for manual investigation
4. **User Feedback:** Users get immediate error if operation fails

**Why NOT 2-Phase Commit (2PC)?**
- Neo4j doesn't support 2PC protocol
- 2PC adds significant latency (2 round trips instead of 1)
- 2PC can cause deadlocks in distributed systems

**Why NOT Event Sourcing?**
- Over-engineering for MVP
- Event log adds complexity (Kafka, event replay logic)
- Can add later if needed

---

### Consequences

**Positive:**
- ✅ **Data Consistency:** No orphaned records in either database
- ✅ **Immediate Feedback:** Users see errors in real-time
- ✅ **Debuggable:** Failed operations are logged with full context
- ✅ **Simple:** No complex distributed transaction coordinator

**Negative:**
- ❌ **Latency:** Synchronous writes are slower than async (20ms vs 5ms)
- ❌ **Partial Failures:** If rollback fails, manual cleanup required
- ❌ **No Retry:** User must retry manually (could auto-retry in future)

**Mitigation Strategies:**
- **Monitoring:** Alert on dual-write failures (PagerDuty)
- **Idempotency:** Support idempotent retries (same request twice = same result)
- **Background Reconciliation:** Nightly job to detect drift between Postgres/Neo4j
  ```sql
  -- Find Cards in Postgres missing from Neo4j
  SELECT p.id 
  FROM cards p
  WHERE NOT EXISTS (
      SELECT 1 FROM neo4j_sync_log WHERE card_id = p.id
  );
  ```

---

### Alternatives Considered

**Alternative 1: Async Event-Driven (Publish to Kafka)**
- **Pros:** Low latency, decoupled
- **Cons:** Eventual consistency (user sees stale data), complex retry logic
- **Rejected:** Too complex for MVP

**Alternative 2: Neo4j as Primary, Sync to Postgres**
- **Pros:** Simplifies graph writes
- **Cons:** Neo4j is not designed for CRUD workloads, poor JSONB equivalent
- **Rejected:** Violates "Postgres is source of truth" principle

**Alternative 3: Accept Inconsistency (Eventual Consistency)**
- **Pros:** Fastest writes
- **Cons:** Users see incomplete data, complex debugging
- **Rejected:** Unacceptable for enterprise data integrity

---

### References

- [SAGA Pattern Explained](https://microservices.io/patterns/data/saga.html)
- [Distributed Transactions Best Practices](https://www.microsoft.com/en-us/research/publication/life-beyond-distributed-transactions/)
- Internal Incident Report: `incidents/2025-10-12-dual-write-failure.md`

---

## ADR-005: Client-Side Rendering vs SSR

**Status:** ✅ Accepted  
**Date:** 2025-11-01  
**Deciders:** Frontend Lead, UX Designer

---

### Context

Modern web apps can render in two ways:
1. **Server-Side Rendering (SSR):** HTML generated on server (Next.js, Remix)
2. **Client-Side Rendering (CSR):** HTML generated in browser (Create React App, Vite)

**Arc Zero Requirements:**
- Internal tool (not public website - no SEO concerns)
- Heavy interactivity (graphs, drag-drop, real-time filters)
- Authentication required (no public pages)

---

### Decision

**Use Client-Side Rendering (CSR) with Vite + React.**

---

### Rationale

**Why CSR?**

1. **No SEO Needed:**
   - Arc Zero is behind authentication (no public indexing)
   - Google/Bing will never see these pages
   - SSR's main benefit (SEO) is irrelevant

2. **Better for Highly Interactive UIs:**
   - D3.js visualizations (Landscape Heatmap) run in browser
   - ReactFlow graphs require client-side rendering
   - No page reloads (SPA = smoother UX)

3. **Simpler Deployment:**
   - CSR = Static files (HTML, JS, CSS) → Deploy to CDN
   - SSR = Node.js server → More infrastructure
   - Lower operational complexity

4. **Faster Development:**
   - Vite Hot Module Replacement (HMR) is instant (50ms)
   - Next.js SSR has slower HMR (200ms+)
   - Better developer experience

**Why NOT SSR?**
- SSR adds server complexity for no benefit (we don't need SEO or faster initial paint)
- SSR can't render D3.js/Canvas on server (requires browser DOM)
- SSR doubles infrastructure (need React server + API server)

---

### Consequences

**Positive:**
- ✅ **Simple Deployment:** Just static files (Nginx, S3, Vercel)
- ✅ **Fast Development:** Vite HMR is near-instant
- ✅ **Lower Costs:** No Node.js server to run
- ✅ **Better for D3/Canvas:** All rendering happens in browser

**Negative:**
- ❌ **Slower Initial Load:** User sees blank page until JS loads (2-3 seconds)
- ❌ **No Progressive Enhancement:** JavaScript is required (app breaks if JS disabled)
- ❌ **Bundle Size:** Initial download is larger (500KB+ minified)

**Mitigation Strategies:**
- **Code Splitting:** Lazy load routes (React.lazy)
- **Loading Skeleton:** Show skeleton UI while JS loads
- **Service Worker:** Cache assets for instant repeat visits
- **CDN:** Serve assets from edge locations (low latency)

---

### Alternatives Considered

**Alternative 1: Next.js (SSR)**
- **Rejected:** Adds complexity for no SEO/performance benefit

**Alternative 2: Remix (SSR)**
- **Rejected:** Same reason as Next.js

---

## ADR-006: JWT Authentication (Stateless API)

**Status:** ✅ Accepted  
**Date:** 2025-11-10  
**Deciders:** Backend Lead, Security Engineer

---

### Context

API authentication options:
1. **Session Cookies:** Server stores session state in Redis/Postgres
2. **JWT Tokens:** Client stores token, server validates signature

---

### Decision

**Use JWT (JSON Web Tokens) for stateless authentication.**

**Token Structure:**
```json
{
  "sub": "user-uuid",
  "roles": ["architect", "editor"],
  "org_id": "acme-corp",
  "exp": 1704114000
}
```

---

### Rationale

**Why JWT?**

1. **Stateless API:**
   - No session storage required (Redis/Postgres)
   - Easier horizontal scaling (any server can validate token)

2. **Mobile-Friendly:**
   - Works with React Native app (future roadmap)
   - Cookies don't work well in mobile apps

3. **Microservices-Ready:**
   - Token can be validated by any service
   - No central session store dependency

---

### Consequences

**Positive:**
- ✅ Stateless (easier scaling)
- ✅ Works with mobile apps

**Negative:**
- ❌ Cannot revoke tokens (must wait for expiration)
- ❌ Larger payload (vs session ID)

**Mitigation:**
- Short expiration (1 hour)
- Refresh token rotation
- Blacklist for critical revocations

---

## ADR-007: Shadcn UI over Material UI

**Status:** ✅ Accepted  
**Date:** 2025-12-01  
**Deciders:** Frontend Lead, UX Designer

---

### Context

Need a React component library for Arc Zero UI.

**Options:**
- Material UI (MUI)
- Ant Design
- Chakra UI
- Shadcn UI

---

### Decision

**Use Shadcn UI + Tailwind CSS.**

---

### Rationale

**Why Shadcn?**

1. **Copy-Paste Components:**
   - No npm dependency bloat (copy code into project)
   - Full customization (own the code)

2. **Radix UI Foundation:**
   - Accessibility built-in (WCAG 2.1 AA)
   - Headless components (full design control)

3. **Tailwind Integration:**
   - Consistent design tokens
   - Fast styling with utility classes

4. **Modern Stack:**
   - TypeScript-first
   - React 18+ (concurrent features)

**Why NOT Material UI?**
- Heavy bundle size (500KB+)
- Google's design language (not customizable)
- Harder to make unique designs

---

### Consequences

**Positive:**
- ✅ Full design control
- ✅ Smaller bundle size
- ✅ Built-in accessibility

**Negative:**
- ❌ Must copy/paste updates
- ❌ Less mature ecosystem

**Mitigation:**
- Pin Shadcn version in docs
- Test accessibility with screen readers

---

## Appendix: ADR Template

Use this template for future decisions:

```markdown
## ADR-XXX: [Title]

**Status:** 🚧 Proposed | ✅ Accepted | ⛔ Rejected | ⚠️ Deprecated  
**Date:** YYYY-MM-DD  
**Deciders:** [Names/Roles]

### Context
What problem are we solving? What constraints exist?

### Decision
What did we decide?

### Rationale
Why is this the best choice?

### Consequences
**Positive:**
- ✅ Benefit 1

**Negative:**
- ❌ Drawback 1

**Mitigation:**
- How we address drawbacks

### Alternatives Considered
What else did we evaluate and why did we reject it?

### References
- Links to research, benchmarks, discussions
```

---

## Document Maintenance

**Review Frequency:** Quarterly  
**Next Review:** April 1, 2026  
**Owner:** Lead Architect

**Changelog:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-12 | Initial ADR collection (7 decisions) | Documentation Team |

---

**When to Create a New ADR:**

- ✅ Technology choice (language, database, framework)
- ✅ Architectural pattern (microservices, monolith, event-driven)
- ✅ Cross-cutting concerns (auth, logging, error handling)
- ✅ Data modeling decisions (schema design, normalization)
- ✅ Major trade-offs (performance vs simplicity, consistency vs availability)

**When NOT to Create an ADR:**

- ❌ Minor implementation details (variable naming, file structure)
- ❌ Temporary workarounds (will be refactored soon)
- ❌ Obvious choices (use Git for version control)

---

**End of Document**
