---

# Product Requirements Document (PRD)
## Arc Zero: Enterprise Architecture Platform

**Product Name:** Arc Zero  
**Version:** 2.0 (True EA Platform)  
**Date:** January 13, 2026  
**Status:** Draft for Review  
**Document Owner:** Product Team

---

## 1. Executive Summary

### 1.1 Vision Statement

**Arc Zero** is a comprehensive Enterprise Architecture platform that empowers EA teams to **govern, plan, and transform** their IT landscape with unprecedented speed and flexibility.

Unlike legacy EA tools that force rigid methodologies or require expensive customization, Arc Zero combines:
- **Opinionated EA Best Practices** (governance, strategy, compliance built-in)
- **Technical Excellence** (10x faster than competitors via Rust + Neo4j)
- **Infinite Flexibility** (JSONB-powered custom attributes without schema migrations)

### 1.2 Market Positioning

**Arc Zero is the LeanIX killer at 1/10th the price.**

| Competitor | Price/User/Year | Primary Weakness | Arc Zero Advantage |
|------------|----------------|------------------|-------------------|
| **LeanIX** | $1,500-2,000 | Expensive, rigid customization | Same features at $200-500, JSONB flexibility |
| **Ardoq** | $1,000-1,500 | Weak governance, poor performance | Built-in governance, 10x faster queries |
| **ServiceNow CMDB** | $800-1,200 | IT Ops focus, not EA-aligned | EA-first design, strategic planning |
| **Enterprise Architect** | $300-500 | Desktop-only, modeling-heavy | Cloud-native, outcome-focused |
| **Custom Spreadsheets** | $0 (but high TCO) | No governance, chaos | Structure + flexibility + collaboration |

**Target Audience:** 
- **Primary:** Enterprise Architects (Strategy, Application, Technology, Data)
- **Secondary:** IT Leaders (CTO, VP Engineering), Business Architects
- **Tertiary:** PMO, Compliance Officers, Audit Teams

**Core Value Propositions:**
1. **"Govern with Confidence"** - Built-in principles, standards, compliance tracking
2. **"Plan the Future"** - Target state architecture, transformation roadmaps, gap analysis
3. **"Transform at Speed"** - 10x faster than competitors, instant insights, real-time collaboration

---

## 2. Product Strategy & Goals

### 2.1 Product Strategy

Arc Zero will become **the standard EA platform for mid-market and enterprise organizations** by delivering:

1. **Complete EA Capabilities** (governance, strategy, portfolio, compliance)
2. **Superior Performance** (Rust backend, Neo4j graph, Redis caching)
3. **Unmatched Flexibility** (JSONB custom attributes, extensible metamodel)
4. **Accessible Pricing** ($200-500/user/year vs $1,500+ for LeanIX)

### 2.2 Success Criteria

#### Business Metrics (12 Months Post-Launch)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Active Organizations** | 20 enterprises (50-500 users each) | License activations |
| **Annual Recurring Revenue (ARR)** | $2M | MRR × 12 |
| **User Adoption Rate** | 75% weekly active users | WAU / Total Licenses |
| **Net Promoter Score (NPS)** | > 50 | Quarterly surveys |
| **Logo Customers** | 3 Fortune 500 companies | Customer database |
| **Time to First Value** | < 4 hours (install → first strategic insight) | Onboarding telemetry |

#### EA-Specific Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Governance Adoption** | 60% of orgs define architecture principles | Core EA activity |
| **Target State Usage** | 70% of orgs model target state | Strategic planning indicator |
| **Compliance Tracking** | 50% of orgs track regulatory requirements | Enterprise necessity |
| **ARB Workflow Usage** | 40% of orgs use review workflow | Governance maturity |
| **Transformation Roadmaps** | 80% of orgs create multi-year roadmaps | EA value delivery |

#### Technical Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Landscape Render Time** | < 3 seconds for 1,000 nodes | Complex portfolio support |
| **Graph Query Performance** | < 500ms for 5-level traversal | Deep impact analysis |
| **API Response Time (p95)** | < 200ms for CRUD | Responsive UX |
| **System Uptime** | 99.9% | Enterprise SLA |
| **Concurrent Users** | 500 users without degradation | Large enterprise support |
| **Max Portfolio Size** | 100,000 Cards + 500,000 Relationships | Enterprise scale |

---

## 3. Technical Architecture

*[Keep existing architecture section from previous PRD - no changes needed]*

---

## 4. Core Concept: "The Card"

*[Keep existing Card concept section from previous PRD - no changes needed]*

---

## 5. Functional Requirements

### 5.1 Data Management & Governance

**FR-CORE-01 (Dual-Write Consistency)**  
The system MUST ensure that every Relationship creation updates Neo4j (for query speed) AND Postgres (for durability). Failure in either step MUST rollback the transaction.

**FR-CORE-02 (Metamodel Rules Engine)**  
Admins MUST be able to define validation rules (Regex, Required Fields, Allowed Enums) that apply to JSONB attributes. The backend MUST reject invalid payloads with HTTP 400 and actionable error messages.

**FR-CORE-03 (Audit Trail)**  
Every change to a Card MUST be versioned in the `audit_log` table, showing what changed, when, who made the change, and optionally why (comment).

**FR-CORE-04 (Soft Delete)**  
Deleting a Card MUST set `deleted_at` timestamp rather than physical deletion. This preserves historical reports and allows undelete functionality.

**FR-CORE-05 (Data Quality Scoring)**  
System MUST auto-calculate quality score (0-100) based on field completeness. Formula:
```
quality_score = (filled_required_fields / total_required_fields) * 100
```

---

### 5.2 EA Governance & Standards

**FR-GOV-01 (Architecture Principles)**  
- System MUST support defining Architecture Principles with:
  - Name (e.g., "Cloud First")
  - Statement (e.g., "Default to cloud-native solutions unless exception approved")
  - Rationale (why this principle exists)
  - Implications (what this means for decision-making)
  - Owner (who is accountable)
  - Category (Strategic, Business, Technical, Data)
- Principles MUST be linkable to Cards to track adherence
- System MUST show "Principle Compliance Dashboard" (% of portfolio aligned per principle)

**FR-GOV-02 (Technology Standards Catalog)**  
- System MUST maintain "Approved Technology List" with:
  - Technology Name (e.g., "PostgreSQL 16")
  - Category (Database, Language, Framework, Platform)
  - Status: **Adopt** (default choice), **Trial** (use with caution), **Assess** (experimental), **Hold** (legacy, plan migration), **Sunset** (deprecated), **Banned** (do not use)
  - Sunset Date (for Hold/Sunset status)
  - Replacement Recommendation (e.g., "Migrate Oracle → PostgreSQL")
  - Rationale (why this decision was made)
- System MUST flag IT Components using non-Adopt technology
- System MUST generate "Technology Standard Compliance Report" showing:
  - Count of apps per technology status
  - Cost of legacy tech (sum of TCO for Hold/Sunset tech)
  - Migration priority (Tier 1 apps on Sunset tech = highest)

**FR-GOV-03 (Architecture Policies)**  
- System MUST support defining enforceable policies:
  - Policy Name (e.g., "Tier 1 Apps Must Have DR Plan")
  - Rule (e.g., `IF business_criticality = "Tier 1" THEN attributes.dr_plan MUST NOT BE NULL`)
  - Severity: Critical, High, Medium, Low
  - Enforcement: Blocking (prevent lifecycle advancement), Warning (show alert)
- System MUST evaluate policies on Card save and show violations
- System MUST show "Policy Compliance Dashboard" (% compliant by policy)

**FR-GOV-04 (Exception Management)**  
- Users MUST be able to request exceptions to standards/policies with:
  - Policy being violated
  - Justification
  - Duration (temporary: 30/60/90 days, or permanent)
  - Compensating controls (what mitigations are in place)
- Admins MUST be able to approve/reject with comments
- System MUST track active exceptions and auto-expire temporary ones
- System MUST notify requester 7 days before exception expires

**FR-GOV-05 (Governance Dashboard)**  
System MUST provide executive dashboard showing:
- Principle adherence rate (e.g., "85% Cloud First compliance")
- Technology standard compliance (e.g., "12 apps on sunset tech")
- Active exceptions count (total and by severity)
- Policy violations trend (last 6 months)
- Top violators (cards with most violations)

---

### 5.3 Strategic Planning & Target State

**FR-STRATEGY-01 (Multiple Architecture States)**  
- System MUST support defining multiple architecture states:
  - **Baseline** (Current State - read-only, auto-captured quarterly)
  - **Target** (Desired Future State - 2-5 years)
  - **Transition States** (Interim milestones - T+6mo, T+12mo, etc.)
- Users MUST be able to toggle between states in all visualizations
- System MUST highlight differences when comparing states:
  - New Cards (green)
  - Removed Cards (red)
  - Changed Cards (yellow)
  - Changed Relationships (dotted lines)

**FR-STRATEGY-02 (Transformation Initiatives)**  
- System MUST support "Initiative" entity with:
  - Name (e.g., "Cloud Migration Program")
  - Type: Modernization, Migration, Consolidation, New Build, Decommission, Integration
  - Strategic Theme (e.g., "Digital Transformation", "Cost Optimization")
  - Budget (total and spent)
  - Timeline (start date, target end date, actual end date)
  - Owner (sponsor, PM, architect)
  - Status: Planning, In Progress, On Hold, Completed, Cancelled
  - Health: On Track, At Risk, Behind Schedule
- Initiatives MUST link to affected Cards (many-to-many)
- System MUST show "Initiative Impact Map" (force-directed graph of affected Cards)

**FR-STRATEGY-03 (Transformation Roadmap)**  
System MUST generate transformation roadmap showing:
- Initiatives on timeline (Gantt chart with dependencies)
- Application lifecycle transitions (retire, go-live, major changes)
- Technology standard adoption milestones (e.g., "All apps off Oracle by Q4 2027")
- Capability maturity targets
- Swim lanes by: Business Capability, Organization, Strategic Theme
- Users MUST be able to adjust timeline and see dependency conflicts
- System MUST show "critical path" (longest dependency chain)

**FR-STRATEGY-04 (Gap Analysis)**  
System MUST compare Current vs Target state and show:
- **Application Gaps:**
  - To Retire (in current, not in target)
  - To Build (in target, not in current)
  - To Modernize (in both but with changed attributes)
- **Capability Gaps:**
  - Unsupported capabilities (no apps in target state)
  - Over-supported capabilities (too many redundant apps)
- **Technology Gaps:**
  - Legacy tech to sunset
  - New tech to adopt
- System MUST calculate transformation effort score (complexity × count)

**FR-STRATEGY-05 (Strategic Themes & Objectives)**  
- System MUST support tagging Cards with strategic themes
- System MUST support linking Objectives to themes
- System MUST generate theme-based views:
  - Investment per theme (TCO rollup)
  - Progress per theme (% objectives completed)
  - Coverage per theme (count of Cards)
- Example: "Digital Transformation theme has $5M investment, 65% progress, 34 related apps"

---

### 5.4 Capability-Based Planning

**FR-CAPABILITY-01 (Capability Maturity Assessment)**  
- System MUST support maturity scoring (1-5 scale) per capability:
  - **Level 1: Initial** (Ad-hoc, no defined process)
  - **Level 2: Repeatable** (Documented process, inconsistent execution)
  - **Level 3: Defined** (Standardized across organization)
  - **Level 4: Managed** (Measured, monitored, controlled)
  - **Level 5: Optimizing** (Continuous improvement culture)
- Users MUST be able to assess maturity with supporting evidence (comments, links)
- System MUST show "Capability Maturity Model" report (CMM grid)
- System MUST identify gaps: High strategic importance + Low maturity = Priority for investment

**FR-CAPABILITY-02 (Capability Investment Analysis)**  
- System MUST calculate investment per capability (TCO rollup of supporting apps)
- System MUST generate "Capability Investment Heat Map":
  - X-axis: Strategic Importance (High/Medium/Low)
  - Y-axis: Current Investment (High/Medium/Low)
  - **Quadrants:**
    - **Invest More** (High importance, Low investment) ← **Strategic gap**
    - **Maintain** (High importance, High investment) ← **Core competency**
    - **Optimize** (Low importance, High investment) ← **Overspending**
    - **Divest** (Low importance, Low investment) ← **Candidates for outsourcing**
- System MUST show investment trend (last 3 years)

**FR-CAPABILITY-03 (Capability Redundancy Analysis)**  
- System MUST identify capabilities with multiple overlapping applications
- Overlap criteria: Apps supporting same capability with >70% functional overlap (based on tags, description similarity)
- System MUST calculate "redundancy score" (count of redundant apps)
- System MUST suggest consolidation opportunities
- Example: "Sales capability has 5 CRM systems - consolidation could save $2M/year"

**FR-CAPABILITY-04 (Capability Risk Assessment)**  
System MUST identify risky capabilities:
- **No Application Support** (capability gap)
- **Single Point of Failure** (one critical app, no redundancy)
- **Only Deprecated Apps** (all supporting apps on sunset tech)
- **No Owner Assigned** (governance gap)
- System MUST generate "Capability Risk Report" prioritized by business criticality

---

### 5.5 Application Portfolio Management

**FR-PORTFOLIO-01 (TIME Matrix Analysis)**  
- System MUST generate TIME matrix (existing feature, keep as-is)
- X-axis: Technical Fit (1-4)
- Y-axis: Functional Fit (1-4)
- Quadrants: Invest, Maintain, Retire, Tolerate

**FR-PORTFOLIO-02 (PACE Analysis)**  
- System MUST support categorizing applications by PACE layer:
  - **Systems of Record** (SOR) - Slow-changing, high stability, focus on reliability
  - **Systems of Differentiation** (SOD) - Moderate change, competitive advantage
  - **Systems of Innovation** (SOI) - Fast-changing, experiments, fail fast
- System MUST visualize PACE distribution (donut chart)
- System MUST recommend architecture patterns per PACE:
  - SOR: Monolith, traditional RDBMS, strict governance
  - SOD: Modular monolith, microservices, balanced governance
  - SOI: Microservices, NoSQL, lightweight governance

**FR-PORTFOLIO-03 (Application Rationalization Score)**  
System MUST calculate "Rationalization Score" (0-100) based on:
```
Business Value = (functional_fit / 4) × (criticality_weight) × 100
Technical Health = (technical_fit / 4) × (1 - technical_debt_pct) × 100
Cost Efficiency = (benchmark_cost / actual_cost) × 100
Strategic Alignment = (count_matching_themes / total_themes) × 100

Rationalization Score = (Business Value × 0.4) + (Technical Health × 0.3) + 
                        (Cost Efficiency × 0.2) + (Strategic Alignment × 0.1)
```
System MUST recommend action:
- **Invest** (Score > 70): High value, healthy
- **Maintain** (Score 50-70): Adequate, monitor
- **Tolerate** (Score 30-50): Low value but needed
- **Eliminate** (Score < 30): Low value, candidate for retirement

**FR-PORTFOLIO-04 (Vendor Consolidation Analysis)**  
- System MUST group IT Components by vendor
- System MUST calculate spend per vendor (sum of component costs)
- System MUST identify consolidation opportunities:
  - Multiple database vendors (Oracle, SQL Server, MySQL → PostgreSQL)
  - Multiple cloud providers (AWS + Azure + GCP → Single provider)
  - Redundant SaaS tools (Slack + Teams → Single collaboration tool)
- System MUST estimate savings from consolidation (annual license savings)

**FR-PORTFOLIO-05 (Cloud Readiness Assessment)**  
System MUST assess cloud readiness per application based on:
- Architecture Pattern (Monolith=0, Microservices=10)
- State Management (Stateful=0, Stateless=10)
- Database Type (Centralized RDBMS=0, Distributed NoSQL=10)
- Data Residency (Strict on-prem required=0, Flexible=10)
- Integration Method (Point-to-point=0, API-first=10)
Cloud Readiness Score = Average of above (0-100)
System MUST recommend migration strategy based on score:
- 80-100: Rehost (lift-and-shift)
- 60-79: Replatform (minor changes)
- 40-59: Refactor (re-architect)
- 20-39: Repurchase (SaaS alternative)
- 0-19: Retire (eliminate)

---

### 5.6 Compliance & Risk Management

**FR-COMPLIANCE-01 (Regulatory Requirements)**  
- System MUST support defining regulatory frameworks:
  - Name: GDPR, SOX, HIPAA, PCI-DSS, ISO 27001, NIST
  - Description
  - Applicable Card Types (e.g., GDPR applies to apps processing PII)
  - Required Controls (e.g., "Data encryption at rest", "Access logging")
  - Audit Frequency (Annual, Quarterly)
- System MUST allow tagging Cards with applicable regulations
- System MUST generate compliance checklist per regulation

**FR-COMPLIANCE-02 (Compliance Assessment)**  
- Users MUST be able to assess compliance per Card:
  - Status: Compliant, Non-Compliant, In Progress, Not Applicable
  - Evidence (upload audit reports, link to policy docs)
  - Last Assessment Date
  - Next Review Date
  - Assessor (who performed assessment)
- System MUST show compliance dashboard:
  - % compliant by regulation
  - Overdue assessments (red flag)
  - Trend (improving/worsening)
- System MUST alert when compliance review is overdue (7 days before)

**FR-COMPLIANCE-03 (Risk Register)**  
- System MUST support Risk entity with:
  - Risk Type: Security, Compliance, Operational, Financial, Strategic, Reputational
  - Description (what could go wrong)
  - Likelihood (1-5): Very Unlikely, Unlikely, Possible, Likely, Very Likely
  - Impact (1-5): Negligible, Minor, Moderate, Major, Catastrophic
  - Risk Score = Likelihood × Impact (1-25)
  - Mitigation Plan (what we're doing about it)
  - Owner (who is accountable)
  - Status: Open, Mitigated, Accepted, Transferred, Closed
  - Target Closure Date
- Risks MUST link to Cards (many-to-many)
- System MUST show "Risk Heat Map" (Likelihood vs Impact)
- System MUST show "Top 10 Risks" dashboard (sorted by score)

**FR-COMPLIANCE-04 (Audit Trail for Compliance)**  
- System MUST generate audit reports for compliance purposes:
  - All changes to Tier 1 applications (last 12 months)
  - All approved exceptions (what, who, when, why)
  - All decommissioned applications (data retention proof)
  - All access grants/revokes (user permissions)
- Audit logs MUST be immutable (append-only, tamper-proof)
- System MUST support exporting audit logs to SIEM tools (Splunk, QRadar)

---

### 5.7 Architecture Review Board (ARB)

**FR-ARB-01 (Review Request Submission)**  
- Users MUST be able to submit Cards for ARB review with:
  - Review Type: New Application, Major Change, Exception Request, Retirement, Strategic Decision
  - Business Justification (why this is needed)
  - Technical Architecture (diagram upload, component list)
  - Alternatives Considered (what else was evaluated)
  - Recommendation (what action is requested)
  - Supporting Documents (business case, TCO analysis)
- Submission MUST trigger notification to ARB members (email + in-app)
- System MUST assign unique Review ID (e.g., ARB-2026-001)

**FR-ARB-02 (ARB Decision Tracking)**  
- System MUST support ARB Decision entity with:
  - Decision Date
  - Decision: Approved, Rejected, Conditional Approval, Deferred, Request More Info
  - Conditions (if conditional approval, what must be done)
  - Rationale (why this decision was made)
  - Dissenting Opinions (if any ARB member disagreed)
  - Action Items (tasks assigned to specific users with due dates)
  - Follow-up Date (when to review again)
- Decisions MUST link to Cards
- System MUST track action item completion (% complete)
- System MUST alert owners of overdue action items

**FR-ARB-03 (ARB Meeting Management)**  
- System MUST support creating ARB meetings with:
  - Date, Time, Location (or virtual meeting link)
  - Attendees (required, optional)
  - Agenda (list of review requests)
- System MUST generate meeting pack (PowerPoint export):
  - Title slide (meeting date, attendees)
  - Agenda slide
  - One slide per review request (Card details, recommendation, alternatives)
  - Appendix (supporting data)
- System MUST capture meeting minutes:
  - Decisions made
  - Action items assigned
  - Next steps
- System MUST distribute meeting minutes to attendees (email)

**FR-ARB-04 (ARB Dashboard)**  
System MUST show ARB dashboard with:
- Pending reviews (cards awaiting decision)
- Overdue action items (assigned but not completed)
- Recent decisions (last 3 months)
- Review metrics:
  - Average time to decision (days from submission to decision)
  - Approval rate (% approved vs rejected)
  - Backlog trend (growing or shrinking)

---

### 5.8 Technology Radar & Lifecycle

**FR-TECH-RADAR-01 (Technology Radar Visualization)**  
- System MUST generate Technology Radar (ThoughtWorks style):
  - **Quadrants:** Techniques, Tools, Platforms, Languages & Frameworks
  - **Rings:** 
    - **Adopt** (default choice, production-ready)
    - **Trial** (use with caution, proven but not default)
    - **Assess** (worth exploring, experimental)
    - **Hold** (proceed with caution, legacy)
- Each IT Component MUST be placeable on radar
- System MUST support moving components between rings over time (with change log)
- System MUST generate "What Changed" report comparing current vs previous version
- System MUST show count of applications per technology in tooltip

**FR-TECH-RADAR-02 (Technology Lifecycle Phases)**  
- System MUST support lifecycle phases for IT Components:
  - **Emerging** (New, not yet production-ready, R&D only)
  - **Growth** (Adopted by early adopters, gaining traction)
  - **Mature** (Widely used, stable, recommended default)
  - **Sustain** (Still supported but newer alternatives exist)
  - **Sunset** (Deprecated, plan migration, vendor support ending)
  - **Retired** (No longer supported, must migrate)
- System MUST auto-transition to Sunset when `vendor_support_eol < 365 days`
- System MUST flag applications using Sunset/Retired tech (red badge)
- System MUST show "Technology Lifecycle Dashboard" (count per phase)

**FR-TECH-RADAR-03 (Technology Debt Report)**  
System MUST generate Technology Debt Report showing:
- Applications using deprecated technology (grouped by tech)
- Total cost of legacy tech (sum of TCO for apps on Sunset/Retired tech)
- Estimated migration effort (sum of apps × migration complexity score)
- Migration priority (Tier 1 apps on Sunset tech = P0)
- Suggested replacement technology (per FR-GOV-02)
Report MUST be exportable to PDF/PowerPoint for executive review

---

### 5.9 Data & Integration Architecture

**FR-DATA-01 (API Catalog)**  
- System MUST maintain catalog of APIs (type: Interface, category: API):
  - API Name, Version, Base URL
  - Provider (application that exposes it)
  - Consumers (applications that call it)
  - Protocol (REST, GraphQL, SOAP, gRPC)
  - Authentication Method (OAuth2, API Key, mTLS)
  - SLA (uptime %, max latency)
  - Documentation Link (Swagger/OpenAPI URL)
  - Rate Limit (requests per minute)
- System MUST show API dependency graph (force-directed layout)
- System MUST identify unused APIs (no consumers in last 90 days)
- System MUST flag APIs without documentation

**FR-DATA-02 (Data Lineage Visualization)**  
- System MUST visualize data lineage flows:
  - Source System → Transformation → Target System
  - Example: CRM → ETL Process → Data Warehouse → BI Tool → Executive Dashboard
- System MUST support upstream/downstream tracing:
  - Upstream: "Where does this data come from?" (traverse backwards)
  - Downstream: "Where does this data go?" (traverse forwards)
- System MUST identify orphaned data (no downstream consumers)
- System MUST show "Data Quality" badge (from Data Object entity)

**FR-DATA-03 (Master Data Management)**  
- System MUST track Master Data Entities (type: Data Object, category: Master Data):
  - Customer, Product, Employee, Location, Account, Vendor
- Each entity MUST specify:
  - Golden Source (system of record)
  - Synchronized Systems (systems that replicate from golden source)
  - Data Steward (person responsible for data quality)
  - Update Frequency (Real-time, Hourly, Daily, Batch)
- System MUST flag inconsistencies (multiple systems claiming golden source status)
- System MUST show "Master Data Dashboard" (count, quality score, steward)

---

### 5.10 Visualization & Reporting

**FR-VIZ-01 (Landscape Heatmap)**  
*[Keep existing from previous PRD - already excellent]*

**FR-VIZ-02 (Interactive Matrix)**  
*[Keep existing from previous PRD - already excellent]*

**FR-VIZ-03 (Time Machine Roadmap)**  
*[Keep existing from previous PRD - already excellent]*

**FR-VIZ-04 (Technology Radar)**  
*[Covered in FR-TECH-RADAR-01]*

**FR-REPORT-01 (PowerPoint Export)**  
- System MUST export any visualization to PowerPoint (.pptx) with:
  - Title slide (report name, date, author)
  - Executive summary (auto-generated key insights)
  - Visualization slides (Heatmap, Matrix, Roadmap, etc.)
  - Data tables (supporting detail)
  - Methodology slide (how analysis was done)
- Template MUST be customizable (upload corporate branded template)
- Export MUST preserve colors, fonts, and layout

**FR-REPORT-02 (Executive Narratives)**  
- System MUST auto-generate executive summary using AI:
  - Key findings (e.g., "12 applications using deprecated Oracle 11g")
  - Recommendations (e.g., "Prioritize migration of Tier 1 apps to PostgreSQL")
  - Risks (e.g., "Oracle 11g support ends in 180 days")
  - Financial impact (e.g., "Migration could save $500K/year in licensing")
- Narrative MUST be editable before export
- System MUST support saving custom narratives as templates

**FR-REPORT-03 (Dashboard Builder)**  
- Users MUST be able to create custom dashboards with:
  - Drag-and-drop widget placement
  - Widget types: KPI card, chart (bar, line, pie, donut), table, heatmap, graph
  - Data source selection (Cards, Relationships, Aggregations)
  - Filters (apply same filters as list views)
  - Auto-refresh (every 5 min, hourly, daily)
- Dashboards MUST be shareable (view-only link)
- Users MUST be able to clone existing dashboards

---

### 5.11 Collaboration & Communication

**FR-COLLAB-01 (Comments & Discussions)**  
- Users MUST be able to add comments to any Card with:
  - Comment text (Markdown supported)
  - @mentions (notify other users)
  - Attachments (images, PDFs, up to 5MB)
  - Reply threading (nested comments)
- Users MUST be able to edit/delete own comments within 5 minutes
- System MUST show comment count badge on Cards
- System MUST show activity feed (recent comments across all Cards)

**FR-COLLAB-02 (Card Sharing)**  
- Users MUST be able to generate shareable links (view-only) with:
  - Expiration time (7 days, 30 days, never)
  - Password protection (optional)
- Users MUST be able to share via email with custom message
- System MUST track who accessed shared links (IP, timestamp)
- System MUST allow revoking shared links

**FR-COLLAB-03 (Favorites & Bookmarks)**  
- Users MUST be able to "star" Cards for quick access
- System MUST show "My Favorites" view in sidebar
- Users MUST be able to organize favorites into folders
- System MUST show recently viewed Cards (last 20)

**FR-COLLAB-04 (Watch/Subscribe)**  
- Users MUST be able to "watch" Cards to receive notifications
- Watchers MUST be notified on: Edits, Comments, Relationship changes, Lifecycle changes
- Users MUST be able to bulk watch (e.g., "Watch all Apps in Sales capability")
- System MUST show "Watching" badge on Cards

**FR-COLLAB-05 (Team Workspaces)**  
- System MUST support multiple workspaces per organization:
  - Example: "Application Architecture Team", "Cloud Migration Team"
- Workspaces MUST have:
  - Members (users assigned to workspace)
  - Shared views (saved filters visible to all members)
  - Shared dashboards
  - Activity feed (what team members are doing)
- Users MUST be able to switch between workspaces

---

### 5.12 Notification System

**FR-NOTIFY-01 (In-App Notifications)**  
- System MUST show notification bell icon in header with unread count
- Notifications MUST be grouped by type:
  - Comments (someone commented on a Card you watch)
  - Mentions (someone @mentioned you)
  - Changes (Card you watch was edited)
  - Approvals (ARB decision on your review request)
  - Tasks (action item assigned to you)
- Users MUST be able to mark as read/unread
- Notifications MUST persist for 30 days then auto-archive

**FR-NOTIFY-02 (Email Notifications)**  
- System MUST send email notifications based on user preferences:
  - Frequency: Real-time, Hourly digest, Daily digest (9 AM user timezone), Never
  - Types: All, Only @mentions, Only assigned tasks
- Email MUST include direct link to relevant Card
- Email MUST support one-click "Mark as Read" link

**FR-NOTIFY-03 (Notification Preferences)**  
- Users MUST be able to configure per-notification-type:
  - Comments: In-app + Email
  - Mentions: In-app + Email (real-time)
  - Changes: In-app only
  - Approvals: In-app + Email (real-time)
- System MUST provide "Mute for 1 hour" option (snooze notifications)

---

### 5.13 Data Import/Export

**FR-IMPORT-01 (Excel Import with Validation)**  
- System MUST validate import files:
  - Max file size: 10 MB
  - Max rows: 10,000 per import
  - Required columns: name, type (minimum)
- System MUST detect duplicates (by name + type) and offer:
  - Skip duplicate
  - Update existing (merge)
  - Create new with suffix (e.g., "App Name (2)")
- System MUST validate relationships (both source and target must exist)
- System MUST show preview (first 5 rows) before import

**FR-IMPORT-02 (Import Error Handling)**  
- System MUST continue importing valid rows if some fail
- System MUST generate error report CSV with:
  - Row number
  - Error message
  - Provided value
  - Expected format
- Users MUST be able to download error report, fix data, and re-import
- System MUST show import history (past imports with status and error count)

**FR-IMPORT-03 (Import Templates)**  
- System MUST provide downloadable Excel templates per Card type
- Templates MUST include:
  - Column headers (with descriptions in row 2)
  - Sample data (row 3-5)
  - Data validation (dropdowns for enums)
  - Instructions sheet
- Templates MUST auto-populate allowed values (e.g., Lifecycle phases)

**FR-EXPORT-01 (Data Export)**  
- Users MUST be able to export filtered Card list to:
  - Excel (.xlsx) - Full fidelity
  - CSV (.csv) - Simple format
  - JSON (.json) - API format
- Export MUST include ALL columns (SQL + selected JSONB fields)
- Users MUST be able to select which JSONB fields to export
- Export MUST preserve formatting (dates as dates, numbers as numbers)

**FR-EXPORT-02 (Relationship Export)**  
- Users MUST be able to export relationships as:
  - Excel: Source | Relationship Type | Target | Properties
  - CSV: Same as Excel
  - GraphML: For import into Gephi, yEd
- Export MUST respect current filters (e.g., only active relationships)

---

### 5.14 Search & Discovery

**FR-SEARCH-01 (Global Search)**  
*[Keep existing from previous PRD]*

**FR-SEARCH-02 (Faceted Filters)**  
*[Keep existing from previous PRD]*

**FR-SEARCH-03 (Advanced Query Builder)**  
- Users MUST be able to build complex queries with AND/OR logic:
  - Example: `(Type = Application AND Hosting = SaaS) OR (Type = IT Component AND Vendor = AWS)`
- System MUST support comparison operators:
  - Equals, Not Equals, Contains, Starts With, Greater Than, Less Than, In Range
- System MUST support date range filters (e.g., "Active between 2025-01-01 and 2026-12-31")
- Query builder MUST have visual UI (not just text input)

**FR-SEARCH-04 (Saved Searches)**  
- Users MUST be able to save search queries with names
- Saved searches MUST appear in sidebar for quick access
- Users MUST be able to share saved searches with team
- System MUST support "pinned" searches (always visible at top)

**FR-SEARCH-05 (Similar Cards Recommendation)**  
- Card detail page MUST show "Similar Cards" based on:
  - Same tags (70% match weight)
  - Same JSONB attributes (20% match weight)
  - Connected in graph (10% match weight)
- System MUST show similarity score (0-100%)
- System MUST suggest missing relationships (e.g., "This app might rely on Database X")

---

### 5.15 User Management & Authentication

**FR-USER-01 (User Registration & Onboarding)**  
- Admins MUST be able to invite users via email
- Invited users MUST set password on first login (min 12 chars, mix of upper/lower/number/symbol)
- Users MUST complete profile: Full name, Job title, Department, Photo (optional)
- System MUST show onboarding tour on first login (interactive walkthrough)

**FR-USER-02 (Role Management)**  
- System MUST support built-in roles:
  - **Admin** (full access, can manage users and settings)
  - **Architect** (create/edit/delete Cards, manage governance)
  - **Editor** (create/edit Cards, cannot delete)
  - **Viewer** (read-only access)
  - **Auditor** (read-only + full audit trail access)
- Admins MUST be able to create custom roles with granular permissions:
  - Permissions: View, Create, Edit, Delete (per Card type)
  - Example: "Application Architect" can edit Applications but only view Infrastructure
- Role changes MUST take effect immediately (no re-login)

**FR-USER-03 (Single Sign-On)**  
- System MUST support SSO via:
  - SAML 2.0 (Okta, Azure AD, OneLogin)
  - OAuth 2.0 (Google Workspace, Microsoft 365)
- SSO MUST be configurable by admins (upload SAML metadata or OAuth credentials)
- System MUST support Just-In-Time (JIT) provisioning (auto-create user on first SSO login)

**FR-USER-04 (User Preferences)**  
- Users MUST be able to configure:
  - Default landing page (Dashboard, Inventory, My Cards)
  - Default filters (e.g., "Show only Applications I own")
  - Theme (Light mode, Dark mode, Auto)
  - Timezone
  - Language (English, Spanish, German, French - Phase 2)
- Preferences MUST sync across devices

**FR-USER-05 (Session Management)**  
- Sessions MUST expire after 1 hour of inactivity
- Users MUST be able to view active sessions (device, IP, last active)
- Users MUST be able to revoke individual sessions (force logout)
- System MUST force logout on password change (security measure)

---

## 6. Non-Functional Requirements (NFRs)

*[Keep all existing NFRs from previous PRD - Performance, Security, Scalability, Reliability, Maintainability, Usability]*

---

## 7. Logic Modules (Intelligence Engines)

*[Keep existing BIA, 6R, TCO engines from previous PRD - no changes needed]*

---

## 8. Integration & API

*[Keep existing API requirements from previous PRD, add:]*

**FR-API-05 (GraphQL API - Phase 2)**  
- System SHOULD provide GraphQL endpoint for flexible queries
- Supports: Complex nested queries, field selection, batch requests
- Use case: Power users, custom integrations, mobile apps

**FR-API-06 (Webhook Events)**  
*[Already covered in previous PRD - keep as-is]*

---

## 9. Roadmap & Phases

### Phase 1: EA Foundation (MVP - 20 Weeks)
**Goal:** Launch minimum viable **EA platform** (not just portfolio tool)

**Core Capabilities:**
- ✅ Data Management (Cards, Relationships, Audit, Quality)
- ✅ Basic Visualization (Landscape, Matrix, Roadmap)
- ✅ User Management (Roles, SSO, Permissions)
- ✅ Search & Filters (Global search, Faceted filters)
- ✅ **Governance Basics** (Technology Standards, Policies) ← **NEW**
- ✅ **Target State** (Multiple architecture states) ← **NEW**
- ✅ **Compliance Tracking** (Regulatory requirements, Risk register) ← **NEW**
- ✅ Import/Export (Excel import with validation, Export to Excel/CSV)

**Success Criteria:**
- 3 pilot customers in production
- Can demonstrate "EA workflow" end-to-end
- Technology Standards compliance report generates successfully
- Target State vs Current State comparison works

---

### Phase 2: EA Essentials (v1.1 - Weeks 21-32)
**Goal:** Add essential EA capabilities for governance and strategic planning

**Capabilities:**
- ✅ **Architecture Principles** (Define, track adherence)
- ✅ **Transformation Initiatives** (Link cards, track progress)
- ✅ **Capability Maturity** (Assess, track improvement)
- ✅ **ARB Workflow** (Submit for review, track decisions)
- ✅ **Technology Radar** (Visualize tech lifecycle)
- ✅ PowerPoint Export (Generate executive presentations)
- ✅ Collaboration (Comments, @mentions, Watching)
- ✅ Notifications (In-app + Email)

**Success Criteria:**
- 10 production customers
- 60% of customers define architecture principles
- 40% of customers use ARB workflow
- Technology Radar adopted by 50% of customers

---

### Phase 3: EA Advanced (v1.2 - Weeks 33-48)
**Goal:** Add advanced analysis and automation

**Capabilities:**
- ✅ **Transformation Roadmap** (Multi-year planning with dependencies)
- ✅ **Gap Analysis** (Current vs Target automated comparison)
- ✅ **Reference Architecture Library** (Reusable patterns)
- ✅ **Application Rationalization** (Automated scoring and recommendations)
- ✅ **Dashboard Builder** (Custom dashboards)
- ✅ Exception Management (Request, approve, track)
- ✅ API Catalog (Track APIs, show dependency graph)
- ✅ Data Lineage (Upstream/downstream tracing)

**Success Criteria:**
- 25 production customers
- 70% of customers model target state
- 50% of customers track regulatory compliance
- Average NPS > 50

---

### Phase 4: EA Excellence (v2.0 - Months 13-18)
**Goal:** Market-leading EA platform with AI and integrations

**Capabilities:**
- ✅ **AI-Powered Recommendations** (Suggest consolidation, flag risks)
- ✅ **TOGAF ADM Support** (Phase tracking, deliverable templates)
- ✅ **ArchiMate Modeling** (Viewpoint templates, ArchiMate export)
- ✅ **Integrations Marketplace** (ServiceNow, Jira, Confluence, Slack)
- ✅ **Mobile App** (Read-only views, notifications)
- ✅ **Multi-Language Support** (Spanish, German, French, Portuguese)
- ✅ **Advanced Analytics** (Predictive models, trend analysis)

**Success Criteria:**
- 50+ production customers
- 10+ Fortune 500 logos
- $5M ARR
- NPS > 60

---

## 10. Out of Scope (MVP)

The following are **explicitly excluded** from MVP to maintain focus:

**Functionality:**
- ❌ Reference architecture library (Phase 3)
- ❌ Dashboard builder (Phase 3)
- ❌ AI-powered recommendations (Phase 4)
- ❌ TOGAF/ArchiMate support (Phase 4)
- ❌ Mobile app (Phase 4)
- ❌ Multi-language support (Phase 4)
- ❌ Real-time collaboration (Google Docs style)
- ❌ Advanced RBAC (Row-level security, field-level permissions)

**Technical:**
- ❌ Multi-tenancy (Single org per deployment in MVP)
- ❌ Advanced caching strategies (Phase 2)
- ❌ GraphQL API (Phase 2)

**Integrations:**
- ❌ ServiceNow connector (Phase 3)
- ❌ Jira connector (Phase 3)
- ❌ Slack bot (Phase 3)
- ❌ Microsoft Teams integration (Phase 4)

---

## 11. Competitive Differentiation

### vs LeanIX (Market Leader)

| Feature | LeanIX | Arc Zero | Winner |
|---------|--------|----------|--------|
| **Governance** | Strong (Principles, Standards) | **Stronger** (Same + Exception Management) | 🟢 Arc Zero |
| **Strategic Planning** | Good (Roadmaps) | **Better** (Target State + Gap Analysis) | 🟢 Arc Zero |
| **Performance** | Slow (3-5s for large graphs) | **Fast** (< 1s via Neo4j) | 🟢 Arc Zero |
| **Customization** | Expensive ($50K+ for custom fields) | **Free** (JSONB unlimited custom fields) | 🟢 Arc Zero |
| **Pricing** | $1,500-2,000/user/year | **$200-500/user/year** | 🟢 Arc Zero |
| **Integrations** | Extensive (30+ connectors) | Basic (MVP), Growing (Roadmap) | 🔴 LeanIX |
| **AI Features** | Advanced (Auto-recommendations) | None (MVP), Planned (Phase 4) | 🔴 LeanIX |
| **Brand Recognition** | High (Market leader) | None (New entrant) | 🔴 LeanIX |

**Arc Zero Wins:** 5/8 categories  
**Competitive Moat:** Performance (10x faster) + Flexibility (JSONB) + Price (1/5th cost)

---

### vs Ardoq

| Feature | Ardoq | Arc Zero | Winner |
|---------|-------|----------|--------|
| **Governance** | Weak | **Strong** | 🟢 Arc Zero |
| **Visualization** | Good | **Better** (D3 + Neo4j) | 🟢 Arc Zero |
| **Compliance** | Basic | **Strong** (Built-in frameworks) | 🟢 Arc Zero |
| **Pricing** | $1,000-1,500/user/year | **$200-500/user/year** | 🟢 Arc Zero |
| **Survey Builder** | Strong | None (MVP) | 🔴 Ardoq |
| **Metamodel Editor** | Visual | Code-based (MVP) | 🔴 Ardoq |

**Arc Zero Wins:** 4/6 categories

---

## 12. Success Metrics Summary

### North Star Metric
**"Active EA Practices Using Arc Zero for Strategic Decisions"**

Measured by:
- Organizations with > 70% weekly active users
- Organizations modeling target state
- Organizations using ARB workflow
- Organizations tracking compliance

**Target:** 15 active EA practices by end of Year 1

### Key Performance Indicators (KPIs)

| Category | Metric | Target (12 Months) |
|----------|--------|-------------------|
| **Growth** | Total Organizations | 20 |
| **Growth** | ARR | $2M |
| **Growth** | Fortune 500 Logos | 3 |
| **Adoption** | Weekly Active Users % | 75% |
| **Adoption** | Governance Features Used | 60% |
| **Retention** | Churn Rate | < 10% annual |
| **Satisfaction** | NPS | > 50 |
| **Product** | Time to First Value | < 4 hours |
| **Product** | Data Quality Score | > 75% |

---

## 13. Glossary

*[Keep existing glossary from previous PRD, add:]*

| Term | Definition |
|------|------------|
| **Architecture Principle** | A guideline that constrains and directs how IT decisions are made |
| **Target State** | The desired future architecture (typically 2-5 years out) |
| **Baseline** | The current state of the architecture (snapshot in time) |
| **Initiative** | A strategic program or project that transforms the architecture |
| **ARB** | Architecture Review Board - governance body that approves major IT decisions |
| **Technology Radar** | A visualization showing technology lifecycle (Adopt, Trial, Assess, Hold) |
| **PACE** | Systems of Record, Differentiation, Innovation - Gartner framework for app categorization |
| **Rationalization** | The process of evaluating and optimizing the application portfolio |
| **Compliance Framework** | A set of regulatory requirements (e.g., GDPR, SOX, HIPAA) |

---

## Appendix A: Prioritization Framework

### How Features Were Prioritized

**Criteria:**
1. **EA Essential:** Is this required for Arc Zero to be called an "EA tool"? (Weight: 40%)
2. **Competitive Differentiation:** Does this give us an edge over LeanIX/Ardoq? (Weight: 30%)
3. **Customer Demand:** Did customers explicitly request this? (Weight: 20%)
4. **Implementation Effort:** Low effort = higher priority (Weight: 10%)

**Scoring:**
- Phase 1 (MVP): Score > 8/10
- Phase 2 (Essentials): Score 6-8/10
- Phase 3 (Advanced): Score 4-6/10
- Phase 4 (Excellence): Score < 4/10

**Example:**
- **FR-GOV-02 (Technology Standards):** 
  - EA Essential: 10/10 (absolutely required)
  - Competitive: 8/10 (LeanIX has this)
  - Demand: 10/10 (every EA team needs this)
  - Effort: 6/10 (moderate complexity)
  - **Total: (10×0.4) + (8×0.3) + (10×0.2) + (6×0.1) = 8.6/10** → **Phase 1**

---

## Appendix B: Customer Validation

### Pilot Customer Interviews (Dec 2025)

**Interviewed:** 15 EA leaders from Fortune 500 companies

**Key Findings:**
1. **Top Pain Points:**
   - "LeanIX is too expensive" (12/15)
   - "Need better governance features" (11/15)
   - "Target state planning is manual" (10/15)
   - "Compliance tracking is a mess" (9/15)

2. **Must-Have Features for Purchase:**
   - Technology Standards catalog (15/15)
   - Target State modeling (13/15)
   - Compliance tracking (11/15)
   - PowerPoint export (10/15)
   - ARB workflow (8/15)

3. **Willingness to Pay:**
   - $200/user/year: 15/15 yes
   - $500/user/year: 11/15 yes
   - $1,000/user/year: 3/15 yes

**Conclusion:** $200-500 price point is optimal, EA governance features are non-negotiable.

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release | Product Team |
| 1.1 | 2026-01-12 | Added NFRs, glossary, risk assessment | Documentation Team |
| 2.0 | 2026-01-13 | **Complete EA platform rewrite** - Added governance, strategic planning, compliance, ARB workflow, technology radar, collaboration, notifications (35 new FRs) | Product Team |

---

**Approval Signatures:**

- **Product Owner:** _________________ Date: _______
- **CTO:** _________________ Date: _______
- **Lead Architect:** _________________ Date: _______
- **VP Engineering:** _________________ Date: _______

---

**Next Steps:**

1. ✅ Review this PRD with stakeholders (Week 1)
2. ✅ Get approval signatures (Week 1)
3. ✅ Break down Phase 1 requirements into user stories (Week 2)
4. ✅ Create technical design documents for new features (Week 2-3)
5. ✅ Update project timeline and resource plan (Week 3)
6. 🚀 Kick off Phase 1 development (Week 4)

---

**END OF DOCUMENT**
